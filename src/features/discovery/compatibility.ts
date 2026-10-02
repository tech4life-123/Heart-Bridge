import type { ChildrenPreference, HabitFrequency, Intention } from "@/features/profile/constants";

/**
 * Explainable compatibility score.
 *
 * Rules (see docs): every factor is something the user chose to tell us; only
 * factors that can be compared for BOTH people count (missing data never lowers
 * the score); gender, age, ethnicity, religion or any other protected attribute
 * is never a factor (gender/age only act as the hard preferences each person set).
 * The score is a guide for starting conversations, not a prediction.
 */

export type ScoringSubject = {
  intentionPrimary: Intention | null;
  intentionsExtra: Intention[];
  interestIds: string[];
  smoking: HabitFrequency | null;
  drinking: HabitFrequency | null;
  childrenPreference: ChildrenPreference | null;
  languages: string[];
};

export type ScoringCandidate = ScoringSubject & {
  /** 3 same city, 2 same county, 1 same country, 0 elsewhere (relative to the viewer). */
  proximity: number;
  /** 0..1 average closeness over questionnaire answers both people gave, or null. */
  qaSimilarity: number | null;
  qaCount: number;
};

export type FactorKey =
  | "intention"
  | "location"
  | "interests"
  | "lifestyle"
  | "children"
  | "languages"
  | "questions";

export type Factor = {
  key: FactorKey;
  weight: number;
  /** 0..1 */
  value: number;
  /** Plain-language reason shown to users when the factor is a strength. */
  reason: string | null;
};

export type Compatibility = {
  /** 0-100, or null when there is not enough in common to compare. */
  score: number | null;
  reasons: string[];
  factors: Factor[];
  /** How many of the 7 factors could be compared for this pair. */
  comparedFactors: number;
};

export const WEIGHTS: Record<FactorKey, number> = {
  intention: 25,
  location: 15,
  interests: 20,
  lifestyle: 10,
  children: 10,
  languages: 5,
  questions: 15,
};

/** Minimum total weight that must be comparable before a number is shown. */
const MIN_COMPARABLE_WEIGHT = 40;
const MIN_QUESTIONS_FOR_FACTOR = 2;
const MAX_REASONS = 3;

const LONG_TERM: Intention[] = ["serious_relationship", "marriage"];
const CASUAL: Intention[] = ["dating", "getting_to_know"];

const INTENTION_TEXT: Record<Intention, string> = {
  serious_relationship: "a serious relationship",
  marriage: "marriage",
  dating: "dating",
  friendship: "friendship",
  getting_to_know: "getting to know someone",
};

function intentionFactor(a: ScoringSubject, b: ScoringSubject): Factor | null {
  if (!a.intentionPrimary || !b.intentionPrimary) return null;
  const setA = [a.intentionPrimary, ...a.intentionsExtra];
  const setB = [b.intentionPrimary, ...b.intentionsExtra];

  if (a.intentionPrimary === b.intentionPrimary) {
    return {
      key: "intention",
      weight: WEIGHTS.intention,
      value: 1,
      reason: `You are both looking for ${INTENTION_TEXT[a.intentionPrimary]}`,
    };
  }
  const shared = setA.find((i) => setB.includes(i));
  if (shared) {
    return {
      key: "intention",
      weight: WEIGHTS.intention,
      value: 0.8,
      reason: `You are both open to ${INTENTION_TEXT[shared]}`,
    };
  }
  const bothLongTerm = setA.some((i) => LONG_TERM.includes(i)) && setB.some((i) => LONG_TERM.includes(i));
  if (bothLongTerm) {
    return { key: "intention", weight: WEIGHTS.intention, value: 0.5, reason: "You both want something long-term" };
  }
  const bothCasual = setA.some((i) => CASUAL.includes(i)) && setB.some((i) => CASUAL.includes(i));
  if (bothCasual) {
    return { key: "intention", weight: WEIGHTS.intention, value: 0.5, reason: "You both prefer to start things casually" };
  }
  return { key: "intention", weight: WEIGHTS.intention, value: 0, reason: null };
}

function locationFactor(c: ScoringCandidate): Factor {
  const table: Record<number, [number, string | null]> = {
    3: [1, "You live in the same city"],
    2: [0.8, "You live in the same county"],
    1: [0.5, "You live in the same country"],
    0: [0.2, null],
  };
  const [value, reason] = table[Math.max(0, Math.min(3, c.proximity))];
  return { key: "location", weight: WEIGHTS.location, value, reason };
}

function interestsFactor(a: ScoringSubject, b: ScoringSubject, labels: Map<string, string>): Factor | null {
  if (a.interestIds.length === 0 || b.interestIds.length === 0) return null;
  const setB = new Set(b.interestIds);
  const shared = a.interestIds.filter((id) => setB.has(id));
  const value = Math.min(1, shared.length / 3);
  let reason: string | null = null;
  if (shared.length > 0) {
    const names = shared
      .map((id) => labels.get(id))
      .filter((n): n is string => Boolean(n))
      .slice(0, 3)
      .map((n) => n.toLowerCase());
    reason = names.length > 0 ? `You both enjoy ${joinList(names)}` : `You share ${shared.length} interests`;
  }
  return { key: "interests", weight: WEIGHTS.interests, value, reason };
}

