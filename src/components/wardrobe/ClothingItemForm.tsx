"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/lib/i18n/routing";
import {
  CATEGORIES,
  COLORS,
  FORMALITIES,
  SEASONS,
  subcategoriesFor,
} from "@/lib/enums/clothing";
import { createClothingItem, updateClothingItem } from "@/lib/actions/wardrobe";
import type { WardrobeFormState } from "@/lib/validation/wardrobe";
import { EnumSelect } from "@/components/wardrobe/EnumSelect";
import { TagInput } from "@/components/wardrobe/TagInput";

export type ClothingItemFormValues = {
  name: string;
  category: string;
  subcategory: string;
  color: string;
  season: string;
  formality: string;
  brand: string;
  size: string;
  notes: string;
  tags: string[];
};

const EMPTY: ClothingItemFormValues = {
  name: "",
  category: "",
  subcategory: "",
  color: "",
  season: "",
  formality: "",
  brand: "",
  size: "",
  notes: "",
  tags: [],
};

export function ClothingItemForm({
  itemId,
  initial = EMPTY,
  existingImageUrl,
}: {
  itemId?: string;
  initial?: ClothingItemFormValues;
  existingImageUrl?: string | null;
}) {
  const locale = useLocale();
  const t = useTranslations("wardrobe");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("wardrobe.errors");

  const action = itemId
    ? updateClothingItem.bind(null, locale, itemId)
    : createClothingItem.bind(null, locale);

  const [state, formAction, pending] = useActionState<
    WardrobeFormState,
    FormData
  >(action, undefined);

  // A failed submit's echoed values win over the saved row.
  const v = { ...initial, ...(state?.values ?? {}) } as ClothingItemFormValues;

  const [category, setCategory] = useState(v.category);
  const [preview, setPreview] = useState<string | null>(null);

  const err = (field: string) =>
    state?.fieldErrors?.[field] ? tErrors(state.fieldErrors[field]!) : undefined;

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {tErrors(state.error)}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          {t("image")}
          {itemId && (
            <span className="ms-1 text-xs text-zinc-400">
              ({tCommon("optional")})
            </span>
          )}
        </span>
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          required={!itemId}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className={inputClass}
        />
        <span className="text-xs text-zinc-400">{t("imageHint")}</span>
        {err("image") && (
          <span className="text-sm text-red-600">{err("image")}</span>
        )}
        {(preview || existingImageUrl) && (
          <Image
            src={preview ?? existingImageUrl!}
            alt=""
            width={128}
            height={128}
            unoptimized
            className="mt-2 h-32 w-32 rounded-md object-cover"
          />
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("name")}</span>
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={v.name}
          className={inputClass}
        />
        {err("name") && (
          <span className="text-sm text-red-600">{err("name")}</span>
        )}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <EnumSelect
          name="category"
          namespace="category"
          options={CATEGORIES}
          label={t("category")}
          value={category}
          onChange={setCategory}
          required
          error={err("category")}
        />
        <EnumSelect
          // Remount when the category changes so a now-invalid subcategory
          // does not stay selected.
          key={`sub-${category}`}
          name="subcategory"
          namespace="subcategory"
          options={category ? subcategoriesFor(category) : []}
          label={t("subcategory")}
          value={v.subcategory}
          error={err("subcategory")}
        />
        <EnumSelect
          name="color"
          namespace="color"
          options={COLORS}
          label={t("color")}
          value={v.color}
          error={err("color")}
        />
        <EnumSelect
          name="season"
          namespace="season"
          options={SEASONS}
          label={t("season")}
          value={v.season}
          error={err("season")}
        />
        <EnumSelect
          name="formality"
          namespace="formality"
          options={FORMALITIES}
          label={t("formality")}
          value={v.formality}
          error={err("formality")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">
            {t("brand")}
            <span className="ms-1 text-xs text-zinc-400">
              ({tCommon("optional")})
            </span>
          </span>
          <input name="brand" defaultValue={v.brand} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">
            {t("size")}
            <span className="ms-1 text-xs text-zinc-400">
              ({tCommon("optional")})
            </span>
          </span>
          <input name="size" defaultValue={v.size} className={inputClass} />
        </label>
      </div>

      <TagInput defaultTags={v.tags} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          {t("notes")}
          <span className="ms-1 text-xs text-zinc-400">
            ({tCommon("optional")})
          </span>
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={v.notes}
          className={inputClass}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {pending ? tCommon("saving") : tCommon("save")}
        </button>
        <Link
          href="/app/wardrobe"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          {tCommon("cancel")}
        </Link>
      </div>
    </form>
  );
}
