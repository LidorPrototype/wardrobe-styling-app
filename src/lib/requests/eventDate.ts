/**
 * `styling_requests.event_at` is a naive `timestamp` — a wall clock, not an
 * instant (see the migration for why). These helpers keep the wall clock
 * intact across the three representations it passes through:
 *
 *   <input type="datetime-local">   "2026-09-01T19:30"
 *   Postgres timestamp             "2026-09-01T19:30:00"
 *   Intl formatting                Date + { timeZone: "UTC" }
 *
 * The formatting step is the subtle one. A naive string has no offset, so
 * `new Date(s)` would resolve it against whatever zone the runtime happens to
 * be in — meaning the server and the browser could render different times for
 * the same row. Pinning both the parse (`+ "Z"`) and the format (`timeZone:
 * "UTC"`) to UTC makes the output identical everywhere, and equal to what the
 * owner typed.
 */

/** Postgres `timestamp` -> the value a `datetime-local` input expects. */
export function toDateTimeInputValue(stored: string | null | undefined): string {
  if (!stored) return "";
  // Trim seconds and anything after; the input only accepts minute precision.
  return stored.slice(0, 16);
}

/** `datetime-local` string -> what gets written to a naive `timestamp` column. */
export function toStoredTimestamp(input: string | null | undefined): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;
  return `${trimmed.slice(0, 16)}:00`;
}

/**
 * Postgres `timestamp` -> a Date positioned so that formatting it with
 * `timeZone: "UTC"` reproduces the stored wall clock.
 */
export function toFormattableDate(stored: string | null | undefined): Date | null {
  if (!stored) return null;
  const date = new Date(`${stored.slice(0, 19)}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Always pass this alongside a `toFormattableDate` result. */
export const EVENT_TIME_ZONE = "UTC";
