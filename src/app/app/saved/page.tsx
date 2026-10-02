import Link from "next/link";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { PersonSummary } from "@/features/discovery/components/PersonSummary";
import { requireOnboarded } from "@/features/discovery/context";
import { attachPhotoUrls, loadPeople, loadSavedIds } from "@/features/discovery/queries";
import { getInterests } from "@/features/profile/queries";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const { supabase, user, bundle } = await requireOnboarded("/app/saved");
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;

  const ids = await loadSavedIds(supabase, user.id);
  const [found, interests] = await Promise.all([loadPeople(supabase, bundle, ids), getInterests(supabase)]);
  // Keep the order they were saved in; anyone who is no longer visible is simply left out.
  const order = new Map(ids.map((id, i) => [id, i]));
  const sorted = [...found].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const people = await attachPhotoUrls(supabase, sorted, "first");
  const labels = new Map(interests.map((i) => [i.id, i.label]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Saved</h1>
        <p className="mt-1 text-muted">People you want to come back to. Only you can see this list.</p>
      </div>

      {people.length === 0 ? (
        <div className="space-y-3 rounded-3xl border border-line bg-surface p-6 text-center">
          <p className="text-muted">You have not saved anyone yet. Tap Save on someone you would like to think about.</p>
          <Link href="/app/discover" className={buttonStyles.primary}>
            Find people
          </Link>
        </div>
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
