import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { listLibrary } from "@/lib/library/data";
import { calendarDate, LIBRARY_STATUSES, parseLibraryFilter } from "@/lib/library/rules";
import { loadHeadPhotoUrl } from "@/lib/suggestions/data";
import { OutfitFigure } from "@/components/suggestions/OutfitFigure";
import { OutfitStatusBadge } from "@/components/library/OutfitStatusBadge";

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const filter = parseLibraryFilter((await searchParams).status);

  const t = await getTranslations("library");
  const tStatus = await getTranslations("enums.outfitStatus");
  const tSuggestions = await getTranslations("suggestions");
  const format = await getFormatter();
  const [entries, headUrl] = await Promise.all([listLibrary(filter), loadHeadPhotoUrl(user.id)]);

  const tabs = [null, ...LIBRARY_STATUSES];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-2 text-sm">
        {tabs.map((status) => (
          <Link
            key={status ?? "all"}
            href={status ? `/app/library?status=${status}` : "/app/library"}
            aria-current={status === filter ? "true" : undefined}
            className={`rounded-full px-3 py-1 ${
              status === filter
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            {status ? tStatus(status) : t("all")}
          </Link>
        ))}
      </nav>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">{filter ? t("emptyFiltered") : t("empty")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("emptyHint")}</p>
        </div>
      ) : (
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
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
