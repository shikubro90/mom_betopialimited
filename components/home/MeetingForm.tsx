"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Calendar, FileText, ChevronDown, Plus, Trash2, UserPlus, Bot, PenLine, Paperclip, X, AlertTriangle, Eraser } from "lucide-react";
import { cn }                    from "@/lib/utils";
import { fieldCls, FieldError }  from "@/components/ui/form";
import { meetingFormSchema }     from "@/lib/validations";
import type { MeetingFormData }  from "@/types/meeting";
import { useContactSearch, type Contact } from "@/lib/useContacts";

const STORAGE_KEY = "mombetopia_form_draft";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "executive",    label: "Executive Brief" },
  { value: "casual",       label: "Casual" },
  { value: "detailed",     label: "Detailed" },
  { value: "concise",      label: "Concise" },
];

type AttendeeRow = { name: string; email: string };
type FormErrors  = Partial<Record<keyof MeetingFormData, string>>;

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

const SUPPORTED_EXTS = new Set([
  "jpg","jpeg","png","gif","svg","webp","psd",
  "pdf","doc","docx","xls","xlsx","csv","ppt","pptx",
  "txt","md","json","zip",
]);

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

interface Props {
  onSubmit:  (data: MeetingFormData, files: File[]) => void;
  isLoading: boolean;
}

const DEFAULT_FORM = { title: "", date: new Date().toISOString().split("T")[0], notes: "", tone: "professional" };
const DEFAULT_ATTENDEES: AttendeeRow[] = [{ name: "", email: "" }];

function loadDraft() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"); } catch { return null; }
}

