import { describe, expect, it } from "vitest";
import { completionPercent, completionTasks, type CompletionInput } from "./completion";
import { fitWithin, sniffImageType } from "./images";
import { normalizePhone } from "./phone";
import { aboutSchema, interestsSchema, locationSchema, lookingForSchema } from "./schemas";

const U = "3f2c1d0e-8a4b-4c6d-9e1f-0a1b2c3d4e5f";

describe("normalizePhone", () => {
  it("accepts international format", () => {
    expect(normalizePhone("+231 77 123 4567")).toBe("+231771234567");
    expect(normalizePhone("+1 (415) 555-2671")).toBe("+14155552671");
  });
  it("treats 00 as +", () => {
    expect(normalizePhone("00231771234567")).toBe("+231771234567");
  });
  it("assumes Liberia when no country code", () => {
    expect(normalizePhone("0771234567")).toBe("+231771234567");
    expect(normalizePhone("771234567")).toBe("+231771234567");
  });
  it("rejects junk", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("+12")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("+231 77 123 456 789 012 345")).toBeNull();
  });
});

describe("image helpers", () => {
  it("sniffs by magic bytes", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(sniffImageType(webp)).toBe("webp");
  });
  it("rejects other content, even if renamed .jpg", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("GIF89a......"))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
  it("fits within the maximum without upscaling", () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });
});

describe("aboutSchema", () => {
  const base = {
    gender: "woman", bio: "", occupation: "", education: "", languages: [],
    smoking: "", drinking: "", children_preference: "", phone: "",
  };
  it("accepts a minimal valid form and nulls empty text", () => {
    const r = aboutSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bio).toBeNull();
      expect(r.data.phone).toBeNull();
      expect(r.data.smoking).toBeNull();
    }
  });
  it("requires gender and rejects unknown values", () => {
    expect(aboutSchema.safeParse({ ...base, gender: "" }).success).toBe(false);
    expect(aboutSchema.safeParse({ ...base, gender: "robot" }).success).toBe(false);
  });
  it("limits bio length and strips control characters", () => {
    expect(aboutSchema.safeParse({ ...base, bio: "x".repeat(501) }).success).toBe(false);
    const r = aboutSchema.safeParse({ ...base, bio: "hi\u0000 there" });
    expect(r.success && r.data.bio).toBe("hi there");
  });
  it("rejects languages outside the list and too many", () => {
    expect(aboutSchema.safeParse({ ...base, languages: ["Klingon"] }).success).toBe(false);
    expect(aboutSchema.safeParse({ ...base, languages: ["English", "Kpelle"] }).success).toBe(true);
  });
  it("normalises or rejects phone numbers", () => {
    const ok = aboutSchema.safeParse({ ...base, phone: "077 123 4567" });
    expect(ok.success && ok.data.phone).toBe("+231771234567");
    expect(aboutSchema.safeParse({ ...base, phone: "call me" }).success).toBe(false);
  });
});

describe("lookingForSchema", () => {
  const base = {
    intention_primary: "serious_relationship", intentions_extra: ["marriage", "serious_relationship"],
    seeking_genders: ["man"], age_min: "25", age_max: "40",
    appear_local: true, appear_liberia: true, appear_diaspora: false,
  };
  it("coerces ages and drops the primary from extras", () => {
    const r = lookingForSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.age_min).toBe(25);
      expect(r.data.intentions_extra).toEqual(["marriage"]);
    }
  });
  it("blocks under-18 minimum and inverted ranges", () => {
    expect(lookingForSchema.safeParse({ ...base, age_min: "17" }).success).toBe(false);
    expect(lookingForSchema.safeParse({ ...base, age_min: "50", age_max: "30" }).success).toBe(false);
  });
  it("requires someone to look for", () => {
    expect(lookingForSchema.safeParse({ ...base, seeking_genders: [] }).success).toBe(false);
  });
});

describe("locationSchema and interestsSchema", () => {
  it("requires a country and nulls blanks", () => {
    expect(locationSchema.safeParse({ country_id: "", region_id: "", city_id: "", community_id: "", city_other: "" }).success).toBe(false);
    const r = locationSchema.safeParse({ country_id: U, region_id: "", city_id: "", community_id: "", city_other: " Staten Island " });
    expect(r.success && r.data.city_other).toBe("Staten Island");
    expect(r.success && r.data.region_id).toBeNull();
  });
  it("caps interests at 10 and requires UUIDs", () => {
    expect(interestsSchema.safeParse({ interests: Array(11).fill(U) }).success).toBe(false);
    expect(interestsSchema.safeParse({ interests: ["not-a-uuid"] }).success).toBe(false);
    expect(interestsSchema.safeParse({ interests: [U] }).success).toBe(true);
  });
});

describe("completion", () => {
  const empty: CompletionInput = {
    gender: null, intention_primary: null, country_id: null, region_id: null, city_id: null,
    city_other: null, bio: null, occupation: null, education: null, languages: [],
    photoCount: 0, interestCount: 0,
  };
  it("weights add up to 100", () => {
    expect(completionTasks(empty).reduce((s, t) => s + t.points, 0)).toBe(100);
  });
  it("starts at 10% (account basics) and reaches 100%", () => {
    expect(completionPercent(empty)).toBe(10);
    expect(
      completionPercent({
        gender: "woman", intention_primary: "marriage", country_id: U, region_id: U, city_id: U,
        city_other: null, bio: "A friendly person who loves music.", occupation: "Nurse",
        education: null, languages: ["English"], photoCount: 3, interestCount: 3,
      }),
    ).toBe(100);
  });
  it("counts a diaspora place with only a free-text city", () => {
    expect(completionPercent({ ...empty, country_id: U, city_other: "London" })).toBe(25);
  });
  it("does not count a short bio", () => {
    expect(completionPercent({ ...empty, bio: "hi" })).toBe(10);
  });
});
