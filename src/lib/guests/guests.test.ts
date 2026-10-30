import { describe, expect, it } from "vitest";
import { hashPassphrase, verifyPassphrase } from "@/lib/guests/passphrase";
import {
  GuestJoinSchema,
  isLocked,
  isSessionExpired,
  nicknameKey,
  SESSION_DAYS,
} from "@/lib/guests/rules";

describe("guest passphrases", () => {
  it("verifies the right passphrase, rejects others, and salts every hash", async () => {
    const stored = await hashPassphrase("blue jeans 42");

    expect(await verifyPassphrase("blue jeans 42", stored)).toBe(true);
    expect(await verifyPassphrase("blue jeans 43", stored)).toBe(false);
    expect(stored).not.toContain("blue jeans 42");
    expect(await hashPassphrase("blue jeans 42")).not.toBe(stored);
  });

  it("treats a malformed stored hash as a mismatch instead of throwing", async () => {
    expect(await verifyPassphrase("anything", "not-a-hash")).toBe(false);
  });
});

describe("guest join rules", () => {
  it("matches nicknames regardless of case and surrounding spaces", () => {
    expect(nicknameKey("Alice")).toBe(nicknameKey("  ALICE "));
  });

  it.each([
    ["5 characters", "abcde", "passphraseTooShort"],
    ["only spaces", "        ", "passphraseTooShort"],
  ])("rejects a passphrase with %s", (_label, passphrase, message) => {
    const result = GuestJoinSchema.safeParse({ nickname: "Alice", passphrase });
    expect(result.error?.issues[0].message).toBe(message);
  });

  it("keeps spaces inside a passphrase", () => {
    expect(GuestJoinSchema.parse({ nickname: " Alice ", passphrase: " a b c " })).toEqual({
      nickname: "Alice",
      passphrase: " a b c ",
    });
  });

  it("locks only until the lock time passes", () => {
    const now = new Date("2026-10-31T12:00:00Z");
    expect(isLocked("2026-10-31T12:10:00Z", now)).toBe(true);
    expect(isLocked("2026-10-31T11:59:00Z", now)).toBe(false);
    expect(isLocked(null, now)).toBe(false);
  });

  it(`expires a session after ${SESSION_DAYS} days without a visit`, () => {
    const now = new Date("2026-10-31T12:00:00Z");
    expect(isSessionExpired("2026-10-02T12:00:00Z", now)).toBe(false);
    expect(isSessionExpired("2026-09-30T12:00:00Z", now)).toBe(true);
  });
});
