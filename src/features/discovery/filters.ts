import { z } from "zod";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export const PAGE_SIZE = 10;
export const POOL_SIZE = 60;

const GENDER = ["man", "woman", "non_binary"] as const satisfies readonly Enums["gender"][];
const INTENTION = [
  "serious_relationship",
  "marriage",
  "dating",
  "friendship",
  "getting_to_know",
] as const satisfies readonly Enums["relationship_intention"][];
const CHILDREN = [
  "have_children",
  "want_children",
  "open_to_children",
  "no_children",
  "prefer_not_to_say",
] as const satisfies readonly Enums["children_preference"][];
const HABIT = ["never", "sometimes", "often", "prefer_not_to_say"] as const satisfies readonly Enums["habit_frequency"][];

export type PlaceKind = "country" | "region" | "city" | "community";

export type Filters = {
  ageMin?: number;
  ageMax?: number;
  genders: Enums["gender"][];
  place?: { kind: PlaceKind; id: string };
  intentions: Enums["relationship_intention"][];
  interestIds: string[];
  children: Enums["children_preference"][];
  smoking: Enums["habit_frequency"][];
  drinking: Enums["habit_frequency"][];
};

export const EMPTY_FILTERS: Filters = {
  genders: [],
  intentions: [],
  interestIds: [],
  children: [],
  smoking: [],
  drinking: [],
};

type Params = Record<string, string | string[] | undefined>;

function list(p: Params, key: string): string[] {
  const v = p[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}
function first(p: Params, key: string): string | undefined {
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
}
function pick<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return [...new Set(values.filter((v): v is T => (allowed as readonly string[]).includes(v)))];
}
const uuid = z.uuid();
function age(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 18 && n <= 99 ? n : undefined;
}

/** Lenient: anything invalid in the URL is simply ignored, never an error page. */
export function parseFilters(p: Params): Filters {
  const placeRaw = first(p, "place");
  let place: Filters["place"];
  if (placeRaw) {
    const [kind, id] = placeRaw.split(":");
    if (["country", "region", "city", "community"].includes(kind) && uuid.safeParse(id).success) {
      place = { kind: kind as PlaceKind, id };
    }
  }
  let ageMin = age(first(p, "agemin"));
  let ageMax = age(first(p, "agemax"));
  if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) [ageMin, ageMax] = [ageMax, ageMin];

  return {
    ageMin,
    ageMax,
    genders: pick(list(p, "gender"), GENDER),
    place,
    intentions: pick(list(p, "intention"), INTENTION),
    interestIds: [...new Set(list(p, "interest").filter((v) => uuid.safeParse(v).success))].slice(0, 10),
    children: pick(list(p, "children"), CHILDREN),
    smoking: pick(list(p, "smoking"), HABIT),
    drinking: pick(list(p, "drinking"), HABIT),
  };
}

export function parsePage(p: Params): number {
  const n = Number(first(p, "page"));
  return Number.isInteger(n) && n >= 1 && n <= Math.ceil(POOL_SIZE / PAGE_SIZE) ? n : 1;
}

export function activeFilterCount(f: Filters): number {
  return [
    f.ageMin !== undefined || f.ageMax !== undefined,
    f.genders.length > 0,
    f.place !== undefined,
    f.intentions.length > 0,
    f.interestIds.length > 0,
    f.children.length > 0,
    f.smoking.length > 0,
    f.drinking.length > 0,
  ].filter(Boolean).length;
}

/** Arguments for the discover_profiles function. Empty filters are omitted (the database treats null as "no filter"). */
export function toRpcArgs(f: Filters): Database["public"]["Functions"]["discover_profiles"]["Args"] {
  const args: Database["public"]["Functions"]["discover_profiles"]["Args"] = { p_limit: POOL_SIZE };
  if (f.ageMin !== undefined) args.p_age_min = f.ageMin;
  if (f.ageMax !== undefined) args.p_age_max = f.ageMax;
  if (f.genders.length) args.p_genders = f.genders;
  if (f.place) {
    if (f.place.kind === "country") args.p_country_id = f.place.id;
    if (f.place.kind === "region") args.p_region_id = f.place.id;
    if (f.place.kind === "city") args.p_city_id = f.place.id;
    if (f.place.kind === "community") args.p_community_id = f.place.id;
  }
  if (f.intentions.length) args.p_intentions = f.intentions;
  if (f.interestIds.length) args.p_interest_ids = f.interestIds;
  if (f.children.length) args.p_children = f.children;
  if (f.smoking.length) args.p_smoking = f.smoking;
  if (f.drinking.length) args.p_drinking = f.drinking;
  return args;
}
