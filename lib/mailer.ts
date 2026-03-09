import nodemailer from "nodemailer";

export type MailResult = {
  provider:   string;
  accepted:   string[];
  rejected:   string[];
};

function makeTransport() {
  return nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   587,
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
    from:    `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    cc:      cc || undefined,
    subject,
    html,
  });

  console.log(`[MAILER] ✓ Gmail — accepted: ${info.accepted.join(", ")}`);
  if (info.rejected.length) {
    console.warn(`[MAILER] rejected: ${info.rejected.join(", ")}`);
  }

  return {
    provider: "Gmail",
    accepted: info.accepted as string[],
    rejected: info.rejected as string[],
  };
}
