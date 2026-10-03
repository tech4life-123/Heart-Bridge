"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { GENERIC_ERROR } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { FEEDBACK_CATEGORIES } from "./constants";

export type FeedbackState = { ok?: boolean; error?: string };

const schema = z.object({
  category: z.enum(
    FEEDBACK_CATEGORIES.map((c) => c.value) as [string, ...string[]],
  ),
  message: z.string().trim().min(10).max(1000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.string().trim().max(100).optional(),
});

/** Sends feedback to the HeartBridge team. Only the member's own words and the page they were on are stored. */
export async function submitFeedbackAction(
  _prev: FeedbackState,
  fd: FormData,
): Promise<FeedbackState> {
  const parsed = schema.safeParse({
    category: fd.get("category"),
    message: fd.get("message"),
    rating: (fd.get("rating") as string | null) || undefined,
    page: ((fd.get("page") as string | null) || "").startsWith("/app")
      ? (fd.get("page") as string)
      : undefined,
  });
  if (!parsed.success)
    return {
      error:
        "Please choose a type and write at least 10 characters (up to 1000).",
    };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/feedback");
  const { error } = await supabase.rpc("submit_feedback", {
    p_category: parsed.data.category as "idea",
    p_message: parsed.data.message,
    p_rating: (parsed.data.rating ?? null) as unknown as number,
    p_page: (parsed.data.page ?? null) as unknown as string,
  });
  if (error) {
    if ((error.message ?? "").includes("rate_limited"))
      return {
        error:
          "You have sent several messages today. Please try again tomorrow.",
      };
    logger.error("feedback.submit_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  return { ok: true };
}
