import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "mb_session";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export interface UserSession extends JWTPayload {
  email:   string;
  userId?: string;
  role?:   "USER" | "ADMIN";
}

/** Alias kept for admin login compatibility */
export type AdminSession = UserSession;

export async function createSessionToken(payload: UserSession): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<UserSession> {
  const { payload } = await jwtVerify(token, secret());
  return payload as unknown as UserSession;
}

export async function getSession(): Promise<UserSession | null> {
  const jar   = await cookies();
  // Support old cookie name from admin login
  const token = jar.get(COOKIE_NAME)?.value ?? jar.get("mb_admin_token")?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
