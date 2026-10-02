import { Card, Notice } from "@/features/admin/components";
import { setStaffRoleAction } from "@/features/admin/actions";
import { SUPER, requireStaff } from "@/features/admin/guard";

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ done?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireStaff("/admin/staff", SUPER);
  const { data } = await supabase.rpc("admin_list_staff");
  return (
    <>
      <Notice done={sp.done} error={sp.error} />
      <Card title="Staff roles">
        <p className="text-sm text-muted">Super admin: everything. Moderator: reports, profiles, user safety. Support: look people up. Finance: payments (when payments exist). Roles are checked in the database on every action.</p>
        <ul className="divide-y divide-line">
          {(data ?? []).map((s) => (
            <li key={s.user_id} className="flex items-center justify-between gap-3 py-2">
              <span className="font-semibold">{s.first_name ?? "(unknown)"}{s.user_id === user.id && " (you)"}</span>
              <span className="text-muted">{s.role === "admin" ? "super admin" : s.role}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Grant or change a role">
        <form action={setStaffRoleAction} className="space-y-3">
          <label htmlFor="userId" className="block text-sm font-semibold">User ID (copy it from People)</label>
          <input id="userId" name="userId" required className="min-h-12 w-full rounded-xl border-2 bg-surface-2 px-4" />
          <label htmlFor="role" className="block text-sm font-semibold">Role</label>
          <select id="role" name="role" className="min-h-12 w-full rounded-xl border-2 bg-surface-2 px-3">
            <option value="moderator">Moderator</option>
            <option value="support">Support</option>
            <option value="finance">Finance</option>
            <option value="admin">Super admin</option>
            <option value="none">Remove staff access</option>
          </select>
          <button className="min-h-12 rounded-full bg-gold px-6 font-semibold text-on-gold">Save</button>
        </form>
      </Card>
    </>
  );
}
