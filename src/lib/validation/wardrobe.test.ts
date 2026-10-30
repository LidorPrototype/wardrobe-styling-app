import { describe, expect, it } from "vitest";
import {
  ClothingItemSchema,
  MAX_IMAGE_BYTES,
  parseTags,
  validateImage,
} from "@/lib/validation/wardrobe";

describe("ClothingItemSchema", () => {
  it("rejects a subcategory that belongs to a different category", () => {
    // The UI narrows the subcategory list, but a direct POST does not.
    const wrong = ClothingItemSchema.safeParse({
      name: "Blue jeans",
      category: "top",
      subcategory: "jeans",
    });
    expect(wrong.success).toBe(false);
    expect(wrong.error?.issues[0]).toMatchObject({ path: ["subcategory"] });

    const right = ClothingItemSchema.safeParse({
      name: "Blue jeans",
      category: "bottom",
      subcategory: "jeans",
    });
    expect(right.success).toBe(true);
  });
});

describe("validateImage", () => {
  const file = (bytes: number, type: string) =>
    new File([new Uint8Array(bytes)], "photo", { type });

  it.each([
    ["missing on create", null, true, "imageRequired"],
    ["missing on edit (keeps the existing photo)", null, false, null],
    ["over the bucket's size limit", file(MAX_IMAGE_BYTES + 1, "image/jpeg"), true, "imageTooLarge"],
    ["not an allowed image type", file(10, "image/gif"), true, "imageType"],
    ["a valid photo", file(10, "image/webp"), true, null],
  ])("%s", (_label, image, required, expected) => {
    expect(validateImage(image, { required })).toBe(expected);
  });
});

describe("parseTags", () => {
  it("splits, trims and de-duplicates case-insensitively, keeping the first spelling", () => {
    expect(parseTags(["Summer, beach", "summer", "  ", "Work"])).toEqual([
      "Summer",
      "beach",
      "Work",
    ]);
  });
});
