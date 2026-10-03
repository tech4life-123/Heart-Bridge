"use client";

import { useActionState } from "react";
import {
  saveNotificationSettingsAction,
  type NotificationState,
} from "./actions";

export function NotificationForm({
  matches,
  messages,
}: {
  matches: boolean;
  messages: boolean;
}) {
  const [state, action, pending] = useActionState<NotificationState, FormData>(
    saveNotificationSettingsAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          name="matches"
          defaultChecked={matches}
          className="mt-1 size-5"
        />
        <span>
          <span className="block font-semibold">New matches</span>
          <span className="text-sm text-muted">
            Email me when I get a new match.
          </span>
        </span>
      </label>
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          name="messages"
          defaultChecked={messages}
          className="mt-1 size-5"
        />
        <span>
          <span className="block font-semibold">New messages</span>
          <span className="text-sm text-muted">
            Email me if I have an unread message. At most one email per chat
            until I read it. The email never shows the message.
          </span>
        </span>
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-green-400">
          Saved.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-xl bg-gold px-5 font-bold text-black disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
