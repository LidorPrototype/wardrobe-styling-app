"use client";

import { useTranslations } from "next-intl";

export default function InviteError({ retry }: { error: Error; retry: () => void }) {
  const t = useTranslations("guest");

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("errorTitle")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("errorBody")}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
      >
        {t("retry")}
      </button>
    </div>
  );
}
