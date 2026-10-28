import { getTranslations } from "next-intl/server";

export async function RequestStatusBadge({ status }: { status: string }) {
  const t = await getTranslations("enums.requestStatus");
  const finished = status === "finished";

  return (
    <span
      className={
        finished
          ? "rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          : "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
      }
    >
      {t(finished ? "finished" : "open")}
    </span>
  );
}
