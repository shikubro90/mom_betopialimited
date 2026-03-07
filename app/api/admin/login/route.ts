import { NextRequest, NextResponse } from "next/server";
import bcrypt                        from "bcryptjs";
import { createSessionToken, COOKIE_NAME } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email = "", password = "" } = body;

  if (!email.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminHash     = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    console.error("[ADMIN LOGIN] ADMIN_EMAIL or ADMIN_PASSWORD_HASH not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const emailMatch    = email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatch = await bcrypt.compare(password, adminHash);

  if (!emailMatch || !passwordMatch) {
    // Same response for both to prevent email enumeration
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({ email: adminEmail });

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 8, // 8 hours
    path:     "/",
  });

  return res;
}
