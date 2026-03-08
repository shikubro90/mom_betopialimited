import nodemailer from "nodemailer";

type MailResult = { provider: string };

const SMTP_OPTS = {
  connectionTimeout: 10_000,   // 10 s to connect
  greetingTimeout:   8_000,    // 8 s for EHLO
  socketTimeout:     30_000,   // 30 s per socket op
  tls: { rejectUnauthorized: false },
} as const;

function ms365() {
  return nodemailer.createTransport({
    host: "smtp.office365.com", port: 587, secure: false,
    auth: {
      user: process.env.MS_USER,
      pass: process.env.MS_PASS_B64
        ? Buffer.from(process.env.MS_PASS_B64, "base64").toString("utf8")
        : process.env.MS_PASS,
    },
    ...SMTP_OPTS,
  });
}

function ses() {
  return nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com", port: 587, secure: false,
    auth: { user: process.env.SES_USER, pass: process.env.SES_PASS },
    ...SMTP_OPTS,
  });
}

function gmail() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    ...SMTP_OPTS,
  });
}

// Domains known to reject via Microsoft/SES — use Gmail for these
const GMAIL_DOMAINS = ["betopiagroup.com"];

function splitByDomain(emails: string): { standard: string[]; gmailRoute: string[] } {
  const all = emails.split(",").map((e) => e.trim()).filter(Boolean);
  const standard:    string[] = [];
  const gmailRoute:  string[] = [];
  for (const email of all) {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    if (GMAIL_DOMAINS.includes(domain)) gmailRoute.push(email);
    else standard.push(email);
  }
  return { standard, gmailRoute };
}

async function trySend(
  transport: nodemailer.Transporter,
  message: object,
  label: string,
  retries = 2
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transport.sendMail(message);
      console.log(`[MAILER] ✓ Sent via ${label}${attempt > 1 ? ` (attempt ${attempt})` : ""}`);
      return true;
    } catch (err) {
      const msg = (err as Error).message;
      console.warn(`[MAILER] ✗ ${label} attempt ${attempt}/${retries}:`, msg);
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return false;
}

export async function sendEmail({
  to,
  cc,
  subject,
  html,
}: {
  to:      string;
  cc?:     string;
  subject: string;
  html:    string;
}): Promise<MailResult> {
  const { standard: toStd, gmailRoute: toGmail } = splitByDomain(to);
  const { standard: ccStd, gmailRoute: ccGmail }  = cc ? splitByDomain(cc) : { standard: [], gmailRoute: [] };

  const providers: string[] = [];

  // ── Standard recipients: Microsoft 365 → SES → Gmail fallback ────────────
  if (toStd.length > 0 || ccStd.length > 0) {
    const msg = {
      from:    `"${process.env.MS_FROM_NAME}" <${process.env.MS_FROM_EMAIL}>`,
      to:      toStd.join(", ") || undefined,
      cc:      ccStd.length > 0 ? ccStd.join(", ") : undefined,
      subject, html,
    };

    if      (await trySend(ms365(),  msg, "Microsoft 365")) providers.push("Microsoft 365");
    else if (await trySend(ses(),    { ...msg, from: `"${process.env.SES_FROM_NAME}" <${process.env.SES_FROM_EMAIL}>` }, "AWS SES")) providers.push("AWS SES");
    else if (await trySend(gmail(),  { ...msg, from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`, replyTo: process.env.MS_FROM_EMAIL }, "Gmail")) providers.push("Gmail");
    else throw new Error("All providers failed for standard recipients");
  }

  // ── betopiagroup.com and similar: Gmail (works, others block) ─────────────
  if (toGmail.length > 0 || ccGmail.length > 0) {
    const msg = {
      from:     `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      replyTo:  process.env.MS_FROM_EMAIL,
      to:       toGmail.join(", ") || undefined,
      cc:       ccGmail.length > 0 ? ccGmail.join(", ") : undefined,
      subject,  html,
    };
    // retries=3 for Gmail betopiagroup route to be extra resilient
    if (await trySend(gmail(), msg, "Gmail (betopiagroup route)", 3)) providers.push("Gmail");
    else throw new Error("Gmail failed for betopiagroup route after 3 attempts");
  }

  return { provider: providers.join(" + ") };
}
