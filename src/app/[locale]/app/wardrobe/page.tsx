import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { signImageUrls } from "@/lib/wardrobe/images";
import { ClothingCard } from "@/components/wardrobe/ClothingCard";
import { ClothingFilters } from "@/components/wardrobe/ClothingFilters";

export default async function WardrobePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    color?: string;
    tag?: string;
    archived?: string;
  }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  const user = await requireUser(locale);

  const t = await getTranslations("wardrobe");
  const supabase = await createClient();

  const { data: ownedTags } = await supabase
    .from("clothing_item_tags")
    .select("tag, clothing_items!inner(owner_id)")
    .eq("clothing_items.owner_id", user.id);

  const allTags = [...new Set((ownedTags ?? []).map((r) => r.tag))].sort((a, b) =>
    a.localeCompare(b),
  );

  let query = supabase
    .from("clothing_items")
    .select("id, name, category, color, is_archived, image_path")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (!filters.archived) query = query.eq("is_archived", false);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.color) query = query.eq("color", filters.color);

  if (filters.tag) {
    // Filtering the embedded tags instead would truncate each item's tag list.
    const { data: tagged } = await supabase
      .from("clothing_item_tags")
      .select("clothing_item_id, clothing_items!inner(owner_id)")
      .eq("tag", filters.tag)
      .eq("clothing_items.owner_id", user.id);
    query = query.in("id", (tagged ?? []).map((r) => r.clothing_item_id));
  }

  const { data: items } = await query;
  const rows = items ?? [];

  const [urlMap, tagRows] = await Promise.all([
    signImageUrls(rows.map((r) => r.image_path)),
    rows.length
      ? supabase
          .from("clothing_item_tags")
          .select("clothing_item_id, tag")
          .in("clothing_item_id", rows.map((r) => r.id))
      : Promise.resolve({ data: [] as { clothing_item_id: string; tag: string }[] }),
  ]);

  const tagsByItem = new Map<string, string[]>();
  for (const row of tagRows.data ?? []) {
    const list = tagsByItem.get(row.clothing_item_id) ?? [];
    list.push(row.tag);
    tagsByItem.set(row.clothing_item_id, list);
  }

  const hasFilters = Boolean(
    filters.category || filters.color || filters.tag || filters.archived,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">
            {t("itemCount", { count: rows.length })}
          </p>
        </div>
        <Link
          href="/app/wardrobe/new"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          {t("addItem")}
        </Link>
      </div>

      <ClothingFilters
        allTags={allTags}
        selected={{
          category: filters.category,
          color: filters.color,
          tag: filters.tag,
          archived: Boolean(filters.archived),
        }}
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">
            {hasFilters ? t("noResults") : t("empty")}
          </p>
          {!hasFilters && (
            <p className="mt-1 text-sm text-zinc-500">{t("emptyHint")}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((row, index) => (
            <ClothingCard
              key={row.id}
              locale={locale}
              eager={index < 4}
              item={{
                id: row.id,
                name: row.name,
                category: row.category,
                color: row.color,
                is_archived: row.is_archived,
                imageUrl: row.image_path
                  ? (urlMap.get(row.image_path) ?? null)
                  : null,
                tags: tagsByItem.get(row.id) ?? [],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
