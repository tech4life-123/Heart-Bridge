import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getEntitlements(supabase: SupabaseClient<Database>) {
  const { data } = await supabase.rpc("my_entitlements");
  const e = data?.[0];
  return {
    isPremium: e?.is_premium ?? false,
    premiumUntil: e?.premium_until ?? null,
  };
}
