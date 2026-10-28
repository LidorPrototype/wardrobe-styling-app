import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { ClothingItemForm } from "@/components/wardrobe/ClothingItemForm";
import { BackArrow } from "@/components/layout/BackArrow";

export default async function NewClothingItemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);
  const t = await getTranslations("wardrobe");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/app/wardrobe"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          <BackArrow /> {t("backToWardrobe")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t("newItemTitle")}
        </h1>
      </div>
      <ClothingItemForm />
    </div>
  );
}
