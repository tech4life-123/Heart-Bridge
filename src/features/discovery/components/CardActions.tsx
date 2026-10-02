"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cardAction, type CardState } from "../actions";

function ActionButton({
  intent,
  label,
  className,
  ariaLabel,
}: {
  intent: "like" | "pass" | "save" | "unsave";
  label: string;
  className: string;
  ariaLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      aria-label={ariaLabel}
      className={`inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full px-2 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}

/**
 * Like / Pass / Save as obvious buttons (never swipe-only). The database enforces every rule;
 * this component only shows the outcome.
 */
export function CardActions({
  id,
  firstName,
  isLiked,
  isSaved,
}: {
  id: string;
  firstName: string;
  isLiked: boolean;
  isSaved: boolean;
}) {
  const [state, action] = useActionState<CardState, FormData>(cardAction, {});
  const liked = isLiked || state.done === "like";
  const saved = state.done === "save" ? true : state.done === "unsave" ? false : isSaved;

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-3 gap-2">
        <ActionButton
          intent="pass"
          label="✕ Pass"
          ariaLabel={`Pass on ${firstName}`}
          className="border-2 border-line text-fg hover:border-fg"
        />
        {saved ? (
          <ActionButton
            intent="unsave"
            label="★ Saved"
            ariaLabel={`Remove ${firstName} from saved`}
            className="border-2 border-gold text-gold hover:bg-gold/10"
          />
        ) : (
          <ActionButton
            intent="save"
            label="☆ Save"
            ariaLabel={`Save ${firstName} for later`}
            className="border-2 border-line text-fg hover:border-gold hover:text-gold"
          />
        )}
        {liked ? (
          <span
            aria-live="polite"
            className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-gold/20 px-2 text-[15px] font-semibold text-gold"
          >
            ❤ Liked
          </span>
        ) : (
          <ActionButton
            intent="like"
            label="❤ Like"
            ariaLabel={`Like ${firstName}`}
            className="bg-gold text-on-gold hover:bg-gold-dark"
          />
        )}
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="text-sm text-muted">
          {state.message}
        </p>
      )}
    </form>
  );
}
