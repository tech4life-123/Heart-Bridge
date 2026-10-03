export const FEEDBACK_CATEGORIES = [
  { value: "idea", label: "An idea or suggestion" },
  { value: "bug", label: "Something is broken" },
  { value: "praise", label: "Something I like" },
  { value: "other", label: "Something else" },
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

/** Used by staff screens: also covers categories members cannot pick directly. */
export const CATEGORY_LABEL: Record<string, string> = {
  idea: "Idea",
  bug: "Bug",
  praise: "Praise",
  safety_concern: "Safety concern",
  other: "Other",
};
