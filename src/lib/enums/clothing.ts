/**
 * Canonical clothing code lists.
 *
 * These are language-neutral codes — they are what gets stored in the database
 * and used for filtering. Human-readable labels live in the `enums` namespace of
 * messages/{locale}.json, keyed by the same codes, so the same wardrobe reads
 * correctly in English and Hebrew. Never store a localized label in the DB.
 *
 * Adding a code here means adding the matching translation key in BOTH locale
 * files. Renaming or removing a code is a data migration, not a code change.
 */

export const CATEGORIES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
  "other",
] as const;

/** Subcategories are scoped to a category so the UI can narrow the options. */
export const SUBCATEGORIES_BY_CATEGORY = {
  top: ["t_shirt", "shirt", "button_down", "blouse", "sweater", "hoodie", "tank_top"],
  bottom: ["jeans", "trousers", "shorts", "skirt", "leggings"],
  dress: ["day_dress", "evening_dress", "jumpsuit"],
  outerwear: ["jacket", "coat", "blazer", "cardigan", "vest"],
  shoes: ["sneakers", "boots", "sandals", "heels", "flats", "dress_shoes"],
  accessory: ["bag", "belt", "hat", "scarf", "jewelry", "sunglasses", "watch", "tie"],
  other: ["other_item"],
} as const satisfies Record<(typeof CATEGORIES)[number], readonly string[]>;

export const SUBCATEGORIES = Object.values(SUBCATEGORIES_BY_CATEGORY).flat();

export const COLORS = [
  "black",
  "white",
  "gray",
  "beige",
  "brown",
  "blue",
  "navy",
  "green",
  "red",
  "pink",
  "purple",
  "yellow",
  "orange",
  "multicolor",
  "other",
] as const;

export const SEASONS = ["spring", "summer", "fall", "winter", "all_season"] as const;

export const FORMALITIES = ["casual", "smart_casual", "formal", "sport"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Subcategory = (typeof SUBCATEGORIES)[number];
export type Color = (typeof COLORS)[number];
export type Season = (typeof SEASONS)[number];
export type Formality = (typeof FORMALITIES)[number];

/** Subcategories valid for a given category, for dependent selects. */
export function subcategoriesFor(category: string): readonly string[] {
  return (
    SUBCATEGORIES_BY_CATEGORY[category as Category] ?? SUBCATEGORIES_BY_CATEGORY.other
  );
}

export function isValidSubcategoryFor(
  category: string,
  subcategory: string,
): boolean {
  return subcategoriesFor(category).includes(subcategory);
}
