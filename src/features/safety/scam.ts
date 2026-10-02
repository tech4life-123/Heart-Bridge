/**
 * Neutral safety reminders for messages that look like money requests.
 * This is a hint, never proof: it must NEVER be used to accuse, block or punish anyone
 * automatically. It only shows a reminder and records a quiet flag for human review.
 */
export type ScamReason = "money_request" | "emergency_money" | "investment" | "payment_details";

const RULES: { reason: ScamReason; pattern: RegExp }[] = [
  {
    reason: "emergency_money",
    pattern:
      /\b(emergency|urgent(ly)?|hospital|stranded|accident|bail|customs|stuck at)\b[^.!?]{0,80}\b(money|send|pay|fund|cash|\$\s?\d|usd|dollars?|lrd)/i,
  },
  {
    reason: "payment_details",
    pattern:
      /\b(gift ?cards?|western union|moneygram|orange money|mtn momo|mobile money|bank (account|details)|cash ?app|paypal|zelle|wire transfer)\b/i,
  },
  {
    reason: "investment",
    pattern: /\b(invest(ment|ing)?|crypto(currency)?|bitcoin|forex|trading platform|double your money|guaranteed returns?)\b/i,
  },
  {
    reason: "money_request",
    pattern:
      /\b(send|wire|transfer|give|lend|loan|borrow)\b[^.!?]{0,40}\b(me|us)?\b[^.!?]{0,20}(\bmoney\b|\bcash\b|\bfunds?\b|\$\s?\d|\busd\b|\bdollars?\b|\blrd\b)/i,
  },
];

export function detectScamPattern(text: string): ScamReason | null {
  if (!text || text.length > 2000) return null;
  for (const r of RULES) if (r.pattern.test(text)) return r.reason;
  return null;
}

export const SCAM_REMINDER =
  "Never send money to someone you met online. If you feel pressured to send money, consider reporting the account.";
