"use client";

import { useState } from "react";
import {
  Brain,
  Gavel,
  Zap,
  ArrowRight,
  Lightbulb,
  Edit3,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Summary } from "@/types/meeting";

/* ─── Skeleton ───────────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg bg-gray-100 animate-pulse", className)} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center gap-2">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="p-6 space-y-5">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ))}
        </div>
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

/* ─── Section badge + list ───────────────────────────────── */
interface SectionProps {
  label:    string;
  badgeCls: string;
  rowCls:   string;
  numCls:   string;
  icon:     LucideIcon;
  items:    string[];
  editing:  boolean;
  onChange: (index: number, value: string) => void;
}

function SectionList({
  label,
  badgeCls,
  rowCls,
  numCls,
  icon: Icon,
  items,
  editing,
  onChange,
}: SectionProps) {
  return (
    <div className="space-y-3">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
          badgeCls
        )}
      >
        <Icon className="w-3 h-3" />
        {label}
      </span>

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={cn("flex gap-2 text-sm text-gray-700", rowCls)}>
            <span
              className={cn(
                "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5",
                numCls
              )}
            >
              {i + 1}
            </span>
            {editing ? (
              <input
                value={item}
                onChange={(e) => onChange(i, e.target.value)}
                className="flex-1 text-sm bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-brand-400 pb-0.5"
              />
            ) : (
              <span>{item}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Main card ──────────────────────────────────────────── */
interface Props {
  summary:   Summary | null;
  isLoading: boolean;
}

export function SummaryCard({ summary, isLoading }: Props) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState<Summary | null>(null);

  const data = draft ?? summary;

  if (isLoading) return <LoadingSkeleton />;
  if (!data)     return null;

  const updateField = (key: keyof Summary, value: string) =>
    setDraft((d) => ({ ...(d ?? data), [key]: value } as Summary));

  const updateListItem = (
    key: keyof Pick<Summary, "decisions" | "actionItems" | "nextSteps">,
    index: number,
    value: string
  ) => {
    const arr = [...(data[key] as string[])];
    arr[index] = value;
    setDraft((d) => ({ ...(d ?? data), [key]: arr } as Summary));
  };

  const handleEditToggle = () => {
    if (editing) setDraft(null); // discard — or keep: remove this line to save on toggle
    setEditing((e) => !e);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-hero-gradient flex items-center justify-center shrink-0">
            <Brain className="w-3.5 h-3.5 text-white" />
          </span>
          <h2 className="font-semibold text-gray-900">AI Summary</h2>
        </div>

        <button
          onClick={handleEditToggle}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            editing
              ? "bg-brand-600 text-white shadow-sm"
              : "border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600"
          )}
        >
          {editing ? (
            <><Check className="w-3.5 h-3.5" /> Save</>
          ) : (
            <><Edit3 className="w-3.5 h-3.5" /> Edit</>
          )}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Executive summary */}
        <div className="rounded-xl bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-black text-brand-700 uppercase tracking-widest mb-2">
            <Brain className="w-3 h-3" /> Executive Summary
          </p>
          {editing ? (
            <textarea
              value={data.executiveSummary}
              onChange={(e) => updateField("executiveSummary", e.target.value)}
              rows={3}
              className="w-full text-sm text-gray-700 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.executiveSummary}
            </p>
          )}
        </div>

        {/* Three-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SectionList
            label="Decisions"
            badgeCls="bg-purple-100 text-purple-700"
            rowCls=""
            numCls="bg-purple-100 text-purple-600"
            icon={Gavel}
            items={data.decisions}
            editing={editing}
            onChange={(i, v) => updateListItem("decisions", i, v)}
          />
          <SectionList
            label="Action Items"
            badgeCls="bg-amber-100 text-amber-700"
            rowCls=""
            numCls="bg-amber-100 text-amber-600"
            icon={Zap}
            items={data.actionItems}
            editing={editing}
            onChange={(i, v) => updateListItem("actionItems", i, v)}
          />
          <SectionList
            label="Next Steps"
            badgeCls="bg-emerald-100 text-emerald-700"
            rowCls=""
            numCls="bg-emerald-100 text-emerald-600"
            icon={ArrowRight}
            items={data.nextSteps}
            editing={editing}
            onChange={(i, v) => updateListItem("nextSteps", i, v)}
          />
        </div>

        {/* Gist */}
        <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-100 p-4 flex gap-3">
          <Lightbulb className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-cyan-700 uppercase tracking-widest mb-1.5">
              Quick Gist
            </p>
            {editing ? (
              <textarea
                value={data.gist}
                onChange={(e) => updateField("gist", e.target.value)}
                rows={2}
                className="w-full text-sm text-gray-700 bg-transparent focus:outline-none resize-none italic"
              />
            ) : (
              <p className="text-sm text-gray-700 italic leading-relaxed">
                {data.gist}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
