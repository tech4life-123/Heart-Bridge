"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Choice } from "@/components/ui/Choice";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { saveAboutAction } from "../actions";
import { CHILDREN_OPTIONS, GENDERS, HABIT_OPTIONS, LANGUAGES, LIMITS } from "../constants";
import { initialFormState, valueOf, valuesOf } from "../types";
import { StepFooter } from "./StepFooter";

export type AboutDefaults = {
  gender: string | null;
  bio: string | null;
  occupation: string | null;
  education: string | null;
  languages: string[];
  smoking: string | null;
  drinking: string | null;
  children_preference: string | null;
  phone: string | null;
};

export function AboutForm({ defaults, mode }: { defaults: AboutDefaults; mode: "onboarding" | "edit" }) {
  const [state, action] = useActionState(saveAboutAction, initialFormState);
  const fe = state.fieldErrors ?? {};
  const gender = valueOf(state, "gender", defaults.gender ?? "");
  const languages = valuesOf(state, "languages", defaults.languages);

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="mode" value={mode} />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">I am a</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {GENDERS.map((g) => (
            <Choice key={g.value} type="radio" name="gender" value={g.value} defaultChecked={gender === g.value}>
              {g.label}
            </Choice>
          ))}
        </div>
        {fe.gender && <p role="alert" className="text-sm font-medium text-danger">{fe.gender}</p>}
      </fieldset>

      <Textarea
        name="bio"
        label="About me"
        maxLength={LIMITS.bio}
        defaultValue={valueOf(state, "bio", defaults.bio ?? "")}
        hint="A few honest lines about you and what matters to you."
        error={fe.bio}
        placeholder="I love music, church on Sundays and good conversation…"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="occupation" label="Occupation" maxLength={LIMITS.occupation}
          defaultValue={valueOf(state, "occupation", defaults.occupation ?? "")} error={fe.occupation} autoComplete="organization-title" />
        <Field name="education" label="Education" maxLength={LIMITS.education}
          defaultValue={valueOf(state, "education", defaults.education ?? "")} error={fe.education} hint="School, course or level" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Languages I speak</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((l) => (
            <Choice key={l} type="checkbox" name="languages" value={l} defaultChecked={languages.includes(l)}>
              {l}
            </Choice>
          ))}
        </div>
        {fe.languages && <p role="alert" className="text-sm font-medium text-danger">{fe.languages}</p>}
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-line p-4">
        <legend className="px-2 text-sm font-semibold">Lifestyle (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select name="children_preference" label="Children" defaultValue={valueOf(state, "children_preference", defaults.children_preference ?? "")}>
            <option value="">Not set</option>
            {CHILDREN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select name="smoking" label="Smoking" defaultValue={valueOf(state, "smoking", defaults.smoking ?? "")}>
            <option value="">Not set</option>
            {HABIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select name="drinking" label="Drinking" defaultValue={valueOf(state, "drinking", defaults.drinking ?? "")}>
            <option value="">Not set</option>
            {HABIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
      </fieldset>

      <Field
        name="phone"
        label="Phone number (optional, private)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={valueOf(state, "phone", defaults.phone ?? "")}
        error={fe.phone}
        hint="Never shown to other people. It is not verified, so no “verified” badge is given."
      />

      <StepFooter mode={mode} stepNumber={1} />
    </form>
  );
}
