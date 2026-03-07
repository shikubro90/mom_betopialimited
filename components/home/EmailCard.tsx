"use client";

import { useState }             from "react";
import { Mail, Send, Check, Loader2, AtSign, Users } from "lucide-react";
import { cn }                   from "@/lib/utils";
import { fieldCls, FieldError } from "@/components/ui/form";
import { emailFormSchema }      from "@/lib/validations";
import { Toast }                from "@/components/shared/Toast";
import type { Summary, MeetingMeta } from "@/types/meeting";

type FormErrors = Partial<Record<"to" | "cc" | "subject", string>>;
type ToastState = { message: string; type: "success" | "error" } | null;

interface Props {
  defaultSubject: string;
  defaultTo?:     string;
  summaryId:      string | null;
  summary:        Summary;
  meta:           MeetingMeta;
}

export function EmailCard({ defaultSubject, defaultTo = "", summaryId, summary, meta }: Props) {
  const [form,      setForm]      = useState({ to: defaultTo, cc: "", subject: defaultSubject });
  const [errors,    setErrors]    = useState<FormErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [toast,     setToast]     = useState<ToastState>(null);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailFormSchema.safeParse(form);
    if (!result.success) {
      const fe: FormErrors = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof FormErrors;
        if (!fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setIsSending(true);

    try {
      const res = await fetch("/api/email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:      form.to,
          cc:      form.cc,
          subject: form.subject,
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
      setToast({ message: "Meeting summary has been successfully sent.", type: "success" });
    } catch {
      setToast({ message: "Network error — please try again", type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Mail className="w-3.5 h-3.5 text-white" />
          </span>
          <h2 className="font-semibold text-gray-900">Send Brief via Email</h2>
        </div>

        {sent ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Brief delivered!</p>
              <p className="text-sm text-gray-500 mt-1">
                Sent to <span className="font-medium text-gray-700">{form.to}</span>
                {form.cc && <> and CC&apos;d <span className="font-medium text-gray-700">{form.cc}</span></>}
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setForm({ to: defaultTo, cc: "", subject: defaultSubject }); }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline underline-offset-2 transition-colors"
            >
              Send to someone else
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} noValidate className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  <AtSign className="w-3 h-3" /> To <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.to}
                  onChange={set("to")}
                  placeholder="team@company.com, boss@example.com"
                  className={fieldCls("focus:ring-emerald-400", errors.to)}
                />
                <FieldError msg={errors.to} />
                {!errors.to && <p className="text-[10px] text-gray-400">Separate multiple with commas</p>}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  <Users className="w-3 h-3" /> CC
                </label>
                <input
                  type="text"
                  value={form.cc}
                  onChange={set("cc")}
                  placeholder="optional@example.com"
                  className={fieldCls("focus:ring-emerald-400", errors.cc)}
                />
                <FieldError msg={errors.cc} />
                {!errors.cc && <p className="text-[10px] text-gray-400">Optional</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Subject <span className="text-emerald-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={set("subject")}
                className={fieldCls("focus:ring-emerald-400", errors.subject)}
              />
              <FieldError msg={errors.subject} />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSending}
                className={cn(
                  "flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white",
                  "bg-gradient-to-r from-emerald-500 to-cyan-500",
                  "shadow-lg shadow-emerald-200/50 transition-all duration-200",
                  "hover:opacity-90 hover:shadow-xl hover:shadow-emerald-300/40 hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                )}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? "Sending…" : "Send Brief"}
              </button>
            </div>
          </form>
        )}
      </div>

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
}
