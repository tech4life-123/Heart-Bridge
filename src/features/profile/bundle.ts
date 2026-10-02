import type { CompletionInput } from "./completion";
import type { ProfileBundle } from "./queries";

export function toCompletionInput(b: ProfileBundle): CompletionInput {
  const p = b.profile;
  return {
    gender: p.gender,
    intention_primary: p.intention_primary,
    country_id: p.country_id,
    region_id: p.region_id,
    city_id: p.city_id,
    city_other: p.city_other,
    bio: p.bio,
    occupation: p.occupation,
    education: p.education,
    languages: p.languages,
    photoCount: b.photos.length,
    interestCount: b.interestIds.length,
  };
}
