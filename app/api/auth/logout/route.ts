import { NextResponse } from "next/server";
import { COOKIE_NAME }  from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  res.cookies.delete("mb_admin_token"); // clear old admin cookie too
  return res;
}
