import { NextRequest, NextResponse } from "next/server";
import { openai }           from "@/lib/openai";
import { checkGuestRateLimit } from "@/lib/rateLimit";
import { buildFingerprint }    from "@/lib/fingerprint";

export async function POST(req: NextRequest) {
  const fp = buildFingerprint(req);

  const rl = await checkGuestRateLimit(
    fp.fingerprint,
    fp.ip,
    fp.userAgent,
    fp.browser,
    fp.os,
    fp.platform,
  );

  if (!rl.allowed) {
    return NextResponse.json(
      {
        success:           false,
        code:              "GUEST_AI_LIMIT_REACHED",
        message:           "You have reached the free AI summary limit. Please login/register or try again later.",
        retryAfterSeconds: rl.retryAfterSeconds,
        requiresAuth:      true,
      },
      {
        status:  429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      }
    );
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model:    "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({
      result: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("[AI_ROUTE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
