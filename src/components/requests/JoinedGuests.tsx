import { getFormatter, getTranslations } from "next-intl/server";

export async function JoinedGuests({
  guests,
}: {
  guests: { id: string; nickname: string; created_at: string }[];
}) {
  const t = await getTranslations("invites");
  const format = await getFormatter();
  // Relative times don't depend on the server's time zone.
  const now = new Date();

  return (
    <div className="flex flex-col gap-1 text-sm">
      <h3 className="text-zinc-700 dark:text-zinc-300">{t("joinedTitle", { count: guests.length })}</h3>
      {guests.length === 0 ? (
        <p className="text-xs text-zinc-500">{t("joinedEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {guests.map((g) => (
            <li key={g.id} className="flex justify-between gap-3">
              <span className="text-zinc-950 dark:text-zinc-50">{g.nickname}</span>
              <span className="text-xs text-zinc-500">
                {t("joinedWhen", { when: format.relativeTime(new Date(g.created_at), now) })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
