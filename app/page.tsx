"use client";

import { useState }          from "react";
import Link                   from "next/link";
import { Navbar }             from "@/components/home/Navbar";
import { MeetingForm }        from "@/components/home/MeetingForm";
import { SummaryCard }        from "@/components/home/SummaryCard";
import { SendBriefBar }       from "@/components/home/SendBriefBar";
import { Toast }              from "@/components/shared/Toast";
import { LogIn, UserPlus, X } from "lucide-react";
import type { MeetingFormData, Summary, MeetingMeta, SummarizeResult } from "@/types/meeting";

/* ── Rate-limit modal ─────────────────────────────────────── */
function GuestLimitModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f14] shadow-2xl p-6 text-white">
        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* top gradient line */}
        <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 mb-5" />

        <h2 className="text-lg font-bold mb-1">Free AI limit reached</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          You&apos;ve used all 3 free AI summaries. Login or register with your work email
          to get <span className="text-white font-semibold">10 AI summaries per hour</span>.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold bg-brand-600 hover:bg-brand-500 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold border border-white/10 hover:bg-white/5 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
async function readTextFiles(files: File[]): Promise<string> {
  const textTypes = ["text/plain", "text/markdown", "text/csv", "application/json"];
  const texts: string[] = [];
  for (const file of files) {
    if (textTypes.includes(file.type) || file.name.match(/\.(txt|md|csv|json)$/i)) {
      try {
        const content = await file.text();
        texts.push(`\n\n--- Attachment: ${file.name} ---\n${content}`);
      } catch { /* skip unreadable */ }
    }
  }
  return texts.join("");
}

function getFingerprint(): string {
  try {
    const raw = [
      navigator.userAgent,
      `${screen.width}x${screen.height}`,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform,
      String(screen.colorDepth),
    ].join("|");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = Math.imul(31, hash) + raw.charCodeAt(i) | 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return "unknown";
  }
}

async function generateSummary(data: MeetingFormData, files: File[]): Promise<SummarizeResult & { limitReached?: boolean }> {
  const fileText = await readTextFiles(files);
  const rawInput = data.notes + fileText;

  const res = await fetch("/api/summarize", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title:       data.title,
      date:        data.date,
      attendees:   data.attendees,
      rawInput,
      tone:        data.tone,
      fingerprint: getFingerprint(),
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    if (res.status === 429 && json.code === "GUEST_AI_LIMIT_REACHED") {
      // Signal to caller to show modal instead of toast
      const err = new Error(json.message) as Error & { limitReached: boolean };
      err.limitReached = true;
      throw err;
    }
    if (res.status === 429 && json.code === "USER_AI_LIMIT_REACHED") {
      throw new Error(json.message ?? "AI summary limit reached. Please try again later.");
    }
    throw new Error(json.error ?? "Summarization failed");
  }

  return {
    summary: {
      executiveSummary: json.executiveSummary,
      decisions:        json.decisions,
      actionItems:      json.actionItems,
      nextSteps:        json.nextSteps,
      gist:             json.shortGist,
    },
    id:        json.id        ?? null,
    remaining: json.remaining ?? 0,
  };
}

/* ── Page ─────────────────────────────────────────────────── */
export default function HomePage() {
  const [summary,         setSummary]         = useState<Summary | null>(null);
  const [currentSummary,  setCurrentSummary]  = useState<Summary | null>(null);
  const [summaryId,       setSummaryId]       = useState<string | null>(null);
  const [summaryKey,      setSummaryKey]      = useState(0);
  const [meetingMeta,     setMeetingMeta]     = useState<MeetingMeta>({ title: "", date: "", attendees: "" });
  const [attendeeEmails,  setAttendeeEmails]  = useState("");
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [warning,         setWarning]         = useState<string | null>(null);
  const [showLimitModal,  setShowLimitModal]  = useState(false);
  const [manualMode,      setManualMode]      = useState(false);

  const handleSummarize = async (data: MeetingFormData, files: File[]) => {
    setIsLoading(true);
    setSummary(null);
    setCurrentSummary(null);
    setError(null);
    setManualMode(data.mode === "manual");
    setMeetingMeta({ title: data.title, date: data.date, attendees: data.attendees });
    setAttendeeEmails(data.attendeeEmails ?? "");
    setAttachmentNames(data.attachmentNames ?? []);
    setSummaryKey((k) => k + 1);

    if (data.mode === "manual") {
      const empty: Summary = {
        executiveSummary: "",
        decisions:        [""],
        actionItems:      [""],
        nextSteps:        [""],
        gist:             "",
      };
      setSummary(empty);
      setCurrentSummary(empty);
      setIsLoading(false);
      return;
    }

    try {
      const { summary: result, id, remaining } = await generateSummary(data, files);
      setSummary(result);
      setCurrentSummary(result);
      setSummaryId(id);
      if (remaining === 1) {
        setWarning("You have 1 free AI summary left. Login or register to get 10/hour.");
      }
    } catch (err) {
      const e = err as Error & { limitReached?: boolean };
      if (e.limitReached) {
        setShowLimitModal(true);
      } else {
        setError(e.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummaryChange = (updated: Summary) => setCurrentSummary(updated);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40">
      <Navbar />

      {/* Rate-limit modal */}
      {showLimitModal && <GuestLimitModal onClose={() => setShowLimitModal(false)} />}

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 pb-10 px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-bold text-brand-700">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Powered by MoMBetopia AI
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Turn meetings into{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
              }}
            >
              clear briefs
            </span>
          </h1>

          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Paste your notes, pick a tone, and get an AI-generated summary —
            decisions, action items, and next steps, ready to share in seconds.
          </p>

          <div className="flex items-center justify-center gap-8 pt-2">
            {[
              { label: "Avg. time saved", value: "45 min" },
              { label: "Tones available", value: "5" },
              { label: "One-click email",  value: "✓" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-extrabold text-brand-600">{value}</p>
                <p className="text-[11px] text-gray-400 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cards ─────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-24 space-y-6">
        <MeetingForm onSubmit={handleSummarize} isLoading={isLoading} />

        {warning && (
          <Toast type="warning" message={warning} onClose={() => setWarning(null)} />
        )}

        {error && (
          <Toast type="error" message={error} onClose={() => setError(null)} />
        )}

        {(isLoading || summary) && (
          <SummaryCard
            key={summaryKey}
            summary={summary}
            isLoading={isLoading}
            startEditing={manualMode}
            onChange={handleSummaryChange}
          />
        )}

        {(currentSummary && !isLoading) && (
          <SendBriefBar
            defaultSubject={`Meeting Brief: ${meetingMeta.title}`}
            defaultTo={attendeeEmails}
            summaryId={summaryId}
            summary={currentSummary}
            meta={meetingMeta}
            attachmentNames={attachmentNames}
          />
        )}
      </section>
    </div>
  );
}
