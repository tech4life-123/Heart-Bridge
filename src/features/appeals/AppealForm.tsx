"use client";

import { useActionState } from "react";
import { submitAppealAction, type AppealState } from "./actions";

export function AppealForm() {
  const [state, action, pending] = useActionState<AppealState, FormData>(
    submitAppealAction,
    {},
  );
  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-xl border-2 border-success/40 bg-success/10 px-4 py-3 font-medium text-success"
      >
        Thank you. A member of our team will review your appeal.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="message" className="block text-sm font-semibold">
        Tell us what happened (20 to 1000 characters)
      </label>
      <textarea
        id="message"
        name="message"
        required
        minLength={20}
        maxLength={1000}
        rows={5}
        className="w-full rounded-xl border-2 border-line bg-surface-2 px-3 py-2 text-base"
      />
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 font-semibold text-on-gold hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send appeal"}
      </button>
    </form>
  );
}
