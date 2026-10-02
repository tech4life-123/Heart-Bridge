import { redirect } from "next/navigation";
import { getProfileBundle } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared guard for discovery screens: verified session, own profile loaded, onboarding finished.
 * (Defence in depth: the proxy and /app layout already require a session.)
 */
export async function requireOnboarded(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const bundle = await getProfileBundle(supabase, user.id);
  if (!bundle) return { supabase, user, bundle: null } as const;
  if (!bundle.profile.onboarding_completed_at) {
    redirect(`/app/onboarding?step=${Math.min(bundle.profile.onboarding_step + 1, 6)}`);
  }
  return { supabase, user, bundle } as const;
}
