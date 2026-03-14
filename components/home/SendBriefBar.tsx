"use client";

import { useState }             from "react";
import { Send, Loader2, Check, Mail, Users, AtSign, Paperclip, X, CheckCircle2, AlertCircle, Clock, Plus, Eye } from "lucide-react";
import { cn }                   from "@/lib/utils";
import { fieldCls, FieldError } from "@/components/ui/form";
import type { Summary, MeetingMeta } from "@/types/meeting";

type DeliveryStatus = {
  ok:       boolean;
  accepted: number;
  rejected: number;
  error?:   string;
  time:     string;
} | null;

interface Props {
  defaultSubject:   string;
  defaultTo:        string;
  summaryId:        string | null;
  summary:          Summary;
  meta:             MeetingMeta;
  attachmentNames?: string[];
  attachments?:     { filename: string; content: string; contentType: string }[];
}

export function SendBriefBar({ defaultSubject, defaultTo, summaryId, summary, meta, attachmentNames, attachments }: Props) {
  const [subject,     setSubject]     = useState(defaultSubject);
  const [ccList,      setCcList]      = useState<string[]>([""]);
  const [isSending,   setIsSending]   = useState(false);
  const [sent,        setSent]        = useState(false);
  const [delivery,    setDelivery]    = useState<DeliveryStatus>(null);
  const [subjectErr,  setSubjectErr]  = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const cc = ccList.filter(Boolean).join(", ");

  const recipientCount = defaultTo
    ? defaultTo.split(",").map((e) => e.trim()).filter(Boolean).length
    : 0;

  const handleSend = async () => {
    if (!subject.trim()) { setSubjectErr("Subject is required"); return; }
    setSubjectErr("");
    if (!defaultTo.trim()) {
      setDelivery({ ok: false, accepted: 0, rejected: 0, error: "Add attendee emails in the form above first.", time: now() });
      return;
    }

    setIsSending(true);
    setDelivery(null);
    try {
      const res  = await fetch("/api/email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:               defaultTo,
          cc:               cc.trim(),
          subject,
          summaryId,
          title:            meta.title,
          date:             meta.date,
          attendees:        meta.attendees,
          executiveSummary: summary.executiveSummary,
          decisions:        summary.decisions,
          actionItems:      summary.actionItems,
          nextSteps:        summary.nextSteps,
          attachments:      attachments ?? [],
        }),
      });
      // Safely parse JSON — Nginx may return HTML on 413/5xx
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch {
        const label = res.status === 413
          ? "File too large — reduce attachment size and try again"
          : `Server error (HTTP ${res.status}) — please try again`;
        setDelivery({ ok: false, accepted: 0, rejected: recipientCount, error: label, time: now() });
        return;
      }

      if (!res.ok) {
        setDelivery({ ok: false, accepted: 0, rejected: recipientCount, error: (json.error as string) ?? "Failed to send", time: now() });
      } else {
        setSent(true);
        setDelivery({
          ok:       true,
          accepted: (json.accepted as string[])?.length ?? recipientCount,
          rejected: (json.rejected as string[])?.length ?? 0,
          time:     now(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setDelivery({ ok: false, accepted: 0, rejected: recipientCount, error: `${msg} — please try again`, time: now() });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Mail className="w-3.5 h-3.5 text-white" />
          </span>
          <h2 className="font-semibold text-gray-900">Send Brief</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipients */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-3">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            {recipientCount > 0 ? (
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-700">
                  {recipientCount} recipient{recipientCount > 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-emerald-600 truncate">{defaultTo}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No attendee emails — add them in the form above.</p>
            )}
          </div>

          {/* Attachments */}
          {attachmentNames && attachmentNames.length > 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex flex-wrap gap-2">
              <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              {attachmentNames.map((name) => (
                <span key={name} className="text-[11px] bg-white border border-gray-200 rounded-md px-2 py-0.5 text-gray-600">{name}</span>
              ))}
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setSubjectErr(""); }}
              className={fieldCls("focus:ring-emerald-400", subjectErr)}
            />
            <FieldError msg={subjectErr} />
          </div>

          {/* CC */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <AtSign className="w-3 h-3" /> CC <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            {ccList.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const next = [...ccList];
                    next[i] = e.target.value;
                    setCcList(next);
                  }}
                  placeholder="manager@company.com"
                  className={cn(fieldCls("focus:ring-emerald-400"), "flex-1")}
                />
                {ccList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCcList(ccList.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCcList([...ccList, ""])}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add CC
              </button>
            </div>
          </div>

          {/* Send + Preview buttons */}
          <div className="flex flex-col items-end gap-2 pt-1">
            {sent ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <Check className="w-4 h-4" /> Brief sent!
                <button
                  onClick={() => { setSent(false); setDelivery(null); }}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                >
                  Send again
                </button>
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={isSending || recipientCount === 0}
                className={cn(
                  "flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white",
                  "bg-gradient-to-r from-emerald-500 to-cyan-500",
                  "shadow-lg shadow-emerald-200/50 transition-all duration-200",
                  "hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                )}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? "Sending…" : "Send Brief"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview email
            </button>
          </div>
        </div>
      </div>

      {/* ── Email preview modal ──────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-500" /> Email Preview
              </h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-sm space-y-1">
              <p><span className="text-gray-400 font-medium w-16 inline-block">To:</span> <span className="text-gray-700">{defaultTo || "—"}</span></p>
              {cc && <p><span className="text-gray-400 font-medium w-16 inline-block">CC:</span> <span className="text-gray-700">{cc}</span></p>}
              <p><span className="text-gray-400 font-medium w-16 inline-block">Subject:</span> <span className="text-gray-700">{subject}</span></p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm text-sm font-sans">
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)", padding: "24px 28px" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: ".08em", textTransform: "uppercase" }}>Meeting Brief</p>
                  <h2 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 800, color: "#fff" }}>{meta.title || "Untitled"}</h2>
                  {meta.date      && <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,.8)" }}>📅 {meta.date}</p>}
                  {meta.attendees && <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,.8)" }}>👥 {meta.attendees}</p>}
                </div>
                {/* Body */}
                <div style={{ padding: "24px 28px" }}>
                  <div style={{ background: "#eef2ff", borderLeft: "4px solid #6366f1", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#4f46e5" }}>Executive Summary</p>
                    <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{summary.executiveSummary}</p>
                  </div>
                  {[
                    { label: "Decisions",    color: "#7c3aed", bg: "#f5f3ff", items: summary.decisions },
                    { label: "Action Items", color: "#b45309", bg: "#fffbeb", items: summary.actionItems },
                    { label: "Next Steps",   color: "#065f46", bg: "#ecfdf5", items: summary.nextSteps },
                  ].map(({ label, color, bg, items }) => (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color, background: bg, padding: "3px 10px", borderRadius: 999, display: "inline-block", marginBottom: 8 }}>{label}</span>
                      <ol style={{ margin: 0, paddingLeft: 20 }}>
                        {items.filter(Boolean).map((item, i) => (
                          <li key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px 28px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Sent via <strong style={{ color: "#6366f1" }}>MoMBetopia</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delivery status — fixed bottom left ─────────────── */}
      {delivery && (
        <div className={cn(
          "fixed bottom-4 left-4 z-50 flex items-start gap-3 rounded-2xl shadow-xl border px-4 py-3 w-72",
          delivery.ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
        )}>
          {delivery.ok
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            : <AlertCircle  className="w-5 h-5 text-red-500    shrink-0 mt-0.5" />
          }
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-bold", delivery.ok ? "text-emerald-700" : "text-red-700")}>
              {delivery.ok ? "Brief delivered" : "Delivery failed"}
            </p>
            {delivery.ok ? (
              <p className="text-[11px] text-emerald-600 mt-0.5">
                ✓ {delivery.accepted} recipient{delivery.accepted !== 1 ? "s" : ""} received
                {delivery.rejected > 0 && ` · ${delivery.rejected} rejected`}
              </p>
            ) : (
              <p className="text-[11px] text-red-500 mt-0.5 break-words">{delivery.error}</p>
            )}
            <p className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
              <Clock className="w-3 h-3" /> {delivery.time}
            </p>
          </div>
          <button onClick={() => setDelivery(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
