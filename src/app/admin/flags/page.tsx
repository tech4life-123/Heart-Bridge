import Link from "next/link";
import { Card, Notice } from "@/features/admin/components";
import { reviewFlagAction } from "@/features/admin/actions";
import { MODERATION, requireStaff } from "@/features/admin/guard";

const KIND: Record<string, string> = {
  scam_pattern: "A message looked like a money request (automatic, not proof)",
  multiple_reports: "Reported by 3 or more different people",
  underage_report: "Reported as possibly underage (urgent)",
};

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireStaff("/admin/flags", MODERATION);
  const { data } = await supabase.rpc("admin_flags_queue");
  return (
    <>
      <Notice done={sp.done} error={sp.error} />
      <Card title="Safety flags">
        <p className="text-sm text-muted">
          Flags are hints for human review. Never act on a flag alone without
          looking at the person and any reports.
        </p>
        {(data ?? []).length === 0 && (
          <p className="text-muted">No open flags.</p>
        )}
        <ul className="divide-y divide-line">
          {(data ?? []).map((f) => (
            <li key={f.id} className="space-y-2 py-3">
              <p>
                <Link
                  href={`/admin/users/${f.user_id}`}
                  className="font-semibold hover:text-gold"
                >
                  {f.first_name}
                </Link>{" "}
                <span className="text-muted">- {KIND[f.kind] ?? f.kind}</span>
              </p>
              <form action={reviewFlagAction} className="flex gap-2">
                <input type="hidden" name="id" value={f.id} />
                <button
                  name="status"
                  value="reviewed"
                  className="min-h-11 rounded-full border-2 border-line px-5 font-semibold hover:border-gold"
                >
                  Reviewed
                </button>
                <button
                  name="status"
                  value="dismissed"
                  className="min-h-11 rounded-full border-2 border-line px-5 font-semibold hover:border-gold"
                >
                  Dismiss
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
