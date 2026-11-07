import { getTranslations } from "next-intl/server";

export async function LoadingState() {
  const t = await getTranslations("common");

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4 py-2">
      <span className="sr-only">{t("loading")}</span>
      <div aria-hidden className="h-7 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div aria-hidden className="h-4 w-72 max-w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div aria-hidden className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
