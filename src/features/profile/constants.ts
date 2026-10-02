import type { Enums } from "@/types/database";

export type Gender = Enums<"gender">;
export type Intention = Enums<"relationship_intention">;
export type ChildrenPreference = Enums<"children_preference">;
export type HabitFrequency = Enums<"habit_frequency">;

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
];

export const INTENTIONS: { value: Intention; label: string; hint: string }[] = [
  { value: "serious_relationship", label: "Serious relationship", hint: "Looking for something lasting" },
  { value: "marriage", label: "Marriage", hint: "Ready to build a life together" },
  { value: "dating", label: "Dating", hint: "Meeting people and seeing where it goes" },
  { value: "friendship", label: "Friendship", hint: "Good company first" },
  { value: "getting_to_know", label: "Getting to know someone", hint: "No pressure, take it slowly" },
];

export const CHILDREN_OPTIONS: { value: ChildrenPreference; label: string }[] = [
  { value: "have_children", label: "I have children" },
  { value: "want_children", label: "I want children" },
  { value: "open_to_children", label: "Open to children" },
  { value: "no_children", label: "I don't want children" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const HABIT_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

/** Languages spoken in Liberia and by the diaspora. Stored as plain labels. */
export const LANGUAGES = [
  "English",
  "Liberian English",
  "Kpelle",
  "Bassa",
  "Gio",
  "Mano",
  "Kru",
  "Grebo",
  "Lorma",
  "Vai",
  "Mandingo",
  "Kissi",
  "Gola",
  "Krahn",
  "Mende",
  "Gbandi",
  "Dei",
  "French",
] as const;

export const LIMITS = {
  bio: 500,
  occupation: 80,
  education: 80,
  cityOther: 60,
  languages: 10,
  interests: 10,
  photos: 6,
  extraIntentions: 4,
} as const;

export const ONBOARDING_STEPS = [
  { key: "about", title: "About you" },
  { key: "photos", title: "Photos" },
  { key: "interests", title: "Interests" },
  { key: "looking", title: "What you're looking for" },
  { key: "location", title: "Where you live" },
  { key: "preview", title: "Preview" },
] as const;

export type StepKey = (typeof ONBOARDING_STEPS)[number]["key"];

export function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T | null | undefined,
): string | null {
  return options.find((o) => o.value === value)?.label ?? null;
}
