import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { ItemActions } from "@/components/wardrobe/ItemActions";

export type ClothingCardItem = {
  id: string;
  name: string;
  category: string;
  color: string | null;
  is_archived: boolean;
  imageUrl: string | null;
  tags: string[];
};

export async function ClothingCard({
  item,
  locale,
  eager = false,
}: {
  item: ClothingCardItem;
  locale: string;
  eager?: boolean;
}) {
  const t = await getTranslations("wardrobe");
  const tCategory = await getTranslations("enums.category");
  const tColor = await getTranslations("enums.color");

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/app/wardrobe/${item.id}`} className="relative block">
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              unoptimized
              loading={eager ? "eager" : "lazy"}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : null}
        </div>
        {item.is_archived && (
          <span className="absolute top-2 start-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
            {t("archived")}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <Link
            href={`/app/wardrobe/${item.id}`}
            className="line-clamp-1 font-medium text-zinc-950 hover:underline dark:text-zinc-50"
          >
            {item.name}
          </Link>
          <p className="text-xs text-zinc-500">
            {tCategory(item.category)}
            {item.color ? ` · ${tColor(item.color)}` : ""}
          </p>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-1">
          <ItemActions
            locale={locale}
            itemId={item.id}
            isArchived={item.is_archived}
          />
        </div>
      </div>
    </div>
  );
}
