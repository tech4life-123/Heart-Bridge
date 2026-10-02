/**
 * Static brand and product constants.
 * Business rules that the owner must be able to change WITHOUT a deploy
 * (launch mode, user limit, subscriptions) live in the `app_settings` table,
 * not here. See src/config/launch.ts.
 */
export const APP = {
  name: "HeartBridge",
  tagline: "Where Hearts Connect.",
  description:
    "HeartBridge is a safe, private dating platform for people looking for meaningful relationships. Built for Liberia, ready for Africa.",
  minimumAge: 18,
} as const;
