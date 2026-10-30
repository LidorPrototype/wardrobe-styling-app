import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

// Guest URLs carry a token or a request id: keep them out of search engines
// and out of the Referer header sent to other sites.
export const guestMetadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export async function GuestShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <span className="font-semibold text-zinc-950 dark:text-zinc-50">{t("appName")}</span>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
