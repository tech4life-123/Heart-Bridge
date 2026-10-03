import { describe, expect, it } from "vitest";
import { formatMoney, isProviderId, parseAmountToMinor } from "./providers";

describe("payment helpers", () => {
  it("parses amounts to minor units", () => {
    expect(parseAmountToMinor("2")).toBe(200);
    expect(parseAmountToMinor("2.5")).toBe(250);
    expect(parseAmountToMinor("2,05")).toBe(205);
    expect(parseAmountToMinor("0")).toBeNull();
    expect(parseAmountToMinor("-1")).toBeNull();
    expect(parseAmountToMinor("abc")).toBeNull();
    expect(parseAmountToMinor("1.234")).toBeNull();
  });
  it("formats money", () => {
    expect(formatMoney(200, "USD")).toBe("US$2.00");
    expect(formatMoney(15000, "LRD")).toBe("L$150.00");
  });
  it("accepts only known providers", () => {
    expect(isProviderId("orange_money")).toBe(true);
    expect(isProviderId("card")).toBe(false);
  });
});
