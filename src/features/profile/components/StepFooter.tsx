"use client";

import Link from "next/link";
import { SubmitButton } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { ONBOARDING_STEPS } from "../constants";

/** Back + submit controls shared by every step form. */
export function StepFooter({
  mode,
  stepNumber,
  submitLabel,
}: {
  mode: "onboarding" | "edit";
  stepNumber: number; // 1-based
  submitLabel?: string;
}) {
  const backHref =
    mode === "edit"
      ? "/app/profile"
      : stepNumber > 1
        ? `/app/onboarding?step=${stepNumber - 1}`
        : null;
  const last = stepNumber >= ONBOARDING_STEPS.length;
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      {backHref ? (
        <Link href={backHref} className={`${buttonStyles.secondary} sm:w-auto`}>
          {mode === "edit" ? "Cancel" : "Back"}
        </Link>
      ) : (
        <span />
      )}
      <SubmitButton className="sm:!w-auto sm:min-w-44" pendingText="Saving…">
        {submitLabel ?? (mode === "edit" ? "Save" : last ? "Finish" : "Continue")}
      </SubmitButton>
    </div>
  );
}
