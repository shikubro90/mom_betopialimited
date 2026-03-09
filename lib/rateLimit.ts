import { db } from "@/lib/db";

// Business rules
const GUEST_LIMIT        = 3;
const GUEST_BLOCK_MS     = 2 * 60 * 60 * 1000;  // 2 hours
const GUEST_WINDOW_MS    = 2 * 60 * 60 * 1000;

const USER_LIMIT         = 10;
const USER_BLOCK_MS      = 1 * 60 * 60 * 1000;   // 1 hour
const USER_WINDOW_MS     = 1 * 60 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true;  remaining: number }
  | { allowed: false; remaining: 0; resetAt: Date; message: string };

/* ── Guest rate limit (by device fingerprint + IP) ────── */
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
    // Upsert device fingerprint
    const device = await db.deviceFingerprint.upsert({
      where:  { fingerprint_ip: { fingerprint, ip } },
      create: { fingerprint, ip, userAgent, browser, os, platform },
      update: { lastSeen: now, userAgent, browser, os, platform },
    });

    // Upsert usage log
    let log = await db.aiUsageLog.findUnique({ where: { deviceId: device.id } });

    if (!log) {
      log = await db.aiUsageLog.create({
        data: { deviceId: device.id, count: 0, windowStart: now },
      });
    }

    // Still blocked?
    if (log.blockedUntil && log.blockedUntil > now) {
      return { allowed: false, remaining: 0, resetAt: log.blockedUntil,
        message: `Guest limit reached (${GUEST_LIMIT}/2h). Try again at ${fmt(log.blockedUntil)}.` };
    }

    // Window expired → reset
    const windowExpired = now.getTime() - log.windowStart.getTime() > GUEST_WINDOW_MS;
    if (windowExpired) {
      await db.aiUsageLog.update({
        where: { id: log.id },
        data:  { count: 1, windowStart: now, blockedUntil: null },
      });
      return { allowed: true, remaining: GUEST_LIMIT - 1 };
    }

    // Within window — check count
    if (log.count >= GUEST_LIMIT) {
      const blockedUntil = new Date(now.getTime() + GUEST_BLOCK_MS);
      await db.aiUsageLog.update({ where: { id: log.id }, data: { blockedUntil } });
      return { allowed: false, remaining: 0, resetAt: blockedUntil,
        message: `Guest limit reached (${GUEST_LIMIT}/2h). Try again at ${fmt(blockedUntil)}.` };
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
      return { allowed: false, remaining: 0, resetAt: log.blockedUntil,
        message: `Limit reached (${USER_LIMIT}/hr). Try again at ${fmt(log.blockedUntil)}.` };
    }

    const windowExpired = now.getTime() - log.windowStart.getTime() > USER_WINDOW_MS;
    if (windowExpired) {
      await db.aiUsageLog.update({
        where: { id: log.id },
        data:  { count: 1, windowStart: now, blockedUntil: null },
      });
      return { allowed: true, remaining: USER_LIMIT - 1 };
    }

    if (log.count >= USER_LIMIT) {
      const blockedUntil = new Date(now.getTime() + USER_BLOCK_MS);
      await db.aiUsageLog.update({ where: { id: log.id }, data: { blockedUntil } });
      return { allowed: false, remaining: 0, resetAt: blockedUntil,
        message: `Limit reached (${USER_LIMIT}/hr). Try again at ${fmt(blockedUntil)}.` };
    }

    await db.aiUsageLog.update({ where: { id: log.id }, data: { count: { increment: 1 } } });
    return { allowed: true, remaining: USER_LIMIT - log.count - 1 };

  } catch {
    return { allowed: true, remaining: USER_LIMIT };
  }
}

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
