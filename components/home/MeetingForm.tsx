"use client";

import { useState }              from "react";
import { Sparkles, Loader2, Calendar, FileText, ChevronDown, Plus, Trash2, UserPlus } from "lucide-react";
import { cn }                    from "@/lib/utils";
import { fieldCls, FieldError }  from "@/components/ui/form";
import { meetingFormSchema }     from "@/lib/validations";
import type { MeetingFormData }  from "@/types/meeting";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "executive",    label: "Executive Brief" },
  { value: "casual",       label: "Casual" },
  { value: "detailed",     label: "Detailed" },
  { value: "concise",      label: "Concise" },
];

type AttendeeRow = { name: string; email: string };
type FormErrors  = Partial<Record<keyof MeetingFormData, string>>;

interface Props {
  onSubmit:  (data: MeetingFormData) => void;
  isLoading: boolean;
}

export function MeetingForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useState({ title: "", date: "", notes: "", tone: "professional" });
  const [attendees, setAttendees] = useState<AttendeeRow[]>([{ name: "", email: "" }]);
  const [errors, setErrors] = useState<FormErrors>({});

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key as keyof FormErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const setAttendee = (i: number, field: keyof AttendeeRow, value: string) => {
    setAttendees((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
    setErrors((prev) => ({ ...prev, attendees: undefined, attendeeEmails: undefined }));
  };

  const addRow    = () => setAttendees((prev) => [...prev, { name: "", email: "" }]);
  const removeRow = (i: number) => setAttendees((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const attendeeNames  = attendees.map((a) => a.name).filter(Boolean).join(", ");
    const attendeeEmails = attendees.map((a) => a.email).filter(Boolean).join(", ");

    const payload: MeetingFormData = {
      ...form,
      attendees:      attendeeNames,
      attendeeEmails: attendeeEmails,
    };

    const result = meetingFormSchema.safeParse(payload);
    if (!result.success) {
      const fe: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof MeetingFormData;
        if (!fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    onSubmit(result.data as MeetingFormData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 via-purple-50 to-pink-50 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-hero-gradient flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-white" />
        </span>
        <h2 className="font-semibold text-gray-900">Meeting Details</h2>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
        {/* Title + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Meeting Title <span className="text-brand-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="Q3 Planning Call"
              className={fieldCls("focus:ring-brand-400", errors.title)}
            />
            <FieldError msg={errors.title} />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              className={fieldCls("focus:ring-brand-400")}
            />
          </div>
        </div>

        {/* Attendees dynamic list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <UserPlus className="w-3 h-3" /> Attendees
            </label>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="space-y-2">
            {attendees.map((row, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => setAttendee(i, "name", e.target.value)}
                  placeholder="Name"
                  className={cn(fieldCls("focus:ring-brand-400"), "flex-1")}
                />
                <input
                  type="email"
                  value={row.email}
                  onChange={(e) => setAttendee(i, "email", e.target.value)}
                  placeholder="email@example.com"
                  className={cn(fieldCls("focus:ring-brand-400"), "flex-1")}
                />
                {attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="mt-0.5 p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <FieldError msg={errors.attendeeEmails} />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            Notes / Agenda <span className="text-brand-500">*</span>
          </label>
          <textarea
            value={form.notes}
            onChange={set("notes")}
            rows={7}
            placeholder="Paste your meeting notes, transcript, or agenda here…"
            className={cn(fieldCls("focus:ring-brand-400", errors.notes), "resize-none leading-relaxed")}
          />
          <div className="flex items-center justify-between">
            <FieldError msg={errors.notes} />
            <span className={cn(
              "text-[11px] ml-auto",
              form.notes.length < 20 ? "text-gray-400" : "text-emerald-500"
            )}>
              {form.notes.length} chars
            </span>
          </div>
        </div>

        {/* Tone + Submit */}
        <div className="flex flex-col sm:flex-row gap-3 items-end pt-1">
          <div className="flex-1 space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Summary Tone
            </label>
            <div className="relative">
              <select
                value={form.tone}
                onChange={set("tone")}
                className={cn(fieldCls("focus:ring-brand-400"), "appearance-none pr-10 cursor-pointer")}
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white",
              "bg-hero-gradient shadow-lg shadow-brand-300/40 transition-all duration-200",
              "hover:opacity-90 hover:shadow-xl hover:shadow-brand-400/30 hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading ? "Summarizing…" : "Summarize"}
          </button>
        </div>
      </form>
    </div>
  );
}
