"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { toUserMessage } from "@/lib/errors";
import { safeNextPath } from "@/lib/safe-redirect";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";
import type { AuthState } from "./types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function fieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    firstName: str(formData, "firstName"),
    email: str(formData, "email"),
    password: str(formData, "password"),
    dateOfBirth: str(formData, "dateOfBirth"),
    confirmAdult: str(formData, "confirmAdult"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const { firstName, email, password, dateOfBirth } = parsed.data;
  const supabase = await createClient();
  const site = getPublicEnv().NEXT_PUBLIC_SITE_URL;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${site}/auth/confirm?next=/app`,
      // Validated again by the database trigger (18+ rule); never trusted here alone.
      data: { first_name: firstName, date_of_birth: dateOfBirth },
    },
  });

  if (error) {
    logger.warn("auth.signup_failed", { code: error.code, status: error.status });
    return { error: toUserMessage(error) };
  }
  return {
    success: true,
    message:
      "Almost there! We sent a confirmation link to your email. Open it to activate your account.",
  };
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logger.warn("auth.signin_failed", { code: error.code, status: error.status });
    return { error: toUserMessage(error) };
  }

  redirect(safeNextPath(str(formData, "next")));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) logger.warn("auth.signout_failed", { code: error.code });
  redirect("/");
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse({ email: str(formData, "email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const site = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site}/auth/confirm?next=/reset-password`,
  });
  if (error) {
    logger.warn("auth.reset_request_failed", { code: error.code, status: error.status });
    if (error.status === 429) return { error: toUserMessage(error) };
  }
  // Same response whether or not the account exists (prevents account enumeration).
  return {
    success: true,
    message:
      "If an account exists for that email, a reset link is on its way. Check your inbox.",
  };
}

export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    logger.warn("auth.update_password_failed", { code: error.code, status: error.status });
    return { error: toUserMessage(error) };
  }
  redirect("/app");
}
