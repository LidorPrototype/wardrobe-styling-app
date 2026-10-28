/**
 * Canonical styling-request code lists.
 *
 * Same contract as src/lib/enums/clothing.ts: these language-neutral codes are
 * what the database stores, and the human-readable labels live in the
 * `enums.occasion` / `enums.requestStatus` namespaces of messages/{locale}.json.
 * Adding a code here means adding the matching key in BOTH locale files.
 */

export const OCCASIONS = [
  "work",
  "interview",
  "wedding",
  "formal_event",
  "party",
  "date",
  "casual_outing",
  "travel",
  "sport",
  "other",
] as const;

export const REQUEST_STATUSES = ["open", "finished"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
