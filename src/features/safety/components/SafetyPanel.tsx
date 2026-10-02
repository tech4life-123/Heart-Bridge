"use client";

import { useActionState } from "react";
import { blockUserAction, reportUserAction, type ReportState } from "../actions";
import { REPORT_CATEGORIES } from "../constants";

/** Report and Block for one person. Used on profiles and inside conversations. */
export function SafetyPanel({
  targetId,
  name,
  matchId,
  back,
}: {
  targetId: string;
  name: string;
  matchId?: string;
  back: "discover" | "matches";
}) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportUserAction, {});

  return (
    <div className="space-y-3">
      <details className="rounded-2xl border border-line bg-surface-2 p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center font-semibold">Report {name}</summary>
        {state.ok ? (
          <p role="status" className="py-2 text-success">
            Thank you. Our team will review your report. {name} will not be told who reported them.
          </p>
        ) : (
          <form action={action} className="space-y-3 pt-2">
            <input type="hidden" name="id" value={targetId} />
            {matchId && <input type="hidden" name="matchId" value={matchId} />}
            <fieldset className="space-y-1">
              <legend className="mb-1 text-sm font-semibold">What is the problem?</legend>
              {REPORT_CATEGORIES.map((c) => (
                <label key={c.value} className="flex min-h-11 items-center gap-3">
                  <input type="radio" name="category" value={c.value} required className="size-5 accent-[var(--hb-gold)]" />
                  <span>{c.label}</span>
                </label>
              ))}
            </fieldset>
            <div className="space-y-1">
              <label htmlFor={`desc-${targetId}`} className="block text-sm font-semibold">
                Tell us more (optional)
              </label>
              <textarea
                id={`desc-${targetId}`}
                name="description"
                maxLength={1000}
                rows={3}
                className="w-full rounded-xl border-2 bg-surface px-3 py-2 text-base"
              />
            </div>
            {state.error && (
              <p role="alert" className="text-sm font-semibold text-danger">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 w-full rounded-full bg-gold px-4 font-semibold text-on-gold hover:bg-gold-dark disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send report"}
            </button>
          </form>
        )}
      </details>

      <details className="rounded-2xl border border-line bg-surface-2 p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center font-semibold">Block {name}</summary>
        <form action={blockUserAction} className="space-y-2 pt-2">
          <input type="hidden" name="id" value={targetId} />
          <input type="hidden" name="back" value={back} />
          <p className="text-sm text-muted">
            {name} will not be able to see your profile or message you, and you will not see them. You can unblock later in
            Profile &gt; Blocked people.
          </p>
          <button type="submit" className="min-h-11 w-full rounded-full border-2 border-danger px-4 font-semibold text-danger">
            Yes, block {name}
          </button>
        </form>
      </details>
    </div>
  );
}
