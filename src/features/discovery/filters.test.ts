import { describe, expect, it } from "vitest";
import { activeFilterCount, parseFilters, parsePage, toRpcArgs } from "./filters";

const ID = "3f2b8c1e-9d4a-4e7b-8a6c-1f2e3d4c5b6a";

describe("parseFilters", () => {
  it("returns empty filters for an empty query", () => {
    const f = parseFilters({});
    expect(activeFilterCount(f)).toBe(0);
    expect(toRpcArgs(f)).toEqual({ p_limit: 60 });
  });

  it("reads valid values and ignores invalid ones", () => {
    const f = parseFilters({
      agemin: "25",
      agemax: "abc",
      gender: ["woman", "robot"],
      place: `region:${ID}`,
      intention: "marriage",
      interest: [ID, "not-a-uuid"],
      children: "want_children",
      smoking: "never",
    });
    expect(f.ageMin).toBe(25);
    expect(f.ageMax).toBeUndefined();
    expect(f.genders).toEqual(["woman"]);
    expect(f.place).toEqual({ kind: "region", id: ID });
    expect(f.intentions).toEqual(["marriage"]);
    expect(f.interestIds).toEqual([ID]);
    expect(activeFilterCount(f)).toBe(7);
  });

  it("rejects ages under 18 and swaps an inverted range", () => {
    expect(parseFilters({ agemin: "17" }).ageMin).toBeUndefined();
    const f = parseFilters({ agemin: "40", agemax: "30" });
    expect([f.ageMin, f.ageMax]).toEqual([30, 40]);
  });

  it("rejects malformed place values", () => {
    expect(parseFilters({ place: "region:nope" }).place).toBeUndefined();
    expect(parseFilters({ place: `planet:${ID}` }).place).toBeUndefined();
  });

  it("maps each place kind to the right database argument", () => {
    expect(toRpcArgs(parseFilters({ place: `country:${ID}` })).p_country_id).toBe(ID);
    expect(toRpcArgs(parseFilters({ place: `region:${ID}` })).p_region_id).toBe(ID);
    expect(toRpcArgs(parseFilters({ place: `city:${ID}` })).p_city_id).toBe(ID);
    expect(toRpcArgs(parseFilters({ place: `community:${ID}` })).p_community_id).toBe(ID);
  });
});

describe("parsePage", () => {
  it("defaults to page 1 and clamps nonsense", () => {
    expect(parsePage({})).toBe(1);
    expect(parsePage({ page: "3" })).toBe(3);
    expect(parsePage({ page: "0" })).toBe(1);
    expect(parsePage({ page: "999" })).toBe(1);
    expect(parsePage({ page: "x" })).toBe(1);
  });
});
