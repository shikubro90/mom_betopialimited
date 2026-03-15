import { NextRequest, NextResponse } from "next/server";
import { getSession }               from "@/lib/session";
import { db }                       from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session || (session as { role?: string }).role !== "ADMIN") return false;
  return true;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domains = await db.allowedDomain.findMany({
    orderBy: { domain: "asc" },
  });

  return NextResponse.json(domains);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await req.json();
  if (!domain?.trim()) return NextResponse.json({ error: "Domain required" }, { status: 400 });

  const record = await db.allowedDomain.upsert({
    where:  { domain: domain.trim().toLowerCase() },
    update: { active: true },
    create: { domain: domain.trim().toLowerCase(), active: true },
  });

  return NextResponse.json(record, { status: 201 });
}
