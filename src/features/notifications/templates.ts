/**
 * Notification emails. Rules: never include message text or profile details,
 * escape every dynamic value, always link to the app and to notification settings.
 */
export type NotificationKind =
  | "new_match"
  | "new_message"
  | "premium_active"
  | "payment_failed"
  | "appeal_decided";

export type TemplateInput = {
  kind: string;
  firstName: string;
  otherName: string | null;
  payload: unknown;
  siteUrl: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Body = { subject: string; line: string; path: string; cta: string };

function body(i: TemplateInput): Body | null {
  const other = i.otherName?.trim() || "someone";
  const p = (i.payload ?? {}) as Record<string, unknown>;
  switch (i.kind) {
    case "new_match":
      return {
        subject: "You have a new match on HeartBridge",
        line: `You and ${other} liked each other. Say hello when you are ready.`,
        path: "/app/matches",
        cta: "Open my matches",
      };
    case "new_message":
      return {
        subject: "You have a new message on HeartBridge",
        line: `${other} sent you a message. Open HeartBridge to read it.`,
        path: "/app/messages",
        cta: "Open my messages",
      };
    case "premium_active": {
      const until = typeof p.until === "string" ? new Date(p.until) : null;
      const when =
        until && !Number.isNaN(until.getTime())
          ? ` It runs until ${until.toISOString().slice(0, 10)}.`
          : "";
      return {
        subject: "Your HeartBridge Premium is active",
        line: `Your payment was confirmed and Premium is now on.${when}`,
        path: "/app/premium",
        cta: "View Premium",
      };
    }
    case "payment_failed":
      return {
        subject: "We could not confirm your HeartBridge payment",
        line: "We could not match your payment to the money received. Open Premium to see the details and try again.",
        path: "/app/premium",
        cta: "Check my payment",
      };
    case "appeal_decided":
      return {
        subject: "Your HeartBridge appeal has been reviewed",
        line: "A person on our team has reviewed your appeal. Open HeartBridge to read the decision.",
        path: "/app",
        cta: "Open HeartBridge",
      };
    default:
      return null;
  }
}

export function renderNotification(
  i: TemplateInput,
): { subject: string; html: string; text: string } | null {
  const b = body(i);
  if (!b) return null;
  const base = i.siteUrl.replace(/\/+$/, "");
  const link = `${base}${b.path}`;
  const settings = `${base}/app/profile/notifications`;
  const name = i.firstName.trim() || "there";
  const text = `Hi ${name},\n\n${b.line}\n\n${b.cta}: ${link}\n\nYou can change which emails you get here: ${settings}\n\nHeartBridge. Real People. True Connections.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4f1;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<div style="max-width:520px;margin:0 auto;padding:24px">
<div style="background:#ffffff;border-radius:12px;padding:28px">
<p style="font-size:20px;font-weight:700;margin:0 0 16px">HeartBridge</p>
<p style="font-size:16px;margin:0 0 12px">Hi ${esc(name)},</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 20px">${esc(b.line)}</p>
<p style="margin:0 0 8px"><a href="${esc(link)}" style="display:inline-block;background:#c9a24a;color:#1a1a1a;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${esc(b.cta)}</a></p>
</div>
<p style="font-size:12px;color:#666;text-align:center;margin:16px 0 0">You can change which emails you get in <a href="${esc(settings)}" style="color:#666">notification settings</a>.</p>
</div></body></html>`;
  return { subject: b.subject, html, text };
}