function habitCloseness(a: HabitFrequency | null, b: HabitFrequency | null): number | null {
  const order: Record<string, number> = { never: 0, sometimes: 1, often: 2 };
  if (!a || !b || !(a in order) || !(b in order)) return null;
  return 1 - Math.abs(order[a] - order[b]) / 2;
}

function lifestyleFactor(a: ScoringSubject, b: ScoringSubject): Factor | null {
  const parts = [habitCloseness(a.smoking, b.smoking), habitCloseness(a.drinking, b.drinking)].filter(
    (v): v is number => v !== null,
  );
  if (parts.length === 0) return null;
  const value = parts.reduce((s, v) => s + v, 0) / parts.length;
  return {
    key: "lifestyle",
    weight: WEIGHTS.lifestyle,
    value,
    reason: value >= 0.75 ? "You have similar lifestyle habits" : null,
  };
}

/** How well two stances on children fit together (symmetric). */
const CHILDREN_FIT: Record<string, number> = {
  "have_children|have_children": 1,
  "want_children|want_children": 1,
  "open_to_children|open_to_children": 1,
  "no_children|no_children": 1,
  "have_children|open_to_children": 0.8,
  "have_children|want_children": 0.8,
  "open_to_children|want_children": 0.8,
  "have_children|no_children": 0.2,
  "no_children|open_to_children": 0.4,
  "no_children|want_children": 0,
};

function childrenFactor(a: ScoringSubject, b: ScoringSubject): Factor | null {
  const x = a.childrenPreference;
  const y = b.childrenPreference;
  if (!x || !y || x === "prefer_not_to_say" || y === "prefer_not_to_say") return null;
  const value = CHILDREN_FIT[`${x}|${y}`] ?? CHILDREN_FIT[`${y}|${x}`] ?? 0.5;
  return {
    key: "children",
    weight: WEIGHTS.children,
    value,
    reason: value >= 0.8 ? "You have compatible plans for children" : null,
  };
}

function languagesFactor(a: ScoringSubject, b: ScoringSubject): Factor | null {
  if (a.languages.length === 0 || b.languages.length === 0) return null;
  const setB = new Set(b.languages.map((l) => l.toLowerCase()));
  const shared = a.languages.filter((l) => setB.has(l.toLowerCase()));
  if (shared.length === 0) return { key: "languages", weight: WEIGHTS.languages, value: 0.2, reason: null };
  return {
    key: "languages",
    weight: WEIGHTS.languages,
    value: 1,
    reason: shared.length === 1 ? `You both speak ${shared[0]}` : "You share more than one language",
  };
}

function questionsFactor(c: ScoringCandidate): Factor | null {
  if (c.qaSimilarity === null || c.qaCount < MIN_QUESTIONS_FOR_FACTOR) return null;
  return {
    key: "questions",
    weight: WEIGHTS.questions,
    value: c.qaSimilarity,
    reason: c.qaSimilarity >= 0.75 ? "Your answers to our questions are closely aligned" : null,
  };
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function scoreCompatibility(
  viewer: ScoringSubject,
  candidate: ScoringCandidate,
  interestLabels: Map<string, string> = new Map(),
): Compatibility {
  const factors = [
    intentionFactor(viewer, candidate),
    locationFactor(candidate),
    interestsFactor(viewer, candidate, interestLabels),
    lifestyleFactor(viewer, candidate),
    childrenFactor(viewer, candidate),
    languagesFactor(viewer, candidate),
    questionsFactor(candidate),
  ].filter((f): f is Factor => f !== null);

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const reasons = [...factors]
    .filter((f) => f.reason && f.value >= 0.5)
    .sort((x, y) => y.weight * y.value - x.weight * x.value)
    .slice(0, MAX_REASONS)
    .map((f) => f.reason as string);

  if (totalWeight < MIN_COMPARABLE_WEIGHT) {
    return { score: null, reasons, factors, comparedFactors: factors.length };
  }
  const weighted = factors.reduce((s, f) => s + f.weight * f.value, 0);
  return {
    score: Math.round((weighted / totalWeight) * 100),
    reasons,
    factors,
    comparedFactors: factors.length,
  };
}

export const TOTAL_FACTORS = Object.keys(WEIGHTS).length;

/** Best match first; people we can't score go last; ties keep the daily shuffled order. */
export function rankByCompatibility<T extends { compatibility: Compatibility; proximity: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const sa = a.item.compatibility.score ?? -1;
      const sb = b.item.compatibility.score ?? -1;
      if (sb !== sa) return sb - sa;
      if (b.item.proximity !== a.item.proximity) return b.item.proximity - a.item.proximity;
      return a.index - b.index;
    })
    .map((x) => x.item);
}
