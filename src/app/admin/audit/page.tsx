import Link from "next/link";
import { Card } from "@/features/admin/components";
import { SUPER, requireStaff } from "@/features/admin/guard";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.min(
    Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1),
    1000,
  );
  const { supabase } = await requireStaff("/admin/audit", SUPER);
  const { data } = await supabase.rpc("admin_audit_log", {
    p_limit: 50,
    p_offset: (page - 1) * 50,
  });
  const rows = data ?? [];
  return (
    <Card title="Audit log">
      <ul className="divide-y divide-line text-sm">
        {rows.map((a) => (
          <li key={a.id} className="space-y-1 py-2">
            <p>
              <strong>{a.action}</strong> by {a.actor_name ?? "(removed user)"}{" "}
              on {a.entity_type}{" "}
              <span className="text-muted">{a.entity_id}</span>
            </p>
            <p className="text-muted">
              {new Date(a.created_at)
                .toISOString()
                .slice(0, 16)
                .replace("T", " ")}{" "}
              UTC{" "}
              {Object.keys(a.metadata as object).length > 0 && (
                <>· {JSON.stringify(a.metadata)}</>
              )}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex justify-between">
        {page > 1 ? (
          <Link href={`/admin/audit?page=${page - 1}`} className="text-gold">
            ← Newer
          </Link>
        ) : (
          <span />
        )}
        {rows.length === 50 && (
          <Link href={`/admin/audit?page=${page + 1}`} className="text-gold">
            Older →
          </Link>
        )}
      </div>
    </Card>
  );
}
