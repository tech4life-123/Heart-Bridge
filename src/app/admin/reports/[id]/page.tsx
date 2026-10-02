import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ModerationForms, Notice } from "@/features/admin/components";
import { setReportStatusAction } from "@/features/admin/actions";
import { MODERATION, requireStaff } from "@/features/admin/guard";
import { REPORT_CATEGORIES } from "@/features/safety/constants";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string; error?: string; messages?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();
  const path = `/admin/reports/${id}`;
  const { supabase, role } = await requireStaff(path, MODERATION);
  const { data } = await supabase.rpc("admin_report_detail", { p_id: id });
  const r = data?.[0];
  if (!r) notFound();
  const { data: ov } = await supabase.rpc("admin_user_overview", { p_user: r.reported_id });
  const u = ov?.[0];

  // Reading private messages is an explicit, audited click - never automatic.
  const messages = sp.messages === "1" ? ((await supabase.rpc("admin_report_messages", { p_report_id: id })).data ?? []) : null;

  let photos: string[] = [];
  if (u && u.photo_paths.length > 0) {
    const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrls(u.photo_paths, 600);
    photos = (signed ?? []).flatMap((s) => (s.signedUrl ? [s.signedUrl] : []));
  }
  const cat = REPORT_CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category;

  return (
    <>
      <Link href="/admin/reports" className="text-muted hover:text-fg">← Reports</Link>
      <Notice done={sp.done} error={sp.error} />
      <Card title={`${cat}: ${r.reported_name}`}>
        <p className="text-sm text-muted">
          Filed by {r.reporter_name} · status <strong>{r.status}</strong> · <time dateTime={r.created_at}>{new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ")} UTC</time>
        </p>
        <p className="whitespace-pre-wrap">{r.description ?? "No description provided."}</p>
        <form action={setReportStatusAction} className="space-y-2">
          <input type="hidden" name="reportId" value={id} />
          <input type="hidden" name="back" value={path} />
          <label htmlFor="note" className="block text-sm font-semibold">Note (optional)</label>
          <input id="note" name="note" maxLength={500} className="min-h-11 w-full rounded-xl border-2 bg-surface-2 px-3" />
          <div className="flex flex-wrap gap-2">
            {(["reviewing", "resolved", "dismissed"] as const).map((s) => (
              <button key={s} type="submit" name="status" value={s} className="min-h-11 rounded-full border-2 border-line px-5 font-semibold capitalize hover:border-gold">
                Mark {s}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {u && (
        <Card title={`${u.first_name}, ${u.age}`}>
          <p className="text-sm text-muted">
            {u.account_status} · {u.reports_open} open / {u.reports_total} total reports · {u.warnings} warnings · {u.matches} matches
          </p>
          {u.bio && <p className="whitespace-pre-wrap">{u.bio}</p>}
          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <li key={p}><img src={p} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" loading="lazy" /></li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {r.match_id && (
        <Card title="Reported conversation">
          {messages === null ? (
            <>
              <p className="text-sm text-muted">Private messages. Opening them is recorded in the audit log. Only this reported conversation is shown.</p>
              <Link href={`${path}?messages=1`} className="inline-flex min-h-11 items-center rounded-full border-2 border-warning px-5 font-semibold text-warning">
                Open messages (audited)
              </Link>
            </>
          ) : messages.length === 0 ? (
            <p className="text-muted">No messages.</p>
          ) : (
            <ol className="space-y-2">
              {[...messages].reverse().map((m) => (
                <li key={m.created_at + m.sender_id} className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs text-muted">{m.sender_name} · {new Date(m.created_at).toISOString().slice(0, 16).replace("T", " ")}</p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {u && !u.is_staff && <ModerationForms userId={u.id} back={path} role={role} status={u.account_status} />}
    </>
  );
}
