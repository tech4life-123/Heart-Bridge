import "server-only";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function emailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
}

/** Sends one transactional email through Brevo. Returns an error code, never the provider's raw message. */
export async function sendEmail(
  mail: OutgoingEmail,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "HeartBridge", email: from },
        to: [{ email: mail.to }],
        subject: mail.subject,
        htmlContent: mail.html,
        textContent: mail.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "network" };
  }
}
