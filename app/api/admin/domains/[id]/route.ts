import { NextRequest, NextResponse } from "next/server";
import { getSession }               from "@/lib/session";
import { db }                       from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session || (session as { role?: string }).role !== "ADMIN") return false;
  return true;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db.allowedDomain.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
