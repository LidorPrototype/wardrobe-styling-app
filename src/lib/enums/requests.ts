// Same contract as enums/clothing.ts.

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
