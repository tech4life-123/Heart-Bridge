import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"select">, "id" | "name"> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
};

export function Select({ name, label, error, hint, className = "", children, ...props }: Props) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-fg">
        {label}
      </label>
      <select
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`min-h-11 w-full rounded-xl border-2 bg-surface-2 px-3 text-base text-fg ${
          error ? "border-danger" : "border-line focus:border-gold"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p id={hintId} className="text-sm text-muted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
