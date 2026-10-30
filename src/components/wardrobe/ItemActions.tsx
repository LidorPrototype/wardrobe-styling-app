"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { deleteClothingItem, setArchived } from "@/lib/actions/wardrobe";

export function ItemActions({
  locale,
  itemId,
  isArchived,
}: {
  locale: string;
  itemId: string;
  isArchived: boolean;
}) {
  const t = useTranslations("wardrobe");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <Link
        href={`/app/wardrobe/${itemId}`}
        className="text-zinc-600 underline dark:text-zinc-400"
      >
        {tCommon("edit")}
      </Link>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void setArchived(locale, itemId, !isArchived);
          })
        }
        className="text-zinc-600 underline disabled:opacity-50 dark:text-zinc-400"
      >
        {isArchived ? t("unarchive") : t("archive")}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("confirmDelete"))) return;
          startTransition(() => {
            void deleteClothingItem(locale, itemId);
          });
        }}
        className="text-red-600 underline disabled:opacity-50"
      >
        {tCommon("delete")}
      </button>
    </div>
  );
}
