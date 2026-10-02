/** Whole years between an ISO date (YYYY-MM-DD) and `today`, using UTC dates. */
export function calculateAge(isoDob: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDob);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let age = today.getUTCFullYear() - y;
  const beforeBirthday =
    today.getUTCMonth() + 1 < mo || (today.getUTCMonth() + 1 === mo && today.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}
