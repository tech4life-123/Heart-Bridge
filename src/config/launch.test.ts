import { describe, expect, it } from "vitest";
import { DEFAULT_LAUNCH_CONFIG, parseLaunchConfig } from "./launch";

describe("parseLaunchConfig", () => {
  it("reads owner-controlled settings", () => {
    const cfg = parseLaunchConfig([
      { key: "launch_mode", value: "PAID" },
      { key: "free_user_limit", value: 250 },
      { key: "subscriptions_enabled", value: true },
    ]);
    expect(cfg).toEqual({ launchMode: "PAID", freeUserLimit: 250, subscriptionsEnabled: true });
  });
  it("falls back to the safe free-launch default on missing rows", () => {
    expect(parseLaunchConfig([])).toEqual(DEFAULT_LAUNCH_CONFIG);
  });
  it("falls back on malformed values rather than trusting them", () => {
    const cfg = parseLaunchConfig([
      { key: "launch_mode", value: "WHATEVER" },
      { key: "free_user_limit", value: -5 },
      { key: "subscriptions_enabled", value: "yes" },
    ]);
    expect(cfg).toEqual(DEFAULT_LAUNCH_CONFIG);
  });
  it("never enables subscriptions by default", () => {
    expect(DEFAULT_LAUNCH_CONFIG.subscriptionsEnabled).toBe(false);
  });
});
