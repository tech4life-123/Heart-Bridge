import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { CompletionCard } from "@/features/profile/components/CompletionCard";
import { toCompletionInput } from "@/features/profile/bundle";
import { getProfileBundle } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home" };

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  const bundle = await getProfileBundle(supabase, user.id);
  if (!bundle) {
    return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;
  }
  // The minimum profile (who you are, what you want, where you live) comes first.
  if (!bundle.profile.onboarding_completed_at) {
    redirect(`/app/onboarding?step=${Math.min(bundle.profile.onboarding_step + 1, 6)}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {bundle.profile.first_name}.</h1>
      <CompletionCard input={toCompletionInput(bundle)} compact />
      <Alert tone="info">
        Your profile is saved. Discovery, matching and chat are the next things we are building. We will tell you
        when they are ready.
      </Alert>
      <Link href="/app/profile" className={buttonStyles.secondary}>
        View my profile
      </Link>
    </div>
  );
}
