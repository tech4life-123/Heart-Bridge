/**
 * Prevents open-redirect attacks: only same-site relative paths are allowed.
 * Anything else falls back to the provided default.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/app",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // "//evil.com" and "/\evil.com" are treated as external by browsers.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return next;
}
