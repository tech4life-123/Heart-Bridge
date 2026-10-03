import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ModerationForms, Notice } from "@/features/admin/components";
import { MODERATION, PEOPLE, requireStaff } from "@/features/admin/guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();
  const path = `/admin/users/${id}`;
  const { supabase, role } = await requireStaff(path, PEOPLE);
  const { data } = await supabase.rpc("admin_user_overview", { p_user: id });
  const u = data?.[0];
  if (!u) notFound();

  let photos: string[] = [];
  if (u.photo_paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrls(u.photo_paths, 600);
    photos = (signed ?? []).flatMap((s) => (s.signedUrl ? [s.signedUrl] : []));
  }
  return (
    <>
      <Link href="/admin/users" className="text-muted hover:text-fg">
        ← People
      </Link>
      <Notice done={sp.done} error={sp.error} />
      <Card title={`${u.first_name}, ${u.age}`}>
        <p className="text-sm text-muted">
          {u.account_status}
          {u.is_staff ? " · staff" : ""} · joined{" "}
          {new Date(u.created_at).toISOString().slice(0, 10)} · {u.reports_open}{" "}
          open / {u.reports_total} total reports · {u.warnings} warnings ·{" "}
          {u.matches} matches
        </p>
        {u.occupation && <p>{u.occupation}</p>}
        {u.bio && <p className="whitespace-pre-wrap">{u.bio}</p>}
        {photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <li key={p}>
                <img
                  src={p}
                  alt=""
                  className="aspect-[4/5] w-full rounded-xl object-cover"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
      {MODERATION.includes(role) && !u.is_staff && (
        <ModerationForms
          userId={u.id}
          back={path}
          role={role}
          status={u.account_status}
        />
      )}
    </>
  );
}
