"use client";

import { useActionState } from "react";
import type { ListState, TextState } from "../actions";

const btn =
  "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-line px-5 font-semibold hover:border-gold hover:text-gold disabled:opacity-60";

type TextAction = (p: TextState, fd: FormData) => Promise<TextState>;
type ListAction = (p: ListState, fd: FormData) => Promise<ListState>;

/** Button that fetches a short AI text. Always labelled as AI, never blocks anything else on the page. */
export function AiTextButton({
  action,
  fields,
  label,
  note,
}: {
  action: TextAction;
  fields: Record<string, string>;
  label: string;
  note?: string;
}) {
  const [state, run, pending] = useActionState<TextState, FormData>(action, {});
  return (
    <form action={run} className="space-y-2">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={pending} className={btn}>
        {pending ? "Thinking…" : label}
      </button>
      {state.text && (
        <p
          role="status"
          className="whitespace-pre-wrap rounded-2xl bg-surface-2 p-3"
        >
          {state.text}
          <span className="mt-2 block text-xs text-muted">
            {note ??
              "Written by AI from information on the profile. It may be wrong."}
          </span>
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-muted">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Opening-line suggestions the member can copy. Never sent automatically. */
export function StartersBox({
  action,
  matchId,
}: {
  action: ListAction;
  matchId: string;
}) {
  const [state, run, pending] = useActionState<ListState, FormData>(action, {});
  return (
    <form action={run} className="space-y-2">
      <input type="hidden" name="matchId" value={matchId} />
      <button type="submit" disabled={pending} className={btn}>
        {pending ? "Thinking…" : "Need an opener? Ask the AI"}
      </button>
      {state.items && (
        <div className="space-y-2">
          <ul className="space-y-2">
            {state.items.map((t) => (
              <li
                key={t}
                className="flex items-start justify-between gap-3 rounded-2xl bg-surface-2 p-3"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(t)}
                  className="min-h-11 shrink-0 text-sm font-semibold text-gold"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            Suggestions from AI. Change them so they sound like you.
          </p>
        </div>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-muted">
          {state.error}
        </p>
      )}
    </form>
  );
}
