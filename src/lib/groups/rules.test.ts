import { describe, expect, it } from "vitest";
import { GROUP_NAME_MAX, GroupSchema, membershipChanges } from "@/lib/groups/rules";

describe("membershipChanges", () => {
  it("adds only the newly ticked groups and removes only the unticked ones", () => {
    expect(membershipChanges(["work", "summer"], ["summer", "dating", "dating"])).toEqual({
      add: ["dating"],
      remove: ["work"],
    });
    expect(membershipChanges(["work"], ["work"])).toEqual({ add: [], remove: [] });
  });
});

describe("group form", () => {
  it("trims the name, rejects blank or over-long names, and clears an empty description", () => {
    expect(GroupSchema.parse({ name: "  Dating ", description: " " })).toEqual({ name: "Dating", description: null });
    expect(GroupSchema.safeParse({ name: "   ", description: "" }).error?.issues[0].message).toBe("nameRequired");
    expect(GroupSchema.safeParse({ name: "x".repeat(GROUP_NAME_MAX + 1), description: "" }).error?.issues[0].message).toBe("nameTooLong");
  });
});
