import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { requireOnboarded } from "@/features/discovery/context";
import { loadChat } from "@/features/matching/queries";

export const metadata: Metadata = { title: "It's a Match!" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, bundle } = await requireOnboarded(`/app/matches/${id}`);
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;

  const chat = await loadChat(supabase, id);
  if (!chat) notFound();
  await supabase.rpc("mark_match_seen", { p_match_id: id });

  return (
    <div className="space-y-6 py-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-gold">It&apos;s a Match! ❤️</h1>
      <p className="text-muted">You and {chat.firstName} liked each other.</p>
      {chat.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={chat.photoUrl}
          alt={`${chat.firstName}'s photo`}
          width={320}
          height={320}
          className="mx-auto size-56 rounded-full border-4 border-gold object-cover"
        />
      ) : (
        <div className="mx-auto flex size-56 items-center justify-center rounded-full border-4 border-gold bg-surface-2 text-5xl font-bold">
          {chat.firstName[0]}
        </div>
      )}
      <p className="text-2xl font-bold">
        {chat.firstName}
        <span className="font-medium text-muted">, {chat.age}</span>
      </p>
      <div className="mx-auto flex max-w-xs flex-col gap-3">
        <Link href={`/app/messages/${id}`} className={buttonStyles.primary}>
          Send a message
        </Link>
        <Link href="/app/discover" className={buttonStyles.secondary}>
          Keep exploring
        </Link>
      </div>
    </div>
  );
}
