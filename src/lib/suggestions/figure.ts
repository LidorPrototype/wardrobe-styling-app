import type { Slot } from "@/lib/suggestions/rules";

export type FigureItem = {
  itemId: string;
  name: string;
  imageUrl: string | null;
  slot: Slot;
  category: string;
};

export type FigureLayout = {
  outerwear: FigureItem | null;
  top: FigureItem | null;
  // A dress in the top slot covers the bottom too, so it's drawn taller.
  topIsDress: boolean;
  bottom: FigureItem | null;
  shoes: FigureItem | null;
  side: FigureItem[];
};

export function arrangeFigure(items: FigureItem[]): FigureLayout {
  const first = (slot: Slot) => items.find((i) => i.slot === slot) ?? null;
  const top = first("top");
  return {
    outerwear: first("outerwear"),
    top,
    topIsDress: top?.category === "dress",
    bottom: first("bottom"),
    shoes: first("shoes"),
    side: items.filter((i) => i.slot === "accessory" || i.slot === "other"),
  };
}
