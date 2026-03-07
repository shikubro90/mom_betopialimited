import { NextRequest, NextResponse } from "next/server";
import { jwtVerify }                 from "jose";

const COOKIE_NAME = "mb_admin_token";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page is always public
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
