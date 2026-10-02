import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { buttonStyles } from "@/components/ui/button-styles";
import { signOutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // Defence in depth: src/proxy.ts already guards /app, but never rely on one layer.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  return (
    <>
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
        <Link href="/app" aria-label="HeartBridge home">
          <Logo />
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={`${buttonStyles.ghost} !min-h-10 !px-4`}>
            Sign out
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-2xl px-5 pb-28 pt-2">{children}</main>
      <BottomNav />
    </>
  );
}
