import type { AiProvider, AiRequest } from "./provider";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 20_000;

/** Anthropic Messages API over plain fetch. Server-side only: the key never reaches the browser. */
export function createAnthropicProvider(
  apiKey: string,
  model: string,
): AiProvider {
  return {
    name: "anthropic",
    async complete(req: AiRequest) {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: req.maxTokens,
            system: req.system,
            messages: [{ role: "user", content: req.user }],
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = (await res.json()) as {
          content?: { type: string; text?: string }[];
        };
        const text = json.content?.find((c) => c.type === "text")?.text?.trim();
        return text ? text : null;
      } catch {
        return null;
      }
    },
  };
}
