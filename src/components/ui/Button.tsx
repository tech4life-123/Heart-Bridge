"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

import { buttonStyles, type ButtonVariant } from "./button-styles";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
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
