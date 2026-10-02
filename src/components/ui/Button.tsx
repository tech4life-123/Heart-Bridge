"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const buttonStyles = {
  primary: `${base} bg-rose text-white hover:bg-rose-dark`,
  secondary: `${base} border-2 border-ink/20 bg-transparent text-ink hover:border-rose hover:text-rose`,
  ghost: `${base} text-ink hover:text-rose`,
} as const;

type Variant = keyof typeof buttonStyles;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={`${buttonStyles[variant]} ${className}`} {...props} />
  );
}

/** Submit button that disables itself and shows progress while a form action runs. */
export function SubmitButton({
  children,
  pendingText = "Please wait…",
  className = "",
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${buttonStyles.primary} w-full ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
