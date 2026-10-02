import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { requireOnboarded } from "@/features/discovery/context";
import { hideConversationAction } from "@/features/matching/actions";
import { SafetyPanel } from "@/features/safety/components/SafetyPanel";
import { ChatRoom } from "@/features/matching/components/ChatRoom";
import { loadChat } from "@/features/matching/queries";

export const metadata: Metadata = { title: "Chat" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, user, bundle } = await requireOnboarded(`/app/messages/${id}`);
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;

  const chat = await loadChat(supabase, id);
  if (!chat) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/app/matches" aria-label="Back to matches" className="flex min-h-11 min-w-11 items-center text-2xl text-muted hover:text-fg">
          ←
        </Link>
        {chat.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={chat.photoUrl} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-surface-2 font-bold">{chat.firstName[0]}</div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">
            {chat.firstName}
            <span className="font-medium text-muted">, {chat.age}</span>
          </h1>
        </div>
        <details className="relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full px-3 text-sm font-semibold text-muted hover:text-fg">
            Options
          </summary>
          <div className="absolute right-0 z-10 mt-1 w-72 max-w-[85vw] space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-lg">
            <SafetyPanel targetId={chat.otherId} name={chat.firstName} matchId={id} back="matches" />
            <form action={hideConversationAction} className="space-y-2">
              <input type="hidden" name="matchId" value={id} />
              <p className="text-sm text-muted">
                Deleting removes the conversation from your view only. {chat.firstName} keeps theirs. New messages bring it back.
              </p>
              <button type="submit" className="min-h-11 w-full rounded-full border-2 border-line px-4 font-semibold hover:border-danger hover:text-danger">
                Delete conversation
              </button>
            </form>
          </div>
        </details>
      </div>

      <ChatRoom
        matchId={id}
        meId={user.id}
        firstName={chat.firstName}
        initialMessages={chat.messages}
        otherLastReadAt={chat.otherLastReadAt}
        canMessage={chat.canMessage}
      />
    </div>
  );
}
