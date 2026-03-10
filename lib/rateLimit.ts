import { db } from "@/lib/db";

// Business rules
const GUEST_LIMIT     = 3;
const GUEST_BLOCK_MS  = 2 * 60 * 60 * 1000;  // 2 hours
const GUEST_WINDOW_MS = 2 * 60 * 60 * 1000;

const USER_LIMIT      = 10;
const USER_BLOCK_MS   = 1 * 60 * 60 * 1000;   // 1 hour
const USER_WINDOW_MS  = 1 * 60 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true;  remaining: number }
  | { allowed: false; remaining: 0; resetAt: Date; retryAfterSeconds: number };

function secondsUntil(d: Date): number {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 1000));
}

/* ── Guest rate limit (fingerprint + IP + UA details) ── */
export async function checkGuestRateLimit(
  fingerprint: string,
  ip:          string,
  userAgent?:  string,
  browser?:    string,
  os?:         string,
  platform?:   string,
): Promise<RateLimitResult> {
  const now = new Date();

  try {
    const device = await db.deviceFingerprint.upsert({
      where:  { fingerprint_ip: { fingerprint, ip } },
      create: { fingerprint, ip, userAgent, browser, os, platform },
      update: { lastSeen: now, userAgent, browser, os, platform },
    });

    let log = await db.aiUsageLog.findUnique({ where: { deviceId: device.id } });
    if (!log) {
      log = await db.aiUsageLog.create({
        data: { deviceId: device.id, count: 0, windowStart: now },
      });
    }

    // Still blocked?
    if (log.blockedUntil && log.blockedUntil > now) {
      return {
        allowed: false, remaining: 0,
        resetAt: log.blockedUntil,
        retryAfterSeconds: secondsUntil(log.blockedUntil),
      };
    }

    // Window expired → reset
    if (now.getTime() - log.windowStart.getTime() > GUEST_WINDOW_MS) {
      await db.aiUsageLog.update({
        where: { id: log.id },
        data:  { count: 1, windowStart: now, blockedUntil: null },
      });
      return { allowed: true, remaining: GUEST_LIMIT - 1 };
    }

    // Limit hit → block
    if (log.count >= GUEST_LIMIT) {
      const blockedUntil = new Date(now.getTime() + GUEST_BLOCK_MS);
      await db.aiUsageLog.update({ where: { id: log.id }, data: { blockedUntil } });
      return {
        allowed: false, remaining: 0,
        resetAt: blockedUntil,
        retryAfterSeconds: secondsUntil(blockedUntil),
      };
    }

    await db.aiUsageLog.update({ where: { id: log.id }, data: { count: { increment: 1 } } });
    return { allowed: true, remaining: GUEST_LIMIT - log.count - 1 };

  } catch {
    return { allowed: true, remaining: GUEST_LIMIT }; // fail open
  }
}

/* ── Registered user rate limit (by userId) ──────────── */
export async function checkUserRateLimit(userId: string): Promise<RateLimitResult> {
  const now = new Date();

  try {
    let log = await db.aiUsageLog.findUnique({ where: { userId } });
    if (!log) {
      log = await db.aiUsageLog.create({ data: { userId, count: 0, windowStart: now } });
    }

    if (log.blockedUntil && log.blockedUntil > now) {
      return {
        allowed: false, remaining: 0,
        resetAt: log.blockedUntil,
        retryAfterSeconds: secondsUntil(log.blockedUntil),
      };
    }

    if (now.getTime() - log.windowStart.getTime() > USER_WINDOW_MS) {
      await db.aiUsageLog.update({
        where: { id: log.id },
        data:  { count: 1, windowStart: now, blockedUntil: null },
      });
      return { allowed: true, remaining: USER_LIMIT - 1 };
    }

    if (log.count >= USER_LIMIT) {
      const blockedUntil = new Date(now.getTime() + USER_BLOCK_MS);
      await db.aiUsageLog.update({ where: { id: log.id }, data: { blockedUntil } });
      return {
        allowed: false, remaining: 0,
        resetAt: blockedUntil,
        retryAfterSeconds: secondsUntil(blockedUntil),
      };
    }

    await db.aiUsageLog.update({ where: { id: log.id }, data: { count: { increment: 1 } } });
    return { allowed: true, remaining: USER_LIMIT - log.count - 1 };

  } catch {
    return { allowed: true, remaining: USER_LIMIT };
  }
}
