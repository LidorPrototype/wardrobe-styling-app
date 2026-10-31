import { notFound } from "next/navigation";
import * as z from "zod";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { getGroup } from "@/lib/groups/data";
import { listLibrary } from "@/lib/library/data";
import { loadHeadPhotoUrl } from "@/lib/suggestions/data";
import { deleteGroup, updateGroup } from "@/lib/actions/groups";
import { GroupForm } from "@/components/groups/GroupForm";
import { DeleteGroupButton } from "@/components/groups/DeleteGroupButton";
import { LibraryEntryGrid } from "@/components/library/LibraryEntryGrid";
import { BackArrow } from "@/components/layout/BackArrow";

export default async function GroupPage({ params }: { params: Promise<{ locale: string; groupId: string }> }) {
  const { locale, groupId } = await params;
  const user = await requireUser(locale);
  if (!z.uuid().safeParse(groupId).success) notFound();

  // RLS: another owner's group yields nothing.
  const group = await getGroup(groupId);
  if (!group) notFound();
  const [entries, headUrl] = await Promise.all([listLibrary({ groupId }), loadHeadPhotoUrl(user.id)]);
  const t = await getTranslations("groups");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/library/groups" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          <BackArrow /> {t("backToGroups")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{group.name}</h1>
        {group.description && <p className="text-sm text-zinc-600 dark:text-zinc-400">{group.description}</p>}
        <p className="text-sm text-zinc-500">{t("outfitCount", { count: group.entryCount })}</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">{t("groupEmpty")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("groupEmptyHint")}</p>
        </div>
      ) : (
        <LibraryEntryGrid entries={entries} headUrl={headUrl} />
      )}

      <section className="flex max-w-md flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{t("editTitle")}</h2>
        <GroupForm
          action={updateGroup.bind(null, locale, group.id)}
          initial={{ name: group.name, description: group.description }}
          submitLabel={t("save")}
        />
        <div>
          <DeleteGroupButton action={deleteGroup.bind(null, locale, group.id)} />
        </div>
      </section>
    </div>
  );
}
