export type FormState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of submitted values so a failed submit never wipes what the user typed. */
  values?: Record<string, string | string[]>;
};

export const initialFormState: FormState = {};

export function valueOf(state: FormState, key: string, fallback: string): string {
  const v = state.values?.[key];
  if (state.values) return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
  return fallback;
}

export function valuesOf(state: FormState, key: string, fallback: string[]): string[] {
  if (!state.values) return fallback;
  const v = state.values[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

export function checkedOf(state: FormState, key: string, fallback: boolean): boolean {
  return state.values ? state.values[key] !== undefined : fallback;
}
