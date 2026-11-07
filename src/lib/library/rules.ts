import * as z from "zod";

// Must match the status CHECK constraints in outfit_suggestions and
// outfit_library_entries.
export const SUGGESTION_STATUSES = ["suggested", "chosen", "worn", "favorite", "rejected"] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export const LIBRARY_STATUSES = ["worn", "chosen", "favorite"] as const;
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

// What the owner can do to a suggestion; "suggested" clears a decision.
export const DECISIONS = ["chosen", "worn", "favorite", "rejected", "suggested"] as const;
export type Decision = (typeof DECISIONS)[number];

export function isDecision(value: string): value is Decision {
  return (DECISIONS as readonly string[]).includes(value);
}

// Each of these saves a new library entry, every time.
export function savesToLibrary(status: string): status is LibraryStatus {
  return (LIBRARY_STATUSES as readonly string[]).includes(status);
}

// Guests see good news only: a rejection stays between the owner and the app.
export function statusShownTo(viewer: "owner" | "guest", status: string): SuggestionStatus | null {
  if (status === "suggested") return null;
  if (viewer === "guest" && status === "rejected") return null;
  return (SUGGESTION_STATUSES as readonly string[]).includes(status) ? (status as SuggestionStatus) : null;
}

export function parseLibraryFilter(value: string | string[] | undefined): LibraryStatus | null {
  return typeof value === "string" && savesToLibrary(value) ? value : null;
}

// worn_on is a calendar date; pin it to UTC so no time zone shifts the day.
// Format the result with timeZone: "UTC".
export function calendarDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

// The browser's local date as YYYY-MM-DD (toISOString would give UTC's).
export function localIsoDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// A client's "today" is trusted only if it's a real date within a day of the
// server's UTC date (every time zone is); otherwise the database uses its own.
export function plausibleToday(value: unknown, now = new Date()): string | null {
  if (typeof value !== "string" || !z.iso.date().safeParse(value).success) return null;
  const days = Math.abs(calendarDate(value).getTime() - calendarDate(now.toISOString().slice(0, 10)).getTime()) / 86_400_000;
  return days <= 1 ? value : null;
}

export const LIBRARY_NOTES_MAX = 1000;

// Must match the notes CHECK constraint on outfit_library_entries.
export const LibraryEntrySchema = z.object({
  wornOn: z.union([z.literal("").transform(() => null), z.iso.date("invalidDate")]),
  notes: z
    .string()
    .trim()
    .max(LIBRARY_NOTES_MAX, "tooLong")
    .transform((v) => v || null),
});
