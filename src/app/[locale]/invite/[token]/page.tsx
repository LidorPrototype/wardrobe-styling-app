import { getFormatter, getTranslations } from "next-intl/server";
import { resolveInvite } from "@/lib/invites/resolveInvite";
import { EVENT_TIME_ZONE, toFormattableDate } from "@/lib/requests/eventDate";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("guest");
  const tOccasion = await getTranslations("enums.occasion");
  const format = await getFormatter();

  const invite = await resolveInvite(token);

  if (invite.status === "invalid") {
    return (
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t("invalidTitle")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("invalidBody")}</p>
      </div>
    );
  }

  const { request } = invite;
  const eventDate = toFormattableDate(request.event_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-500">
          {request.ownerName ? t("invitedBy", { name: request.ownerName }) : t("invitedTo")}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {request.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {[
            request.occasion && tOccasion(request.occasion),
            eventDate &&
              format.dateTime(eventDate, {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: EVENT_TIME_ZONE,
              }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {request.notes && (
        <p className="whitespace-pre-line rounded-md bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {request.notes}
        </p>
      )}

      {invite.status === "closed" ? (
        <p className="rounded-md border border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {t("closedBody")}
        </p>
      ) : (
        // Nickname + passphrase join form arrives in Milestone 5.
        <p className="rounded-md border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {t("joinSoon")}
        </p>
      )}
    </div>
  );
}
