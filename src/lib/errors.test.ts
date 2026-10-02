import { describe, expect, it } from "vitest";
import { GENERIC_ERROR, toUserMessage } from "./errors";

describe("toUserMessage (never leak raw errors)", () => {
  it("returns the generic message for unknown or missing errors", () => {
    expect(toUserMessage(null)).toBe(GENERIC_ERROR);
    expect(toUserMessage({ message: "PostgrestError: duplicate key value violates unique constraint" })).toBe(GENERIC_ERROR);
  });
  it("maps known auth codes", () => {
    expect(toUserMessage({ code: "invalid_credentials" })).toBe("Incorrect email or password.");
    expect(toUserMessage({ code: "email_not_confirmed" })).toMatch(/confirm your email/i);
  });
  it("maps rate limits by code and status", () => {
    expect(toUserMessage({ code: "over_request_rate_limit" })).toMatch(/too many/i);
    expect(toUserMessage({ status: 429 })).toMatch(/too many/i);
  });
  it("maps signup trigger failures without exposing internals", () => {
    const msg = toUserMessage({ message: "Database error saving new user" });
    expect(msg).toMatch(/couldn't create your account/i);
    expect(msg).not.toMatch(/database/i);
  });
});
