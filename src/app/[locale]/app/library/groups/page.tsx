import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { listGroups } from "@/lib/groups/data";
import { createGroup } from "@/lib/actions/groups";
import { GroupForm } from "@/components/groups/GroupForm";
import { BackArrow } from "@/components/layout/BackArrow";

export default async function GroupsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireUser(locale);
  const t = await getTranslations("groups");
  const groups = await listGroups();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/library" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          <BackArrow /> {t("backToLibrary")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">{t("empty")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/app/library/groups/${g.id}`}
                className="flex h-full flex-col gap-1 rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <span className="font-medium text-zinc-950 dark:text-zinc-50">{g.name}</span>
                {g.description && <span className="text-sm text-zinc-600 dark:text-zinc-400">{g.description}</span>}
                <span className="text-xs text-zinc-500">{t("outfitCount", { count: g.entryCount })}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="flex max-w-md flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{t("newGroupTitle")}</h2>
        <GroupForm action={createGroup.bind(null, locale)} submitLabel={t("create")} />
      </section>
    </div>
  );
}
