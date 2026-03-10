import { NextRequest, NextResponse } from "next/server";
import { sendEmail }        from "@/lib/mailer";
import { db }               from "@/lib/db";
import { emailBodySchema, parseEmails } from "@/lib/validations";

/* ─── Markdown renderer ──────────────────────────────────── */
function renderMd(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g,       "<em>$1</em>")
    .replace(/==(.*?)==/g,     '<span style="background:#fef08a;padding:0 2px;border-radius:3px">$1</span>')
    .replace(/\n/g, "<br>");
}

/* ─── HTML email builder ─────────────────────────────────── */
function buildHtml(data: {
  title:            string;
  date:             string;
  attendees:        string;
  executiveSummary: string;
  decisions:        string[];
  actionItems:      string[];
  nextSteps:        string[];
}): string {
  const list = (items: string[], color: string) =>
    items
      .map(
        (item, i) => `
        <tr>
          <td style="padding:4px 0;vertical-align:top;">
            <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${color};color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:20px;margin-right:8px;">${i + 1}</span>
          </td>
          <td style="padding:4px 0;font-size:14px;color:#374151;line-height:1.5;">${item}</td>
        </tr>`
      )
      .join("");

  const section = (
    label: string,
    color: string,
    bg: string,
    items: string[]
  ) => `
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${color};background:${bg};display:inline-block;padding:3px 10px;border-radius:999px;">${label}</p>
      <table style="width:100%;border-collapse:collapse;">${list(items, color)}</table>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);padding:28px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,.7);letter-spacing:.08em;text-transform:uppercase;">Meeting Brief</p>
            <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;color:#fff;">${data.title}</h1>
            ${data.date      ? `<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.8);">📅 ${data.date}</p>`      : ""}
            ${data.attendees ? `<p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,.8);">👥 ${data.attendees}</p>` : ""}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            <!-- Executive Summary -->
            <div style="background:#eef2ff;border-left:4px solid #6366f1;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#4f46e5;">Executive Summary</p>
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${renderMd(data.executiveSummary)}</p>
            </div>

            ${section("Decisions",    "#7c3aed", "#f5f3ff", data.decisions)}
            ${section("Action Items", "#b45309", "#fffbeb", data.actionItems)}
            ${section("Next Steps",   "#065f46", "#ecfdf5", data.nextSteps)}

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">Sent via <strong style="color:#6366f1;">MoMBetopia</strong></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ─── Route handler ──────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = emailBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { to, cc, subject, summaryId, title, date, attendees, executiveSummary, decisions, actionItems, nextSteps } = parsed.data;

  const toList = parseEmails(to);
  const ccList = cc ? parseEmails(cc) : [];

  const html = buildHtml({ title, date, attendees, executiveSummary, decisions, actionItems, nextSteps });

  let accepted: string[] = [];
  let rejected: string[] = [];
  let provider = "unknown";
  try {
    const result = await sendEmail({
      to:      toList.join(", "),
      subject: String(subject),
      html,
      ...(ccList.length > 0 ? { cc: ccList.join(", ") } : {}),
    });
    provider = result.provider;
    accepted = result.accepted;
    rejected = result.rejected;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SMTP error";
    console.error("[EMAIL]", message);
    return NextResponse.json({ error: `Failed to send: ${message}` }, { status: 502 });
  }

  // Update DB — non-blocking
  if (summaryId && typeof summaryId === "string") {
    db.meetingSummary
      .update({
        where: { id: summaryId },
        data: {
          emailSent: true,
          emailTo:   toList.join(", "),
          emailCc:   ccList.length > 0 ? ccList.join(", ") : null,
        },
      })
      .catch((e: unknown) => console.error("[EMAIL] db update failed:", e));
  }

  return NextResponse.json({ success: true, provider, accepted, rejected });
}
