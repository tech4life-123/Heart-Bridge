"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { sendMessageAction } from "../actions";
import type { ChatMessage } from "../queries";

const MAX = 2000;

function time(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function day(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export function ChatRoom({
  matchId,
  meId,
  firstName,
  initialMessages,
  otherLastReadAt,
  canMessage,
}: {
  matchId: string;
  meId: string;
  firstName: string;
  initialMessages: ChatMessage[];
  otherLastReadAt: string | null;
  canMessage: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherRead, setOtherRead] = useState<string | null>(otherLastReadAt);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSent = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null);

  const add = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  const markRead = useCallback(() => {
    const sb = supabaseRef.current;
    if (!sb) return;
    void sb.rpc("mark_conversation_read", { p_match_id: matchId }).then(() => {
      void channelRef.current?.send({ type: "broadcast", event: "read", payload: { at: new Date().toISOString() } });
    });
  }, [matchId]);

  useEffect(() => {
    const sb = createBrowserSupabase();
    supabaseRef.current = sb;
    let cancelled = false;
    let dbChannel: RealtimeChannel | null = null;

    void (async () => {
      await sb.realtime.setAuth();
      if (cancelled) return;

      dbChannel = sb
        .channel(`chat-${matchId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const m = payload.new as ChatMessage;
            add({ id: m.id, body: m.body, created_at: m.created_at, sender_id: m.sender_id });
            if (m.sender_id !== meId) {
              setTyping(false);
              markRead();
            }
          },
        )
        .subscribe();

      const ch = sb.channel(`typing:${matchId}`, { config: { private: true, broadcast: { self: false } } });
      ch.on("broadcast", { event: "typing" }, () => {
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 3000);
      });
      ch.on("broadcast", { event: "read" }, (p) => {
        const at = (p.payload as { at?: string } | null)?.at;
        if (at) setOtherRead(at);
      });
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") markRead();
      });
      channelRef.current = ch;
    })();

    return () => {
      cancelled = true;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (dbChannel) void sb.removeChannel(dbChannel);
      if (channelRef.current) void sb.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [matchId, meId, add, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  function onType(v: string) {
    setText(v);
    const now = Date.now();
    if (now - lastTypingSent.current > 2000 && v.length > 0) {
      lastTypingSent.current = now;
      void channelRef.current?.send({ type: "broadcast", event: "typing", payload: {} });
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await sendMessageAction(matchId, body);
    setSending(false);
    if (!res.ok) {
      setError(res.error);
      return; // keep the text so nothing is lost
    }
    setText("");
    add({ id: res.id, body, created_at: new Date().toISOString(), sender_id: meId });
  }

  const lastMine = [...messages].reverse().find((m) => m.sender_id === meId);
  const seen = lastMine && otherRead && new Date(otherRead) >= new Date(lastMine.created_at);

  return (
    <div className="flex flex-col">
      <div className="space-y-2 pb-4" role="log" aria-live="polite" aria-label={`Conversation with ${firstName}`}>
        {messages.length === 0 && (
          <p className="rounded-2xl bg-surface p-4 text-center text-muted">
            You matched! Say hello to {firstName}. Be kind and never share money or private details too early.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === meId;
          const newDay = i === 0 || day(messages[i - 1].created_at) !== day(m.created_at);
          return (
            <div key={m.id}>
              {newDay && (
                <p className="my-3 text-center text-xs font-semibold text-muted" suppressHydrationWarning>
                  {day(m.created_at)}
                </p>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 ${
                    mine ? "rounded-br-md bg-gold text-on-gold" : "rounded-bl-md border border-line bg-surface"
                  }`}
                >
                  <p>{m.body}</p>
                  <p className={`mt-1 text-[11px] ${mine ? "text-on-gold/70" : "text-muted"}`} suppressHydrationWarning>
                    {time(m.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {seen && <p className="text-right text-xs text-muted">Seen</p>}
        {typing && <p className="text-sm text-muted">{firstName} is typing…</p>}
        <div ref={bottomRef} />
      </div>

      {canMessage ? (
        <form
          onSubmit={send}
          className="sticky bottom-16 -mx-5 space-y-2 border-t border-line bg-canvas/95 px-5 py-3 backdrop-blur"
        >
          {error && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="message" className="sr-only">
              Message to {firstName}
            </label>
            <textarea
              id="message"
              value={text}
              maxLength={MAX}
              rows={1}
              onChange={(e) => onType(e.target.value)}
              placeholder="Write a message"
              className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border-2 bg-surface-2 px-4 py-3 text-base text-fg placeholder:text-muted/70"
            />
            <button
              type="submit"
              disabled={sending || text.trim().length === 0}
              className="min-h-12 rounded-full bg-gold px-5 font-semibold text-on-gold hover:bg-gold-dark disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-2xl bg-surface p-4 text-center text-muted">You can&apos;t send messages in this conversation.</p>
      )}
    </div>
  );
}
