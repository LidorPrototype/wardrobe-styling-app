import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function Home() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-center dark:bg-black">
      <div className="absolute top-6 end-6">
        <LanguageSwitcher />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
        {t("appName")}
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        {t("tagline")}
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-zinc-950 px-5 py-2 font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          {tAuth("loginButton")}
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-zinc-300 px-5 py-2 font-medium text-zinc-950 dark:border-zinc-700 dark:text-zinc-50"
        >
          {tAuth("signupButton")}
        </Link>
      </div>
    </div>
  );
}
