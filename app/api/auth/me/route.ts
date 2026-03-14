import { NextResponse } from "next/server";
import { getSession }   from "@/lib/session";
import { db }           from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  // Look up real name from employee directory
  const employee = await db.employeeDirectory.findUnique({
    where:  { email: session.email },
    select: { name: true },
  });

  // Fall back to the name stored at registration if not in directory
  const user = await db.user.findUnique({
    where:  { email: session.email },
    select: { name: true },
  });

  const name = employee?.name ?? user?.name ?? session.email;

  return NextResponse.json({ user: { email: session.email, name } });
}
