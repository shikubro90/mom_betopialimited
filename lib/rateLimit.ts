import { db } from "@/lib/db";

const LIMIT  = 10;
const WINDOW = 24 * 60 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true;  remaining: number }
  | { allowed: false; remaining: 0; resetAt: Date };

export async function checkAiRateLimit(
  fingerprint: string,
  ip: string
): Promise<RateLimitResult> {
  const now         = new Date();
  const windowFloor = new Date(now.getTime() - WINDOW);

  try {
    const record = await db.aiUsage.findUnique({
      where: { fingerprint_ip: { fingerprint, ip } },
    });

    if (!record || record.windowStart < windowFloor) {
      await db.aiUsage.upsert({
        where:  { fingerprint_ip: { fingerprint, ip } },
        create: { fingerprint, ip, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return { allowed: true, remaining: LIMIT - 1 };
    }

    if (record.count >= LIMIT) {
      return { allowed: false, remaining: 0, resetAt: new Date(record.windowStart.getTime() + WINDOW) };
    }

    await db.aiUsage.update({
      where: { fingerprint_ip: { fingerprint, ip } },
      data:  { count: { increment: 1 } },
    });
    return { allowed: true, remaining: LIMIT - record.count - 1 };
  } catch {
    return { allowed: true, remaining: LIMIT };
  }
}
