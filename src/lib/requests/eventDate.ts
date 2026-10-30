/**
 * `event_at` is a naive `timestamp`: a wall clock, not an instant. Parsing it
 * with `new Date(s)` would use the runtime's zone, so server and browser could
 * render different times. Parse (`+ "Z"`) and format (`timeZone: "UTC"`) are
 * both pinned to UTC so the output always equals what the owner typed.
 */

export function toDateTimeInputValue(stored: string | null | undefined): string {
  if (!stored) return "";
  // datetime-local only accepts minute precision.
  return stored.slice(0, 16);
}

export function toStoredTimestamp(input: string | null | undefined): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;
  return `${trimmed.slice(0, 16)}:00`;
}

export function toFormattableDate(stored: string | null | undefined): Date | null {
  if (!stored) return null;
  const date = new Date(`${stored.slice(0, 19)}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Always pass this alongside a `toFormattableDate` result. */
export const EVENT_TIME_ZONE = "UTC";
