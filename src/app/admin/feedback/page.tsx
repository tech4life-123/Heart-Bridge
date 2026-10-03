import Link from "next/link";
import { Card, Notice } from "@/features/admin/components";
import { setFeedbackStatusAction } from "@/features/admin/actions";
import { PEOPLE, requireStaff } from "@/features/admin/guard";
import { CATEGORY_LABEL } from "@/features/feedback/constants";

const TABS = ["new", "reviewed", "done"] as const;

export default async function FeedbackInbox({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tab = (TABS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof TABS)[number])
    : "new";
  const { supabase } = await requireStaff("/admin/feedback", PEOPLE);
  const [{ data }, { data: sum }] = await Promise.all([
    supabase.rpc("admin_feedback_queue", { p_status: tab, p_limit: 50 }),
    supabase.rpc("admin_feedback_summary"),
  ]);
  const s = sum?.[0];
  const rows = data ?? [];
  return (
    <>
      <Notice done={sp.done} error={sp.error} />
      <Card title="Member feedback">
        {s && (
          <p className="text-sm text-muted">
            {s.total} messages · {s.new_count} new
            {s.avg_rating !== null
              ? ` · average rating ${s.avg_rating} / 5`
              : ""}
          </p>
        )}
        <nav aria-label="Feedback status" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/admin/feedback?status=${t}`}
              aria-current={t === tab ? "page" : undefined}
              className={`min-h-11 rounded-full border-2 px-4 py-2.5 font-semibold capitalize ${t === tab ? "border-gold text-gold" : "border-line"}`}
            >
              {t}
            </Link>
          ))}
        </nav>
        {rows.length === 0 && <p className="text-muted">Nothing here.</p>}
        <ul className="divide-y divide-line">
          {rows.map((f) => (
            <li key={f.id} className="space-y-2 py-4">
              <p className="text-sm text-muted">
                <strong className="text-fg">
                  {CATEGORY_LABEL[f.category] ?? f.category}
                </strong>
                {f.rating ? ` · ${f.rating}/5` : ""} ·{" "}
                {f.first_name ?? "deleted account"} ·{" "}
                {f.created_at.slice(0, 10)}
                {f.page ? ` · from ${f.page}` : ""}
              </p>
              <p className="whitespace-pre-wrap">{f.message}</p>
              <form
                action={setFeedbackStatusAction}
                className="flex flex-wrap gap-2"
              >
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="tab" value={tab} />
                {TABS.filter((t) => t !== tab).map((t) => (
                  <button
                    key={t}
                    name="status"
                    value={t}
                    className="min-h-11 rounded-full border-2 border-line px-5 font-semibold capitalize hover:border-gold"
                  >
                    Mark {t}
                  </button>
                ))}
              </form>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          If a message describes a person behaving badly, open their profile
          from People and use the moderation tools instead of leaving it here.
        </p>
      </Card>
    </>
  );
}
