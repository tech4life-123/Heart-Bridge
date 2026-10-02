import Link from "next/link";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { requireOnboarded } from "@/features/discovery/context";
import { loadMatches } from "@/features/matching/queries";

export const metadata: Metadata = { title: "Matches" };

export default async function MatchesPage() {
  const { supabase, user, bundle } = await requireOnboarded("/app/matches");
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;
  const { items, failed } = await loadMatches(supabase, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Matches</h1>
        <p className="mt-1 text-muted">People who liked you back. Only matched people can message each other.</p>
      </div>

      {failed && <Alert tone="error">We couldn&apos;t load your matches. Please refresh the page.</Alert>}

      {!failed && items.length === 0 && (
        <div className="space-y-3 rounded-3xl border border-line bg-surface p-6 text-center">
          <p className="text-muted">No matches yet. When you and someone else like each other, they appear here.</p>
          <Link href="/app/discover" className={buttonStyles.primary}>
            Find people
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.matchId}>
            <Link
              href={m.isNew ? `/app/matches/${m.matchId}` : `/app/messages/${m.matchId}`}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 hover:border-gold"
            >
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl font-bold">
                  {m.firstName[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {m.firstName}
                  <span className="font-medium text-muted">, {m.age}</span>
                </p>
                <p className={`truncate ${m.unread > 0 ? "font-semibold text-fg" : "text-muted"}`}>
                  {m.isNew
                    ? "New match - say hello!"
                    : m.lastBody
                      ? `${m.lastSenderIsMe ? "You: " : ""}${m.lastBody}`
                      : "Start the conversation"}
                </p>
              </div>
              {(m.unread > 0 || m.isNew) && (
                <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-on-gold">
                  {m.isNew ? "New" : m.unread}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
