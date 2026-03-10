import { z } from "zod";

/* ─── Email helpers (used by API routes and client schemas) ── */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmails(raw: string): string[] {
  return raw.split(",").map((e) => e.trim()).filter(Boolean);
}

export function isValidEmailList(raw: string): boolean {
  const list = parseEmails(raw);
  return list.length > 0 && list.every((e) => EMAIL_RE.test(e));
}

/* ─── Reusable Zod refinements ───────────────────────────── */
const requiredEmailList = (label: string) =>
  z.string().refine(
    (v) => v.trim().length > 0 && isValidEmailList(v),
    { message: `Enter valid ${label} address(es), separated by commas` }
  );

const optionalEmailList = z.string().refine(
  (v) => !v.trim() || isValidEmailList(v),
  { message: "Enter valid CC email address(es)" }
);

/* ─── API request schemas ────────────────────────────────── */
export const summarizeBodySchema = z.object({
  title:       z.string().min(2,  "Title must be at least 2 characters"),
  rawInput:    z.string().min(20, "Notes must be at least 20 characters"),
  date:        z.string().optional().default(""),
  attendees:   z.string().optional().default(""),
  tone:        z.string().optional().default("professional"),
  fingerprint: z.string().optional().default("unknown"),
});

export const emailBodySchema = z.object({
  to:               requiredEmailList("To"),
  cc:               optionalEmailList.optional().default(""),
  subject:          z.string().min(1, "Subject is required"),
  summaryId:        z.string().nullable().optional(),
  title:            z.string().default(""),
  date:             z.string().default(""),
  attendees:        z.string().default(""),
  executiveSummary: z.string().default(""),
  decisions:        z.array(z.string()).default([]),
  actionItems:      z.array(z.string()).default([]),
  nextSteps:        z.array(z.string()).default([]),
});

/* ─── Client-side form schemas ───────────────────────────── */
export const meetingFormSchema = z.object({
  title:          z.string().min(2,  "Title must be at least 2 characters"),
  date:           z.string().optional(),
  attendees:      z.string().optional(),
  attendeeEmails: z.string().refine(
    (v) => !v.trim() || isValidEmailList(v),
    { message: "Enter valid email address(es), separated by commas" }
  ).optional(),
  notes:          z.string().min(20, "Notes must be at least 20 characters"),
  tone:           z.string(),
});

export const emailFormSchema = z.object({
  to:      requiredEmailList("To"),
  cc:      optionalEmailList,
  subject: z.string().min(1, "Subject is required"),
});
