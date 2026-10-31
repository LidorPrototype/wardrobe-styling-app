import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import he from "../../../messages/he.json";
import {
  CATEGORIES,
  COLORS,
  FORMALITIES,
  SEASONS,
  SUBCATEGORIES,
} from "@/lib/enums/clothing";
import { OCCASIONS, REQUEST_STATUSES } from "@/lib/enums/requests";
import { SLOTS } from "@/lib/suggestions/rules";

type Tree = { [key: string]: string | Tree };

function flatKeys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flatKeys(value, path);
  });
}

describe("translations", () => {
  it("English and Hebrew define exactly the same keys", () => {
    const enKeys = new Set(flatKeys(en as Tree));
    const heKeys = new Set(flatKeys(he as Tree));
    expect([...enKeys].filter((k) => !heKeys.has(k))).toEqual([]);
    expect([...heKeys].filter((k) => !enKeys.has(k))).toEqual([]);
  });

  it("every stored enum code has a label", () => {
    // Codes live in TypeScript, labels in JSON — nothing else links them.
    const enums: Record<string, readonly string[]> = {
      category: CATEGORIES,
      subcategory: SUBCATEGORIES,
      color: COLORS,
      season: SEASONS,
      formality: FORMALITIES,
      occasion: OCCASIONS,
      requestStatus: REQUEST_STATUSES,
      slot: SLOTS,
    };
    const labels = (en as unknown as { enums: Record<string, Record<string, string>> }).enums;

    const missing = Object.entries(enums).flatMap(([namespace, codes]) =>
      codes.filter((code) => !labels[namespace]?.[code]).map((code) => `${namespace}.${code}`),
    );
    expect(missing).toEqual([]);
  });
});
