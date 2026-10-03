"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GENERIC_ERROR } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type AppealState = { ok?: boolean; error?: string };

/** A suspended or banned member asks a human to look again. */
export async function submitAppealAction(
  _prev: AppealState,
  fd: FormData,
): Promise<AppealState> {
  const message = String(fd.get("message") ?? "").trim();
  if (message.length < 20 || message.length > 1000) {
    return {
      error:
        "Please explain in 20 to 1000 characters so our team can review it properly.",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");
  const { error } = await supabase.rpc("submit_appeal", { p_message: message });
  if (error) {
    const m = error.message ?? "";
    if (m.includes("appeal_open"))
      return { error: "You already have an appeal being reviewed." };
    if (m.includes("rate_limited"))
      return {
        error:
          "You have sent several appeals recently. Please wait before sending another.",
      };
    if (m.includes("not_restricted"))
      return { error: "Your account is not restricted." };
    if (m.includes("invalid_appeal"))
      return { error: "Please explain in 20 to 1000 characters." };
    logger.error("appeals.submit_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}
