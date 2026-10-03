"use server";

import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

/** Permanently deletes the signed-in person's account (photos first, then the account itself). */
export async function deleteAccountAction(fd: FormData): Promise<void> {
  if (fd.get("confirm") !== "DELETE") redirect("/app/profile/delete?error=failed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: photos } = await supabase.from("profile_photos").select("storage_path").eq("user_id", user.id);
  const paths = (photos ?? []).map((p) => p.storage_path);

  // Ask the database first: it refuses while a safety review is open, before anything is removed.
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.code === "23514") redirect("/app/profile/delete?error=review");
    logger.error("account.delete_failed", { code: error.code });
    redirect("/app/profile/delete?error=failed");
  }

  // The account is gone; remove the image files (best effort - they are private and unreachable anyway).
  if (paths.length > 0) {
    const { error: sErr } = await supabase.storage.from("profile-photos").remove(paths);
    if (sErr) logger.error("account.photo_cleanup_failed", { message: sErr.message });
  }
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
