import Link from "next/link";
import { INTENTIONS, labelFor } from "@/features/profile/constants";
import type { ScoredPerson } from "../queries";
import { CardActions } from "./CardActions";
import { CompatibilityBadge } from "./CompatibilityBadge";

/** One recommended person: photo, name, age, approximate place, intention, compatibility, actions. */
export function PersonSummary({
  person,
  interestLabels,
  priority = false,
}: {
  person: ScoredPerson;
  interestLabels: Map<string, string>;
  priority?: boolean;
}) {
  const photo = person.photoUrls[0];
  const intentions = [person.intentionPrimary, ...person.intentionsExtra].filter(Boolean) as (typeof INTENTIONS)[number]["value"][];
  const sharedLabels = person.interestIds
    .map((id) => interestLabels.get(id))
    .filter((l): l is string => Boolean(l))
    .slice(0, 4);
  const href = `/app/people/${person.id}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      <Link href={href} aria-label={`View ${person.firstName}'s profile`} className="block">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={`${person.firstName}'s main photo`}
            width={640}
            height={800}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="aspect-[4/5] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center bg-surface-2 px-6 text-center text-muted">
            {person.firstName} has not added a photo yet.
          </div>
        )}
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <h2 className="text-2xl font-bold">
            <Link href={href} className="hover:text-gold">
              {person.firstName}
            </Link>
            <span className="font-medium text-muted">, {person.age}</span>
          </h2>
          {person.place && <p className="text-muted">{person.place}</p>}
          {person.occupation && <p className="text-sm text-muted">{person.occupation}</p>}
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

        <CompatibilityBadge compatibility={person.compatibility} />

        {person.bio && <p className="line-clamp-3 whitespace-pre-line text-base leading-relaxed">{person.bio}</p>}

        {sharedLabels.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Interests">
            {sharedLabels.map((l) => (
              <li key={l} className="rounded-full border border-line px-3 py-1 text-sm">
                {l}
              </li>
            ))}
          </ul>
        )}

        <CardActions id={person.id} firstName={person.firstName} isLiked={person.isLiked} isSaved={person.isSaved} />
      </div>
    </article>
  );
}
