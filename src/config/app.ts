/**
 * Static brand and product constants.
 * Business rules that the owner must be able to change WITHOUT a deploy
 * (launch mode, user limit, subscriptions) live in the `app_settings` table,
 * not here. See src/config/launch.ts.
 */
export const APP = {
  name: "HeartBridge",
  tagline: "Real People. True Connections.",
  description:
    "Connect with people in Liberia and around the world who are looking for meaningful relationships. HeartBridge is a safe, private, 18+ dating platform built for Liberia and the diaspora.",
  secondaryTagline: "Liberia & Beyond",
  minimumAge: 18,
} as const;
