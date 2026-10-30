import { afterEach, describe, expect, it } from "vitest";
import {
  EVENT_TIME_ZONE,
  toDateTimeInputValue,
  toFormattableDate,
  toStoredTimestamp,
} from "@/lib/requests/eventDate";

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

describe("event time (naive wall clock)", () => {
  it("renders the stored wall clock identically whatever zone the runtime is in", () => {
    // Server and browser can run in different zones. If parsing or formatting
    // ever resolves against the runtime zone, these outputs diverge — which is
    // exactly the hydration/"wrong time for guests" bug this guards against.
    const stored = toStoredTimestamp("2026-12-05T19:30");
    const rendered = new Set<string>();

    for (const tz of ["UTC", "Asia/Jerusalem", "America/Los_Angeles", "Pacific/Kiritimati"]) {
      process.env.TZ = tz;
      const date = toFormattableDate(stored)!;
      rendered.add(
        new Intl.DateTimeFormat("en-GB", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: EVENT_TIME_ZONE,
        }).format(date),
      );
    }

    expect([...rendered]).toEqual(["05/12/2026, 19:30"]);
  });

  it("round-trips a datetime-local value through storage unchanged", () => {
    const input = "2026-12-05T19:30";
    expect(toDateTimeInputValue(toStoredTimestamp(input))).toBe(input);
    // Postgres returns seconds; the input only accepts minutes.
    expect(toDateTimeInputValue("2026-12-05T19:30:00")).toBe(input);
    // Clearing the field must clear the column, not store a bogus value.
    expect(toStoredTimestamp("")).toBeNull();
  });
});
