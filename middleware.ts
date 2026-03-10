import { NextRequest, NextResponse } from "next/server";
import { jwtVerify }                 from "jose";

// Accept both old and new cookie names
const COOKIE_NAMES = ["mb_session", "mb_admin_token"];
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page is always public
  if (pathname === "/superadmin/login") return NextResponse.next();

  const token = COOKIE_NAMES.map(n => req.cookies.get(n)?.value).find(Boolean);

  if (!token) {
    return NextResponse.redirect(new URL("/superadmin/login", req.url));
  }

  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/superadmin/login", req.url));
    COOKIE_NAMES.forEach(n => res.cookies.delete(n));
    return res;
  }
}

export const config = {
  matcher: ["/superadmin/:path*"],
};
