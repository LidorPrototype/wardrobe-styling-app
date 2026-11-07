import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";

export async function NotFoundState({ homeHref }: { homeHref: string }) {
  const t = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm font-medium text-zinc-500">404</p>
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("notFoundTitle")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("notFoundBody")}</p>
      <Link href={homeHref} className="text-sm text-zinc-600 underline dark:text-zinc-400">
        {t("goHome")}
      </Link>
    </div>
  );
}
