"use server";

import { z } from "zod";
import { MODERATION, requireStaff } from "@/features/admin/guard";
import { loadPeople } from "@/features/discovery/queries";
import { requireOnboarded } from "@/features/discovery/context";
import { getInterests } from "@/features/profile/queries";
import { aiSafetyEnabled } from "@/lib/ai";
import {
  AI_OFF,
  conversationStarters,
  explainCompatibility,
  improveBio,
  summarizeReport,
} from "./service";

export type TextState = { text?: string; error?: string };
export type ListState = { items?: string[]; error?: string };

const id = z.uuid();

/** Friendly explanation of a match's compatibility. Rebuilt server-side from what this member may already see. */
export async function explainAction(
  _p: TextState,
  fd: FormData,
): Promise<TextState> {
  const pid = id.safeParse(fd.get("id"));
  if (!pid.success)
    return { error: "Something went wrong. Please refresh and try again." };
  const { supabase, bundle } = await requireOnboarded(
    `/app/people/${pid.data}`,
  );
  if (!bundle)
    return { error: "Something went wrong. Please refresh and try again." };
  const [found, interests] = await Promise.all([
    loadPeople(supabase, bundle, [pid.data]),
    getInterests(supabase),
  ]);
  const person = found[0];
  if (!person)
    return { error: "Something went wrong. Please refresh and try again." };
  const labels = new Map(interests.map((i) => [i.id, i.label]));
  const mine = new Set(bundle.interestIds);
  const shared = person.interestIds
    .filter((i) => mine.has(i))
    .flatMap((i) => (labels.get(i) ? [labels.get(i) as string] : []));
  const r = await explainCompatibility(supabase, {
    reasons: person.compatibility.reasons,
    sharedInterests: shared,
    score: person.compatibility.score,
  });
  return r.ok ? { text: r.value } : { error: r.error };
}

/** Three opening lines for a match. The member edits and sends them; nothing is sent automatically. */
export async function startersAction(
  _p: ListState,
  fd: FormData,
): Promise<ListState> {
  const mid = id.safeParse(fd.get("matchId"));
  if (!mid.success)
    return { error: "Something went wrong. Please refresh and try again." };
  const { supabase, bundle } = await requireOnboarded(
    `/app/messages/${mid.data}`,
  );
  if (!bundle)
    return { error: "Something went wrong. Please refresh and try again." };
  const { data: meta } = await supabase.rpc("chat_meta", {
    p_match_id: mid.data,
  });
  const otherId = meta?.[0]?.other_id;
  if (!otherId)
    return { error: "Something went wrong. Please refresh and try again." };
  const [found, interests] = await Promise.all([
    loadPeople(supabase, bundle, [otherId]),
    getInterests(supabase),
  ]);
  const person = found[0];
  if (!person)
    return { error: "Something went wrong. Please refresh and try again." };
  const labels = new Map(interests.map((i) => [i.id, i.label]));
  const mine = new Set(bundle.interestIds);
  const names = (ids: string[]) =>
    ids.flatMap((i) => (labels.get(i) ? [labels.get(i) as string] : []));
  const r = await conversationStarters(supabase, {
    theirBio: person.bio,
    theirInterests: names(person.interestIds),
    shared: names(person.interestIds.filter((i) => mine.has(i))),
  });
  return r.ok ? { items: r.value } : { error: r.error };
}

const bioSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(10, "Write a little more first (at least 10 characters).")
    .max(500),
});

/** Suggests a better bio. The member copies it into their profile themselves. */
export async function improveBioAction(
  _p: TextState,
  fd: FormData,
): Promise<TextState> {
  const parsed = bioSchema.safeParse({ bio: fd.get("bio") });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Please check your text.",
    };
  const { supabase } = await requireOnboarded("/app/profile/assistant");
  const r = await improveBio(supabase, parsed.data.bio);
  return r.ok ? { text: r.value } : { error: r.error };
}

/** Moderator-initiated, advisory summary of a reported conversation. Reading the messages is audited by the database. */
export async function summarizeReportAction(
  _p: TextState,
  fd: FormData,
): Promise<TextState> {
  const rid = id.safeParse(fd.get("reportId"));
  if (!rid.success) return { error: "Something went wrong." };
  if (!aiSafetyEnabled()) return { error: AI_OFF };
  const { supabase } = await requireStaff(
    `/admin/reports/${rid.data}`,
    MODERATION,
  );
  const [{ data: detail }, { data: msgs }] = await Promise.all([
    supabase.rpc("admin_report_detail", { p_id: rid.data }),
    supabase.rpc("admin_report_messages", { p_report_id: rid.data }),
  ]);
  const d = detail?.[0];
  if (!d || !msgs || msgs.length === 0)
    return { error: "There are no messages to summarise." };
  const order = new Map<string, "A" | "B">();
  const messages = msgs.map((m) => {
    if (!order.has(m.sender_id))
      order.set(m.sender_id, order.size === 0 ? "A" : "B");
    return { who: order.get(m.sender_id) ?? "B", body: m.body };
  });
  const r = await summarizeReport(supabase, {
    category: d.category,
    description: d.description,
    messages,
  });
  return r.ok ? { text: r.value } : { error: r.error };
}
