/**
 * AI Summary Quota Service
 *
 * Single entry point for all AI rate-limit checks.
 * Automatically branches between:
 *   - Guest  → DeviceFingerprint + AiUsageLog  (3 calls / 2-hour window)
 *   - User   → User + AiUsageLog               (10 calls / 1-hour window)
 *
 * Manual note creation is NOT routed through here — it remains unlimited.
 */

import { NextRequest }       from "next/server";
import { db }                from "@/lib/db";
import { buildFingerprint }  from "@/lib/fingerprint";
import { getSession }        from "@/lib/session";
import {
  checkGuestRateLimit,
  checkUserRateLimit,
  type RateLimitResult,
} from "@/lib/rateLimit";

/* ── Identity resolved from the request ──────────────────── */
export type QuotaIdentity =
  | { kind: "guest"; fingerprint: string; ip: string; userAgent?: string; browser?: string; os?: string; platform?: string }
  | { kind: "user";  userId: string; email: string };

/**
 * Determines who is making the request.
 * Returns a `user` identity if a valid JWT session exists and the User row
 * can be found (or created) in the DB.  Otherwise returns `guest`.
 */
export async function resolveIdentity(req: NextRequest): Promise<QuotaIdentity> {
  try {
    const session = await getSession();
    if (session?.email) {
      // Upsert so admins/first-timers are auto-registered in the users table
      const user = await db.user.upsert({
        where:  { email: session.email },
        create: { email: session.email, name: session.email.split("@")[0] },
        update: {},
      });
      return { kind: "user", userId: user.id, email: user.email };
    }
  } catch {
    // Session lookup failed — fall through to guest
  }

  const fp = buildFingerprint(req);
  return {
    kind:      "guest",
    fingerprint: fp.fingerprint,
    ip:        fp.ip,
    userAgent: fp.userAgent,
    browser:   fp.browser,
    os:        fp.os,
    platform:  fp.platform,
  };
}

/* ── Quota error payloads ─────────────────────────────────── */
export type QuotaError = {
  success:           false;
  code:              "GUEST_AI_LIMIT_REACHED" | "USER_AI_LIMIT_REACHED";
  message:           string;
  retryAfterSeconds: number;
  requiresAuth?:     true;
};

export type QuotaResult =
  | { allowed: true;  remaining: number; identity: QuotaIdentity }
  | { allowed: false; error: QuotaError; identity: QuotaIdentity };

/**
 * Main quota check — call this in any AI endpoint before hitting OpenAI.
 * Returns a typed result; caller decides how to respond.
 */
export async function checkAiQuota(req: NextRequest): Promise<QuotaResult> {
  const identity = await resolveIdentity(req);
  let rl: RateLimitResult;

  if (identity.kind === "user") {
    rl = await checkUserRateLimit(identity.userId);
  } else {
    rl = await checkGuestRateLimit(
      identity.fingerprint,
      identity.ip,
      identity.userAgent,
      identity.browser,
      identity.os,
      identity.platform,
    );
  }

  if (!rl.allowed) {
    const isUser = identity.kind === "user";
    return {
      allowed: false,
      identity,
      error: {
        success:           false,
        code:              isUser ? "USER_AI_LIMIT_REACHED" : "GUEST_AI_LIMIT_REACHED",
        message:           isUser
          ? "You have reached your AI summary limit for now. Please try again later."
          : "You have reached the free AI summary limit. Please login/register or try again later.",
        retryAfterSeconds: rl.retryAfterSeconds,
        ...(isUser ? {} : { requiresAuth: true as const }),
      },
    };
  }

  return { allowed: true, remaining: rl.remaining, identity };
}
