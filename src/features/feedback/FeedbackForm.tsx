"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitFeedbackAction, type FeedbackState } from "./actions";
import { FEEDBACK_CATEGORIES } from "./constants";

export function FeedbackForm({ page }: { page?: string }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(
    submitFeedbackAction,
    {},
  );
  if (state.ok) {
    return (
      <div
        role="status"
        className="space-y-3 rounded-2xl border-2 border-success/40 bg-success/10 p-4"
      >
        <p className="font-medium text-success">
          Thank you! Our team reads every message.
        </p>
        <Link
          href="/app/profile"
          className="inline-flex min-h-11 items-center text-gold"
        >
          Back to my profile
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      {page && <input type="hidden" name="page" value={page} />}
      <fieldset className="space-y-1">
        <legend className="mb-1 text-sm font-semibold">
          What kind of feedback is it?
        </legend>
        {FEEDBACK_CATEGORIES.map((c, i) => (
          <label key={c.value} className="flex min-h-11 items-center gap-3">
            <input
              type="radio"
              name="category"
              value={c.value}
              required
              defaultChecked={i === 0}
              className="size-5 accent-[var(--hb-gold)]"
            />
            <span>{c.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-semibold">
          Your message (10 to 1000 characters)
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          className="w-full rounded-xl border-2 border-line bg-surface-2 px-3 py-2 text-base"
        />
      </div>
      <fieldset className="space-y-1">
        <legend className="mb-1 text-sm font-semibold">
          How are you finding HeartBridge? (optional)
        </legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border-2 border-line font-semibold has-[:checked]:border-gold has-[:checked]:text-gold"
            >
              <input type="radio" name="rating" value={n} className="sr-only" />
              {n}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted">1 is poor, 5 is great.</p>
      </fieldset>
      <p className="text-sm text-muted">
        This is not for emergencies or for reporting a person. To report
        someone, use <strong>Report</strong> on their profile or in the chat, so
        the safety team can act.
      </p>
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
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
