/**
 * Payment provider abstraction.
 *
 * Mobile-money wallets in Liberia (Orange Money, Lonestar MTN MoMo) have no provider API wired in yet,
 * so both use MANUAL verification: the member pays the merchant wallet, submits the transaction
 * reference, and finance staff confirm it against the real wallet statement before premium starts.
 * Nothing here ever marks a payment successful. When an official provider API is connected, add a
 * provider with `verification: "automatic"` and have its server-side webhook call the same
 * database review function. Card payments are listed as unavailable so the UI never fakes them.
 */
export type ProviderId = "orange_money" | "lonestar_momo";

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  verification: "manual";
  /** Short, plain steps shown to the member. */
  steps: (wallet: string, accountName: string, price: string) => string[];
};

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  orange_money: {
    id: "orange_money",
    label: "Orange Money",
    verification: "manual",
    steps: (wallet, name, price) => [
      `Open Orange Money and choose to send money to ${wallet}${name ? ` (${name})` : ""}.`,
      `Send ${price}.`,
      "Keep the confirmation message and copy the transaction ID.",
      "Enter the transaction ID below. We check it against our wallet before turning Premium on.",
    ],
  },
  lonestar_momo: {
    id: "lonestar_momo",
    label: "Lonestar MTN MoMo",
    verification: "manual",
    steps: (wallet, name, price) => [
      `Open MTN MoMo and choose to send money to ${wallet}${name ? ` (${name})` : ""}.`,
      `Send ${price}.`,
      "Keep the confirmation message and copy the transaction ID.",
      "Enter the transaction ID below. We check it against our wallet before turning Premium on.",
    ],
  },
};

export const PREMIUM_PRICE_LABEL = "US$2.00 per month";
export const PREMIUM_PRICE_MINOR = 200;

export const CARD_NOTICE = "Card payments are not available yet.";

export function isProviderId(v: string): v is ProviderId {
  return v === "orange_money" || v === "lonestar_momo";
}

export function formatMoney(minor: number, currency: string) {
  return `${currency === "USD" ? "US$" : "L$"}${(minor / 100).toFixed(2)}`;
}

/** "2", "2.00", "2,50" -> minor units, or null when not a sensible amount. */
export function parseAmountToMinor(input: string): number | null {
  const m = /^\s*(\d{1,7})(?:[.,](\d{1,2}))?\s*$/.exec(input);
  if (!m) return null;
  const minor = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
  return minor > 0 && minor <= 100_000_000 ? minor : null;
}
