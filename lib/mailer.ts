import nodemailer from "nodemailer";

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
}) {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS_B64
        ? Buffer.from(process.env.SMTP_PASS_B64, "base64").toString("utf8")
        : process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    ...(cc ? { cc } : {}),
    subject,
    html,
  });
}
