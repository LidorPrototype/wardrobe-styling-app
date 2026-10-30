import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { EVENT_TIME_ZONE, toFormattableDate } from "@/lib/requests/eventDate";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";

export type RequestCardRow = {
  id: string;
  title: string;
  occasion: string | null;
  event_at: string | null;
  status: string;
};

export async function RequestCard({ request }: { request: RequestCardRow }) {
  const t = await getTranslations("requests");
  const tOccasion = await getTranslations("enums.occasion");
  const format = await getFormatter();

  const eventDate = toFormattableDate(request.event_at);

  return (
    <Link
      href={`/app/requests/${request.id}`}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
          {request.title}
        </h2>
        <RequestStatusBadge status={request.status} />
      </div>
      <p className="text-sm text-zinc-500">
        {request.occasion ? tOccasion(request.occasion) : t("noOccasion")}
        {eventDate
          ? ` · ${format.dateTime(eventDate, {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: EVENT_TIME_ZONE,
            })}`
          : ""}
      </p>
    </Link>
  );
}
