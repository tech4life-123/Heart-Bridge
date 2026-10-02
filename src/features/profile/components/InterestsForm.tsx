"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Choice } from "@/components/ui/Choice";
import { saveInterestsAction } from "../actions";
import { LIMITS } from "../constants";
import type { InterestOption } from "../queries";
import { initialFormState, valuesOf } from "../types";
import { StepFooter } from "./StepFooter";

export function InterestsForm({
  interests,
  selected,
  mode,
}: {
  interests: InterestOption[];
  selected: string[];
  mode: "onboarding" | "edit";
}) {
  const [state, action] = useActionState(saveInterestsAction, initialFormState);
  const initial = valuesOf(state, "interests", selected);
  const [chosen, setChosen] = useState<string[]>(initial);
  const atLimit = chosen.length >= LIMITS.interests;

  const byCategory = new Map<string, InterestOption[]>();
  for (const i of interests) byCategory.set(i.category, [...(byCategory.get(i.category) ?? []), i]);

  return (
    <form
      action={action}
      className="space-y-6"
      onChange={(e) => {
        const fd = new FormData(e.currentTarget);
        setChosen(fd.getAll("interests").map(String));
      }}
    >
      <input type="hidden" name="mode" value={mode} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <p aria-live="polite" className="text-sm text-muted">
        {chosen.length} of {LIMITS.interests} chosen. Pick what you genuinely enjoy; it helps people start conversations.
      </p>
      {[...byCategory.entries()].map(([category, items]) => (
        <fieldset key={category} className="space-y-2">
          <legend className="text-sm font-semibold">{category}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((i) => {
              const isOn = chosen.includes(i.id);
              return (
                <Choice
                  key={i.id}
                  type="checkbox"
                  name="interests"
                  value={i.id}
                  defaultChecked={initial.includes(i.id)}
                  disabled={atLimit && !isOn}
                >
                  {i.label}
                </Choice>
              );
            })}
          </div>
        </fieldset>
      ))}
      <StepFooter mode={mode} stepNumber={3} />
    </form>
  );
}
