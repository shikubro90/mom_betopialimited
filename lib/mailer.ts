export type MailResult = {
  provider: string;
  accepted: string[];
  rejected: string[];
};

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

export async function sendEmail({
  to, cc, subject, html,
}: {
  to: string; cc?: string; subject: string; html: string;
}): Promise<MailResult> {
  const token     = await getAccessToken();
  const fromEmail = process.env.MS_FROM_EMAIL!;
  const fromName  = process.env.MS_FROM_NAME ?? "MoMBetopia";

  const toList = to.split(",").map((e) => e.trim()).filter(Boolean);
  const ccList = cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [];

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body:         { contentType: "HTML", content: html },
          from:         { emailAddress: { address: fromEmail, name: fromName } },
          toRecipients: toList.map((a) => ({ emailAddress: { address: a } })),
          ...(ccList.length > 0 ? {
            ccRecipients: ccList.map((a) => ({ emailAddress: { address: a } })),
          } : {}),
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!res.ok) throw new Error(`Graph sendMail error: ${await res.text()}`);

  console.log(`[MAILER] ✓ Microsoft Graph → ${toList.join(", ")}`);
  return { provider: "Microsoft Graph", accepted: toList, rejected: [] };
}
