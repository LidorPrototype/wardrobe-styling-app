import { getFormatter, getTranslations } from "next-intl/server";
import type { SuggestionView } from "@/lib/suggestions/data";
import { SLOTS } from "@/lib/suggestions/rules";
import { DeleteSuggestionButton } from "@/components/suggestions/DeleteSuggestionButton";
import { OutfitFigure } from "@/components/suggestions/OutfitFigure";

export async function SuggestionList({
  suggestions,
  headUrl,
  deleteActionFor,
}: {
  suggestions: SuggestionView[];
  headUrl: string | null;
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

            <div className="flex flex-wrap items-start gap-4">
              <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900">
                <OutfitFigure headUrl={headUrl} items={items} size="sm" />
              </div>
              <ul className="flex min-w-40 flex-1 flex-col gap-1 text-sm">
                {items.map((item) => (
                  <li key={item.itemId} className="flex gap-2">
                    <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-zinc-500">{tSlot(item.slot)}</span>
                    <span className="text-zinc-800 dark:text-zinc-200">{item.name}</span>
                  </li>
                ))}
              </ul>
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
