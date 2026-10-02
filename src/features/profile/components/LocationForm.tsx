"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { saveLocationAction } from "../actions";
import { LIMITS } from "../constants";
import type { LocationOption } from "../queries";
import { initialFormState, valueOf } from "../types";
import { StepFooter } from "./StepFooter";

export type LocationDefaults = {
  country_id: string | null;
  region_id: string | null;
  city_id: string | null;
  community_id: string | null;
  city_other: string | null;
};

export function LocationForm({
  locations,
  defaults,
  mode,
}: {
  locations: LocationOption[];
  defaults: LocationDefaults;
  mode: "onboarding" | "edit";
}) {
  const [state, action] = useActionState(saveLocationAction, initialFormState);
  const fe = state.fieldErrors ?? {};

  const countries = locations.filter((l) => l.kind === "country");
  const liberia = countries.find((c) => c.iso_code === "LR");
  const [country, setCountry] = useState(valueOf(state, "country_id", defaults.country_id ?? liberia?.id ?? ""));
  const [region, setRegion] = useState(valueOf(state, "region_id", defaults.region_id ?? ""));
  const [city, setCity] = useState(valueOf(state, "city_id", defaults.city_id ?? ""));
  const [community, setCommunity] = useState(valueOf(state, "community_id", defaults.community_id ?? ""));

  const children = (parent: string, kind: LocationOption["kind"]) =>
    locations.filter((l) => l.parent_id === parent && l.kind === kind);
  const isLiberia = !!country && country === liberia?.id;
  const regions = children(country, "region");
  const cities = children(region, "city");
  const communities = children(city, "community");

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="mode" value={mode} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <p className="text-sm text-muted">
        Others only see your town and county (for example “Paynesville, Montserrado”), never your address.
      </p>

      <Select
        name="country_id"
        label="Country"
        value={country}
        onChange={(e) => { setCountry(e.target.value); setRegion(""); setCity(""); setCommunity(""); }}
        error={fe.country_id}
      >
        <option value="">Choose your country</option>
        {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>

      {isLiberia ? (
        <>
          <Select
            name="region_id"
            label="County"
            value={region}
            onChange={(e) => { setRegion(e.target.value); setCity(""); setCommunity(""); }}
            error={fe.region_id}
          >
            <option value="">Choose your county</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select
            name="city_id"
            label="City or town"
            value={city}
            disabled={!region}
            onChange={(e) => { setCity(e.target.value); setCommunity(""); }}
            error={fe.city_id}
          >
            <option value="">{region ? "Choose your city or town" : "Choose a county first"}</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {communities.length > 0 && (
            <Select
              name="community_id"
              label="Community or neighbourhood (optional)"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              error={fe.community_id}
            >
              <option value="">Not listed / prefer not to say</option>
              {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </>
      ) : (
        country && (
          <Field
            name="city_other"
            label="City or town (optional)"
            maxLength={LIMITS.cityOther}
            defaultValue={valueOf(state, "city_other", defaults.city_other ?? "")}
            error={fe.city_other}
            autoComplete="address-level2"
          />
        )
      )}

      <StepFooter mode={mode} stepNumber={5} />
    </form>
  );
}
