import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { listLibrary } from "@/lib/library/data";
import { LIBRARY_STATUSES, parseLibraryFilter } from "@/lib/library/rules";
import { loadHeadPhotoUrl } from "@/lib/suggestions/data";
import { LibraryEntryGrid } from "@/components/library/LibraryEntryGrid";

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
  const [entries, headUrl] = await Promise.all([listLibrary({ status: filter }), loadHeadPhotoUrl(user.id)]);

  const tabs = [null, ...LIBRARY_STATUSES];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
        <Link
          href="/app/library/groups"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:text-zinc-50"
        >
          {t("groupsLink")}
        </Link>
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
        <LibraryEntryGrid entries={entries} headUrl={headUrl} />
      )}
    </div>
  );
}
