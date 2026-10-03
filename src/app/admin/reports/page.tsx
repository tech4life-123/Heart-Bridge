import Link from "next/link";
import { Card } from "@/features/admin/components";
import { MODERATION, requireStaff } from "@/features/admin/guard";
import { REPORT_CATEGORIES } from "@/features/safety/constants";

const STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { supabase } = await requireStaff("/admin/reports", MODERATION);
  const filter = STATUSES.find((s) => s === status);
  const { data } = await supabase.rpc(
    "admin_report_queue",
    filter ? { p_status: filter } : {},
  );
  const rows = data ?? [];
  const label = (c: string) =>
    REPORT_CATEGORIES.find((x) => x.value === c)?.label ?? c;
  return (
    <Card title="Reports">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/reports"
          className="rounded-full border border-line px-3 py-1.5"
        >
          Needs review
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/reports?status=${s}`}
            className="rounded-full border border-line px-3 py-1.5 capitalize"
          >
            {s}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/reports/${r.id}`}
                className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2 hover:text-gold"
              >
                <span>
                  <span className="font-semibold">{r.reported_name}</span> ·{" "}
                  {label(r.category)}
                  {r.category === "underage_user" && (
                    <span className="ml-2 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
                      URGENT
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted">
                  {r.reports_against} report{r.reports_against === 1 ? "" : "s"}{" "}
                  · {r.reported_status} ·{" "}
                  <time dateTime={r.created_at}>
                    {new Date(r.created_at).toISOString().slice(0, 10)}
                  </time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
