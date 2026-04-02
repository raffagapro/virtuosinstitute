export interface InviteEmailPayload {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
}

export class InviteMailerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteMailerConfigError";
  }
}

function readMailerEnv(name: "BREVO_API_KEY" | "INVITE_EMAIL_FROM") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new InviteMailerConfigError(`Missing required mailer environment variable: ${name}`);
  }

  return value;
}

function parseSender(senderValue: string) {
  const senderMatch = senderValue.match(/^(.*)<([^>]+)>$/);
  if (!senderMatch) {
    return {
      email: senderValue,
    };
  }

  const name = senderMatch[1]?.trim().replace(/^"|"$/g, "");
  const email = senderMatch[2]?.trim();

  return name ? { name, email } : { email };
}

export async function sendInviteEmail(payload: InviteEmailPayload) {
  const apiKey = readMailerEnv("BREVO_API_KEY");
  const sender = parseSender(readMailerEnv("INVITE_EMAIL_FROM"));

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: payload.toEmail }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Brevo send failed: ${response.status} ${responseText}`);
  }
}