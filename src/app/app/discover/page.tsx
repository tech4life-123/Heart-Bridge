import Link from "next/link";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { FilterForm } from "@/features/discovery/components/FilterForm";
import { PersonSummary } from "@/features/discovery/components/PersonSummary";
import { requireOnboarded } from "@/features/discovery/context";
import { activeFilterCount, PAGE_SIZE, parseFilters, parsePage } from "@/features/discovery/filters";
import { attachPhotoUrls, loadFeed } from "@/features/discovery/queries";
import { getInterests, getLocations } from "@/features/profile/queries";

export const metadata: Metadata = { title: "Discover" };

type SearchParams = Record<string, string | string[] | undefined>;

function pageHref(params: SearchParams, page: number): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "page" || v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) q.append(k, item);
  }
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `/app/discover?${s}` : "/app/discover";
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { supabase, bundle } = await requireOnboarded("/app/discover");
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;

  const filters = parseFilters(params);
  const page = parsePage(params);
  const filtered = activeFilterCount(filters) > 0;

  const [feed, locations, interests] = await Promise.all([
    loadFeed(supabase, bundle, filters),
    getLocations(supabase),
    getInterests(supabase),
  ]);

  const total = feed.people.length;
  const start = (page - 1) * PAGE_SIZE;
  const slice = feed.people.slice(start, start + PAGE_SIZE);
  const people = await attachPhotoUrls(supabase, slice, "first");
  const labels = new Map(interests.map((i) => [i.id, i.label]));
  const noPreferences = (bundle.preferences?.seeking_genders.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Recommended for you</h1>
        <p className="mt-1 text-muted">People who fit what you are looking for, best matches first.</p>
      </div>

      <FilterForm filters={filters} locations={locations} interests={interests} />

      {feed.failed && <Alert tone="error">We couldn&apos;t load recommendations. Please refresh the page.</Alert>}

      {noPreferences && (
        <Alert tone="info">
          Tell us who you would like to meet to see recommendations.{" "}
          <Link href="/app/profile/edit/looking" className="font-semibold text-gold underline">
            Set my preferences
          </Link>
        </Alert>
      )}

      {!feed.failed && !noPreferences && total === 0 && (
        <div className="space-y-3 rounded-3xl border border-line bg-surface p-6 text-center">
          <h2 className="text-xl font-bold">{filtered ? "No one matches these filters" : "You have seen everyone for now"}</h2>
          <p className="text-muted">
            {filtered
              ? "Try widening your filters."
              : "HeartBridge is growing. New people join every day, so check back soon. You can also widen your preferences."}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            {filtered && (
              <Link href="/app/discover" className={buttonStyles.primary}>
                Clear filters
              </Link>
            )}
            <Link href="/app/profile/edit/looking" className={buttonStyles.secondary}>
              Change my preferences
            </Link>
          </div>
        </div>
      )}

      {people.length > 0 && (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            Showing {start + 1}-{start + people.length} of {total}
          </p>
          <div className="space-y-6">
            {people.map((p, idx) => (
              <PersonSummary key={p.id} person={p} interestLabels={labels} priority={idx === 0} />
            ))}
          </div>
          <nav aria-label="Pages" className="flex items-center justify-between gap-3">
            {page > 1 ? (
              <Link href={pageHref(params, page - 1)} className={buttonStyles.secondary}>
                ‹ Previous
              </Link>
            ) : (
              <span />
            )}
            {start + PAGE_SIZE < total && (
              <Link href={pageHref(params, page + 1)} className={buttonStyles.secondary}>
                Next ›
              </Link>
            )}
          </nav>
        </>
      )}

      <p className="text-center text-sm text-muted">
        Never send money to someone you have met online. <Link href="/safety" className="underline">Safety tips</Link>
      </p>
    </div>
  );
}
