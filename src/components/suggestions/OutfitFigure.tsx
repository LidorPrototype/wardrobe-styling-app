import Image from "next/image";
import { useTranslations } from "next-intl";
import { arrangeFigure, type FigureItem } from "@/lib/suggestions/figure";

const SIZES = {
  lg: { head: "size-20", top: "h-28 w-28", dress: "h-48 w-28", outer: "h-24 w-20", bottom: "h-32 w-28", shoes: "h-16 w-24", side: "size-14" },
  sm: { head: "size-12", top: "h-16 w-16", dress: "h-28 w-16", outer: "h-14 w-12", bottom: "h-20 w-16", shoes: "h-10 w-14", side: "size-9" },
} as const;

function Tile({ item, className, showEmpty }: { item: FigureItem | null; className: string; showEmpty: boolean }) {
  if (!item) {
    return showEmpty ? (
      <div aria-hidden className={`${className} rounded-md border border-dashed border-zinc-300 dark:border-zinc-700`} />
    ) : null;
  }
  return (
    <div className={`${className} relative overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800`}>
      {item.imageUrl && (
        <Image src={item.imageUrl} alt={item.name} title={item.name} fill unoptimized sizes="128px" className="object-cover" />
      )}
    </div>
  );
}

/**
 * The owner's head above the outfit, laid out by slot. Purely visual: the
 * slots stay the record of what a suggestion contains.
 */
export function OutfitFigure({
  headUrl,
  items,
  size = "lg",
  showEmpty = false,
}: {
  headUrl: string | null;
  items: FigureItem[];
  size?: keyof typeof SIZES;
  showEmpty?: boolean;
}) {
  const t = useTranslations("suggestions");
  const s = SIZES[size];
  const layout = arrangeFigure(items);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2" aria-label={t("figureLabel")}>
      <div />
      <div className={`${s.head} relative justify-self-center overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700`}>
        {headUrl ? (
          <Image src={headUrl} alt={t("headAlt")} fill unoptimized sizes="80px" className="object-cover" />
        ) : (
          <svg viewBox="0 0 40 40" aria-hidden className="size-full text-zinc-400 dark:text-zinc-500">
            <circle cx="20" cy="15" r="7" fill="currentColor" />
            <path d="M7 38c1-8 6-12 13-12s12 4 13 12z" fill="currentColor" />
          </svg>
        )}
      </div>
      <div />

      <div className="flex justify-end">
        <Tile item={layout.outerwear} className={s.outer} showEmpty={showEmpty} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Tile item={layout.top} className={layout.topIsDress ? s.dress : s.top} showEmpty={showEmpty} />
        {!(layout.topIsDress && !layout.bottom) && (
          <Tile item={layout.bottom} className={s.bottom} showEmpty={showEmpty} />
        )}
        <Tile item={layout.shoes} className={s.shoes} showEmpty={showEmpty} />
      </div>
      <div className="flex flex-col items-start gap-2">
        {layout.side.map((item) => (
          <Tile key={item.itemId} item={item} className={s.side} showEmpty={false} />
        ))}
      </div>
    </div>
  );
}
