import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  isAtLeastAge,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./auth";

const TODAY = new Date(Date.UTC(2026, 9, 2)); // 2026-10-02

describe("isAtLeastAge (18+ rule)", () => {
  it("accepts someone who turned 18 today", () => {
    expect(isAtLeastAge("2008-10-02", 18, TODAY)).toBe(true);
  });
  it("rejects someone who turns 18 tomorrow", () => {
    expect(isAtLeastAge("2008-10-03", 18, TODAY)).toBe(false);
  });
  it("accepts an ordinary adult", () => {
    expect(isAtLeastAge("1995-05-20", 18, TODAY)).toBe(true);
  });
  it("rejects minors", () => {
    expect(isAtLeastAge("2012-01-01", 18, TODAY)).toBe(false);
  });
  it("rejects future dates", () => {
    expect(isAtLeastAge("2030-01-01", 18, TODAY)).toBe(false);
  });
  it("rejects impossible calendar dates", () => {
    expect(isAtLeastAge("1990-02-31", 18, TODAY)).toBe(false);
    expect(isAtLeastAge("1990-13-01", 18, TODAY)).toBe(false);
  });
  it("rejects malformed input", () => {
    expect(isAtLeastAge("", 18, TODAY)).toBe(false);
    expect(isAtLeastAge("20/05/1995", 18, TODAY)).toBe(false);
    expect(isAtLeastAge("not a date", 18, TODAY)).toBe(false);
  });
  it("rejects implausible ages over 120", () => {
    expect(isAtLeastAge("1890-01-01", 18, TODAY)).toBe(false);
  });
  it("handles leap-day birthdays", () => {
    expect(isAtLeastAge("2008-02-29", 18, new Date(Date.UTC(2026, 2, 1)))).toBe(true);
    expect(isAtLeastAge("2008-02-29", 18, new Date(Date.UTC(2026, 1, 28)))).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    firstName: "  Kemah ",
    email: "  KEMAH@Example.com ",
    password: "correct-horse",
    dateOfBirth: "1995-05-20",
    confirmAdult: "on",
  };

  it("normalises valid input", () => {
    const r = signUpSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.firstName).toBe("Kemah");
      expect(r.data.email).toBe("kemah@example.com");
    }
  });
  it("rejects under-18 date of birth", () => {
    const y = new Date().getUTCFullYear() - 10;
    const r = signUpSchema.safeParse({ ...valid, dateOfBirth: `${y}-01-01` });
    expect(r.success).toBe(false);
  });
  it("requires the adult confirmation checkbox", () => {
    const rest: Record<string, string> = { ...valid };
    delete rest.confirmAdult;
    expect(signUpSchema.safeParse(rest).success).toBe(false);
  });
  it("rejects short and oversized passwords", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "x".repeat(73) }).success).toBe(false);
  });
  it("rejects invalid email and empty name", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, firstName: "   " }).success).toBe(false);
  });
});

describe("other auth schemas", () => {
  it("signIn requires email and password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
  it("forgotPassword validates email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
  it("resetPassword requires matching passwords", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "longenough1", confirmPassword: "different1" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ password: "longenough1", confirmPassword: "longenough1" }).success,
    ).toBe(true);
  });
});
