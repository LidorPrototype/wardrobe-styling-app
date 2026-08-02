import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function Home() {
  const t = useTranslations("common");

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
    </div>
  );
}
