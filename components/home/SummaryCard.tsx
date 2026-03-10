"use client";

import { useState, useRef, useEffect } from "react";
import {
  Brain,
  Gavel,
  Zap,
  ArrowRight,
  Lightbulb,
  Edit3,
  Check,
  Plus,
  Trash2,
  Bold,
  Italic,
  List,
  Highlighter,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Summary } from "@/types/meeting";

/* ─── Simple markdown renderer ───────────────────────────── */
function renderMd(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/==(.*?)==/g, '<mark style="background:#fef08a;padding:0 2px;border-radius:3px">$1</mark>')
    .replace(/\n/g, "<br>");
}

/* ─── Skeleton ───────────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-gray-100 animate-pulse", className)} />;
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

/* ─── Format toolbar ─────────────────────────────────────── */
function FormatToolbar({ targetRef, onUpdate }: {
  targetRef: React.RefObject<HTMLTextAreaElement>;
  onUpdate: (val: string) => void;
}) {
  const apply = (fmt: "bold" | "italic" | "highlight" | "bullet") => {
    const el = targetRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const text  = el.value;
    const sel   = text.slice(start, end);
    let replacement = sel;

    if (fmt === "bold")      replacement = `**${sel}**`;
    if (fmt === "italic")    replacement = `_${sel}_`;
    if (fmt === "highlight") replacement = `==${sel}==`;
    if (fmt === "bullet") {
      replacement = sel
        ? sel.split("\n").map((l) => `• ${l}`).join("\n")
        : "• ";
    }

    const next = text.slice(0, start) + replacement + text.slice(end);
    onUpdate(next);
    // restore focus + cursor
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  };

  const btn = (fmt: "bold" | "italic" | "highlight" | "bullet", Icon: LucideIcon, title: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); apply(fmt); }}
      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="flex gap-0.5 mb-1.5 p-1 bg-gray-50 border border-gray-200 rounded-lg w-fit">
      {btn("bold",      Bold,        "Bold (**text**)")}
      {btn("italic",    Italic,      "Italic (_text_)")}
      {btn("highlight", Highlighter, "Highlight (==text==)")}
      {btn("bullet",    List,        "Bullet list")}
    </div>
  );
}

/* ─── Section list ───────────────────────────────────────── */
interface SectionProps {
  label:    string;
  badgeCls: string;
  numCls:   string;
  icon:     LucideIcon;
  items:    string[];
  editing:  boolean;
  onChange: (index: number, value: string) => void;
  onAdd:    () => void;
  onRemove: (index: number) => void;
}

