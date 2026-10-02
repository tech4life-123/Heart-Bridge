"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

const items = [
  { href: "/app", label: "Home", match: (p: string) => p === "/app" },
  { href: "/app/discover", label: "Discover", match: (p: string) => p.startsWith("/app/discover") || p.startsWith("/app/people") },
  { href: "/app/matches", label: "Matches", match: (p: string) => p.startsWith("/app/matches") || p.startsWith("/app/messages"), badge: true },
  { href: "/app/saved", label: "Saved", match: (p: string) => p.startsWith("/app/saved") },
  { href: "/app/profile", label: "Profile", match: (p: string) => p.startsWith("/app/profile") },
];

/** Mobile bottom navigation with live unread / new-match counters (Supabase Realtime, RLS-protected). */
export function BottomNav({ userId, initialCount }: { userId: string; initialCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [toast, setToast] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    const sb = createBrowserSupabase();
    const { data } = await sb.rpc("unread_summary");
    const row = data?.[0];
    if (row) setCount(row.unread_messages + row.new_matches);
  }, []);

  // Counts change when you read a chat or open a match, i.e. when the page changes.
  useEffect(() => {
    let cancelled = false;
    void createBrowserSupabase()
      .rpc("unread_summary")
      .then(({ data }) => {
        const row = data?.[0];
        if (!cancelled && row) setCount(row.unread_messages + row.new_matches);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const sb = createBrowserSupabase();
    let cancelled = false;
    let channel: ReturnType<typeof sb.channel> | null = null;
    void (async () => {
      await sb.realtime.setAuth();
      if (cancelled) return;
      channel = sb
        .channel(`inbox-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "match_participants", filter: `user_id=eq.${userId}` },
          () => {
            setToast("It's a Match! ❤️ Open Matches to say hello.");
            void refreshCount();
            router.refresh();
          },
        )
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const m = payload.new as { sender_id?: string };
          if (m.sender_id && m.sender_id !== userId) {
            void refreshCount();
            router.refresh();
          }
        })
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) void sb.removeChannel(channel);
    };
  }, [userId, refreshCount, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-20 z-20 mx-auto w-fit max-w-[90%] rounded-full bg-gold px-5 py-3 text-center font-semibold text-on-gold shadow-lg">
          <Link href="/app/matches">{toast}</Link>
        </div>
      )}
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
                  className={`relative flex min-h-14 items-center justify-center text-sm font-semibold ${
                    active ? "text-gold" : "text-muted hover:text-fg"
                  }`}
                >
                  {i.label}
                  {i.badge && count > 0 && (
                    <span
                      aria-label={`${count} new`}
                      className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-on-gold"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
