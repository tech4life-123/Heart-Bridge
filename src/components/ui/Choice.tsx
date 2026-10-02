import type { ReactNode } from "react";

/** Pill-style checkbox/radio. The real input stays in the DOM for keyboards and screen readers. */
export function Choice({
  type,
  name,
  value,
  defaultChecked,
  disabled,
  children,
  hint,
}: {
  type: "checkbox" | "radio";
  name: string;
  value?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="group relative block cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="peer sr-only"
      />
      <span className="flex min-h-11 flex-col justify-center rounded-2xl border-2 border-line bg-surface-2 px-4 py-2 text-base font-medium text-fg transition-colors hover:border-gold/60 peer-checked:border-gold peer-checked:bg-gold/15 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={`flex size-5 shrink-0 items-center justify-center border-2 border-line text-xs text-transparent group-has-[:checked]:border-gold group-has-[:checked]:bg-gold group-has-[:checked]:text-on-gold ${
              type === "radio" ? "rounded-full" : "rounded-md"
            }`}
          >
            ✓
          </span>
          {children}
        </span>
        {hint && <span className="mt-0.5 pl-7 text-sm font-normal text-muted">{hint}</span>}
      </span>
    </label>
  );
}
