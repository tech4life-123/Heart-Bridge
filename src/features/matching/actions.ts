"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GENERIC_ERROR } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { detectScamPattern } from "@/features/safety/scam";

export type SendResult = { ok: true; id: string; reminder?: boolean } | { ok: false; error: string };

const sendSchema = z.object({ matchId: z.uuid(), body: z.string().trim().min(1).max(2000) });

/** Sends one message. The database checks the match, blocks, account status and the rate limit. */
export async function sendMessageAction(matchId: string, body: string): Promise<SendResult> {
  const parsed = sendSchema.safeParse({ matchId, body });
  if (!parsed.success) return { ok: false, error: "Write a message up to 2000 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data, error } = await supabase.rpc("send_message", { p_match_id: parsed.data.matchId, p_body: parsed.data.body });
  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.includes("rate_limited")) return { ok: false, error: "You are sending messages very fast. Please wait a moment." };
    if (error?.code === "42501") return { ok: false, error: "You can't message this person any more." };
    logger.error("matching.send_failed", { code: error?.code });
    return { ok: false, error: GENERIC_ERROR };
  }

  // A neutral reminder only. Never accuse: just record a quiet flag for human review.
  const reason = detectScamPattern(parsed.data.body);
  if (reason) {
    const { error: flagErr } = await supabase.rpc("record_message_flag", { p_message_id: data, p_reason: reason });
    if (flagErr) logger.error("safety.flag_failed", { code: flagErr.code });
    return { ok: true, id: data, reminder: true };
  }
  return { ok: true, id: data };
}

/** Removes the conversation history from the signed-in person's own view only. */
export async function hideConversationAction(fd: FormData): Promise<void> {
  const id = z.uuid().safeParse(fd.get("matchId"));
  if (!id.success) redirect("/app/matches");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/matches");
  const { error } = await supabase.rpc("hide_conversation", { p_match_id: id.data });
  if (error) logger.error("matching.hide_failed", { code: error.code });
  revalidatePath("/app/matches");
  redirect("/app/matches");
}
