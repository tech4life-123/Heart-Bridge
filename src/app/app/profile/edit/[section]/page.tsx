import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { StepContent } from "@/features/profile/components/StepContent";
import { ONBOARDING_STEPS, type StepKey } from "@/features/profile/constants";
import {
  getInterests,
  getLocations,
  getProfileBundle,
} from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit profile" };

const EDITABLE: StepKey[] = [
  "about",
  "photos",
  "interests",
  "looking",
  "location",
];

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!EDITABLE.includes(section as StepKey)) notFound();
  const step = ONBOARDING_STEPS.find((s) => s.key === section)!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/profile/edit/${section}`);

  const [bundle, locations, interests] = await Promise.all([
    getProfileBundle(supabase, user.id),
    getLocations(supabase),
    getInterests(supabase),
  ]);
  if (!bundle)
    return (
      <Alert tone="error">
        We couldn&apos;t load your profile. Please refresh the page.
      </Alert>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{step.title}</h1>
      <StepContent
        step={step.key}
        mode="edit"
        bundle={bundle}
        locations={locations}
        interests={interests}
      />
    </div>
  );
}
