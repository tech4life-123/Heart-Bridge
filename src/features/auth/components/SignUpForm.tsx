"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Button";
import { APP } from "@/config/app";
import { signUpAction } from "../actions";
import { initialAuthState } from "../types";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, initialAuthState);
  const errors = state.fieldErrors ?? {};

  if (state.success) {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field
        name="firstName"
        label="First name"
        autoComplete="given-name"
        required
        error={errors.firstName}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        error={errors.email}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={errors.password}
      />
      <Field
        name="dateOfBirth"
        label="Date of birth"
        type="date"
        autoComplete="bday"
        required
        hint="Only your age is ever shown to others."
        error={errors.dateOfBirth}
      />
      <div className="space-y-1.5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="confirmAdult"
            className="mt-1 size-5 shrink-0 accent-gold"
            aria-invalid={errors.confirmAdult ? true : undefined}
            aria-describedby={errors.confirmAdult ? "confirmAdult-error" : undefined}
          />
          <span>I confirm that I am {APP.minimumAge} years old or older.</span>
        </label>
        {errors.confirmAdult && (
          <p id="confirmAdult-error" role="alert" className="text-sm font-medium text-danger">
            {errors.confirmAdult}
          </p>
        )}
      </div>
      <SubmitButton pendingText="Creating account…">Join HeartBridge</SubmitButton>
    </form>
  );
}
