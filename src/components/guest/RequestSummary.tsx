import { getFormatter, getTranslations } from "next-intl/server";
import { EVENT_TIME_ZONE, toFormattableDate } from "@/lib/requests/eventDate";

export async function RequestSummary({
  request,
}: {
  request: {
    title: string;
    occasion: string | null;
    event_at: string | null;
    notes: string | null;
    ownerName: string | null;
  };
}) {
  const t = await getTranslations("guest");
  const tOccasion = await getTranslations("enums.occasion");
  const format = await getFormatter();
  const eventDate = toFormattableDate(request.event_at);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-500">
          {request.ownerName ? t("invitedBy", { name: request.ownerName }) : t("invitedTo")}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{request.title}</h1>
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
    </div>
  );
}