// Attendee suggestion dropdown
function SuggestionDropdown({
  suggestions,
  onSelect,
  inputRef,
}: {
  suggestions: Contact[];
  onSelect: (c: Contact) => void;
  inputRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div
      className="absolute left-0 top-full mt-1 z-50 w-full min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
    >
      {suggestions.map((c) => (
        <button
          key={c.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
          className="w-full text-left px-3 py-2 hover:bg-brand-50 transition-colors"
        >
          <div className="text-sm font-medium text-gray-800 truncate">{c.name}</div>
          <div className="text-xs text-gray-400 truncate">{c.email}</div>
        </button>
      ))}
    </div>
  );
}

export function MeetingForm({ onSubmit, isLoading }: Props) {
  const [form, setForm]             = useState<typeof DEFAULT_FORM>(DEFAULT_FORM);
  const [attendees, setAttendees]   = useState<AttendeeRow[]>(DEFAULT_ATTENDEES);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [mode, setMode]             = useState<"ai" | "manual">("ai");
  const [files, setFiles]           = useState<File[]>([]);
  const [fileAlerts, setFileAlerts] = useState<string[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  // Per-row server-side contact search — one hook instance per rendered row
  const row0 = useContactSearch();
  const row1 = useContactSearch();
  const row2 = useContactSearch();
  const row3 = useContactSearch();
  const row4 = useContactSearch();
  const rowSearchHooks = [row0, row1, row2, row3, row4];
  const getRowSearch = (i: number) => rowSearchHooks[i] ?? row4;
  const [focusedInput, setFocusedInput] = useState<{ row: number; field: "name" | "email" } | null>(null);

  // Load draft from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    if (draft.form)      setForm(draft.form);
    if (draft.attendees) setAttendees(draft.attendees);
    if (draft.mode)      setMode(draft.mode);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusedInput(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Persist draft to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, attendees, mode }));
  }, [form, attendees, mode]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setForm(DEFAULT_FORM);
    setAttendees(DEFAULT_ATTENDEES);
    setMode("ai");
    setFiles([]);
    setFileAlerts([]);
    setErrors({});
  };

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

  const selectSuggestion = (i: number, contact: Contact) => {
    setAttendees((prev) => prev.map((a, idx) => idx === i ? { name: contact.name, email: contact.email } : a));
    setFocusedInput(null);
  };

  const addRow    = () => setAttendees((prev) => [...prev, { name: "", email: "" }]);
  const removeRow = (i: number) => setAttendees((prev) => prev.filter((_, idx) => idx !== i));

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const alerts: string[] = [];
    const valid: File[] = [];

    Array.from(newFiles).forEach((f) => {
      if (f.size > MAX_FILE_SIZE) {
        alerts.push(`"${f.name}" exceeds the 1 GB limit.`);
        return;
      }
      const ext = getExt(f.name);
      if (ext && !SUPPORTED_EXTS.has(ext)) {
        alerts.push(`"${f.name}" format (.${ext}) is not supported.`);
        return;
      }
      valid.push(f);
    });

    if (alerts.length > 0) setFileAlerts(alerts);

    if (valid.length > 0) {
      setIsReadingFiles(true);
      setFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name));
        return [...prev, ...valid.filter((f) => !existing.has(f.name))];
      });
      // Brief delay to show loader while browser processes files
      setTimeout(() => setIsReadingFiles(false), 600);
    }
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const attendeeNames  = attendees.map((a) => a.name).filter(Boolean).join(", ");
    const attendeeEmails = attendees.map((a) => a.email).filter(Boolean).join(", ");

    // In manual mode, notes is optional — use a placeholder to pass validation
    const notesValue = mode === "manual" && !form.notes.trim() ? "Manual entry" : form.notes;

    const payload: MeetingFormData = {
      ...form,
      notes:           notesValue,
      attendees:       attendeeNames,
      attendeeEmails:  attendeeEmails,
      mode,
      attachmentNames: files.map((f) => f.name),
    };

    const result = meetingFormSchema.safeParse(payload);
    if (!result.success) {
      const fe: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof MeetingFormData;
        if (!fe[key]) fe[key] = issue.message;
      }
      // In manual mode, ignore notes error
      if (mode === "manual") delete fe.notes;
      if (Object.keys(fe).length > 0) {
        setErrors(fe);
        return;
      }
    }
    setErrors({});
    onSubmit({ ...payload, notes: form.notes }, files);
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.45)" }}>
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.35)" }}>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-hero-gradient flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-white" />
          </span>
          <h2 className="font-semibold text-gray-900">Meeting Details</h2>
        </div>
        <button
          type="button"
          onClick={clearDraft}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" /> Clear all
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              mode === "ai"
                ? "bg-white shadow text-brand-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Bot className="w-3.5 h-3.5" /> AI Summary
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              mode === "manual"
                ? "bg-white shadow text-brand-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <PenLine className="w-3.5 h-3.5" /> Write Manually
          </button>
        </div>

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

        {/* Attendees */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            <UserPlus className="w-3 h-3" /> Attendees
          </label>

          <div className="space-y-2">
            {attendees.map((row, i) => {
              const { suggestions, search: searchContacts, clear: clearSuggestions } = getRowSearch(i);
              const nameActive  = focusedInput?.row === i && focusedInput.field === "name";
              const emailActive = focusedInput?.row === i && focusedInput.field === "email";

              return (
                <div key={i} className="flex gap-2 items-start">
                  {/* Name field */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => {
                        setAttendee(i, "name", e.target.value);
                        setFocusedInput({ row: i, field: "name" });
                        searchContacts(e.target.value);
                      }}
                      onFocus={() => { setFocusedInput({ row: i, field: "name" }); searchContacts(row.name || " "); }}
                      onBlur={() => setTimeout(() => { setFocusedInput(null); clearSuggestions(); }, 300)}
                      placeholder="Name"
                      className={cn(fieldCls("focus:ring-brand-400"), "w-full")}
                    />
                    {nameActive && suggestions.length > 0 && (
                      <SuggestionDropdown
                        suggestions={suggestions}
                        onSelect={(c) => { selectSuggestion(i, c); clearSuggestions(); setFocusedInput(null); }}
                        inputRef={{ current: null }}
                      />
                    )}
                  </div>

                  {/* Email field */}
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) => {
                        setAttendee(i, "email", e.target.value);
                        setFocusedInput({ row: i, field: "email" });
                        searchContacts(e.target.value);
                      }}
                      onFocus={() => { setFocusedInput({ row: i, field: "email" }); searchContacts(row.email || " "); }}
                      onBlur={() => setTimeout(() => { setFocusedInput(null); clearSuggestions(); }, 300)}
                      placeholder="email@example.com"
                      className={cn(fieldCls("focus:ring-brand-400"), "w-full")}
                    />
                    {emailActive && suggestions.length > 0 && (
                      <SuggestionDropdown
                        suggestions={suggestions}
                        onSelect={(c) => { selectSuggestion(i, c); clearSuggestions(); setFocusedInput(null); }}
                        inputRef={{ current: null }}
                      />
                    )}
                  </div>

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
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <FieldError msg={errors.attendeeEmails} />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            Notes / Agenda {mode === "ai" && <span className="text-brand-500">*</span>}
            {mode === "manual" && <span className="text-gray-400 normal-case font-normal ml-1">(optional — for reference)</span>}
          </label>
          <textarea
            value={form.notes}
            onChange={set("notes")}
            rows={7}
            placeholder={
              mode === "ai"
                ? "Paste your meeting notes, transcript, or agenda here…"
                : "Paste raw notes for reference (optional)…"
            }
            className={cn(fieldCls("focus:ring-brand-400", mode === "ai" ? errors.notes : undefined), "resize-none leading-relaxed")}
          />
          <div className="flex items-center justify-between">
            {mode === "ai" && <FieldError msg={errors.notes} />}
            <span className={cn(
              "text-[11px] ml-auto",
              form.notes.length < 20 ? "text-gray-400" : "text-emerald-500"
            )}>
              {form.notes.length} chars
            </span>
          </div>
        </div>

        {/* File Attachments */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachments <span className="text-gray-400 normal-case font-normal">(optional)</span></span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
          >
            {isReadingFiles
              ? <Loader2 className="w-4 h-4 text-brand-400 mx-auto mb-1 animate-spin" />
              : <Paperclip className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            }
            <p className="text-xs text-gray-400">{isReadingFiles ? "Loading files…" : "Click or drag files here"}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">PDF, Word, Excel, PPT, CSV, Images, PSD · Max 1 GB</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.svg,.webp,.psd,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.json,.zip"
              className="hidden"
              onChange={(e) => { setFileAlerts([]); addFiles(e.target.files); }}
            />
          </div>
          {fileAlerts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 space-y-1">
              {fileAlerts.map((msg, i) => (
                <p key={i} className="flex items-start gap-1.5 text-[11px] text-red-600">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {msg}
                </p>
              ))}
              <button type="button" onClick={() => setFileAlerts([])} className="text-[10px] text-red-400 underline">Dismiss</button>
            </div>
          )}

          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                  <span className="flex items-center gap-1.5 truncate">
                    <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{f.name}</span>
                    <span className="text-gray-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                  </span>
                  <button type="button" onClick={() => removeFile(f.name)} className="ml-2 text-gray-400 hover:text-red-500 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tone + Submit */}
        <div className="flex flex-col sm:flex-row gap-3 items-end pt-1">
          {mode === "ai" && (
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
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white",
              "bg-hero-gradient shadow-lg shadow-brand-300/40 transition-all duration-200",
              "hover:opacity-90 hover:shadow-xl hover:shadow-brand-400/30 hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
              mode === "ai" ? "" : "w-full sm:w-auto"
            )}
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : mode === "ai" ? <Sparkles className="w-4 h-4" /> : <PenLine className="w-4 h-4" />
            }
            {isLoading ? "Processing…" : mode === "ai" ? "Summarize with AI" : "Create Brief"}
          </button>
        </div>
      </form>
    </div>
  );
}
