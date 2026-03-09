import nodemailer from "nodemailer";

export type MailResult = {
  provider:   string;
  accepted:   string[];
  rejected:   string[];
};

function makeTransport() {
  const pass = process.env.MS_PASS_B64
    ? Buffer.from(process.env.MS_PASS_B64, "base64").toString("utf8")
    : process.env.MS_PASS;

  return nodemailer.createTransport({
    host:   "smtp.office365.com",
    port:   587,
    secure: false,
    auth:   { user: process.env.MS_USER, pass },
    connectionTimeout: 15_000,
    greetingTimeout:   10_000,
    socketTimeout:     30_000,
    tls: { rejectUnauthorized: false },
  });
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
  const transport = makeTransport();

  const info = await transport.sendMail({
    from:    `"${process.env.MS_FROM_NAME}" <${process.env.MS_FROM_EMAIL}>`,
    to,
    cc:      cc || undefined,
    subject,
    html,
  });

  console.log(`[MAILER] ✓ Microsoft 365 — accepted: ${info.accepted.join(", ")}`);
  if (info.rejected.length) {
    console.warn(`[MAILER] rejected: ${info.rejected.join(", ")}`);
  }

  return {
    provider: "Microsoft 365",
    accepted: info.accepted as string[],
    rejected: info.rejected as string[],
  };
}
