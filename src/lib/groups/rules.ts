import * as z from "zod";

export const GROUP_NAME_MAX = 40;
export const GROUP_DESCRIPTION_MAX = 200;

// Must match the CHECK constraints on outfit_groups.
export const GroupSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(GROUP_NAME_MAX, "nameTooLong"),
  description: z
    .string()
    .trim()
    .max(GROUP_DESCRIPTION_MAX, "descriptionTooLong")
    .transform((v) => v || null),
});

// What to add and remove so an entry ends up in exactly `wanted`.
export function membershipChanges(current: string[], wanted: string[]): { add: string[]; remove: string[] } {
  const have = new Set(current);
  const want = new Set(wanted);
  return {
    add: [...want].filter((id) => !have.has(id)),
    remove: [...have].filter((id) => !want.has(id)),
  };
}
