import { z } from "zod";
import { APP } from "@/config/app";

const MAX_AGE = 120;

/**
 * True if the ISO date (YYYY-MM-DD) is a real date making the person at least
 * `minAge` and at most MAX_AGE years old on `today`. Invalid or future dates
 * return false. Uses UTC so results do not depend on server timezone.
 */
export function isAtLeastAge(
  isoDate: string,
  minAge: number = APP.minimumAge,
  today: Date = new Date(),
): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const dob = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    dob.getUTCFullYear() === year &&
    dob.getUTCMonth() === month - 1 &&
    dob.getUTCDate() === day;
  if (!isRealDate) return false;

  let age = today.getUTCFullYear() - year;
  const birthdayPassed =
    today.getUTCMonth() > month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() >= day);
  if (!birthdayPassed) age -= 1;
  return age >= minAge && age <= MAX_AGE;
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

// 72 bytes is the bcrypt limit used by Supabase Auth.
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

export const signUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Enter your first name.")
    .max(50, "Use 50 characters or fewer."),
  email,
  password,
  dateOfBirth: z
    .string()
    .refine(
      (v) => isAtLeastAge(v),
      `You must be at least ${APP.minimumAge} years old to join HeartBridge.`,
    ),
  confirmAdult: z.literal("on", {
    message: `Please confirm you are ${APP.minimumAge} or older.`,
  }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
