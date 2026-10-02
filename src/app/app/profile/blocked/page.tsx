import Link from "next/link";
import type { Metadata } from "next";
import { unblockUserAction } from "@/features/safety/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Blocked people" };

export default async function BlockedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/profile/blocked");
  const { data } = await supabase.rpc("my_blocked");
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/profile" className="text-muted hover:text-fg">
          ← Profile
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Blocked people</h1>
        <p className="mt-1 text-muted">Blocked people can&apos;t see your profile or message you. Only you can see this list.</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-3xl border border-line bg-surface p-6 text-center text-muted">You have not blocked anyone.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.blocked_id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
              <span className="font-semibold">{r.first_name}</span>
              <form action={unblockUserAction}>
                <input type="hidden" name="id" value={r.blocked_id} />
                <button type="submit" className="min-h-11 rounded-full border-2 border-line px-5 font-semibold hover:border-gold">
                  Unblock
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
