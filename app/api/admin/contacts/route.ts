import { NextRequest, NextResponse } from "next/server";
import { cookies }                  from "next/headers";
import { verifySessionToken }        from "@/lib/session";
import { db }                        from "@/lib/db";

async function requireAdmin() {
  const jar   = await cookies();
  const token = jar.get("mb_session")?.value ?? jar.get("mb_admin_token")?.value;
  if (!token) return null;
  try {
    const session = await verifySessionToken(token);
    if (session.role !== "ADMIN") return null;
    return session;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { contacts?: Array<{ name: string; email: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const list = body.contacts;
  if (!Array.isArray(list) || list.length === 0) {
    return NextResponse.json({ error: "contacts array is required" }, { status: 400 });
  }

  let count = 0;
  for (const c of list) {
    if (!c.email || typeof c.email !== "string") continue;
    const email = c.email.trim().toLowerCase();
    const name  = (c.name ?? "").trim() || email;
    await db.employeeDirectory.upsert({
      where:  { email },
      update: { name },
      create: { name, email },
    });
    count++;
  }

  return NextResponse.json({ upserted: count });
}
