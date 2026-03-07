import { SignJWT, jwtVerify } from "jose";
import { cookies }           from "next/headers";

export const COOKIE_NAME = "mb_admin_token";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export interface AdminSession {
  email: string;
}

export async function createSessionToken(payload: AdminSession) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<AdminSession> {
  const { payload } = await jwtVerify(token, secret());
  return payload as unknown as AdminSession;
}

export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
