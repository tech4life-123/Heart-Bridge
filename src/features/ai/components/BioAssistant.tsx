"use client";

import { useActionState } from "react";
import { improveBioAction, type TextState } from "../actions";

export function BioAssistant({ initialBio }: { initialBio: string }) {
  const [state, run, pending] = useActionState<TextState, FormData>(
    improveBioAction,
    {},
  );
  return (
    <form action={run} className="space-y-4">
      <label htmlFor="bio" className="block text-sm font-semibold">
        Your bio
      </label>
      <textarea
        id="bio"
        name="bio"
        defaultValue={initialBio}
        rows={5}
        maxLength={500}
        required
        className="w-full rounded-xl border-2 border-line bg-surface-2 px-3 py-2 text-base"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 font-semibold text-on-gold hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Thinking…" : "Suggest a better bio"}
      </button>
      {state.text && (
        <div role="status" className="space-y-2 rounded-2xl bg-surface-2 p-3">
          <p className="whitespace-pre-wrap">{state.text}</p>
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard?.writeText(state.text ?? "")
            }
            className="min-h-11 text-sm font-semibold text-gold"
          >
            Copy
          </button>
          <p className="text-xs text-muted">
            Written by AI. It does not change your profile: copy it and edit it
            yourself if you like it.
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
