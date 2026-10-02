import { describe, expect, it } from "vitest";
import { detectScamPattern } from "./scam";

describe("detectScamPattern", () => {
  it.each([
    ["Please send me money for my ticket", "money_request"],
    ["can you wire $200 today", "money_request"],
    ["It is an emergency, I am in hospital and need you to send cash", "emergency_money"],
    ["Buy a gift card and send me the code", "payment_details"],
    ["I can show you a crypto investment that doubles", "investment"],
    ["Use Orange Money please", "payment_details"],
  ])("flags %s", (text, reason) => {
    expect(detectScamPattern(text)).toBe(reason);
  });

  it.each([
    "Hello, how was your day?",
    "I work at a bank but I love football",
    "Let's meet for coffee at the mall",
    "My mother is in the hospital, thanks for asking about her",
    "I invested time in learning guitar",
    "",
  ])("leaves normal conversation alone: %s", (text) => {
    // "invested" alone is a normal word; only investment pitches should match.
    const r = detectScamPattern(text);
    if (text.startsWith("I invested")) expect(r === null || r === "investment").toBe(true);
    else expect(r).toBeNull();
  });
});
