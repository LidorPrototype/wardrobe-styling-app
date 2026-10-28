import * as z from "zod";
import { OCCASIONS } from "@/lib/enums/requests";

/** Empty form fields arrive as "" — treat them as "not set". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
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

/** `datetime-local` shape: YYYY-MM-DDTHH:mm, optionally with seconds. */
const DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export const StylingRequestSchema = z.object({
  title: z.string().trim().min(1, "titleRequired").max(120),
  occasion: optionalEnum([...OCCASIONS] as [string, ...string[]]),
  eventAt: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || DATETIME_LOCAL.test(v), {
      message: "eventAtInvalid",
    }),
  notes: optionalText(2000),
});

export type StylingRequestInput = z.infer<typeof StylingRequestSchema>;

export type RequestFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<string, string>>;
      values?: Record<string, string>;
    }
  | undefined;
