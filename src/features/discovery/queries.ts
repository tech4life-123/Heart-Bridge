import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type { ProfileBundle } from "@/features/profile/queries";
import { getInterests } from "@/features/profile/queries";
import type { Database, ProfileCardRow } from "@/types/database";
import {
  rankByCompatibility,
  scoreCompatibility,
  type Compatibility,
  type ScoringSubject,
} from "./compatibility";
import { toRpcArgs, type Filters } from "./filters";

type Client = SupabaseClient<Database>;
type Enums = Database["public"]["Enums"];

const PHOTO_URL_TTL_SECONDS = 3600;

/** What the UI knows about another person. Nothing private: see the profile_card type in the database. */
export type PersonCard = {
  id: string;
  firstName: string;
  age: number;
  bio: string | null;
  occupation: string | null;
  education: string | null;
  languages: string[];
  smoking: Enums["habit_frequency"] | null;
  drinking: Enums["habit_frequency"] | null;
  childrenPreference: Enums["children_preference"] | null;
  intentionPrimary: Enums["relationship_intention"] | null;
  intentionsExtra: Enums["relationship_intention"][];
  place: string | null;
  proximity: number;
  interestIds: string[];
  photoPaths: string[];
  isLiked: boolean;
  isSaved: boolean;
  isPassed: boolean;
  qaSimilarity: number | null;
  qaCount: number;
};

export type ScoredPerson = PersonCard & {
  compatibility: Compatibility;
  /** Signed URLs aligned with photoPaths (null if signing failed or not requested). */
  photoUrls: (string | null)[];
};

export function normalizeCard(r: ProfileCardRow): PersonCard | null {
  if (!r.id || !r.first_name || r.age === null) return null;
  return {
    id: r.id,
    firstName: r.first_name,
    age: r.age,
    bio: r.bio,
    occupation: r.occupation,
    education: r.education,
    languages: r.languages ?? [],
    smoking: r.smoking,
    drinking: r.drinking,
    childrenPreference: r.children_preference,
    intentionPrimary: r.intention_primary,
    intentionsExtra: r.intentions_extra ?? [],
    place: r.place,
    proximity: r.proximity ?? 0,
    interestIds: r.interest_ids ?? [],
    photoPaths: r.photo_paths ?? [],
    isLiked: r.is_liked ?? false,
    isSaved: r.is_saved ?? false,
    isPassed: r.is_passed ?? false,
    qaSimilarity: r.qa_similarity,
    qaCount: r.qa_count ?? 0,
  };
}

export function viewerSubject(bundle: ProfileBundle): ScoringSubject {
  const p = bundle.profile;
  return {
    intentionPrimary: p.intention_primary,
    intentionsExtra: p.intentions_extra,
    interestIds: bundle.interestIds,
    smoking: p.smoking,
    drinking: p.drinking,
    childrenPreference: p.children_preference,
    languages: p.languages,
  };
}

function score(
  card: PersonCard,
  viewer: ScoringSubject,
  labels: Map<string, string>,
): ScoredPerson {
  return {
    ...card,
    photoUrls: card.photoPaths.map(() => null),
    compatibility: scoreCompatibility(
      viewer,
      {
        intentionPrimary: card.intentionPrimary,
        intentionsExtra: card.intentionsExtra,
        interestIds: card.interestIds,
        smoking: card.smoking,
        drinking: card.drinking,
        childrenPreference: card.childrenPreference,
        languages: card.languages,
        proximity: card.proximity,
        qaSimilarity: card.qaSimilarity,
        qaCount: card.qaCount,
      },
      labels,
    ),
  };
}

async function interestLabels(supabase: Client): Promise<Map<string, string>> {
  const all = await getInterests(supabase);
  return new Map(all.map((i) => [i.id, i.label]));
}

/** Signs photos with the viewer's own session; storage policy only allows people they may see. */
export async function attachPhotoUrls(
  supabase: Client,
  people: ScoredPerson[],
  mode: "first" | "all",
): Promise<ScoredPerson[]> {
  const wanted = new Set<string>();
  for (const p of people) {
    const paths = mode === "first" ? p.photoPaths.slice(0, 1) : p.photoPaths;
    for (const path of paths) wanted.add(path);
  }
  if (wanted.size === 0) return people;

  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrls([...wanted], PHOTO_URL_TTL_SECONDS);
  if (error) {
    logger.error("discovery.photo_sign_failed", { message: error.message });
    return people;
  }
  const urls = new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
  return people.map((p) => ({ ...p, photoUrls: p.photoPaths.map((path) => urls.get(path) ?? null) }));
}

/** The recommended pool: filtered by the database, scored and ranked here. */
export async function loadFeed(
  supabase: Client,
  bundle: ProfileBundle,
  filters: Filters,
): Promise<{ people: ScoredPerson[]; failed: boolean }> {
  const [{ data, error }, labels] = await Promise.all([
    supabase.rpc("discover_profiles", toRpcArgs(filters)),
    interestLabels(supabase),
  ]);
  if (error) {
    logger.error("discovery.feed_failed", { code: error.code });
    return { people: [], failed: true };
  }
  const viewer = viewerSubject(bundle);
  const scored = (data ?? [])
    .map(normalizeCard)
    .filter((c): c is PersonCard => c !== null)
    .map((c) => score(c, viewer, labels));
  return { people: rankByCompatibility(scored), failed: false };
}

/** One person (or several) by id, only if the visibility gate allows it. */
export async function loadPeople(
  supabase: Client,
  bundle: ProfileBundle,
  ids: string[],
): Promise<ScoredPerson[]> {
  if (ids.length === 0) return [];
  const [{ data, error }, labels] = await Promise.all([
    supabase.rpc("profile_cards", { p_ids: ids }),
    interestLabels(supabase),
  ]);
  if (error) {
    logger.error("discovery.cards_failed", { code: error.code });
    return [];
  }
  const viewer = viewerSubject(bundle);
  return (data ?? [])
    .map(normalizeCard)
    .filter((c): c is PersonCard => c !== null)
    .map((c) => score(c, viewer, labels));
}

export async function loadSavedIds(supabase: Client, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_profiles")
    .select("saved_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) logger.error("discovery.saved_failed", { code: error.code });
  return (data ?? []).map((r) => r.saved_id);
}

export type Question = {
  id: string;
  slug: string;
  category: string;
  prompt: string;
  options: { value: number; label: string }[];
};

export async function loadQuestions(supabase: Client): Promise<Question[]> {
  const { data, error } = await supabase
    .from("compatibility_questions")
    .select("id, slug, category, prompt, options")
    .eq("is_active", true)
    .order("sort_order");
  if (error) logger.error("questions.read_failed", { code: error.code });
  return (data ?? []).flatMap((q) => {
    const opts = Array.isArray(q.options)
      ? q.options.flatMap((o) =>
          o && typeof o === "object" && !Array.isArray(o) && typeof o.value === "number" && typeof o.label === "string"
            ? [{ value: o.value, label: o.label }]
            : [],
        )
      : [];
    return opts.length >= 2 ? [{ id: q.id, slug: q.slug, category: q.category, prompt: q.prompt, options: opts }] : [];
  });
}

export async function loadMyAnswers(supabase: Client, userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("compatibility_answers")
    .select("question_id, value")
    .eq("user_id", userId);
  if (error) logger.error("answers.read_failed", { code: error.code });
  return Object.fromEntries((data ?? []).map((a) => [a.question_id, a.value]));
}
