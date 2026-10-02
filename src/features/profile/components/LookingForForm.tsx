"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Choice } from "@/components/ui/Choice";
import { Field } from "@/components/ui/Field";
import { saveLookingForAction } from "../actions";
import { GENDERS, INTENTIONS } from "../constants";
import { checkedOf, initialFormState, valueOf, valuesOf } from "../types";
import { StepFooter } from "./StepFooter";

export type LookingDefaults = {
  intention_primary: string | null;
  intentions_extra: string[];
  seeking_genders: string[];
  age_min: number;
  age_max: number;
  appear_local: boolean;
  appear_liberia: boolean;
  appear_diaspora: boolean;
};

export function LookingForForm({ defaults, mode }: { defaults: LookingDefaults; mode: "onboarding" | "edit" }) {
  const [state, action] = useActionState(saveLookingForAction, initialFormState);
  const fe = state.fieldErrors ?? {};
  const primary = valueOf(state, "intention_primary", defaults.intention_primary ?? "");
  const extra = valuesOf(state, "intentions_extra", defaults.intentions_extra);
  const seeking = valuesOf(state, "seeking_genders", defaults.seeking_genders);

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="mode" value={mode} />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">My main goal</legend>
        <div className="grid gap-2">
          {INTENTIONS.map((i) => (
            <Choice key={i.value} type="radio" name="intention_primary" value={i.value} hint={i.hint} defaultChecked={primary === i.value}>
              {i.label}
            </Choice>
          ))}
        </div>
        {fe.intention_primary && <p role="alert" className="text-sm font-medium text-danger">{fe.intention_primary}</p>}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Also open to (optional)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {INTENTIONS.map((i) => (
            <Choice key={i.value} type="checkbox" name="intentions_extra" value={i.value} defaultChecked={extra.includes(i.value)}>
              {i.label}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">I would like to meet</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {GENDERS.map((g) => (
            <Choice key={g.value} type="checkbox" name="seeking_genders" value={g.value} defaultChecked={seeking.includes(g.value)}>
              {g.label === "Woman" ? "Women" : g.label === "Man" ? "Men" : "Non-binary people"}
            </Choice>
          ))}
        </div>
        {fe.seeking_genders && <p role="alert" className="text-sm font-medium text-danger">{fe.seeking_genders}</p>}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Age range</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field name="age_min" label="From" type="number" inputMode="numeric" min={18} max={99}
            defaultValue={valueOf(state, "age_min", String(defaults.age_min))} error={fe.age_min} />
          <Field name="age_max" label="To" type="number" inputMode="numeric" min={18} max={99}
            defaultValue={valueOf(state, "age_max", String(defaults.age_max))} error={fe.age_max} />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Where I appear</legend>
        <p className="text-sm text-muted">Choose who can find you. You can change this any time.</p>
        <div className="grid gap-2">
          <Choice type="checkbox" name="appear_local" defaultChecked={checkedOf(state, "appear_local", defaults.appear_local)} hint="People near you">Local</Choice>
          <Choice type="checkbox" name="appear_liberia" defaultChecked={checkedOf(state, "appear_liberia", defaults.appear_liberia)} hint="People across Liberia">Liberia-wide</Choice>
          <Choice type="checkbox" name="appear_diaspora" defaultChecked={checkedOf(state, "appear_diaspora", defaults.appear_diaspora)} hint="Liberians living abroad and around the world">Diaspora</Choice>
        </div>
      </fieldset>

      <StepFooter mode={mode} stepNumber={4} />
    </form>
  );
}
