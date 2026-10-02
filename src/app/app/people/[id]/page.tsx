import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { CardActions } from "@/features/discovery/components/CardActions";
import { CompatibilityBadge } from "@/features/discovery/components/CompatibilityBadge";
import { requireOnboarded } from "@/features/discovery/context";
import { attachPhotoUrls, loadPeople } from "@/features/discovery/queries";
import { CHILDREN_OPTIONS, HABIT_OPTIONS, INTENTIONS, labelFor } from "@/features/profile/constants";
import { getInterests } from "@/features/profile/queries";

export const metadata: Metadata = { title: "Profile" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase, bundle } = await requireOnboarded(`/app/people/${id}`);
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;

  // The database decides whether this person may be seen (preferences, visibility, blocks).
  const [found, interests] = await Promise.all([loadPeople(supabase, bundle, [id]), getInterests(supabase)]);
  if (found.length === 0) notFound();
  const [person] = await attachPhotoUrls(supabase, found, "all");

  const labels = new Map(interests.map((i) => [i.id, i.label]));
  const myInterests = new Set(bundle.interestIds);
  const interestLabels = person.interestIds
    .map((iid) => ({ label: labels.get(iid), shared: myInterests.has(iid) }))
    .filter((i): i is { label: string; shared: boolean } => Boolean(i.label))
    .sort((a, b) => Number(b.shared) - Number(a.shared));

  const intentions = [person.intentionPrimary, ...person.intentionsExtra].filter(Boolean) as (typeof INTENTIONS)[number]["value"][];
  const facts = [
    person.education,
    labelFor(CHILDREN_OPTIONS, person.childrenPreference),
    person.smoking && person.smoking !== "prefer_not_to_say" ? `Smoking: ${labelFor(HABIT_OPTIONS, person.smoking)?.toLowerCase()}` : null,
    person.drinking && person.drinking !== "prefer_not_to_say" ? `Drinking: ${labelFor(HABIT_OPTIONS, person.drinking)?.toLowerCase()}` : null,
    person.languages.length ? `Speaks ${person.languages.join(", ")}` : null,
  ].filter(Boolean) as string[];

  const photos = person.photoUrls.filter((u): u is string => Boolean(u));

  return (
    <div className="space-y-5">
      <Link href="/app/discover" className="inline-flex min-h-11 items-center text-gold">
        ‹ Back to recommendations
      </Link>

      <article className="overflow-hidden rounded-3xl border border-line bg-surface">
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[0]}
            alt={`${person.firstName}'s main photo`}
            width={640}
            height={800}
            fetchPriority="high"
            decoding="async"
            className="aspect-[4/5] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center bg-surface-2 px-6 text-center text-muted">
            {person.firstName} has not added a photo yet.
          </div>
        )}

        {photos.length > 1 && (
          <ul className="grid grid-cols-3 gap-1 p-1 sm:grid-cols-5" aria-label="More photos">
            {photos.slice(1).map((url, i) => (
              <li key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${person.firstName}, photo ${i + 2}`}
                  width={240}
                  height={300}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full rounded-xl object-cover"
                />
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-5 p-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {person.firstName}
              <span className="font-medium text-muted">, {person.age}</span>
            </h1>
            {person.place && <p className="text-muted">{person.place}</p>}
            {person.occupation && <p className="text-sm text-muted">{person.occupation}</p>}
          </div>

          {intentions.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Looking for">
              {intentions.map((i, idx) => (
                <li
                  key={i}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${idx === 0 ? "bg-gold text-on-gold" : "border border-line text-muted"}`}
                >
                  {labelFor(INTENTIONS, i)}
                </li>
              ))}
            </ul>
          )}

          <CompatibilityBadge compatibility={person.compatibility} open />

          {person.bio && <p className="whitespace-pre-line text-base leading-relaxed">{person.bio}</p>}

          {facts.length > 0 && (
            <ul className="space-y-1 text-sm text-muted">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}

          {interestLabels.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Interests</p>
              <ul className="flex flex-wrap gap-2">
                {interestLabels.map((i) => (
                  <li
                    key={i.label}
                    className={`rounded-full border px-3 py-1 text-sm ${i.shared ? "border-gold text-gold" : "border-line"}`}
                  >
                    {i.label}
                    {i.shared && <span className="sr-only"> (you share this)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <CardActions id={person.id} firstName={person.firstName} isLiked={person.isLiked} isSaved={person.isSaved} />
        </div>
      </article>
    </div>
  );
}
