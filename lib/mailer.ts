export type MailResult = {
  provider: string;
  accepted: string[];
  rejected: string[];
};

async function getAccessToken(): Promise<string> {
  const tenantId     = process.env.MS_TENANT_ID!;
  const clientId     = process.env.MS_CLIENT_ID!;
  const clientSecret = process.env.MS_CLIENT_SECRET!;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "client_credentials",
        client_id:     clientId,
        client_secret: clientSecret,
        scope:         "https://graph.microsoft.com/.default",
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph token error: ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function toRecipients(emails: string) {
  return emails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map((address) => ({ emailAddress: { address } }));
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
  const token    = await getAccessToken();
  const fromEmail = process.env.MS_FROM_EMAIL!;
  const fromName  = process.env.MS_FROM_NAME ?? "MoMBetopia";

  const toList = toRecipients(to);
  const ccList = cc ? toRecipients(cc) : [];

  const body = {
    message: {
      subject,
      body:          { contentType: "HTML", content: html },
      from:          { emailAddress: { address: fromEmail, name: fromName } },
      toRecipients:  toList,
      ...(ccList.length > 0 ? { ccRecipients: ccList } : {}),
    },
    saveToSentItems: true,
  };

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
    {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph sendMail error: ${err}`);
  }

  const accepted = toList.map((r) => r.emailAddress.address);
  console.log(`[MAILER] ✓ Microsoft Graph — accepted: ${accepted.join(", ")}`);

  return { provider: "Microsoft Graph", accepted, rejected: [] };
}
