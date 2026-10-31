import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { getGuestSession } from "@/lib/guests/session";
import { leaveAsGuest } from "@/lib/actions/guests";
import { listComments, listSuggestions, loadHeadPhotoUrl } from "@/lib/suggestions/data";
import { parseSort, type Viewer } from "@/lib/activity/rules";
import { RequestSummary } from "@/components/guest/RequestSummary";
import { GuestSignedOut } from "@/components/guest/GuestSignedOut";
import { SuggestionList } from "@/components/suggestions/SuggestionList";
import { CommentThread } from "@/components/activity/CommentThread";

export default async function GuestRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; requestId: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
}) {
  const { locale, requestId } = await params;
  const sort = parseSort((await searchParams).sort);
  const t = await getTranslations("guest");
  const tSuggestions = await getTranslations("suggestions");
  const tActivity = await getTranslations("activity");

  const session = await getGuestSession(requestId);
  if (!session) return <GuestSignedOut />;

  const finished = session.request.status === "finished";
  const viewer: Viewer = { kind: "guest", guestIdentityId: session.identityId };
  const [suggestions, comments, headUrl] = await Promise.all([
    listSuggestions(requestId),
    listComments(requestId),
    loadHeadPhotoUrl(session.request.owner_id),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-4 py-2 text-sm dark:bg-zinc-900">
        <span className="text-zinc-700 dark:text-zinc-300">
          {t("signedInAs", { nickname: session.nickname })}
        </span>
        <form action={leaveAsGuest.bind(null, locale, requestId)}>
          <button type="submit" className="text-zinc-600 underline dark:text-zinc-400">
            {t("exit")}
          </button>
        </form>
      </div>

      <RequestSummary request={session.request} />

      {finished && (
        <p className="rounded-md border border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {t("finishedReadOnly")}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
            {tSuggestions("title", { count: suggestions.length })}
          </h2>
          {!finished && (
            <Link
              href={`/guest/request/${requestId}/suggest`}
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
            >
              {tSuggestions("suggestAnOutfit")}
            </Link>
          )}
        </div>
        <SuggestionList
          suggestions={suggestions}
          comments={comments}
          headUrl={headUrl}
          viewer={viewer}
          locale={locale}
          requestId={requestId}
          finished={finished}
          sort={sort}
          basePath={`/guest/request/${requestId}`}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div>
          <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{tActivity("discussion")}</h2>
          <p className="text-sm text-zinc-500">{tActivity("discussionHint")}</p>
        </div>
        <CommentThread
          comments={comments.filter((c) => c.suggestionId === null)}
          viewer={viewer}
          locale={locale}
          requestId={requestId}
          suggestionId={null}
          finished={finished}
        />
      </section>
    </div>
  );
}
