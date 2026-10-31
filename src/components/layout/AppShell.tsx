import { getTranslations } from "next-intl/server";
import { logout } from "@/lib/actions/auth";
import { Link } from "@/lib/i18n/routing";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export async function AppShell({
  locale,
  userEmail,
  children,
}: {
  locale: string;
  userEmail: string | undefined;
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");
  const tApp = await getTranslations("app");
  const logoutAction = logout.bind(null, locale);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-5">
          <Link
            href="/app"
            className="font-semibold text-zinc-950 dark:text-zinc-50"
          >
            {t("appName")}
          </Link>
          <Link
            href="/app/wardrobe"
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {tApp("navWardrobe")}
          </Link>
          <Link
            href="/app/requests"
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {tApp("navRequests")}
          </Link>
          <Link
            href="/app/profile"
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {tApp("navProfile")}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {userEmail && (
            <span className="text-sm text-zinc-500">{userEmail}</span>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-950 dark:border-zinc-700 dark:text-zinc-50"
            >
              {t("logout")}
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
