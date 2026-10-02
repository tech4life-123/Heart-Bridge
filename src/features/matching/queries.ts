import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
const TTL = 3600;

export type MatchItem = {
  matchId: string;
  matchedAt: string;
  otherId: string;
  firstName: string;
  age: number;
  photoUrl: string | null;
  lastBody: string | null;
  lastAt: string | null;
  lastSenderIsMe: boolean;
  unread: number;
  isNew: boolean;
};

export type ChatMessage = { id: string; body: string; created_at: string; sender_id: string };

async function signMany(supabase: Client, paths: (string | null)[]): Promise<Map<string, string>> {
  const wanted = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (wanted.length === 0) return new Map();
  const { data, error } = await supabase.storage.from("profile-photos").createSignedUrls(wanted, TTL);
  if (error) {
    logger.error("matching.photo_sign_failed", { message: error.message });
    return new Map();
  }
  return new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
}

export async function loadMatches(supabase: Client, userId: string): Promise<{ items: MatchItem[]; failed: boolean }> {
  const { data, error } = await supabase.rpc("my_matches");
  if (error) {
    logger.error("matching.list_failed", { code: error.code });
    return { items: [], failed: true };
  }
  const rows = data ?? [];
  const urls = await signMany(supabase, rows.map((r) => r.photo_path));
  return {
    failed: false,
    items: rows.map((r) => ({
      matchId: r.match_id,
      matchedAt: r.matched_at,
      otherId: r.other_id,
      firstName: r.first_name,
      age: r.age,
      photoUrl: r.photo_path ? (urls.get(r.photo_path) ?? null) : null,
      lastBody: r.last_body,
      lastAt: r.last_at,
      lastSenderIsMe: r.last_sender === userId,
      unread: r.unread,
      isNew: r.is_new,
    })),
  };
}

export async function loadUnread(supabase: Client): Promise<{ unread: number; newMatches: number }> {
  const { data, error } = await supabase.rpc("unread_summary");
  if (error) logger.error("matching.unread_failed", { code: error.code });
  const row = data?.[0];
  return { unread: row?.unread_messages ?? 0, newMatches: row?.new_matches ?? 0 };
}

export async function loadChat(supabase: Client, matchId: string) {
  const { data: meta, error } = await supabase.rpc("chat_meta", { p_match_id: matchId });
  if (error) logger.error("matching.chat_meta_failed", { code: error.code });
  const m = meta?.[0];
  if (!m) return null;

  // Newest 100, shown oldest-first. RLS already hides anything the person deleted from their view.
  const { data: msgs, error: mErr } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (mErr) logger.error("matching.messages_failed", { code: mErr.code });

  const urls = await signMany(supabase, [m.photo_path]);
  return {
    otherId: m.other_id,
    firstName: m.first_name,
    age: m.age,
    photoUrl: m.photo_path ? (urls.get(m.photo_path) ?? null) : null,
    otherLastReadAt: m.other_last_read_at,
    canMessage: m.can_message,
    messages: ((msgs ?? []) as ChatMessage[]).reverse(),
  };
}
