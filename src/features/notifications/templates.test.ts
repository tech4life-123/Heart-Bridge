import { describe, expect, it } from "vitest";
import { renderNotification } from "./templates";

const base = { siteUrl: "https://example.com/", payload: {} };

describe("renderNotification", () => {
  it("escapes names in html", () => {
    const r = renderNotification({
      ...base,
      kind: "new_match",
      firstName: "<b>Eve</b>",
      otherName: '"><script>',
    });
    expect(r?.html).not.toContain("<script>");
    expect(r?.html).not.toContain("<b>Eve");
  });
  it("links to the app and settings", () => {
    const r = renderNotification({
      ...base,
      kind: "new_message",
      firstName: "Ann",
      otherName: "Ben",
    });
    expect(r?.text).toContain("https://example.com/app/messages");
    expect(r?.text).toContain("https://example.com/app/profile/notifications");
  });
  it("ignores unknown kinds", () => {
    expect(
      renderNotification({
        ...base,
        kind: "x",
        firstName: "A",
        otherName: null,
      }),
    ).toBeNull();
  });
});
