import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiProvider } from "@/lib/ai";
import { DATA_RULES, sanitizeForPrompt, wrapData } from "@/lib/ai/provider";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
export type AiFeature = "explain" | "starters" | "profile" | "safety";
export type AiResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const AI_OFF =
  "The AI assistant isn't switched on yet. Everything else works as normal.";
const BUSY =
  "The AI assistant is busy right now. Please try again in a moment.";
const LIMIT =
  "You have used today's AI help. It resets tomorrow, and Premium gives you more.";

/** Metering first (database-enforced daily allowance), then the provider call. */
async function run(
  supabase: Client,
  feature: AiFeature,
  system: string,
  user: string,
  maxTokens: number,
): Promise<AiResult<string>> {
  const ai = getAiProvider();
  if (!ai) return { ok: false, error: AI_OFF };
  const { data: allowed, error } = await supabase.rpc("ai_consume", {
    p_feature: feature,
  });
  if (error) return { ok: false, error: BUSY };
  if (!allowed) return { ok: false, error: LIMIT };
  const text = await ai.complete({
    system: `${system}\n\n${DATA_RULES}`,
    user,
    maxTokens,
  });
  return text ? { ok: true, value: text } : { ok: false, error: BUSY };
}

export async function explainCompatibility(
  supabase: Client,
  input: { reasons: string[]; sharedInterests: string[]; score: number | null },
): Promise<AiResult<string>> {
  const facts = [
    ...input.reasons,
    ...(input.sharedInterests.length
      ? [`Shared interests: ${input.sharedInterests.join(", ")}`]
      : []),
  ];
  if (facts.length === 0)
    return {
      ok: false,
      error:
        "There isn't enough in common to explain yet. Answering a few compatibility questions helps.",
    };
  return run(
    supabase,
    "explain",
    "You explain in two or three warm, honest sentences why two people on a dating app may suit each other, using ONLY the listed facts. " +
      "Do not promise outcomes and do not exaggerate. If the facts are thin, say so gently.",
    facts.map((f) => wrapData("fact", f, 200)).join("\n") +
      (input.score !== null
        ? `\nFit score out of 100: ${Math.round(input.score)}`
        : ""),
    220,
  );
}

export async function conversationStarters(
  supabase: Client,
  input: {
    theirBio: string | null;
    theirInterests: string[];
    shared: string[];
  },
): Promise<AiResult<string[]>> {
  const r = await run(
    supabase,
    "starters",
    "Suggest exactly 3 short, friendly, respectful opening messages (under 140 characters each) someone could send a new match. " +
      "Base them on the shared interests or the bio. No flattery about looks, no questions about money, and never ask for contact details or sensitive personal data. " +
      "Output one message per line, nothing else.",
    [
      input.theirBio ? wrapData("bio", input.theirBio, 400) : "",
      input.theirInterests.length
        ? wrapData("interests", input.theirInterests.join(", "), 300)
        : "",
      input.shared.length
        ? wrapData("shared", input.shared.join(", "), 300)
        : "",
    ]
      .filter(Boolean)
      .join("\n") || "<bio>No details were provided.</bio>",
    260,
  );
  if (!r.ok) return r;
  const lines = r.value
    .split("\n")
    .map((l) => l.replace(/^[\s\-*\d.)"]+|["\s]+$/g, "").trim())
    .filter((l) => l.length >= 3 && l.length <= 200)
    .slice(0, 3);
  return lines.length ? { ok: true, value: lines } : { ok: false, error: BUSY };
}

export async function improveBio(
  supabase: Client,
  bio: string,
): Promise<AiResult<string>> {
  return run(
    supabase,
    "profile",
    "You help someone improve their dating profile bio. Keep their voice, meaning and facts. Make it clearer, warmer and specific, at most 300 characters. " +
      "Never add facts, claims, contact details or money requests. Output only the improved bio.",
    wrapData("bio", bio, 500),
    200,
  );
}

/** Advisory only. A human moderator decides; this never takes action. */
export async function summarizeReport(
  supabase: Client,
  input: {
    category: string;
    description: string | null;
    messages: { who: "A" | "B"; body: string }[];
  },
): Promise<AiResult<string>> {
  const convo = input.messages
    .slice(-60)
    .map(
      (m) =>
        `<message from="${m.who}">${sanitizeForPrompt(m.body, 400)}</message>`,
    )
    .join("\n");
  return run(
    supabase,
    "safety",
    "You assist a human trust-and-safety moderator. Summarise the reported conversation in at most 5 short sentences: what happened, whether any message " +
      "asks for money, contact moves, threats or pressure, and what is unclear. State uncertainty. You are advisory only: never recommend a punishment " +
      "and never say a person is guilty.",
    `Report category: ${wrapData("category", input.category, 60)}\n${input.description ? wrapData("reporter_note", input.description, 500) + "\n" : ""}${convo}`,
    350,
  );
}
