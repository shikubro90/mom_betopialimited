import { db }           from "@/lib/db";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata = { title: "Users — MoMBetopia Admin" };
export const dynamic  = "force-dynamic";

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      blocked:   true,
      createdAt: true,
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return <UsersManager initialUsers={serialized} />;
}
