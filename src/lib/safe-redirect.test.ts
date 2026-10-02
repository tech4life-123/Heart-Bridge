import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath (open-redirect protection)", () => {
  it("allows same-site paths", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/settings?tab=privacy")).toBe("/app/settings?tab=privacy");
  });
  it("falls back for missing values", () => {
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
  });
  it("blocks absolute and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("//evil.com")).toBe("/app");
    expect(safeNextPath("/\\evil.com")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)")).toBe("/app");
  });
  it("blocks header-injection characters", () => {
    expect(safeNextPath("/ok\r\nSet-Cookie: x=1")).toBe("/app");
  });
  it("uses a custom fallback", () => {
    expect(safeNextPath("https://evil.com", "/login")).toBe("/login");
  });
});
