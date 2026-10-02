"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Button";
import { requestPasswordResetAction } from "../actions";
import { initialAuthState } from "../types";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initialAuthState);

  if (state.success) return <Alert tone="success">{state.message}</Alert>;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        error={state.fieldErrors?.email}
      />
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
