import { notFound } from "next/navigation";
import Link         from "next/link";
import { db }       from "@/lib/db";
import { cn }       from "@/lib/utils";
import {
  ArrowLeft, Brain, Gavel, Zap, ArrowRight, Lightbulb,
  Mail, MailX, Calendar, Users, FileText, AtSign, Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

/* ─── Helpers ────────────────────────────────────────────── */
function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
      {children}
    </p>
  );
}

function MetaItem({
  icon: Icon,
  value,
}: {
  icon: React.ElementType;
  value: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {value}
    </span>
  );
}

function SectionList({
  label, icon: Icon, items, badgeCls, numCls,
}: {
  label:    string;
  icon:     React.ElementType;
  items:    string[];
  badgeCls: string;
  numCls:   string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
        badgeCls
      )}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
            <span className={cn(
              "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5",
              numCls
            )}>
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default async function SummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await db.meetingSummary.findUnique({
    where: { id },
  });

  if (!record) notFound();

  return (
    <div className="space-y-5 max-w-3xl pb-16">

      {/* Back */}
      <Link
        href="/superadmin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to list
      </Link>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-brand-900/50 via-purple-900/30 to-transparent border-b border-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                Meeting Brief
              </p>
              <h1 className="text-2xl font-extrabold text-white leading-tight">
                {record.title}
              </h1>
              <div className="flex flex-wrap gap-4 pt-1">
                {record.date      && <MetaItem icon={Calendar} value={record.date} />}
                {record.attendees && <MetaItem icon={Users}    value={record.attendees} />}
                <MetaItem icon={FileText} value={record.tone} />
                <MetaItem icon={Clock}    value={fmt(record.createdAt)} />
              </div>
            </div>

            {/* Send status badge */}
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold self-start",
              record.emailSent
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-gray-800 text-gray-400 border border-gray-700"
            )}>
              {record.emailSent
                ? <><Mail className="w-3.5 h-3.5" /> Email Sent</>
                : <><MailX className="w-3.5 h-3.5" /> Not Sent</>}
            </span>
          </div>
        </div>

        {/* ── Executive summary ──────────────────────────── */}
        <div className="px-6 pt-6 pb-0">
          <div className="rounded-xl bg-brand-950/50 border border-brand-800/30 p-4">
            <Label><Brain className="inline w-3 h-3 mr-1" />Executive Summary</Label>
            <p className="text-sm text-gray-300 leading-relaxed">{record.executiveSummary}</p>
          </div>
        </div>

        {/* ── Decisions / Action items / Next steps ──────── */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SectionList
              label="Decisions"
              icon={Gavel}
              items={record.decisions}
              badgeCls="bg-purple-500/15 text-purple-400"
              numCls="bg-purple-500/20 text-purple-400"
            />
            <SectionList
              label="Action Items"
              icon={Zap}
              items={record.actionItems}
              badgeCls="bg-amber-500/15 text-amber-400"
              numCls="bg-amber-500/20 text-amber-400"
            />
            <SectionList
              label="Next Steps"
              icon={ArrowRight}
              items={record.nextSteps}
              badgeCls="bg-emerald-500/15 text-emerald-400"
              numCls="bg-emerald-500/20 text-emerald-400"
            />
          </div>
        </div>

        {/* ── Quick gist ─────────────────────────────────── */}
        <div className="px-6 pb-6">
          <div className="rounded-xl bg-cyan-950/40 border border-cyan-800/30 p-4 flex gap-3">
            <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <Label>Quick Gist</Label>
              <p className="text-sm text-gray-300 italic">{record.shortGist}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Email delivery ────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-200">Email Delivery</h2>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* To */}
          <div>
            <Label><AtSign className="inline w-3 h-3 mr-1" />To</Label>
            {record.emailTo ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {record.emailTo.split(",").map((e) => (
                  <span key={e.trim()} className="rounded-md bg-gray-800 border border-gray-700 px-2 py-0.5 text-xs text-gray-300 font-mono">
                    {e.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 mt-1">—</p>
            )}
          </div>

          {/* CC */}
          <div>
            <Label><Users className="inline w-3 h-3 mr-1" />CC</Label>
            {record.emailCc ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {record.emailCc.split(",").map((e) => (
                  <span key={e.trim()} className="rounded-md bg-gray-800 border border-gray-700 px-2 py-0.5 text-xs text-gray-300 font-mono">
                    {e.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 mt-1">—</p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <div className="mt-1">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                record.emailSent
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-gray-800 text-gray-500"
              )}>
                {record.emailSent
                  ? <><Mail className="w-3.5 h-3.5" /> Sent</>
                  : <><MailX className="w-3.5 h-3.5" /> Not sent</>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Raw input ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <details className="group">
          <summary className="px-6 py-4 cursor-pointer flex items-center justify-between text-sm font-bold text-gray-400 hover:text-gray-200 transition-colors list-none border-b border-gray-800 group-open:border-b">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Raw Notes
            </span>
            <span className="text-gray-600 group-open:rotate-180 transition-transform text-xs">▼</span>
          </summary>
          <div className="p-6">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed font-mono bg-gray-950 rounded-xl p-4 border border-gray-800 max-h-80 overflow-y-auto">
              {record.rawInput}
            </pre>
          </div>
        </details>
      </div>

    </div>
  );
}
