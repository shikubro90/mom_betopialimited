import { NextRequest, NextResponse } from "next/server";
import bcrypt                        from "bcryptjs";
import { db }                        from "@/lib/db";
import { createSessionToken, COOKIE_NAME } from "@/lib/session";

const PUBLIC_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
                        "icloud.com", "aol.com", "protonmail.com", "live.com"];

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name     = body.name?.trim()  ?? "";
  const email    = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  // ── Basic validation ───────────────────────────────────────
  if (!name)                    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (password.length < 8)     return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const domain = email.split("@")[1];

  // ── Block public email providers ───────────────────────────
  if (PUBLIC_DOMAINS.includes(domain)) {
    return NextResponse.json(
      { error: "Personal email addresses are not allowed. Please use your work email." },
      { status: 400 }
    );
  }

  // ── Check allowed domains ──────────────────────────────────
  const allowed = await db.allowedDomain.findFirst({
    where: { domain, active: true },
  });

  if (!allowed) {
    return NextResponse.json(
      { error: `Your email domain (${domain}) is not approved for registration. Contact your administrator.` },
      { status: 403 }
    );
  }

  // ── Check if already registered ───────────────────────────
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  // ── Create user ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email, name, passwordHash },
  });

  // ── Auto-login after registration ──────────────────────────
  const token = await createSessionToken({ email: user.email, userId: user.id, role: "USER" });

  const res = NextResponse.json({ success: true, name: user.name, email: user.email });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 8,
    path:     "/",
  });

  return res;
}
