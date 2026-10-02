"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Home", match: (p: string) => p === "/app" },
  { href: "/app/profile", label: "Profile", match: (p: string) => p.startsWith("/app/profile") },
];

/** Mobile bottom navigation. Discover, Matches and Messages are added as those features ship. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-2xl">
        {items.map((i) => {
          const active = i.match(pathname);
          return (
            <li key={i.href} className="flex-1">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center text-sm font-semibold ${
                  active ? "text-gold" : "text-muted hover:text-fg"
                }`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
