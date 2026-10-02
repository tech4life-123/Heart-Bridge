import { z } from "zod";
import {
  CHILDREN_OPTIONS,
  GENDERS,
  HABIT_OPTIONS,
  INTENTIONS,
  LANGUAGES,
  LIMITS,
} from "./constants";
import { normalizePhone } from "./phone";

const pick = { error: "Please choose one." };
const gender = z.enum(GENDERS.map((g) => g.value) as [string, ...string[]], pick);
const intention = z.enum(INTENTIONS.map((i) => i.value) as [string, ...string[]], pick);

/** Strip control characters and collapse stray whitespace; empty becomes null. */
function cleanText(max: number, label: string) {
  return z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim())
    .pipe(z.string().max(max, `${label} must be at most ${max} characters.`))
    .transform((s) => (s === "" ? null : s));
}

const optionalEnum = (values: readonly string[]) =>
  z
    .string()
    .transform((s) => (s === "" ? null : s))
    .pipe(z.union([z.null(), z.enum(values as [string, ...string[]])]));

export const aboutSchema = z.object({
  gender,
  bio: cleanText(LIMITS.bio, "Your bio"),
  occupation: cleanText(LIMITS.occupation, "Occupation"),
  education: cleanText(LIMITS.education, "Education"),
  languages: z
    .array(z.enum(LANGUAGES))
    .max(LIMITS.languages, `Choose up to ${LIMITS.languages} languages.`),
  smoking: optionalEnum(HABIT_OPTIONS.map((o) => o.value)),
  drinking: optionalEnum(HABIT_OPTIONS.map((o) => o.value)),
  children_preference: optionalEnum(CHILDREN_OPTIONS.map((o) => o.value)),
  phone: z
    .string()
    .transform((s, ctx) => {
      if (s.trim() === "") return null;
      const n = normalizePhone(s);
      if (!n) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid phone number, for example +231 77 123 4567.",
        });
        return z.NEVER;
      }
      return n;
    }),
});

export const interestsSchema = z.object({
  interests: z
    .array(z.uuid())
    .max(LIMITS.interests, `Choose up to ${LIMITS.interests} interests.`),
});

export const lookingForSchema = z
  .object({
    intention_primary: intention,
    intentions_extra: z.array(intention).max(LIMITS.extraIntentions),
    seeking_genders: z
      .array(gender)
      .min(1, "Choose at least one.")
      .max(3),
    age_min: z.coerce.number().int().min(18, "Minimum age is 18.").max(99),
    age_max: z.coerce.number().int().min(18).max(99),
    appear_local: z.boolean(),
    appear_liberia: z.boolean(),
    appear_diaspora: z.boolean(),
  })
  .refine((v) => v.age_min <= v.age_max, {
    path: ["age_max"],
    message: "Maximum age must be the same as or higher than the minimum.",
  })
  .transform((v) => ({
    ...v,
    intentions_extra: v.intentions_extra.filter((i) => i !== v.intention_primary),
  }));

const optionalUuid = z
  .string()
  .transform((s) => (s === "" ? null : s))
  .pipe(z.union([z.null(), z.uuid()]));

export const locationSchema = z.object({
  country_id: z.uuid("Please choose your country."),
  region_id: optionalUuid,
  city_id: optionalUuid,
  community_id: optionalUuid,
  city_other: cleanText(LIMITS.cityOther, "City"),
});

export type AboutInput = z.infer<typeof aboutSchema>;
export type LookingForInput = z.infer<typeof lookingForSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
