import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/enums/clothing";
import {
  addToSlot,
  defaultSlotFor,
  emptySelection,
  SLOTS,
  SuggestionSchema,
} from "@/lib/suggestions/rules";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const D = "44444444-4444-4444-8444-444444444444";

describe("outfit slots", () => {
  it("gives every clothing category a slot", () => {
    for (const category of CATEGORIES) {
      expect(SLOTS).toContain(defaultSlotFor(category));
    }
  });

  it("swaps a single-item slot, caps multi-item slots at 3, and never duplicates an item", () => {
    let s = addToSlot(emptySelection(), "top", A);
    s = addToSlot(s, "top", B);
    expect(s.top).toEqual([B]);

    s = addToSlot(s, "accessory", A);
    s = addToSlot(s, "accessory", C);
    s = addToSlot(s, "accessory", D);
    expect(addToSlot(s, "accessory", "55555555-5555-4555-8555-555555555555")).toBe(s);

    // Moving B from top into a full accessory slot is refused, not duplicated.
    expect(addToSlot(s, "accessory", B)).toBe(s);
    expect(addToSlot(s, "bottom", B).top).toEqual([]);
  });
});

describe("SuggestionSchema", () => {
  const parse = (items: string[]) => SuggestionSchema.safeParse({ items });

  it("accepts a valid outfit", () => {
    expect(parse([`top:${A}`, `accessory:${B}`, `accessory:${C}`]).success).toBe(true);
  });

  it.each([
    ["no items", [], "noItems"],
    ["two tops (a direct POST can bypass the builder)", [`top:${A}`, `top:${B}`], "slotFull"],
    ["four accessories", [`accessory:${A}`, `accessory:${B}`, `accessory:${C}`, `accessory:${D}`], "slotFull"],
    ["the same item twice", [`top:${A}`, `bottom:${A}`], "invalidItem"],
    ["an unknown slot", [`hat:${A}`], "invalidItem"],
    ["a non-uuid id", ["top:'; drop table x"], "invalidItem"],
  ])("rejects %s", (_label, items, message) => {
    expect(parse(items).error?.issues[0].message).toBe(message);
  });
});
