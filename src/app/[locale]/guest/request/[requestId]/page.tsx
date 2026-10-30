import { getTranslations } from "next-intl/server";
import { getGuestSession } from "@/lib/guests/session";
import { leaveAsGuest } from "@/lib/actions/guests";
import { RequestSummary } from "@/components/guest/RequestSummary";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GuestRequestPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  const t = await getTranslations("guest");

  // A malformed id would make Postgres reject the uuid comparison.
  const session = UUID.test(requestId) ? await getGuestSession(requestId) : null;

  // Same page whether the request exists or not, so ids can't be probed.
  if (!session) {
    return (
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t("signedOutTitle")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("signedOutBody")}</p>
      </div>
    );
  }

  const finished = session.request.status === "finished";

  return (
    <div className="flex flex-col gap-6">
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

      {/* The wardrobe and outfit builder arrive in Milestone 6. */}
      <p className="rounded-md border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        {t("builderSoon")}
      </p>
    </div>
  );
}
