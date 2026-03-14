import { NextRequest, NextResponse } from "next/server";
import { db }                       from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const contacts = await db.employeeDirectory.findMany({
    where: q
      ? {
          OR: [
            { name:  { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
    take: q ? 50 : 20,  // more results when searching, fewer for empty-field browse
  });

  return NextResponse.json(contacts);
}
