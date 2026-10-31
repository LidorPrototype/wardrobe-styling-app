import * as z from "zod";
import {
  CATEGORIES,
  COLORS,
  FORMALITIES,
  SEASONS,
  SUBCATEGORIES,
  isValidSubcategoryFor,
} from "@/lib/enums/clothing";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // keep in sync with the bucket
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Empty form fields arrive as "" — treat them as "not set". */
const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || values.includes(v), {
      message: "invalidValue",
    });

export const ClothingItemSchema = z
  .object({
    name: z.string().trim().min(1, "nameRequired").max(120),
    category: z.enum(CATEGORIES, { message: "categoryRequired" }),
    subcategory: optionalEnum(SUBCATEGORIES as [string, ...string[]]),
    color: optionalEnum([...COLORS] as [string, ...string[]]),
    season: optionalEnum([...SEASONS] as [string, ...string[]]),
    formality: optionalEnum([...FORMALITIES] as [string, ...string[]]),
    brand: optionalText,
    size: optionalText,
    notes: optionalText,
    tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.subcategory && !isValidSubcategoryFor(val.category, val.subcategory)) {
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: "invalidValue",
      });
    }
  });

export type ClothingItemInput = z.infer<typeof ClothingItemSchema>;

export function imageExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export function validateImage(file: File | null, { required }: { required: boolean }) {
  if (!file || file.size === 0) {
    return required ? "imageRequired" : null;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "imageTooLarge";
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "imageType";
  }
  return null;
}

export function parseTags(raw: FormDataEntryValue[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    for (const piece of String(entry).split(",")) {
      const tag = piece.trim();
      if (!tag) continue;
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
    }
  }
  return out.slice(0, 30);
}

export type WardrobeFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<string, string>>;
      values?: Record<string, string | string[]>;
    }
  | undefined;
