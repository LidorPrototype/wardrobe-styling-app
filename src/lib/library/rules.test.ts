import { describe, expect, it } from "vitest";
import { LibraryEntrySchema, parseLibraryFilter, plausibleToday, statusShownTo } from "@/lib/library/rules";

describe("outfit status visibility", () => {
  it("never shows a rejection to guests, and hides the default status from everyone", () => {
    expect(statusShownTo("owner", "rejected")).toBe("rejected");
    expect(statusShownTo("guest", "rejected")).toBeNull();
    expect(statusShownTo("guest", "worn")).toBe("worn");
    expect(statusShownTo("owner", "suggested")).toBeNull();
  });
});

describe("library filter", () => {
  it("only accepts statuses that live in the library", () => {
    expect(parseLibraryFilter("worn")).toBe("worn");
    expect(parseLibraryFilter("rejected")).toBeNull();
    expect(parseLibraryFilter(["worn", "chosen"])).toBeNull();
  });
});

describe("library entry form", () => {
  it("treats blanks as cleared and rejects impossible dates", () => {
    expect(LibraryEntrySchema.parse({ wornOn: "", notes: "   " })).toEqual({ wornOn: null, notes: null });
    expect(LibraryEntrySchema.parse({ wornOn: "2026-07-09", notes: " wine bar " })).toEqual({
      wornOn: "2026-07-09",
      notes: "wine bar",
    });
    expect(LibraryEntrySchema.safeParse({ wornOn: "2026-02-30", notes: "" }).error?.issues[0].message).toBe("invalidDate");
  });
});

describe("plausibleToday", () => {
  const now = new Date("2026-07-09T22:30:00Z"); // already the 10th in Israel

  it("accepts a client date within a day of the server's, and nothing else", () => {
    expect(plausibleToday("2026-07-10", now)).toBe("2026-07-10");
    expect(plausibleToday("2026-07-08", now)).toBe("2026-07-08");
    expect(plausibleToday("2026-07-12", now)).toBeNull();
    expect(plausibleToday("2026-02-30", now)).toBeNull();
    expect(plausibleToday(undefined, now)).toBeNull();
  });
});
