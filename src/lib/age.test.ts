import { describe, expect, it } from "vitest";
import { calculateAge } from "./age";

const today = new Date(Date.UTC(2026, 9, 2)); // 2 Oct 2026

describe("calculateAge", () => {
  it("counts whole years", () => {
    expect(calculateAge("2000-10-02", today)).toBe(26);
    expect(calculateAge("2000-10-03", today)).toBe(25);
    expect(calculateAge("2000-01-01", today)).toBe(26);
  });
  it("handles bad input", () => {
    expect(calculateAge("not-a-date", today)).toBeNull();
    expect(calculateAge("2030-01-01", today)).toBeNull();
  });
});
