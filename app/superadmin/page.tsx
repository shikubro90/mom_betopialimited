import { db }           from "@/lib/db";
import { SummaryTable } from "@/components/admin/SummaryTable";
import type { SummaryRow } from "@/components/admin/SummaryTable";

export const metadata = { title: "Admin — MoMBetopia" };
export const dynamic  = "force-dynamic";

async function getData() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [rows, sent, week, total] = await Promise.all([
    db.meetingSummary.findMany({
      orderBy: { createdAt: "desc" },
      take:    200,
      select: {
        id:               true,
        title:            true,
        date:             true,
        shortGist:        true,
        executiveSummary: true,
        decisions:        true,
        actionItems:      true,
        nextSteps:        true,
        emailSent:        true,
        tone:             true,
        createdAt:        true,
      },
    }),
    db.meetingSummary.count({ where: { emailSent: true } }),
    db.meetingSummary.count({ where: { createdAt: { gte: weekAgo } } }),
    db.meetingSummary.count(),
  ]);

  return { rows, sent, week, total };
}

export default async function AdminPage() {
  const { rows, sent, week, total } = await getData();

  const serialized: SummaryRow[] = rows.map((r) => ({
    ...r,
    date:             r.date      ?? null,
    executiveSummary: r.executiveSummary ?? "",
    decisions:        r.decisions as string[],
    actionItems:      r.actionItems as string[],
    nextSteps:        r.nextSteps as string[],
    createdAt:        r.createdAt.toISOString(),
  }));

  return (
    <SummaryTable
      rows={serialized}
      total={total}
      sent={sent}
      week={week}
    />
  );
}
