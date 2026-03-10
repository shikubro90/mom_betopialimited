import { createHash } from "crypto";
import { NextRequest }  from "next/server";

export type FingerprintData = {
  fingerprint: string;
  ip:          string;
  userAgent:   string;
  browser:     string;
  os:          string;
  platform:    string;
};

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua))     return "Edge";
  if (/OPR\//.test(ua))     return "Opera";
  if (/Chrome\//.test(ua))  return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua))  return "Safari";
  return "Unknown";
}

function parseOs(ua: string): string {
  if (/Windows NT/.test(ua))      return "Windows";
  if (/Mac OS X/.test(ua))        return "macOS";
  if (/Android/.test(ua))         return "Android";
  if (/iPhone|iPad/.test(ua))     return "iOS";
  if (/Linux/.test(ua))           return "Linux";
  return "Unknown";
}

function parsePlatform(req: NextRequest, ua: string): string {
  const hint = req.headers.get("sec-ch-ua-platform");
  if (hint) return hint.replace(/"/g, "");
  if (/Mobile/.test(ua)) return "Mobile";
  if (/Tablet/.test(ua)) return "Tablet";
  return "Desktop";
}

/**
 * Builds a server-side device fingerprint from request headers.
 * Uses IP + User-Agent + Accept-Language + Sec-CH-UA headers.
 * No MAC address — purely HTTP signals.
 */
export function buildFingerprint(req: NextRequest): FingerprintData {
  const ip        = extractIp(req);
  const userAgent = req.headers.get("user-agent")        ?? "unknown";
  const lang      = req.headers.get("accept-language")   ?? "";
  const encoding  = req.headers.get("accept-encoding")   ?? "";
  const secUa     = req.headers.get("sec-ch-ua")         ?? "";

  const browser  = parseBrowser(userAgent);
  const os       = parseOs(userAgent);
  const platform = parsePlatform(req, userAgent);

  const raw         = [ip, userAgent, lang, encoding, secUa].join("|");
  const fingerprint = createHash("sha256").update(raw).digest("hex").slice(0, 32);

  return { fingerprint, ip, userAgent, browser, os, platform };
}
