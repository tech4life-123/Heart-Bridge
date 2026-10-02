"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Button";
import { updatePasswordAction } from "../actions";
import { initialAuthState } from "../types";

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialAuthState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={errors.password}
      />
      <Field
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
      />
      <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}
