"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing, usePathname, useRouter } from "@/lib/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common.languageSwitcher");

  function handleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">{t("label")}:</span>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => handleChange(loc)}
          disabled={loc === locale}
          className={
            loc === locale
              ? "font-semibold text-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
          }
        >
          {t(loc)}
        </button>
      ))}
    </div>
  );
}
