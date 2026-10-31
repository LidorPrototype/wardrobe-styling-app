"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import {
  addToSlot,
  defaultSlotFor,
  emptySelection,
  isSlotFull,
  NOTES_MAX,
  removeItem,
  SLOT_CAPACITY,
  SLOTS,
  TITLE_MAX,
  type Selection,
  type Slot,
} from "@/lib/suggestions/rules";
import type { SuggestionFormState } from "@/lib/actions/suggestions";
import type { BuilderItem } from "@/lib/suggestions/data";

export function OutfitBuilder({
  items,
  action,
  cancelHref,
}: {
  items: BuilderItem[];
  action: (state: SuggestionFormState, formData: FormData) => Promise<SuggestionFormState>;
  cancelHref: string;
}) {
  const t = useTranslations("suggestions");
  const tSlot = useTranslations("enums.slot");
  const tCategory = useTranslations("enums.category");
  const tErrors = useTranslations("suggestions.errors");
  const [state, formAction, pending] = useActionState(action, undefined);

  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [dragOver, setDragOver] = useState<Slot | null>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const slotOf = (itemId: string) => SLOTS.find((s) => selection[s].includes(itemId));
  const selectedCount = SLOTS.reduce((n, s) => n + selection[s].length, 0);

  const categories = [...new Set(items.map((i) => i.category))];
  const tags = [...new Set(items.flatMap((i) => i.tags))].sort((a, b) => a.localeCompare(b));
  const visible = items.filter(
    (i) => (!category || i.category === category) && (!tag || i.tags.includes(tag)),
  );

  const selectClass =
    "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <form action={formAction} className="flex flex-col gap-6 lg:grid lg:grid-cols-[18rem_1fr] lg:items-start">
      {SLOTS.flatMap((slot) =>
        selection[slot].map((id) => <input key={id} type="hidden" name="item" value={`${slot}:${id}`} />),
      )}

      {/* On phones the wardrobe comes first: picking items is the main task. */}
      <section className="order-2 flex flex-col gap-3 lg:sticky lg:top-4 lg:order-none" aria-label={t("outfit")}>
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{t("outfit")}</h2>
        <ul className="flex flex-col gap-2">
          {SLOTS.map((slot) => (
            <li
              key={slot}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(slot);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (byId.has(id)) setSelection((s) => addToSlot(s, slot, id));
              }}
              className={`flex min-h-14 flex-col gap-1 rounded-md border px-3 py-2 ${
                dragOver === slot
                  ? "border-zinc-950 dark:border-zinc-50"
                  : "border-dashed border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <span className="text-xs text-zinc-500">
                {tSlot(slot)}
                {SLOT_CAPACITY[slot] > 1 && ` (${selection[slot].length}/${SLOT_CAPACITY[slot]})`}
              </span>
              <div className="flex flex-wrap gap-2">
                {selection[slot].map((id) => {
                  const item = byId.get(id)!;
                  return (
                    <span key={id} className="flex items-center gap-1 rounded-full bg-zinc-100 py-0.5 ps-2 pe-1 text-xs dark:bg-zinc-800">
                      {item.name}
                      <button
                        type="button"
                        onClick={() => setSelection((s) => removeItem(s, id))}
                        aria-label={t("removeItem", { name: item.name })}
                        className="px-1 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">{t("titleField")}</span>
          <input name="title" maxLength={TITLE_MAX} placeholder={t("titlePlaceholder")} className={selectClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">{t("notesField")}</span>
          <textarea name="notes" rows={3} maxLength={NOTES_MAX} placeholder={t("notesPlaceholder")} className={selectClass} />
        </label>

        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {tErrors(state.error)}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || selectedCount === 0}
            className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
          <Link href={cancelHref} className="text-sm text-zinc-600 underline dark:text-zinc-400">
            {t("cancel")}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-label={t("wardrobe")}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="me-auto font-medium text-zinc-950 dark:text-zinc-50">{t("wardrobe")}</h2>
          <select aria-label={t("filterCategory")} value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
            <option value="">{t("allCategories")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {tCategory(c)}
              </option>
            ))}
          </select>
          {tags.length > 0 && (
            <select aria-label={t("filterTag")} value={tag} onChange={(e) => setTag(e.target.value)} className={selectClass}>
              <option value="">{t("allTags")}</option>
              {tags.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          )}
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            {t("emptyWardrobe")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((item, index) => {
              const inSlot = slotOf(item.id);
              const target = defaultSlotFor(item.category);
              const blocked = !inSlot && SLOT_CAPACITY[target] > 1 && isSlotFull(selection, target);
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                  className={`flex flex-col overflow-hidden rounded-lg border bg-white dark:bg-zinc-900 ${
                    inSlot ? "border-zinc-950 dark:border-zinc-50" : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        draggable={false}
                        loading={index < 4 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-2">
                    <span className="line-clamp-1 text-sm text-zinc-950 dark:text-zinc-50">{item.name}</span>
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() =>
                        setSelection((s) => (inSlot ? removeItem(s, item.id) : addToSlot(s, target, item.id)))
                      }
                      className="mt-auto rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-950 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50"
                    >
                      {inSlot
                        ? t("remove")
                        : blocked
                          ? t("slotFull", { slot: tSlot(target) })
                          : isSlotFull(selection, target)
                            ? t("swapInto", { slot: tSlot(target) })
                            : t("addTo", { slot: tSlot(target) })}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </form>
  );
}
