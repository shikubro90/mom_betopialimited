import { NextRequest, NextResponse } from "next/server";
import { openai }              from "@/lib/openai";
import { db }                  from "@/lib/db";
import { summarizeBodySchema } from "@/lib/validations";
import { checkAiQuota }        from "@/lib/quota";

export const config = {
  api: { bodyParser: { sizeLimit: "50mb" } },
};

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
    return NextResponse.json(
      { error: "OpenAI API key not configured. Add OPENAI_API_KEY to your .env file." },
      { status: 503 }
    );
  }

  // ── Quota check (guest: 3/2h · user: 10/1h) ───────────────
  const quota = await checkAiQuota(req);
  if (!quota.allowed) {
    return NextResponse.json(quota.error, {
      status:  429,
      headers: { "Retry-After": String(quota.error.retryAfterSeconds) },
    });
  }

  const { title, date, attendees, rawInput, tone } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model:           "gpt-4o-mini",
      temperature:     0.3,
      max_tokens:      600,
      response_format: { type: "json_object" },
      messages:        buildMessages(title, date, attendees, rawInput, tone),
    });

    const raw = completion.choices[0].message.content ?? "{}";

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(raw);
    } catch {
      console.error("[SUMMARIZE] JSON parse failed:", raw);
      return NextResponse.json({ error: "Model returned malformed JSON" }, { status: 502 });
    }

    // Normalise — ensure arrays are arrays
    const summary = {
      executiveSummary: String(result.executiveSummary ?? ""),
      decisions:        Array.isArray(result.decisions)   ? result.decisions   : [],
      actionItems:      Array.isArray(result.actionItems) ? result.actionItems : [],
      nextSteps:        Array.isArray(result.nextSteps)   ? result.nextSteps   : [],
      shortGist:        String(result.shortGist ?? ""),
    };

    // Persist summary
    let summaryId: string | null = null;
    try {
      const record = await db.meetingSummary.create({
        data: {
          title,
          date:      date      || null,
          attendees: attendees || null,
          rawInput,
          tone,
          ...summary,
        },
      });
      summaryId = record.id;
    } catch (e: unknown) {
      console.error("[SUMMARIZE] db save failed:", e);
    }

    // Log token usage (fire-and-forget)
    const usage      = completion.usage;
    const identity   = quota.identity;
    if (usage) {
      db.tokenUsageLog.create({
        data: {
          userId:       identity.kind === "user"  ? identity.userId      : undefined,
          fingerprint:  identity.kind === "guest" ? identity.fingerprint : undefined,
          model:        "gpt-4o-mini",
          promptTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens:  usage.total_tokens,
          summaryId,
        },
      }).catch((e: unknown) => console.error("[TOKEN LOG]", e));
    }

    return NextResponse.json({ ...summary, id: summaryId, remaining: quota.remaining });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    console.error("[SUMMARIZE]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
