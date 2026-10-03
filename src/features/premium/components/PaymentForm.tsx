"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { submitPaymentAction, type PaymentState } from "../actions";
import { PROVIDERS, type ProviderId } from "../providers";

export type WalletOption = {
  provider: ProviderId;
  wallet: string;
  accountName: string;
};

export function PaymentForm({
  options,
  price,
}: {
  options: WalletOption[];
  price: string;
}) {
  const [state, action, pending] = useActionState<PaymentState, FormData>(
    submitPaymentAction,
    {},
  );
  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-xl border-2 border-success/40 bg-success/10 px-4 py-3 font-medium text-success"
      >
        Thank you. We received your transaction ID and will check it against our
        wallet. Premium turns on as soon as it is confirmed.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">How did you pay?</legend>
        {options.map((o, i) => (
          <label
            key={o.provider}
            className="block rounded-2xl border-2 border-line p-4 has-[:checked]:border-gold"
          >
            <span className="flex min-h-8 items-center gap-3 font-semibold">
              <input
                type="radio"
                name="provider"
                value={o.provider}
                defaultChecked={i === 0}
                required
                className="size-5 accent-[var(--hb-gold)]"
              />
              {PROVIDERS[o.provider].label}
            </span>
            <ol className="mt-2 list-decimal space-y-1 pl-9 text-sm text-muted">
              {PROVIDERS[o.provider]
                .steps(o.wallet, o.accountName, price)
                .map((s) => (
                  <li key={s}>{s}</li>
                ))}
            </ol>
          </label>
        ))}
      </fieldset>
      <Field
        name="reference"
        label="Transaction ID"
        required
        minLength={6}
        maxLength={40}
        autoComplete="off"
        hint="From the confirmation message. Letters and numbers only."
      />
      <Field
        name="phone"
        label="Phone number you paid from"
        type="tel"
        required
        maxLength={20}
        autoComplete="tel"
        placeholder="+231…"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          name="amount"
          label="Amount you sent"
          inputMode="decimal"
          required
          defaultValue="2.00"
        />
        <div className="space-y-1.5">
          <label htmlFor="currency" className="block text-sm font-semibold">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue="USD"
            className="min-h-11 w-full rounded-xl border-2 border-line bg-surface-2 px-3 text-base"
          >
            <option value="USD">USD</option>
            <option value="LRD">LRD</option>
          </select>
        </div>
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 font-semibold text-on-gold hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "I have paid"}
      </button>
    </form>
  );
}
