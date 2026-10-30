import { describe, expect, it } from "vitest";
import {
  classifyInvite,
  generateSecretToken,
  hashSecretToken,
  isWellFormedInviteToken,
} from "@/lib/invites/token";

describe("invite tokens", () => {
  it("generates unique, well-formed tokens whose stored hash is not the token", () => {
    const tokens = new Set(Array.from({ length: 50 }, generateSecretToken));
    expect(tokens.size).toBe(50);

    const [token] = tokens;
    expect(isWellFormedInviteToken(token)).toBe(true);
    expect(hashSecretToken(token)).not.toContain(token);
    // Lookups depend on the hash being stable.
    expect(hashSecretToken(token)).toBe(hashSecretToken(token));
  });

  it.each([
    ["too short", "abc"],
    ["padded base64", `${"a".repeat(42)}=`],
    ["path characters", `${"a".repeat(42)}/`],
  ])("rejects a malformed token (%s) before any lookup", (_label, token) => {
    expect(isWellFormedInviteToken(token)).toBe(false);
  });

  it.each([
    ["unknown token", null, "invalid"],
    ["revoked token", { revoked_at: "2026-10-30T10:00:00Z", request_status: "open" }, "invalid"],
    ["finished request", { revoked_at: null, request_status: "finished" }, "closed"],
    ["active token on an open request", { revoked_at: null, request_status: "open" }, "valid"],
  ] as const)("classifies %s", (_label, invite, expected) => {
    expect(classifyInvite(invite)).toBe(expected);
  });
});
