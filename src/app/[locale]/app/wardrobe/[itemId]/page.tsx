import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { signImageUrl } from "@/lib/wardrobe/images";
import { ClothingItemForm } from "@/components/wardrobe/ClothingItemForm";

export default async function EditClothingItemPage({
  params,
}: {
  params: Promise<{ locale: string; itemId: string }>;
}) {
  const { locale, itemId } = await params;
  await requireUser(locale);

  const t = await getTranslations("wardrobe");
  const supabase = await createClient();

  // RLS scopes this to the owner, so another owner's id simply yields nothing.
  const { data: item } = await supabase
    .from("clothing_items")
    .select(
      "id, name, category, subcategory, color, season, formality, brand, size, notes, image_path",
    )
    .eq("id", itemId)
    .maybeSingle();

  if (!item) notFound();

  const { data: tagRows } = await supabase
    .from("clothing_item_tags")
    .select("tag")
    .eq("clothing_item_id", itemId);

  const imageUrl = await signImageUrl(item.image_path);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/app/wardrobe"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← {t("backToWardrobe")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t("editItemTitle")}
        </h1>
      </div>

      <ClothingItemForm
        itemId={item.id}
        existingImageUrl={imageUrl}
        initial={{
          name: item.name,
          category: item.category,
          subcategory: item.subcategory ?? "",
          color: item.color ?? "",
          season: item.season ?? "",
          formality: item.formality ?? "",
          brand: item.brand ?? "",
          size: item.size ?? "",
          notes: item.notes ?? "",
          tags: (tagRows ?? []).map((r) => r.tag),
        }}
      />
    </div>
  );
}
