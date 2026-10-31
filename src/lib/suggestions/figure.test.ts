import { describe, expect, it } from "vitest";
import { arrangeFigure, type FigureItem } from "@/lib/suggestions/figure";

const item = (slot: FigureItem["slot"], category: string, name = category): FigureItem => ({
  itemId: name,
  name,
  imageUrl: null,
  slot,
  category,
});

describe("arrangeFigure", () => {
  it("places body slots down the figure and accessories and other at the side", () => {
    const layout = arrangeFigure([
      item("accessory", "accessory", "watch"),
      item("top", "top"),
      item("shoes", "shoes"),
      item("other", "other", "umbrella"),
      item("bottom", "bottom"),
      item("outerwear", "outerwear"),
    ]);
    expect([layout.outerwear?.name, layout.top?.name, layout.bottom?.name, layout.shoes?.name]).toEqual([
      "outerwear",
      "top",
      "bottom",
      "shoes",
    ]);
    expect(layout.side.map((i) => i.name)).toEqual(["watch", "umbrella"]);
    expect(layout.topIsDress).toBe(false);
  });

  it("draws a dress in the top slot as a full-length piece", () => {
    expect(arrangeFigure([item("top", "dress")]).topIsDress).toBe(true);
    // A dress dragged into "other" is just a side item.
    expect(arrangeFigure([item("other", "dress")]).topIsDress).toBe(false);
  });
});
