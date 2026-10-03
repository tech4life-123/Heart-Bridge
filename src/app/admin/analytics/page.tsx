import { Card } from "@/features/admin/components";
import { FINANCE, MODERATION, requireStaff } from "@/features/admin/guard";
import { REPORT_CATEGORIES } from "@/features/safety/constants";
import { formatMoney } from "@/features/premium/providers";

const SERIES = [
  { key: "signups", label: "New people" },
  { key: "likes", label: "Likes" },
  { key: "matches", label: "Matches" },
  { key: "messages", label: "Messages" },
] as const;

/** Tiny dependency-free bar chart. Counts only: nothing here identifies a person. */
function Bars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div
      role="img"
      aria-label={`${label}: ${total} in total, highest day ${Math.max(...values)}`}
      className="space-y-1"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">{label}</span>
        <span className="text-sm text-muted">{total}</span>
      </div>
      <div className="flex h-16 items-end gap-0.5" aria-hidden>
        {values.map((v, i) => (
          <span
            key={i}
            className="flex-1 rounded-t bg-gold/80"
            style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const { supabase, role } = await requireStaff("/admin/analytics", [
    ...MODERATION,
    ...FINANCE,
  ]);
  const canSeeGrowth = MODERATION.includes(role);
  const canSeeMoney = FINANCE.includes(role);
  const [growth, reports, revenue, premium] = await Promise.all([
    canSeeGrowth ? supabase.rpc("admin_analytics", { p_days: days }) : null,
    canSeeGrowth ? supabase.rpc("admin_report_breakdown") : null,
    canSeeMoney ? supabase.rpc("admin_revenue") : null,
    canSeeMoney ? supabase.rpc("admin_premium_count") : null,
  ]);
  const rows = growth?.data ?? [];
  return (
    <>
      {canSeeGrowth && (
        <Card title={`Activity, last ${days} days`}>
          <nav aria-label="Period" className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <a
                key={d}
                href={`/admin/analytics?days=${d}`}
                aria-current={d === days ? "page" : undefined}
                className={`min-h-11 rounded-full border-2 px-4 py-2.5 font-semibold ${d === days ? "border-gold text-gold" : "border-line"}`}
              >
                {d} days
              </a>
            ))}
          </nav>
          <div className="grid gap-5 sm:grid-cols-2">
            {SERIES.map((s) => (
              <Bars
                key={s.key}
                label={s.label}
                values={rows.map((r) => r[s.key])}
              />
            ))}
          </div>
          <p className="text-xs text-muted">
            Counts per day (UTC). Aggregates only.
          </p>
        </Card>
      )}
      {canSeeGrowth && (
        <Card title="Reports by reason">
          {(reports?.data ?? []).length === 0 && (
            <p className="text-muted">No reports yet.</p>
          )}
          <ul className="divide-y divide-line">
            {(reports?.data ?? []).map((r) => (
              <li key={r.category} className="flex justify-between py-2">
                <span>
                  {REPORT_CATEGORIES.find((c) => c.value === r.category)
                    ?.label ?? r.category}
                </span>
                <span className="text-muted">
                  {r.total} total · {r.open} open
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {canSeeMoney && (
        <Card title="Premium and revenue">
          <p>
            Active Premium members: <strong>{premium?.data ?? 0}</strong>
          </p>
          {(revenue?.data ?? []).length === 0 && (
            <p className="text-muted">No confirmed payments yet.</p>
          )}
          <ul className="divide-y divide-line">
            {(revenue?.data ?? []).map((r) => (
              <li
                key={r.currency}
                className="flex flex-wrap justify-between gap-2 py-2"
              >
                <span className="font-semibold">{r.currency}</span>
                <span className="text-muted">
                  {formatMoney(r.last_30_days, r.currency)} in 30 days ·{" "}
                  {formatMoney(r.all_time, r.currency)} all time · {r.payments}{" "}
                  payments
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            Only payments confirmed by finance are counted.
          </p>
        </Card>
      )}
    </>
  );
}
