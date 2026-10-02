"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { finishOnboardingAction } from "../actions";
import { initialFormState } from "../types";

export function FinishForm({ stepNumber }: { stepNumber: number }) {
  const [state, action] = useActionState(finishOnboardingAction, initialFormState);
  return (
    <form action={action} className="space-y-4 pt-2">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/app/onboarding?step=${stepNumber - 1}`} className={buttonStyles.secondary}>
          Back
        </Link>
        <SubmitButton className="sm:!w-auto sm:min-w-44" pendingText="Finishing…">
          Finish
        </SubmitButton>
      </div>
    </form>
  );
}
