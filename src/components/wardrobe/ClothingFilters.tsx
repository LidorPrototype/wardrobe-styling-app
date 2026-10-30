"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/routing";
import { CATEGORIES, COLORS } from "@/lib/enums/clothing";

// Filters live in the URL so the page stays a Server Component and views are linkable.
export function ClothingFilters({
  allTags,
  selected,
}: {
  allTags: string[];
  selected: {
    category?: string;
    color?: string;
    tag?: string;
    archived?: boolean;
  };
}) {
  const t = useTranslations("wardrobe");
  const tCategory = useTranslations("enums.category");
  const tColor = useTranslations("enums.color");
  const router = useRouter();
  const pathname = usePathname();

  function apply(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = {
      category: selected.category,
      color: selected.color,
      tag: selected.tag,
      archived: selected.archived ? "1" : undefined,
      ...patch,
    };
    for (const [k, val] of Object.entries(next)) {
      if (val) params.set(k, val);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const selectClass =
    "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  const hasFilters =
    selected.category || selected.color || selected.tag || selected.archived;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label={t("category")}
        value={selected.category ?? ""}
        onChange={(e) => apply({ category: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">{t("allCategories")}</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {tCategory(c)}
          </option>
        ))}
      </select>

      <select
        aria-label={t("color")}
        value={selected.color ?? ""}
        onChange={(e) => apply({ color: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">{t("allColors")}</option>
        {COLORS.map((c) => (
          <option key={c} value={c}>
            {tColor(c)}
          </option>
        ))}
      </select>

      {allTags.length > 0 && (
        <select
          aria-label={t("tags")}
          value={selected.tag ?? ""}
          onChange={(e) => apply({ tag: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">{t("allTags")}</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      )}

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={Boolean(selected.archived)}
          onChange={(e) => apply({ archived: e.target.checked ? "1" : undefined })}
        />
        {t("showArchived")}
      </label>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
