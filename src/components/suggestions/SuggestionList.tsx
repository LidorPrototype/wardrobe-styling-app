import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import type { SuggestionView } from "@/lib/suggestions/data";
import { SLOTS } from "@/lib/suggestions/rules";
import { DeleteSuggestionButton } from "@/components/suggestions/DeleteSuggestionButton";

export async function SuggestionList({
  suggestions,
  deleteActionFor,
}: {
  suggestions: SuggestionView[];
  // Returns the bound delete action when the viewer may delete this one.
  deleteActionFor: (s: SuggestionView) => (() => Promise<void>) | null;
}) {
  const t = await getTranslations("suggestions");
  const tSlot = await getTranslations("enums.slot");
  const format = await getFormatter();
  const now = new Date();

  if (suggestions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        {t("none")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {suggestions.map((s) => {
        const onDelete = deleteActionFor(s);
        const items = SLOTS.flatMap((slot) => s.items.filter((i) => i.slot === slot));
        return (
          <li key={s.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="font-medium text-zinc-950 dark:text-zinc-50">{s.title ?? t("untitled")}</h3>
                <p className="text-xs text-zinc-500">
                  {s.author.kind === "guest"
                    ? t("byGuest", { name: s.author.nickname })
                    : s.author.name
                      ? t("byOwnerNamed", { name: s.author.name })
                      : t("byOwner")}
                  {" · "}
                  {format.relativeTime(new Date(s.createdAt), now)}
                </p>
              </div>
              {onDelete && <DeleteSuggestionButton action={onDelete} />}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {items.map((item) => (
                <div key={item.itemId} className="flex flex-col gap-1">
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 33vw, 16vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-500">{tSlot(item.slot)}</span>
                  <span className="-mt-1 line-clamp-1 text-xs text-zinc-700 dark:text-zinc-300">{item.name}</span>
                </div>
              ))}
            </div>

            {s.notes && (
              <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">{s.notes}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
