import { createAnthropicProvider } from "./anthropic";
import type { AiProvider } from "./provider";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/** The configured provider, or null when AI is switched off (no key). Never throws. */
export function getAiProvider(): AiProvider | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return createAnthropicProvider(key, process.env.AI_MODEL || DEFAULT_MODEL);
}

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Staff safety summaries are a separate switch: advisory only, off unless explicitly enabled. */
export function aiSafetyEnabled(): boolean {
  return aiAvailable() && process.env.AI_SAFETY_ENABLED === "true";
}
