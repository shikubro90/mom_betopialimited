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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { blocked?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.blocked !== "boolean") {
    return NextResponse.json({ error: "blocked (boolean) is required" }, { status: 400 });
  }

  try {
    const updated = await db.user.update({
      where: { id },
      data: {
        blocked:   body.blocked,
        blockedAt: body.blocked ? new Date() : null,
      },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        blocked:   true,
        blockedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
