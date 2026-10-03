import Link from "next/link";
import { Card, Notice } from "@/features/admin/components";
import { reviewAppealAction } from "@/features/admin/actions";
import { MODERATION, requireStaff } from "@/features/admin/guard";

export default async function AppealsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const status = ["open", "granted", "denied"].includes(sp.status ?? "")
    ? (sp.status as string)
    : "open";
  const { supabase, role } = await requireStaff("/admin/appeals", MODERATION);
  const { data } = await supabase.rpc("admin_appeals_queue", {
    p_status: status,
    p_limit: 50,
  });
  const rows = data ?? [];
  return (
    <>
      <Notice done={sp.done} error={sp.error} />
      <Card title="Appeals">
        <p className="text-sm text-muted">
          Look at the person&apos;s reports and history first. The note is shown
          to the member, so keep it polite and free of private details. Only a
          Super Admin can restore a banned account.
        </p>
        <nav aria-label="Appeal status" className="flex flex-wrap gap-2">
          {["open", "granted", "denied"].map((t) => (
            <Link
              key={t}
              href={`/admin/appeals?status=${t}`}
              aria-current={t === status ? "page" : undefined}
              className={`min-h-11 rounded-full border-2 px-4 py-2.5 font-semibold capitalize ${t === status ? "border-gold text-gold" : "border-line"}`}
            >
              {t}
            </Link>
          ))}
        </nav>
        {rows.length === 0 && <p className="text-muted">Nothing here.</p>}
        <ul className="divide-y divide-line">
          {rows.map((a) => (
            <li key={a.id} className="space-y-3 py-4">
              <p>
                <Link
                  href={`/admin/users/${a.user_id}`}
                  className="font-semibold hover:text-gold"
                >
                  {a.first_name}
                </Link>{" "}
                <span className="text-muted">
                  · {a.account_status} · {a.created_at.slice(0, 10)}
                </span>
              </p>
              <p className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3">
                {a.message}
              </p>
              {a.decision_note && (
                <p className="text-sm text-muted">Note: {a.decision_note}</p>
              )}
              {status === "open" && (
                <form action={reviewAppealAction} className="space-y-2">
                  <input type="hidden" name="id" value={a.id} />
                  <label
                    htmlFor={`n-${a.id}`}
                    className="block text-sm font-semibold"
                  >
                    Note to the member (required)
                  </label>
                  <input
                    id={`n-${a.id}`}
                    name="note"
                    required
                    minLength={5}
                    maxLength={500}
                    className="min-h-11 w-full rounded-xl border-2 bg-surface-2 px-3"
                  />
                  <div className="flex flex-wrap gap-2">
                    {(a.account_status !== "banned" || role === "admin") && (
                      <button
                        name="decision"
                        value="granted"
                        className="min-h-11 rounded-full border-2 border-success px-5 font-semibold text-success"
                      >
                        Restore account
                      </button>
                    )}
                    <button
                      name="decision"
                      value="denied"
                      className="min-h-11 rounded-full border-2 border-danger px-5 font-semibold text-danger"
                    >
                      Keep restriction
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
