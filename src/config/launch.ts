import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Launch configuration, controlled by the business owner via the
 * `app_settings` table (public rows only). Never hard-code these values
 * elsewhere in the app.
 */
const launchConfigSchema = z.object({
  launchMode: z.enum(["FREE", "PAID"]),
  freeUserLimit: z.number().int().nonnegative(),
  subscriptionsEnabled: z.boolean(),
});

export type LaunchConfig = z.infer<typeof launchConfigSchema>;

/** Safe fallback if settings cannot be read: free access, no paywall. */
export const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  launchMode: "FREE",
  freeUserLimit: 100,
  subscriptionsEnabled: false,
};

export function parseLaunchConfig(
  rows: { key: string; value: unknown }[],
): LaunchConfig {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const parsed = launchConfigSchema.safeParse({
    launchMode: byKey.get("launch_mode"),
    freeUserLimit: byKey.get("free_user_limit"),
    subscriptionsEnabled: byKey.get("subscriptions_enabled"),
  });
  return parsed.success ? parsed.data : DEFAULT_LAUNCH_CONFIG;
}

export async function getLaunchConfig(): Promise<LaunchConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["launch_mode", "free_user_limit", "subscriptions_enabled"]);
    if (error) throw error;
    return parseLaunchConfig(data ?? []);
  } catch (err) {
    logger.error("launch_config.read_failed", { err });
    return DEFAULT_LAUNCH_CONFIG;
  }
}
