import { db }           from "@/lib/db";
import { SummaryTable } from "@/components/admin/SummaryTable";
import type { SummaryRow } from "@/components/admin/SummaryTable";

export const metadata = { title: "Admin — MeetBrief" };
export const dynamic  = "force-dynamic";

async function getData() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [rows, sent, week] = await Promise.all([
    db.meetingSummary.findMany({
      orderBy: { createdAt: "desc" },
      take:    200,
      select: {
        id:        true,
        title:     true,
        date:      true,
        shortGist: true,
        emailSent: true,
        tone:      true,
        createdAt: true,
      },
    }),
    db.meetingSummary.count({ where: { emailSent: true } }),
    db.meetingSummary.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  return { rows, sent, week };
}

export default async function AdminPage() {
  const { rows, sent, week } = await getData();

  const serialized: SummaryRow[] = rows.map((r) => ({
    ...r,
    date:      r.date ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <SummaryTable
      rows={serialized}
      total={rows.length}
      sent={sent}
      week={week}
    />
  );
}
