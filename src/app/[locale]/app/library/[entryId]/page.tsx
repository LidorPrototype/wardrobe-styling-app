import { notFound } from "next/navigation";
import * as z from "zod";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { getLibraryEntry } from "@/lib/library/data";
import { loadHeadPhotoUrl } from "@/lib/suggestions/data";
import { SLOTS } from "@/lib/suggestions/rules";
import { deleteLibraryEntry, updateLibraryEntry } from "@/lib/actions/library";
import { OutfitFigure } from "@/components/suggestions/OutfitFigure";
import { OutfitStatusBadge } from "@/components/library/OutfitStatusBadge";
import { LibraryEntryForm } from "@/components/library/LibraryEntryForm";
import { BackArrow } from "@/components/layout/BackArrow";

export default async function LibraryEntryPage({
  params,
}: {
  params: Promise<{ locale: string; entryId: string }>;
}) {
  const { locale, entryId } = await params;
  const user = await requireUser(locale);
  if (!z.uuid().safeParse(entryId).success) notFound();

  // RLS: another owner's entry yields nothing.
  const entry = await getLibraryEntry(entryId);
  if (!entry) notFound();
  const headUrl = await loadHeadPhotoUrl(user.id);

  const t = await getTranslations("library");
  const tSuggestions = await getTranslations("suggestions");
  const tSlot = await getTranslations("enums.slot");
  const format = await getFormatter();
  const items = SLOTS.flatMap((slot) => entry.items.filter((i) => i.slot === slot));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/library" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          <BackArrow /> {t("backToLibrary")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {entry.title ?? tSuggestions("untitled")}
          </h1>
          <OutfitStatusBadge status={entry.status} />
        </div>
        <p className="text-sm text-zinc-500">
          {t("savedOn", { date: format.dateTime(new Date(entry.createdAt), { dateStyle: "medium" }) })}
          {entry.request && (
            <>
              {" · "}
              <Link href={`/app/requests/${entry.request.id}`} className="underline">
                {t("fromRequest", { title: entry.request.title })}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
          <OutfitFigure headUrl={headUrl} items={entry.items} />
        </div>
        <ul className="flex min-w-48 flex-1 flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.itemId} className="flex gap-2">
              <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-zinc-500">{tSlot(item.slot)}</span>
              <span className="text-zinc-800 dark:text-zinc-200">
                {item.name}
                {item.deleted && <span className="ms-1 text-xs text-zinc-500">{t("itemDeleted")}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <section className="flex max-w-xl flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{t("detailsTitle")}</h2>
        <LibraryEntryForm
          wornOn={entry.wornOn}
          notes={entry.notes}
          action={updateLibraryEntry.bind(null, locale, entry.id)}
          deleteAction={deleteLibraryEntry.bind(null, locale, entry.id)}
        />
      </section>
    </div>
  );
}
