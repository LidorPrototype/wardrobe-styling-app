import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import type { LibraryEntryView } from "@/lib/library/data";
import { calendarDate } from "@/lib/library/rules";
import { OutfitFigure } from "@/components/suggestions/OutfitFigure";
import { OutfitStatusBadge } from "@/components/library/OutfitStatusBadge";
import { GroupChips } from "@/components/groups/GroupChips";

export async function LibraryEntryGrid({ entries, headUrl }: { entries: LibraryEntryView[]; headUrl: string | null }) {
  const t = await getTranslations("library");
  const tSuggestions = await getTranslations("suggestions");
  const format = await getFormatter();

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/app/library/${entry.id}`}
            className="flex h-full gap-3 rounded-lg border border-zinc-200 p-3 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="shrink-0 rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
              <OutfitFigure headUrl={headUrl} items={entry.items} size="sm" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                {entry.title ?? tSuggestions("untitled")}
              </span>
              <div>
                <OutfitStatusBadge status={entry.status} />
              </div>
              <span className="text-xs text-zinc-500">
                {entry.wornOn
                  ? t("wornOn", { date: format.dateTime(calendarDate(entry.wornOn), { dateStyle: "medium", timeZone: "UTC" }) })
                  : t("savedOn", { date: format.dateTime(new Date(entry.createdAt), { dateStyle: "medium" }) })}
              </span>
              {entry.request && (
                <span className="truncate text-xs text-zinc-500">{t("fromRequest", { title: entry.request.title })}</span>
              )}
              <GroupChips groups={entry.groups} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
