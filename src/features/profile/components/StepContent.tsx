import Link from "next/link";
import { buttonStyles } from "@/components/ui/button-styles";
import type { InterestOption, LocationOption, ProfileBundle } from "../queries";
import { AboutForm } from "./AboutForm";
import { FinishForm } from "./FinishForm";
import { InterestsForm } from "./InterestsForm";
import { LocationForm } from "./LocationForm";
import { LookingForForm } from "./LookingForForm";
import { PhotoManager } from "./PhotoManager";
import { ProfileCard } from "./ProfileCard";
import { CompletionCard } from "./CompletionCard";
import { toCompletionInput } from "../bundle";
import { ONBOARDING_STEPS, type StepKey } from "../constants";

/** Renders one profile section. Used by the onboarding wizard AND the edit pages. */
export function StepContent({
  step,
  mode,
  bundle,
  locations,
  interests,
}: {
  step: StepKey;
  mode: "onboarding" | "edit";
  bundle: ProfileBundle;
  locations: LocationOption[];
  interests: InterestOption[];
}) {
  const { profile, preferences, phone, interestIds, photos } = bundle;
  const stepNumber = ONBOARDING_STEPS.findIndex((s) => s.key === step) + 1;

  switch (step) {
    case "about":
      return (
        <AboutForm
          mode={mode}
          defaults={{
            gender: profile.gender,
            bio: profile.bio,
            occupation: profile.occupation,
            education: profile.education,
            languages: profile.languages,
            smoking: profile.smoking,
            drinking: profile.drinking,
            children_preference: profile.children_preference,
            phone,
          }}
        />
      );
    case "photos":
      return (
        <div className="space-y-6">
          <PhotoManager photos={photos} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link
              href={mode === "edit" ? "/app/profile" : `/app/onboarding?step=${stepNumber - 1}`}
              className={buttonStyles.secondary}
            >
              {mode === "edit" ? "Back to profile" : "Back"}
            </Link>
            {mode === "onboarding" && (
              <Link href={`/app/onboarding?step=${stepNumber + 1}`} className={`${buttonStyles.primary} sm:min-w-44`}>
                {photos.length === 0 ? "Skip for now" : "Continue"}
              </Link>
            )}
            {mode === "edit" && (
              <Link href="/app/profile" className={`${buttonStyles.primary} sm:min-w-44`}>
                Done
              </Link>
            )}
          </div>
        </div>
      );
    case "interests":
      return <InterestsForm mode={mode} interests={interests} selected={interestIds} />;
    case "looking":
      return (
        <LookingForForm
          mode={mode}
          defaults={{
            intention_primary: profile.intention_primary,
            intentions_extra: profile.intentions_extra,
            seeking_genders: preferences?.seeking_genders ?? [],
            age_min: preferences?.age_min ?? 18,
            age_max: preferences?.age_max ?? 60,
            appear_local: preferences?.appear_local ?? true,
            appear_liberia: preferences?.appear_liberia ?? true,
            appear_diaspora: preferences?.appear_diaspora ?? true,
          }}
        />
      );
    case "location":
      return (
        <LocationForm
          mode={mode}
          locations={locations}
          defaults={{
            country_id: profile.country_id,
            region_id: profile.region_id,
            city_id: profile.city_id,
            community_id: profile.community_id,
            city_other: profile.city_other,
          }}
        />
      );
    case "preview": {
      const labels = interests.filter((i) => interestIds.includes(i.id)).map((i) => i.label);
      return (
        <div className="space-y-6">
          <p className="text-sm text-muted">This is how your profile looks to others. You can change anything later.</p>
          <ProfileCard profile={profile} photos={photos} interestLabels={labels} locations={locations} />
          <CompletionCard input={toCompletionInput(bundle)} compact />
          <FinishForm stepNumber={stepNumber} />
        </div>
      );
    }
  }
}
