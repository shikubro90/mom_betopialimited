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

/** Verify SMTP auth then send. Returns true on success. */
async function trySend(
  transport: nodemailer.Transporter,
  message:   object,
  label:     string,
  retries  = 2,
): Promise<boolean> {
  // Fast-fail: verify auth before attempting send
  try {
    await transport.verify();
  } catch (err) {
    console.warn(`[MAILER] ✗ ${label} auth verify failed:`, (err as Error).message);
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transport.sendMail(message);
      console.log(`[MAILER] ✓ ${label}${attempt > 1 ? ` (attempt ${attempt})` : ""}`);
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
  const toList = to.split(",").map((e) => e.trim()).filter(Boolean);
  const ccList = cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [];

  if (toList.length === 0) throw new Error("No recipients");

  const sesMsgBase = {
    from:    `"${process.env.SES_FROM_NAME}"  <${process.env.SES_FROM_EMAIL}>`,
    to:      toList.join(", "),
    cc:      ccList.length > 0 ? ccList.join(", ") : undefined,
    subject, html,
  };

  const gmailMsgBase = {
    from:    `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    replyTo: process.env.SES_FROM_EMAIL,
    to:      toList.join(", "),
    cc:      ccList.length > 0 ? ccList.join(", ") : undefined,
    subject, html,
  };

  // ── Primary: AWS SES ─────────────────────────────────────────────────────
  if (await trySend(makeSes(), sesMsgBase, "AWS SES", 2)) {
    return { provider: "AWS SES" };
  }

  // ── Fallback: Gmail ──────────────────────────────────────────────────────
  console.warn("[MAILER] SES failed — falling back to Gmail");
  if (await trySend(makeGmail(), gmailMsgBase, "Gmail", 3)) {
    return { provider: "Gmail" };
  }

  throw new Error("All providers failed. Check SES_USER/SES_PASS and SMTP_USER/SMTP_PASS in .env");
}
