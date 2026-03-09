import { NextRequest, NextResponse } from "next/server";
import { openai }               from "@/lib/openai";
import { db }                   from "@/lib/db";
import { summarizeBodySchema }  from "@/lib/validations";
import { checkAiRateLimit }     from "@/lib/rateLimit";

/* ─── Tone descriptions ───────────────────────────────────── */
const TONE_MAP: Record<string, string> = {
  professional: "formal and professional",
  executive:    "high-level executive brief, very concise",
  casual:       "friendly and conversational",
  detailed:     "thorough and detailed",
  concise:      "extremely brief, bullet-point style",
};

/* ─── Prompt builder ─────────────────────────────────────── */
function buildMessages(
  title: string,
  date: string,
  attendees: string,
  rawInput: string,
  tone: string
) {
  const toneDesc = TONE_MAP[tone] ?? "professional";

  const system = `You are a meeting summarizer. Output ONLY valid JSON — no markdown, no code blocks, no extra text.

Exact output shape:
{
  "executiveSummary": "2–3 sentence overview",
  "decisions": ["string"],
  "actionItems": ["owner: task (deadline if mentioned)"],
  "nextSteps": ["string"],
  "shortGist": "one punchy sentence summary"
}

Writing style: ${toneDesc}. Be concise. Infer sensibly from incomplete notes.`;

  const userLines = [
    `Meeting: ${title}`,
    date      ? `Date: ${date}`           : null,
    attendees ? `Attendees: ${attendees}` : null,
    `\nNotes:\n${rawInput.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user"   as const, content: userLines },
  ];
}

/* ─── Route handler ──────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = summarizeBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured. Add OPENAI_API_KEY to your .env file." }, { status: 503 });
  }

  const { title, date, attendees, rawInput, tone, fingerprint } = parsed.data;

  // Rate limit AI usage per device fingerprint + IP
  const ip     = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
              ?? req.headers.get("x-real-ip")
              ?? "unknown";
  const rl = await checkAiRateLimit(fingerprint, ip);
  if (!rl.allowed) {
    const resetIn = Math.ceil((rl.resetAt.getTime() - Date.now()) / 3_600_000);
    return NextResponse.json(
      { error: `AI summary limit reached (10/day). Resets in ~${resetIn}h. Manual mode is unlimited.` },
      { status: 429 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model:           "gpt-4o-mini",
      temperature:     0.3,
      max_tokens:      600,
      response_format: { type: "json_object" },
      messages:        buildMessages(title, date, attendees, rawInput, tone),
    });

    const raw = completion.choices[0].message.content ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[SUMMARIZE] JSON parse failed:", raw);
      return NextResponse.json({ error: "Model returned malformed JSON" }, { status: 502 });
    }

    // Normalise — ensure arrays are arrays
    const result = {
      executiveSummary: String(parsed.executiveSummary ?? ""),
      decisions:        Array.isArray(parsed.decisions)   ? parsed.decisions   : [],
      actionItems:      Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      nextSteps:        Array.isArray(parsed.nextSteps)   ? parsed.nextSteps   : [],
      shortGist:        String(parsed.shortGist ?? ""),
    };

    // Persist — awaited so we can return the record id
    let summaryId: string | null = null;
    try {
      const record = await db.meetingSummary.create({
        data: {
          title,
          date:      date      || null,
          attendees: attendees || null,
          rawInput,
          tone,
          ...result,
        },
      });
      summaryId = record.id;
    } catch (e: unknown) {
      console.error("[SUMMARIZE] db save failed:", e);
    }

    return NextResponse.json({ ...result, id: summaryId });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "OpenAI request failed";
    console.error("[SUMMARIZE]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
