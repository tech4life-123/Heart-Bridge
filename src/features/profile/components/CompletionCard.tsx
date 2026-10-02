import Link from "next/link";
import { completionTasks, type CompletionInput } from "../completion";

export function CompletionCard({ input, compact = false }: { input: CompletionInput; compact?: boolean }) {
  const tasks = completionTasks(input);
  const percent = tasks.reduce((s, t) => s + (t.done ? t.points : 0), 0);
  const todo = tasks.filter((t) => !t.done);
  return (
    <section aria-labelledby="completion-title" className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="completion-title" className="text-lg font-bold">Profile completion</h2>
        <p className="text-2xl font-extrabold text-gold">{percent}%</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
      {todo.length === 0 ? (
        <p className="mt-4 text-muted">Your profile is complete. Well done.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted">
            {compact ? "Next:" : "A complete profile makes a better first impression. Next steps:"}
          </p>
          <ul className="mt-2 space-y-1">
            {(compact ? todo.slice(0, 3) : todo).map((t) => (
              <li key={t.key}>
                <Link
                  href={`/app/profile/edit/${t.section}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2"
                >
                  <span>{t.label}</span>
                  <span className="shrink-0 text-sm font-semibold text-gold">+{t.points}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
