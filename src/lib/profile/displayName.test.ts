import { describe, expect, it } from "vitest";
import { DISPLAY_NAME_MAX, guestSafeDisplayName, parseDisplayName } from "@/lib/profile/displayName";

describe("owner display name", () => {
  it("never exposes a stored email to guests", () => {
    expect(guestSafeDisplayName("lidor@example.com")).toBeNull();
    expect(guestSafeDisplayName("  ")).toBeNull();
    expect(guestSafeDisplayName(null)).toBeNull();
    expect(guestSafeDisplayName(" Lidor ")).toBe("Lidor");
  });

  it.each([
    ["an email address", "lidor@example.com", { ok: false, error: "nameInvalid" }],
    ["a name over the limit", "x".repeat(DISPLAY_NAME_MAX + 1), { ok: false, error: "nameInvalid" }],
    ["an empty field (clears the name)", "   ", { ok: true, value: null }],
    ["a normal name, trimmed", "  Lidor ", { ok: true, value: "Lidor" }],
  ])("handles %s", (_label, raw, expected) => {
    expect(parseDisplayName(raw)).toEqual(expected);
  });
});
