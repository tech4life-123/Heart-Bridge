"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GENERIC_ERROR } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/features/profile/types";

export type CardState = { ok?: boolean; message?: string; error?: string; done?: "like" | "pass" | "save" | "unsave" };

const cardSchema = z.object({
  id: z.uuid(),
  intent: z.enum(["like", "pass", "save", "unsave"]),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/discover");
  return { supabase, user };
}

function refresh() {
  revalidatePath("/app/discover");
  revalidatePath("/app/saved");
  revalidatePath("/app/people/[id]", "page");
}

/** Like, pass, save or unsave one person. Every rule is enforced by the database (RLS + triggers). */
export async function cardAction(_prev: CardState, fd: FormData): Promise<CardState> {
  const parsed = cardSchema.safeParse({ id: fd.get("id"), intent: fd.get("intent") });
  if (!parsed.success) return { error: GENERIC_ERROR };
  const { id, intent } = parsed.data;
  const { supabase, user } = await requireUser();

  if (id === user.id) return { error: GENERIC_ERROR };

  if (intent === "like") {
    const { error } = await supabase.from("likes").insert({ liker_id: user.id, liked_id: id });
    if (error && error.code !== "23505") {
      if ((error.message ?? "").includes("daily_like_limit")) {
        return { error: "You have reached today's like limit. Come back tomorrow." };
      }
      if (error.code === "42501") return { error: "This profile isn't available any more." };
      logger.error("discovery.like_failed", { code: error.code });
      return { error: GENERIC_ERROR };
    }
    refresh();
    revalidatePath("/app/matches");
    // A mutual like becomes a match inside the database; send the person to the match screen.
    const { data: matchId } = await supabase.rpc("match_id_with", { p_other: id });
    if (matchId) redirect(`/app/matches/${matchId}`);
    return { ok: true, done: "like", message: "Like sent." };
  }

  if (intent === "pass") {
    const { error } = await supabase.from("passes").insert({ user_id: user.id, target_id: id });
    if (error && error.code !== "23505") {
      logger.error("discovery.pass_failed", { code: error.code });
      return { error: GENERIC_ERROR };
    }
    refresh();
    return { ok: true, done: "pass", message: "Passed." };
  }

  if (intent === "save") {
    const { error } = await supabase.from("saved_profiles").insert({ user_id: user.id, saved_id: id });
    if (error && error.code !== "23505") {
      if (error.code === "42501") return { error: "This profile isn't available any more." };
      logger.error("discovery.save_failed", { code: error.code });
      return { error: GENERIC_ERROR };
    }
    refresh();
    return { ok: true, done: "save", message: "Saved." };
  }

  const { error } = await supabase.from("saved_profiles").delete().eq("user_id", user.id).eq("saved_id", id);
  if (error) {
    logger.error("discovery.unsave_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  refresh();
  return { ok: true, done: "unsave", message: "Removed from saved." };
}

/** Saves the optional compatibility questionnaire. Unanswered questions are left as they were. */
export async function saveAnswersAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const { data: questions, error: qErr } = await supabase
    .from("compatibility_questions")
    .select("id, options")
    .eq("is_active", true);
  if (qErr || !questions) {
    logger.error("answers.questions_failed", { code: qErr?.code });
    return { error: GENERIC_ERROR };
  }

  const rows: { user_id: string; question_id: string; value: number }[] = [];
  for (const q of questions) {
    const raw = fd.get(`q_${q.id}`);
    if (typeof raw !== "string" || raw === "") continue;
    const value = Number(raw);
    const valid =
      Array.isArray(q.options) &&
      q.options.some((o) => o && typeof o === "object" && !Array.isArray(o) && o.value === value);
    if (!Number.isInteger(value) || !valid) return { error: "Please choose one of the listed answers." };
    rows.push({ user_id: user.id, question_id: q.id, value });
  }
  if (rows.length === 0) return { error: "Choose at least one answer, or go back." };

  // Update only `value` for existing answers; insert the rest (column grants allow exactly this).
  const { data: existing } = await supabase
    .from("compatibility_answers")
    .select("question_id")
    .eq("user_id", user.id);
  const have = new Set((existing ?? []).map((e) => e.question_id));

  const inserts = rows.filter((r) => !have.has(r.question_id));
  const updates = rows.filter((r) => have.has(r.question_id));

  if (inserts.length > 0) {
    const { error } = await supabase.from("compatibility_answers").insert(inserts);
    if (error) {
      logger.error("answers.insert_failed", { code: error.code });
      return { error: GENERIC_ERROR };
    }
  }
  for (const u of updates) {
    const { error } = await supabase
      .from("compatibility_answers")
      .update({ value: u.value })
      .eq("user_id", user.id)
      .eq("question_id", u.question_id);
    if (error) {
      logger.error("answers.update_failed", { code: error.code });
      return { error: GENERIC_ERROR };
    }
  }

  revalidatePath("/app", "layout");
  return { success: true, message: "Saved. Your recommendations will use your answers." };
}
