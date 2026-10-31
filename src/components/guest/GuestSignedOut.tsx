import { getTranslations } from "next-intl/server";

// Same page whether the request exists or not, so ids can't be probed.
export async function GuestSignedOut() {
  const t = await getTranslations("guest");
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-2 text-center">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("signedOutTitle")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("signedOutBody")}</p>
    </div>
  );
}
