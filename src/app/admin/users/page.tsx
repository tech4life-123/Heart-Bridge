import Link from "next/link";
import { Card } from "@/features/admin/components";
import { PEOPLE, requireStaff } from "@/features/admin/guard";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase, role } = await requireStaff("/admin/users", PEOPLE);
  const query = (q ?? "").trim().slice(0, 100);
  const { data } = query.length >= 2 ? await supabase.rpc("admin_find_user", { p_query: query }) : { data: [] };
  return (
    <Card title="Find a person">
      <form className="flex gap-2">
        <label htmlFor="q" className="sr-only">Name{role !== "moderator" ? ", exact email" : ""} or user ID</label>
        <input id="q" name="q" defaultValue={query} placeholder={role === "moderator" ? "First name or user ID" : "First name, exact email or user ID"} className="min-h-12 flex-1 rounded-xl border-2 bg-surface-2 px-4" />
        <button className="min-h-12 rounded-full bg-gold px-6 font-semibold text-on-gold">Search</button>
      </form>
      <ul className="divide-y divide-line">
        {(data ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/admin/users/${p.id}`} className="flex min-h-12 items-center justify-between py-2 hover:text-gold">
              <span className="font-semibold">{p.first_name}</span>
              <span className="text-sm text-muted">{p.account_status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
