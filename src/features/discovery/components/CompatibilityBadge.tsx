import { TOTAL_FACTORS, type Compatibility } from "../compatibility";

/** "87% Compatible" with an honest, expandable explanation. Never claims to predict success. */
export function CompatibilityBadge({ compatibility, open = false }: { compatibility: Compatibility; open?: boolean }) {
  if (compatibility.score === null) return null;
  return (
    <details open={open} className="group rounded-2xl border border-line bg-surface-2 px-4">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3">
        <span>
          <span className="text-xl font-extrabold text-gold">{compatibility.score}%</span>{" "}
          <span className="font-semibold">Compatible</span>
        </span>
        <span className="text-sm text-muted group-open:hidden">Why?</span>
        <span className="hidden text-sm text-muted group-open:inline">Hide</span>
      </summary>
      <div className="space-y-2 pb-3">
        {compatibility.reasons.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {compatibility.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">We could not find strong overlaps yet. A conversation can tell you more.</p>
        )}
        <p className="text-xs text-muted">
          Based on {compatibility.comparedFactors} of {TOTAL_FACTORS} things we could compare. It is a guide to help you
          start a conversation, not a prediction of how a relationship will go.
        </p>
      </div>
    </details>
  );
}
