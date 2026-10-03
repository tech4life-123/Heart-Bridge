"use server";

import { redirect } from "next/navigation";
import { GENERIC_ERROR } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type NotificationState = { ok?: boolean; error?: string };

export async function saveNotificationSettingsAction(
  _prev: NotificationState,
  fd: FormData,
): Promise<NotificationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/profile/notifications");
  const { error } = await supabase.rpc("set_notification_settings", {
    p_matches: fd.get("matches") === "on",
    p_messages: fd.get("messages") === "on",
  });
  if (error) {
    logger.error("notifications.save_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  return { ok: true };
}
