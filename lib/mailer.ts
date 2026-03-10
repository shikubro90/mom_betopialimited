import nodemailer from "nodemailer";

export type MailResult = {
  provider: string;
  accepted: string[];
  rejected: string[];
};

function makeTransport() {
  return nodemailer.createTransport({
    host:   "email-smtp.us-east-1.amazonaws.com",
    port:   587,
    secure: false,
    auth:   { user: process.env.SES_USER, pass: process.env.SES_PASS },
    connectionTimeout: 15_000,
    greetingTimeout:   10_000,
    socketTimeout:     30_000,
    tls: { rejectUnauthorized: false },
  });
}

export async function sendEmail({
  to, cc, subject, html,
}: {
  to: string; cc?: string; subject: string; html: string;
}): Promise<MailResult> {
  const toList = to.split(",").map((e) => e.trim()).filter(Boolean);
  const ccList = cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [];

  await makeTransport().sendMail({
    from:    `"${process.env.SES_FROM_NAME}" <${process.env.SES_FROM_EMAIL}>`,
    to:      toList.join(", "),
    cc:      ccList.length > 0 ? ccList.join(", ") : undefined,
    subject, html,
  });

  console.log(`[MAILER] ✓ AWS SES → ${toList.join(", ")}`);
  return { provider: "AWS SES", accepted: toList, rejected: [] };
}
