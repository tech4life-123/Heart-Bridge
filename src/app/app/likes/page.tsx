import Link from "next/link";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { PersonSummary } from "@/features/discovery/components/PersonSummary";
import { requireOnboarded } from "@/features/discovery/context";
import { attachPhotoUrls, loadPeople } from "@/features/discovery/queries";
import { getEntitlements } from "@/features/premium/queries";
import { getInterests } from "@/features/profile/queries";

export const metadata: Metadata = { title: "Who liked you" };

export default async function LikesPage() {
  const { supabase, bundle } = await requireOnboarded("/app/likes");
  if (!bundle)
    return (
      <Alert tone="error">
        We couldn&apos;t load your account. Please refresh the page.
      </Alert>
    );
  const ent = await getEntitlements(supabase);

  if (!ent.isPremium) {
    const { data: count } = await supabase.rpc("likes_received_count");
    const n = count ?? 0;
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Who liked you
        </h1>
        <div className="space-y-3 rounded-3xl border border-line bg-surface p-6 text-center">
          <p className="text-lg font-semibold">
            {n === 0
              ? "No new likes right now."
              : `${n >= 100 ? "100+" : n} ${n === 1 ? "person has" : "people have"} liked you.`}
          </p>
          <p className="text-muted">
            Premium shows you who they are. You can also keep discovering for
            free: if you like each other, it is a match.
          </p>
          <Link href="/app/premium" className={buttonStyles.primary}>
            See Premium
          </Link>
        </div>
      </div>
    );
  }

  const { data: cards } = await supabase.rpc("likes_received", { p_limit: 30 });
  const ids = (cards ?? []).flatMap((c) => (c.id ? [c.id] : []));
  const [found, interests] = await Promise.all([
    loadPeople(supabase, bundle, ids),
    getInterests(supabase),
  ]);
  const order = new Map(ids.map((id, i) => [id, i]));
  const people = await attachPhotoUrls(
    supabase,
    [...found].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
    "first",
  );
  const labels = new Map(interests.map((i) => [i.id, i.label]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Who liked you
        </h1>
        <p className="mt-1 text-muted">
          Like someone back and it becomes a match.
        </p>
      </div>
      {people.length === 0 ? (
        <p className="rounded-3xl border border-line bg-surface p-6 text-center text-muted">
          No new likes right now.
        </p>
      ) : (
        <div className="space-y-6">
          {people.map((p) => (
            <PersonSummary key={p.id} person={p} interestLabels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}
