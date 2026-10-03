import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { toCompletionInput } from "@/features/profile/bundle";
import { CompletionCard } from "@/features/profile/components/CompletionCard";
import { ProfileCard } from "@/features/profile/components/ProfileCard";
import {
  getInterests,
  getLocations,
  getProfileBundle,
} from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My profile" };

const sections = [
  { key: "about", label: "About me, languages and lifestyle" },
  { key: "photos", label: "Photos" },
  { key: "interests", label: "Interests" },
  { key: "looking", label: "What I'm looking for" },
  { key: "location", label: "Where I live" },
] as const;

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/profile");

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
  if (!bundle.profile.onboarding_completed_at) redirect("/app/onboarding");

  const labels = interests
    .filter((i) => bundle.interestIds.includes(i.id))
    .map((i) => i.label);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">My profile</h1>
      <ProfileCard
        profile={bundle.profile}
        photos={bundle.photos}
        interestLabels={labels}
        locations={locations}
      />
      <CompletionCard input={toCompletionInput(bundle)} />

      <section
        aria-labelledby="edit-title"
        className="rounded-3xl border border-line bg-surface p-5"
      >
        <h2 id="edit-title" className="text-lg font-bold">
          Edit
        </h2>
        <ul className="mt-2">
          {sections.map((s) => (
            <li key={s.key}>
              <Link
                href={`/app/profile/edit/${s.key}`}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2"
              >
                <span>{s.label}</span>
                <span aria-hidden className="text-gold">
                  ›
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/app/profile/questions"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2"
            >
              <span>Compatibility questions (private)</span>
              <span aria-hidden className="text-gold">
                ›
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/app/profile/assistant"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2"
            >
              <span>Bio helper (AI, optional)</span>
              <span aria-hidden className="text-gold">
                ›
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/app/premium"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2"
            >
              <span>Premium and payments</span>
              <span aria-hidden className="text-gold">
                ›
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/app/likes"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2"
            >
              <span>Who liked you</span>
              <span aria-hidden className="text-gold">
                ›
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/app/profile/blocked"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2"
            >
              <span>Blocked people</span>
              <span aria-hidden className="text-gold">
                ›
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/app/profile/delete"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 text-danger hover:bg-surface-2"
            >
              <span>Delete my account</span>
              <span aria-hidden>›</span>
            </Link>
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="private-title"
        className="rounded-3xl border border-line bg-surface p-5"
      >
        <h2 id="private-title" className="text-lg font-bold">
          Private details
        </h2>
        <p className="mt-1 text-sm text-muted">Only you can see these.</p>
        <p className="mt-3">
          Phone:{" "}
          {bundle.phone ? (
            <span className="font-semibold">{bundle.phone}</span>
          ) : (
            <span className="text-muted">not added</span>
          )}
          {bundle.phone && (
            <span className="ml-2 text-sm text-muted">(not verified)</span>
          )}
        </p>
        <Link
          href="/app/profile/edit/about"
          className={`${buttonStyles.ghost} !px-0`}
        >
          Change
        </Link>
      </section>
    </div>
  );
}
