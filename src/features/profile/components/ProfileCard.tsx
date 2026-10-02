import { calculateAge } from "@/lib/age";
import { CHILDREN_OPTIONS, HABIT_OPTIONS, INTENTIONS, labelFor } from "../constants";
import type { LocationOption, PhotoWithUrl } from "../queries";
import { formatPlace } from "../queries";
import type { Row } from "@/types/database";

/** How the profile looks to others (approximate place, no private details). */
export function ProfileCard({
  profile,
  photos,
  interestLabels,
  locations,
}: {
  profile: Row<"profiles">;
  photos: PhotoWithUrl[];
  interestLabels: string[];
  locations: LocationOption[];
}) {
  const age = calculateAge(profile.date_of_birth);
  const place = formatPlace(profile, locations);
  const main = photos[0];
  const intentions = [profile.intention_primary, ...profile.intentions_extra].filter(Boolean) as (typeof INTENTIONS)[number]["value"][];
  const facts = [
    profile.occupation,
    profile.education,
    labelFor(CHILDREN_OPTIONS, profile.children_preference),
    profile.smoking && profile.smoking !== "prefer_not_to_say" ? `Smoking: ${labelFor(HABIT_OPTIONS, profile.smoking)?.toLowerCase()}` : null,
    profile.drinking && profile.drinking !== "prefer_not_to_say" ? `Drinking: ${labelFor(HABIT_OPTIONS, profile.drinking)?.toLowerCase()}` : null,
    profile.languages.length ? `Speaks ${profile.languages.join(", ")}` : null,
  ].filter(Boolean) as string[];

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      {main?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={main.url}
          alt={`${profile.first_name}'s main photo`}
          width={main.width ?? 480}
          height={main.height ?? 640}
          decoding="async"
          className="aspect-[4/5] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/5] items-center justify-center bg-surface-2 px-6 text-center text-muted">
          No photo yet. Profiles with photos get far more attention.
        </div>
      )}
      <div className="space-y-4 p-5">
        <div>
          <h2 className="text-2xl font-bold">
            {profile.first_name}
            {age !== null && <span className="font-medium text-muted">, {age}</span>}
          </h2>
          {place && <p className="text-muted">{place}</p>}
        </div>

        {intentions.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Looking for">
            {intentions.map((i, idx) => (
              <li
                key={i}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  idx === 0 ? "bg-gold text-on-gold" : "border border-line text-muted"
                }`}
              >
                {labelFor(INTENTIONS, i)}
              </li>
            ))}
          </ul>
        )}

        {profile.bio && <p className="whitespace-pre-line text-base leading-relaxed">{profile.bio}</p>}

        {facts.length > 0 && (
          <ul className="space-y-1 text-sm text-muted">
            {facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}

        {interestLabels.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Interests">
            {interestLabels.map((l) => (
              <li key={l} className="rounded-full border border-line px-3 py-1 text-sm">{l}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
