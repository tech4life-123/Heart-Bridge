import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { signOutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AppHomePage() {
  const supabase = await createClient();

  // Defence in depth: src/proxy.ts already guards /app, but never rely on one layer.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  // Reads through Row Level Security: a user can only ever see their own row.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();
  if (error) logger.error("profile.read_failed", { code: error.code });

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Logo />
        <form action={signOutAction}>
          <button type="submit" className={`${buttonStyles.ghost} !min-h-10 !px-4`}>
            Sign out
          </button>
        </form>
      </div>

      <h1 className="mt-12 text-4xl font-bold tracking-tight">
        {profile?.first_name ? `Welcome, ${profile.first_name}.` : "Welcome."}
      </h1>
      <div className="mt-6">
        <Alert tone="info">
          Your account is ready. Profile setup, photos and preferences are the
          next things we are building, and discovery and chat follow after that.
        </Alert>
      </div>
    </main>
  );
}
