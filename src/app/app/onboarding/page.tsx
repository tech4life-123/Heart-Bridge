import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { StepContent } from "@/features/profile/components/StepContent";
import { ONBOARDING_STEPS } from "@/features/profile/constants";
import { getInterests, getLocations, getProfileBundle } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step: stepParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/onboarding");

  const [bundle, locations, interests] = await Promise.all([
    getProfileBundle(supabase, user.id),
    getLocations(supabase),
    getInterests(supabase),
  ]);
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;

  const requested = Number.parseInt(stepParam ?? "", 10);
  const number = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 1), ONBOARDING_STEPS.length)
    : Math.min(bundle.profile.onboarding_step + 1, ONBOARDING_STEPS.length);
  const step = ONBOARDING_STEPS[number - 1];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">
          Step {number} of {ONBOARDING_STEPS.length}
        </p>
        <div
          role="progressbar"
          aria-valuenow={number}
          aria-valuemin={1}
          aria-valuemax={ONBOARDING_STEPS.length}
          aria-label={`Step ${number} of ${ONBOARDING_STEPS.length}`}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
        >
          <div className="h-full rounded-full bg-gold" style={{ width: `${(number / ONBOARDING_STEPS.length) * 100}%` }} />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{step.title}</h1>
      </div>
      <StepContent step={step.key} mode="onboarding" bundle={bundle} locations={locations} interests={interests} />
    </div>
  );
}
