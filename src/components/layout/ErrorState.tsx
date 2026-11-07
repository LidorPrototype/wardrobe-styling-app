"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

// Body of an error boundary: the details stay in the server logs.
export function ErrorState({ retry, homeHref }: { retry: () => void; homeHref: string }) {
  const t = useTranslations("common");

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("errorTitle")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("errorBody")}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          {t("retry")}
        </button>
        <Link href={homeHref} className="text-sm text-zinc-600 underline dark:text-zinc-400">
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
