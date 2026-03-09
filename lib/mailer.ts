import nodemailer from "nodemailer";

type MailResult = { provider: string };

const BASE_OPTS = {
  connectionTimeout: 10_000,
  greetingTimeout:   8_000,
  socketTimeout:     30_000,
  tls: { rejectUnauthorized: false },
} as const;

function makeSes() {
  return nodemailer.createTransport({
    host:   "email-smtp.us-east-1.amazonaws.com",
    port:   587,
    secure: false,
    auth:   { user: process.env.SES_USER, pass: process.env.SES_PASS },
    ...BASE_OPTS,
  });
}

function makeGmail() {
  return nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   587,
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    ...BASE_OPTS,
  });
}

// These domains block SES/MS365 IPs — must go via Gmail
const GMAIL_ONLY_DOMAINS = ["betopiagroup.com"];

function splitRecipients(emails: string): { standard: string[]; gmailOnly: string[] } {
  const standard:  string[] = [];
  const gmailOnly: string[] = [];
  for (const email of emails.split(",").map((e) => e.trim()).filter(Boolean)) {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    if (GMAIL_ONLY_DOMAINS.includes(domain)) gmailOnly.push(email);
    else standard.push(email);
  }
  return { standard, gmailOnly };
}

async function trySend(
  transport: nodemailer.Transporter,
  message:   object,
  label:     string,
  retries  = 2,
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transport.sendMail(message);
      console.log(`[MAILER] ✓ ${label}${attempt > 1 ? ` (attempt ${attempt})` : ""}`);
      return true;
    } catch (err) {
      console.warn(`[MAILER] ✗ ${label} attempt ${attempt}/${retries}:`, (err as Error).message);
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
  const { standard: toStd, gmailOnly: toGmail } = splitRecipients(to);
  const { standard: ccStd, gmailOnly: ccGmail }  = cc
    ? splitRecipients(cc)
    : { standard: [], gmailOnly: [] };

  const providers: string[] = [];

  // ── Standard recipients: SES → Gmail fallback ────────────────────────────
  if (toStd.length > 0 || ccStd.length > 0) {
    const sesMsg = {
      from:    `"${process.env.SES_FROM_NAME}" <${process.env.SES_FROM_EMAIL}>`,
      to:      toStd.join(", ") || undefined,
      cc:      ccStd.length > 0 ? ccStd.join(", ") : undefined,
      subject, html,
    };
    const gmailMsg = {
      ...sesMsg,
      from:    `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      replyTo: process.env.SES_FROM_EMAIL,
    };

    if      (await trySend(makeSes(),   sesMsg,   "AWS SES"))     providers.push("AWS SES");
    else if (await trySend(makeGmail(), gmailMsg, "Gmail"))        providers.push("Gmail");
    else throw new Error("Both SES and Gmail failed for standard recipients");
  }

  // ── betopiagroup.com and similar: Gmail only (SES/MS365 IPs blocked) ─────
  if (toGmail.length > 0 || ccGmail.length > 0) {
    const gmailMsg = {
      from:    `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      replyTo: process.env.SES_FROM_EMAIL,
      to:      toGmail.join(", ") || undefined,
      cc:      ccGmail.length > 0 ? ccGmail.join(", ") : undefined,
      subject, html,
    };
    if (await trySend(makeGmail(), gmailMsg, "Gmail (betopiagroup route)", 3)) {
      providers.push("Gmail");
    } else {
      throw new Error("Gmail failed for betopiagroup route after 3 attempts");
    }
  }

  return { provider: providers.join(" + ") };
}
