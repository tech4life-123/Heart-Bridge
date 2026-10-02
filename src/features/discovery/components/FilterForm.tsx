import Link from "next/link";
import { Choice } from "@/components/ui/Choice";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { buttonStyles } from "@/components/ui/button-styles";
import { CHILDREN_OPTIONS, GENDERS, HABIT_OPTIONS, INTENTIONS } from "@/features/profile/constants";
import type { InterestOption, LocationOption } from "@/features/profile/queries";
import { activeFilterCount, type Filters } from "../filters";

type Group = { label: string; options: { value: string; label: string }[] };

/** One "Where" list: countries, counties, cities and towns, then communities. No JavaScript needed. */
function placeGroups(locations: LocationOption[]): Group[] {
  const byId = new Map(locations.map((l) => [l.id, l]));
  const opt = (kind: string, l: LocationOption, label = l.name) => ({ value: `${kind}:${l.id}`, label });
  const countries = locations.filter((l) => l.kind === "country");
  const regions = locations.filter((l) => l.kind === "region");
  const cities = locations
    .filter((l) => l.kind === "city")
    .map((l) => ({ l, region: l.parent_id ? byId.get(l.parent_id)?.name : undefined }))
    .sort((a, b) => (a.region ?? "").localeCompare(b.region ?? "") || a.l.name.localeCompare(b.l.name));
  const communities = locations
    .filter((l) => l.kind === "community")
    .map((l) => ({ l, city: l.parent_id ? byId.get(l.parent_id)?.name : undefined }));
  return [
    { label: "Countries", options: countries.map((l) => opt("country", l)) },
    { label: "Counties", options: regions.map((l) => opt("region", l, `${l.name} County`)) },
    { label: "Cities and towns", options: cities.map(({ l, region }) => opt("city", l, region ? `${l.name}, ${region}` : l.name)) },
    { label: "Communities", options: communities.map(({ l, city }) => opt("community", l, city ? `${l.name}, ${city}` : l.name)) },
  ].filter((g) => g.options.length > 0);
}

/** Plain GET form so filters live in the URL: shareable, back-button friendly, works on slow connections. */
export function FilterForm({
  filters,
  locations,
  interests,
}: {
  filters: Filters;
  locations: LocationOption[];
  interests: InterestOption[];
}) {
  const count = activeFilterCount(filters);
  const groups = placeGroups(locations);
  const selectedPlace = filters.place ? `${filters.place.kind}:${filters.place.id}` : "";

  return (
    <details open={count > 0} className="group/filters rounded-3xl border border-line bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5">
        <span className="font-semibold">
          Filters{count > 0 && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-sm text-on-gold">{count}</span>}
        </span>
        <span aria-hidden className="text-gold transition-transform group-open/filters:rotate-90">›</span>
      </summary>

      <form method="get" action="/app/discover" className="space-y-6 border-t border-line p-5">
        <p className="text-sm text-muted">
          Your own preferences (ages and who you want to meet) always apply. Filters narrow them further.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field name="agemin" label="Age from" type="number" inputMode="numeric" min={18} max={99} defaultValue={filters.ageMin ?? ""} />
          <Field name="agemax" label="Age to" type="number" inputMode="numeric" min={18} max={99} defaultValue={filters.ageMax ?? ""} />
        </div>

        <Select name="place" label="Where" defaultValue={selectedPlace}>
          <option value="">Anywhere I can see</option>
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Gender</legend>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <Choice key={g.value} type="checkbox" name="gender" value={g.value} defaultChecked={filters.genders.includes(g.value)}>
                {g.label}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Looking for</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTENTIONS.map((i) => (
              <Choice key={i.value} type="checkbox" name="intention" value={i.value} defaultChecked={filters.intentions.includes(i.value)}>
                {i.label}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Children</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHILDREN_OPTIONS.filter((c) => c.value !== "prefer_not_to_say").map((c) => (
              <Choice key={c.value} type="checkbox" name="children" value={c.value} defaultChecked={filters.children.includes(c.value)}>
                {c.label}
              </Choice>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          {(["smoking", "drinking"] as const).map((key) => (
            <fieldset key={key} className="space-y-2">
              <legend className="text-sm font-semibold capitalize">{key}</legend>
              <div className="flex flex-wrap gap-2">
                {HABIT_OPTIONS.filter((h) => h.value !== "prefer_not_to_say").map((h) => (
                  <Choice key={h.value} type="checkbox" name={key} value={h.value} defaultChecked={filters[key].includes(h.value)}>
                    {h.label}
                  </Choice>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <details className="rounded-2xl border border-line" open={filters.interestIds.length > 0}>
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold">Interests</summary>
          <div className="grid grid-cols-2 gap-2 p-4 pt-0 sm:grid-cols-3">
            {interests.map((i) => (
              <Choice key={i.id} type="checkbox" name="interest" value={i.id} defaultChecked={filters.interestIds.includes(i.id)}>
                {i.label}
              </Choice>
            ))}
          </div>
        </details>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className={`${buttonStyles.primary} flex-1`}>
            Show people
          </button>
          <Link href="/app/discover" className={`${buttonStyles.secondary} flex-1`}>
            Clear filters
          </Link>
        </div>
      </form>
    </details>
  );
}
