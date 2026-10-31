import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import type { CommentView, SuggestionView } from "@/lib/suggestions/data";
import { SLOTS } from "@/lib/suggestions/rules";
import { isMine, SORT_ORDERS, sortSuggestions, type SortOrder, type Viewer } from "@/lib/activity/rules";
import { deleteGuestSuggestion, deleteOwnerSuggestion } from "@/lib/actions/suggestions";
import { toggleGuestLike, toggleOwnerLike } from "@/lib/actions/activity";
import { DeleteSuggestionButton } from "@/components/suggestions/DeleteSuggestionButton";
import { OutfitFigure } from "@/components/suggestions/OutfitFigure";
import { LikeButton } from "@/components/activity/LikeButton";
import { CommentThread, authorLabel } from "@/components/activity/CommentThread";
import { statusShownTo } from "@/lib/library/rules";
import { recordOutfitDecision } from "@/lib/actions/library";
import { OutfitStatusBadge } from "@/components/library/OutfitStatusBadge";
import { DecisionButtons } from "@/components/library/DecisionButtons";

const LIKERS_SHOWN = 3;

export async function SuggestionList({
  suggestions,
  comments,
  headUrl,
  viewer,
  locale,
  requestId,
  finished,
  sort,
  basePath,
  libraryCounts,
}: {
  suggestions: SuggestionView[];
  comments: CommentView[];
  headUrl: string | null;
  viewer: Viewer;
  locale: string;
  requestId: string;
  finished: boolean;
  sort: SortOrder;
  // The page this list is on, for the sort links.
  basePath: string;
  // Owner only: how many library entries each suggestion has.
  libraryCounts?: Map<string, number>;
}) {
  const t = await getTranslations("suggestions");
  const tActivity = await getTranslations("activity");
  const tLibrary = await getTranslations("library");
  const tSlot = await getTranslations("enums.slot");
  const format = await getFormatter();
  const now = new Date();
  const asGuest = viewer.kind === "guest";

  if (suggestions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        {t("none")}
      </p>
    );
  }

  const sorted = sortSuggestions(suggestions, sort);

  return (
    <div className="flex flex-col gap-3">
      {suggestions.length > 1 && (
        <nav aria-label={tActivity("sortLabel")} className="flex gap-2 text-sm">
          {SORT_ORDERS.map((order) => (
            <Link
              key={order}
              href={order === "newest" ? basePath : `${basePath}?sort=${order}`}
              scroll={false}
              aria-current={order === sort ? "true" : undefined}
              className={`rounded-full px-3 py-1 ${
                order === sort
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                  : "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {tActivity(`sort.${order}`)}
            </Link>
          ))}
        </nav>
      )}

      <ul className="flex flex-col gap-4">
        {await Promise.all(
          sorted.map(async (s) => {
            const mine = isMine(viewer, s.author);
            const status = statusShownTo(viewer.kind, s.status);
            const saved = libraryCounts?.get(s.id) ?? 0;
            const items = SLOTS.flatMap((slot) => s.items.filter((i) => i.slot === slot));
            const thread = comments.filter((c) => c.suggestionId === s.id);
            const names = await Promise.all(s.likes.slice(0, LIKERS_SHOWN).map(authorLabel));
            const hidden = s.likes.length - names.length;
            const likers =
              names.length === 0
                ? null
                : hidden > 0
                  ? tActivity("likersMore", { names: names.join(", "), count: hidden })
                  : names.join(", ");

            return (
              <li key={s.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-950 dark:text-zinc-50">{s.title ?? t("untitled")}</h3>
                      {status && <OutfitStatusBadge status={status} />}
                    </div>
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
                  {!finished && mine && (
                    <DeleteSuggestionButton
                      action={(asGuest ? deleteGuestSuggestion : deleteOwnerSuggestion).bind(null, locale, requestId, s.id)}
                    />
                  )}
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

                <LikeButton
                  liked={s.likes.some((a) => isMine(viewer, a))}
                  count={s.likes.length}
                  likers={likers}
                  action={
                    !finished && !mine
                      ? (asGuest ? toggleGuestLike : toggleOwnerLike).bind(null, locale, requestId, s.id)
                      : null
                  }
                />

                {viewer.kind === "owner" && (
                  <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <DecisionButtons
                      status={s.status}
                      action={recordOutfitDecision.bind(null, locale, requestId, s.id)}
                    />
                    {saved > 0 && (
                      <Link href="/app/library" className="text-xs text-zinc-600 underline dark:text-zinc-400">
                        {tLibrary("savedCount", { count: saved })}
                      </Link>
                    )}
                  </div>
                )}

                <details className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <summary className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                    {tActivity("commentsCount", { count: thread.length })}
                  </summary>
                  <div className="mt-3">
                    <CommentThread
                      comments={thread}
                      viewer={viewer}
                      locale={locale}
                      requestId={requestId}
                      suggestionId={s.id}
                      finished={finished}
                    />
                  </div>
                </details>
              </li>
            );
          }),
        )}
      </ul>
    </div>
  );
}
