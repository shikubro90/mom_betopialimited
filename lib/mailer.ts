import nodemailer from "nodemailer";

export type MailResult = {
  provider: string;
  accepted: string[];
  rejected: string[];
};

// betopiagroup.com rejects FROM betopialimited.com (their Postfix misconfiguration).
// Must use Gmail for these domains.
const GMAIL_DOMAINS = ["betopiagroup.com"];

function splitEmails(emails: string): { graph: string[]; gmail: string[] } {
  const graph: string[] = [];
  const gmail: string[] = [];
  for (const e of emails.split(",").map((s) => s.trim()).filter(Boolean)) {
    const domain = e.split("@")[1]?.toLowerCase() ?? "";
    if (GMAIL_DOMAINS.includes(domain)) gmail.push(e);
    else graph.push(e);
  }
  return { graph, gmail };
}

/* ── Microsoft Graph ─────────────────────────────────────── */
async function getAccessToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "client_credentials",
        client_id:     process.env.MS_CLIENT_ID!,
        client_secret: process.env.MS_CLIENT_SECRET!,
        scope:         "https://graph.microsoft.com/.default",
      }),
    }
  );
  if (!res.ok) throw new Error(`Graph token error: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function sendViaGraph(to: string[], cc: string[], subject: string, html: string) {
  const token     = await getAccessToken();
  const fromEmail = process.env.MS_FROM_EMAIL!;
  const fromName  = process.env.MS_FROM_NAME ?? "MoMBetopia";

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject,
          body:         { contentType: "HTML", content: html },
          from:         { emailAddress: { address: fromEmail, name: fromName } },
          toRecipients: to.map((a) => ({ emailAddress: { address: a } })),
          ...(cc.length > 0 ? { ccRecipients: cc.map((a) => ({ emailAddress: { address: a } })) } : {}),
        },
        saveToSentItems: true,
      }),
    }
  );
  if (!res.ok) throw new Error(`Graph sendMail error: ${await res.text()}`);
  console.log(`[MAILER] ✓ Microsoft Graph → ${to.join(", ")}`);
}

/* ── Gmail SMTP (fallback for betopiagroup.com) ──────────── */
async function sendViaGmail(to: string[], cc: string[], subject: string, html: string) {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 30_000,
    tls: { rejectUnauthorized: false },
  });
  await transport.sendMail({
    from:    `"${process.env.MS_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    replyTo: process.env.MS_FROM_EMAIL,
    to:      to.join(", "),
    cc:      cc.length > 0 ? cc.join(", ") : undefined,
    subject, html,
  });
  console.log(`[MAILER] ✓ Gmail → ${to.join(", ")}`);
}

/* ── Main ────────────────────────────────────────────────── */
export async function sendEmail({
  to, cc, subject, html,
}: {
  to: string; cc?: string; subject: string; html: string;
}): Promise<MailResult> {
  const { graph: toGraph, gmail: toGmail } = splitEmails(to);
  const { graph: ccGraph, gmail: ccGmail } = cc ? splitEmails(cc) : { graph: [], gmail: [] };

  const accepted: string[] = [];
  const providers: string[] = [];

  if (toGraph.length > 0 || ccGraph.length > 0) {
    await sendViaGraph(toGraph, ccGraph, subject, html);
    accepted.push(...toGraph);
    providers.push("Microsoft Graph");
  }

  if (toGmail.length > 0 || ccGmail.length > 0) {
    await sendViaGmail(toGmail, ccGmail, subject, html);
    accepted.push(...toGmail);
    providers.push("Gmail");
  }

  return { provider: providers.join(" + "), accepted, rejected: [] };
}
