import * as z from "zod";

// Route ids reach Postgres as uuid comparisons; a malformed one would be a
// query error rather than "not found", so pages check first.
export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}
