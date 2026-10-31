import * as z from "zod";
import type { Category } from "@/lib/enums/clothing";

// Must match the slot CHECK constraint in outfit_suggestion_items.
export const SLOTS = ["top", "bottom", "shoes", "outerwear", "accessory", "other"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_CAPACITY: Record<Slot, number> = {
  top: 1,
  bottom: 1,
  shoes: 1,
  outerwear: 1,
  accessory: 3,
  other: 3,
};

export const TITLE_MAX = 80;
export const NOTES_MAX = 1000;

// A dress is the main garment, so it takes the top slot; drag it elsewhere if needed.
const DEFAULT_SLOT: Record<Category, Slot> = {
  top: "top",
  dress: "top",
  bottom: "bottom",
  shoes: "shoes",
  outerwear: "outerwear",
  accessory: "accessory",
  other: "other",
};

export function defaultSlotFor(category: string): Slot {
  return DEFAULT_SLOT[category as Category] ?? "other";
}

export type Selection = Record<Slot, string[]>;

export function emptySelection(): Selection {
  return { top: [], bottom: [], shoes: [], outerwear: [], accessory: [], other: [] };
}

/**
 * Puts an item in a slot. A single-item slot swaps its item; a full multi-item
 * slot refuses. An item already elsewhere moves rather than appearing twice.
 */
export function addToSlot(selection: Selection, slot: Slot, itemId: string): Selection {
  const next = removeItem(selection, itemId);
  const current = next[slot];
  if (SLOT_CAPACITY[slot] === 1) return { ...next, [slot]: [itemId] };
  if (current.length >= SLOT_CAPACITY[slot]) return selection;
  return { ...next, [slot]: [...current, itemId] };
}

export function removeItem(selection: Selection, itemId: string): Selection {
  return Object.fromEntries(
    SLOTS.map((s) => [s, selection[s].filter((id) => id !== itemId)]),
  ) as Selection;
}

export function isSlotFull(selection: Selection, slot: Slot): boolean {
  return selection[slot].length >= SLOT_CAPACITY[slot];
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .optional()
    .transform((v) => (v ? v : undefined));

// Form field `item` repeats as "<slot>:<clothing item id>".
export const SuggestionSchema = z
  .object({
    title: optionalText(TITLE_MAX),
    notes: optionalText(NOTES_MAX),
    items: z
      .array(
        z.string().transform((raw, ctx) => {
          const [slot, itemId] = raw.split(":");
          if (!SLOTS.includes(slot as Slot) || !z.uuid().safeParse(itemId).success) {
            ctx.addIssue({ code: "custom", message: "invalidItem" });
            return z.NEVER;
          }
          return { slot: slot as Slot, itemId };
        }),
      )
      .min(1, "noItems"),
  })
  .superRefine((value, ctx) => {
    const ids = value.items.map((i) => i.itemId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["items"], message: "invalidItem" });
    }
    for (const slot of SLOTS) {
      if (value.items.filter((i) => i.slot === slot).length > SLOT_CAPACITY[slot]) {
        ctx.addIssue({ code: "custom", path: ["items"], message: "slotFull" });
      }
    }
  });

export type SuggestionInput = z.infer<typeof SuggestionSchema>;
