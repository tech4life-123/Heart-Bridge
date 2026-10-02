/**
 * Normalise a phone number to E.164 (+231...). Liberia-first: a number without
 * an explicit country code is assumed to be Liberian. Returns null if invalid.
 * The number is stored privately and is NEVER verified or shown to others.
 */
export function normalizePhone(input: string): string | null {
  let s = input.trim().replace(/[\s().-]/g, "");
  if (s === "") return null;
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!s.startsWith("+")) {
    if (!/^[0-9]+$/.test(s)) return null;
    s = `+231${s.replace(/^0+/, "")}`;
  }
  return /^\+[1-9][0-9]{6,14}$/.test(s) ? s : null;
}
