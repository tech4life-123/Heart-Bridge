import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/features/admin/components";
import { MODERATION, PEOPLE, requireStaff } from "@/features/admin/guard";

export default async function AdminHome() {
  const { supabase, role } = await requireStaff("/admin", PEOPLE);
  if (!MODERATION.includes(role)) return <Card title="Welcome"><p>Use <Link className="text-gold" href="/admin/users">People</Link> to look someone up.</p></Card>;
  const { data } = await supabase.rpc("admin_stats");
  const s = data?.[0];
  if (!s) notFound();
  const tiles: [string, number, string?][] = [
    ["Open reports", s.open_reports, "/admin/reports"],
    ["Open flags", s.open_flags, "/admin/flags"],
    ["People", s.users_total],
    ["Active", s.users_active],
    ["Suspended", s.users_suspended],
    ["Banned", s.users_banned],
    ["New (7 days)", s.new_users_7d],
    ["Matches", s.matches_total],
    ["Messages (24h)", s.messages_24h],
  ];
  return (
    <Card title="Overview">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, n, href]) => (
          <li key={label} className="rounded-2xl bg-surface-2 p-4">
            <p className="text-3xl font-extrabold">{n}</p>
            <p className="text-muted">{href ? <Link href={href} className="hover:text-gold">{label}</Link> : label}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
