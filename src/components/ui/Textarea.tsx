"use client";

import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"textarea">, "id" | "name" | "maxLength"> & {
  name: string;
  label: string;
  maxLength: number;
  error?: string;
  hint?: string;
};

export function Textarea({ name, label, error, hint, maxLength, defaultValue, className = "", ...props }: Props) {
  const [len, setLen] = useState(String(defaultValue ?? "").length);
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-fg">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        maxLength={maxLength}
        defaultValue={defaultValue}
        onChange={(e) => setLen(e.target.value.length)}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`min-h-28 w-full rounded-xl border-2 bg-surface-2 px-4 py-3 text-base text-fg placeholder:text-muted/70 ${
          error ? "border-danger" : "border-line focus:border-gold"
        } ${className}`}
        {...props}
      />
      <div className="flex justify-between gap-4 text-sm text-muted">
        <span id={hintId}>{hint}</span>
        <span aria-live="polite">{len}/{maxLength}</span>
      </div>
      {error && <p id={errorId} role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