function SectionList({ label, badgeCls, numCls, icon: Icon, items, editing, onChange, onAdd, onRemove }: SectionProps) {
  return (
    <div className="space-y-3">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", badgeCls)}>
        <Icon className="w-3 h-3" />
        {label}
      </span>

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700">
            <span className={cn("w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5", numCls)}>
              {i + 1}
            </span>
            {editing ? (
              <div className="flex flex-1 gap-1 items-start">
                <input
                  value={item}
                  onChange={(e) => onChange(i, e.target.value)}
                  className="flex-1 text-sm bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-brand-400 pb-0.5"
                />
                <button type="button" onClick={() => onRemove(i)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span>{item}</span>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add item
        </button>
      )}
    </div>
  );
}

/* ─── Main card ──────────────────────────────────────────── */
interface Props {
  summary:        Summary | null;
  isLoading:      boolean;
  startEditing?:  boolean;
  onChange?:      (summary: Summary) => void;
}

export function SummaryCard({ summary, isLoading, startEditing, onChange }: Props) {
  const [editing, setEditing] = useState(startEditing ?? false);
  const [draft,   setDraft]   = useState<Summary | null>(startEditing ? emptyS() : null);
  const execSummaryRef        = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (summary && !startEditing) setDraft(null);
  }, [summary, startEditing]);

  const data = draft ?? summary;

  if (isLoading) return <LoadingSkeleton />;
  if (!data)     return null;

  const notify = (updated: Summary) => { if (onChange) onChange(updated); };

  const updateField = (key: keyof Summary, value: string) => {
    const updated = { ...(draft ?? data), [key]: value } as Summary;
    setDraft(updated);
    notify(updated);
  };

  const updateListItem = (
    key: keyof Pick<Summary, "decisions" | "actionItems" | "nextSteps">,
    index: number,
    value: string
  ) => {
    const arr = [...(data[key] as string[])];
    arr[index] = value;
    const updated = { ...(draft ?? data), [key]: arr } as Summary;
    setDraft(updated);
    notify(updated);
  };

  const addListItem = (key: keyof Pick<Summary, "decisions" | "actionItems" | "nextSteps">) => {
    const arr = [...(data[key] as string[]), ""];
    const updated = { ...(draft ?? data), [key]: arr } as Summary;
    setDraft(updated);
    notify(updated);
  };

  const removeListItem = (
    key: keyof Pick<Summary, "decisions" | "actionItems" | "nextSteps">,
    index: number
  ) => {
    const arr = (data[key] as string[]).filter((_, i) => i !== index);
    const updated = { ...(draft ?? data), [key]: arr } as Summary;
    setDraft(updated);
    notify(updated);
  };

  const handleSave = () => {
    if (draft && onChange) onChange(draft);
    setEditing(false);
  };

  const handleEditToggle = () => {
    if (editing) {
      handleSave();
    } else {
      setDraft(data);
      setEditing(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-hero-gradient flex items-center justify-center shrink-0">
            <Brain className="w-3.5 h-3.5 text-white" />
          </span>
          <h2 className="font-semibold text-gray-900">{startEditing ? "Write Brief" : "AI Summary"}</h2>
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
          {editing ? <><Check className="w-3.5 h-3.5" /> Save</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Executive summary */}
        <div className="rounded-xl bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-black text-brand-700 uppercase tracking-widest mb-2">
            <Brain className="w-3 h-3" /> Executive Summary
          </p>
          {editing ? (
            <>
              <FormatToolbar
                targetRef={execSummaryRef}
                onUpdate={(val) => updateField("executiveSummary", val)}
              />
              <textarea
                ref={execSummaryRef}
                value={data.executiveSummary}
                onChange={(e) => updateField("executiveSummary", e.target.value)}
                rows={4}
                placeholder="Write the executive summary here…"
                className="w-full text-sm text-gray-700 bg-transparent focus:outline-none resize-none leading-relaxed"
              />
            </>
          ) : (
            <p
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMd(data.executiveSummary || "") }}
            />
          )}
        </div>

        {/* Three-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SectionList
            label="Decisions"
            badgeCls="bg-purple-100 text-purple-700"
            numCls="bg-purple-100 text-purple-600"
            icon={Gavel}
            items={data.decisions}
            editing={editing}
            onChange={(i, v) => updateListItem("decisions", i, v)}
            onAdd={() => addListItem("decisions")}
            onRemove={(i) => removeListItem("decisions", i)}
          />
          <SectionList
            label="Action Items"
            badgeCls="bg-amber-100 text-amber-700"
            numCls="bg-amber-100 text-amber-600"
            icon={Zap}
            items={data.actionItems}
            editing={editing}
            onChange={(i, v) => updateListItem("actionItems", i, v)}
            onAdd={() => addListItem("actionItems")}
            onRemove={(i) => removeListItem("actionItems", i)}
          />
          <SectionList
            label="Next Steps"
            badgeCls="bg-emerald-100 text-emerald-700"
            numCls="bg-emerald-100 text-emerald-600"
            icon={ArrowRight}
            items={data.nextSteps}
            editing={editing}
            onChange={(i, v) => updateListItem("nextSteps", i, v)}
            onAdd={() => addListItem("nextSteps")}
            onRemove={(i) => removeListItem("nextSteps", i)}
          />
        </div>

        {/* Gist */}
        <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-100 p-4 flex gap-3">
          <Lightbulb className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-cyan-700 uppercase tracking-widest mb-1.5">Quick Gist</p>
            {editing ? (
              <textarea
                value={data.gist}
                onChange={(e) => updateField("gist", e.target.value)}
                rows={2}
                placeholder="One-line summary…"
                className="w-full text-sm text-gray-700 bg-transparent focus:outline-none resize-none italic"
              />
            ) : (
              <p className="text-sm text-gray-700 italic leading-relaxed">{data.gist}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyS(): Summary {
  return {
    executiveSummary: "",
    decisions:        [""],
    actionItems:      [""],
    nextSteps:        [""],
    gist:             "",
  };
}
