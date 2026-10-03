import Link from "next/link";
import type { Metadata } from "next";
import { ANY_STAFF, requireStaff } from "@/features/admin/guard";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireStaff("/admin", ANY_STAFF);
  const links = [
    { href: "/admin", label: "Overview", roles: ["moderator", "admin"] },
    { href: "/admin/reports", label: "Reports", roles: ["moderator", "admin"] },
    { href: "/admin/flags", label: "Flags", roles: ["moderator", "admin"] },
    {
      href: "/admin/users",
      label: "People",
      roles: ["moderator", "admin", "support"],
    },
    { href: "/admin/appeals", label: "Appeals", roles: ["moderator", "admin"] },
    {
      href: "/admin/analytics",
      label: "Analytics",
      roles: ["moderator", "admin", "finance"],
    },
    { href: "/admin/payments", label: "Payments", roles: ["finance", "admin"] },
    { href: "/admin/audit", label: "Audit log", roles: ["admin"] },
    { href: "/admin/locations", label: "Places", roles: ["admin"] },
    { href: "/admin/staff", label: "Staff", roles: ["admin"] },
  ].filter((l) => l.roles.includes(role));
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-4">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-extrabold text-gold">
          HeartBridge staff{" "}
          <span className="font-medium text-muted">
            ({role === "admin" ? "super admin" : role})
          </span>
        </p>
        <Link href="/app" className="text-muted hover:text-fg">
          Back to app
        </Link>
      </header>
      <nav aria-label="Staff" className="mb-6 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="min-h-11 rounded-full border border-line px-4 py-2.5 font-semibold hover:border-gold"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <main className="space-y-6">{children}</main>
    </div>
  );
}
