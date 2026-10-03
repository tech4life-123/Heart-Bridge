export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4 py-6">
      <span className="sr-only">Loading</span>
      <div className="h-8 w-1/2 animate-pulse rounded-xl bg-surface-2" />
      <div className="h-64 animate-pulse rounded-3xl bg-surface-2" />
      <div className="h-24 animate-pulse rounded-3xl bg-surface-2" />
    </div>
  );
}
