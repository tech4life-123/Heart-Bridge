import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StaffRole = Database["public"]["Enums"]["admin_role"];

/**
 * Verified session + staff role, checked on the server for every admin page and action.
 * Non-staff get a plain 404 so the admin area is not even discoverable.
 * The database re-checks the role inside every function: this is only the first layer.
 */
export async function requireStaff(next: string, allowed: StaffRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const { data: role } = await supabase.rpc("staff_role");
  if (!role || !allowed.includes(role)) notFound();
  return { supabase, user, role };
}

export const MODERATION: StaffRole[] = ["moderator", "admin"];
export const PEOPLE: StaffRole[] = ["moderator", "admin", "support"];
export const SUPER: StaffRole[] = ["admin"];
export const FINANCE: StaffRole[] = ["finance", "admin"];
export const ANY_STAFF: StaffRole[] = [
  "moderator",
  "admin",
  "support",
  "finance",
];
