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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await db.employeeDirectory.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
