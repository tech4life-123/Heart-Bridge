"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GENERIC_ERROR } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { REPORT_CATEGORIES } from "./constants";

export type ReportState = { ok?: boolean; error?: string };

const reportSchema = z.object({
  id: z.uuid(),
  category: z.enum(REPORT_CATEGORIES.map((c) => c.value) as [string, ...string[]]),
  description: z.string().trim().max(1000).optional(),
  matchId: z.uuid().optional(),
});

async function requireUser(next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

/** Files a report. The reported person is never told who reported them. */
export async function reportUserAction(_prev: ReportState, fd: FormData): Promise<ReportState> {
  const parsed = reportSchema.safeParse({
    id: fd.get("id"),
    category: fd.get("category"),
    description: (fd.get("description") as string | null) || undefined,
    matchId: (fd.get("matchId") as string | null) || undefined,
  });
  if (!parsed.success) return { error: "Please choose a reason and keep the description under 1000 characters." };
  const { supabase } = await requireUser("/app");

  const { error } = await supabase.rpc("report_user", {
    p_reported: parsed.data.id,
    p_category: parsed.data.category as never,
    p_description: parsed.data.description,
    p_match_id: parsed.data.matchId,
  });
  if (error) {
    if ((error.message ?? "").includes("rate_limited")) return { error: "You have sent several reports today. Please try again tomorrow." };
    if (error.code === "42501") return { error: "This person can't be reported from here." };
    logger.error("safety.report_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  return { ok: true };
}

/** Blocks a person: they disappear from discovery and matches, and can't message you. */
export async function blockUserAction(fd: FormData): Promise<void> {
  const id = z.uuid().safeParse(fd.get("id"));
  const back = fd.get("back") === "discover" ? "/app/discover" : "/app/matches";
  if (!id.success) redirect(back);
  const { supabase, user } = await requireUser(back);
  if (id.data === user.id) redirect(back);
  const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: id.data });
  if (error && error.code !== "23505") logger.error("safety.block_failed", { code: error.code });
  revalidatePath("/app", "layout");
  redirect(back);
}

export async function unblockUserAction(fd: FormData): Promise<void> {
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) redirect("/app/profile/blocked");
  const { supabase, user } = await requireUser("/app/profile/blocked");
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", id.data);
  if (error) logger.error("safety.unblock_failed", { code: error.code });
  revalidatePath("/app", "layout");
  redirect("/app/profile/blocked");
}
