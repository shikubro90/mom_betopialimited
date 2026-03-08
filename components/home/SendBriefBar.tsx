"use client";

import { useState }             from "react";
import { Send, Loader2, Check, Mail, Users, AtSign, Paperclip } from "lucide-react";
import { cn }                   from "@/lib/utils";
import { fieldCls, FieldError } from "@/components/ui/form";
import { Toast }                from "@/components/shared/Toast";
import type { Summary, MeetingMeta } from "@/types/meeting";

type ToastState = { message: string; type: "success" | "error" } | null;

interface Props {
  defaultSubject:  string;
  defaultTo:       string;
  summaryId:       string | null;
  summary:         Summary;
  meta:            MeetingMeta;
  attachmentNames?: string[];
}

export function SendBriefBar({ defaultSubject, defaultTo, summaryId, summary, meta, attachmentNames }: Props) {
  const [subject,   setSubject]   = useState(defaultSubject);
  const [cc,        setCc]        = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [toast,     setToast]     = useState<ToastState>(null);
  const [ccError,   setCcError]   = useState("");
  const [subjectError, setSubjectError] = useState("");

  const recipientCount = defaultTo
    ? defaultTo.split(",").map((e) => e.trim()).filter(Boolean).length
    : 0;

  const handleSend = async () => {
    let valid = true;
    if (!subject.trim()) { setSubjectError("Subject is required"); valid = false; }
    else setSubjectError("");

    if (!defaultTo.trim()) {
      setToast({ message: "Add attendee emails in the form above first.", type: "error" });
      return;
    }
    if (!valid) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/email", {
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
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setToast({ message: json.error ?? "Failed to send email", type: "error" });
        return;
      }
      setSent(true);
      setToast({ message: "Meeting brief sent to all attendees.", type: "success" });
    } catch {
      setToast({ message: "Network error — please try again", type: "error" });
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
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setSubjectError(""); }}
              className={fieldCls("focus:ring-emerald-400", subjectError)}
            />
            <FieldError msg={subjectError} />
          </div>

          {/* CC */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <AtSign className="w-3 h-3" /> CC <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={cc}
              onChange={(e) => { setCc(e.target.value); setCcError(""); }}
              placeholder="manager@company.com"
              className={fieldCls("focus:ring-emerald-400", ccError)}
            />
            <FieldError msg={ccError} />
          </div>

          {/* Send button */}
          <div className="flex justify-end pt-1">
            {sent ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <Check className="w-4 h-4" /> Brief sent!
                <button
                  onClick={() => setSent(false)}
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
          </div>
        </div>
      </div>

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
}
