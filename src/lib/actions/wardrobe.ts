"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import {
  ClothingItemSchema,
  parseTags,
  validateImage,
  type WardrobeFormState,
} from "@/lib/validation/wardrobe";

const BUCKET = "wardrobe-items";

/** Field values echoed back so a failed submit does not wipe the form. */
function echo(formData: FormData): Record<string, string | string[]> {
  return {
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    subcategory: String(formData.get("subcategory") ?? ""),
    color: String(formData.get("color") ?? ""),
    season: String(formData.get("season") ?? ""),
    formality: String(formData.get("formality") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    size: String(formData.get("size") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    tags: parseTags(formData.getAll("tags")),
  };
}

function fieldErrorsFrom(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function createClothingItem(
  locale: string,
  _prevState: WardrobeFormState,
  formData: FormData,
): Promise<WardrobeFormState> {
  const user = await requireUser(locale);
  const supabase = await createClient();
  const values = echo(formData);

  const image = formData.get("image") as File | null;
  const imageError = validateImage(image, { required: true });
  if (imageError) {
    return { fieldErrors: { image: imageError }, values };
  }

  const parsed = ClothingItemSchema.safeParse({
    ...values,
    tags: values.tags as string[],
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  // The item's own wardrobe — MVP has exactly one per owner.
  const { data: wardrobe } = await supabase
    .from("wardrobes")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!wardrobe) {
    return { error: "saveFailed", values };
  }

  // Insert first so the row id can be part of the storage path.
  const { data: item, error: insertError } = await supabase
    .from("clothing_items")
    .insert({
      owner_id: user.id,
      wardrobe_id: wardrobe.id,
      name: parsed.data.name,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory ?? null,
      color: parsed.data.color ?? null,
      season: parsed.data.season ?? null,
      formality: parsed.data.formality ?? null,
      brand: parsed.data.brand ?? null,
      size: parsed.data.size ?? null,
      notes: parsed.data.notes ?? null,
      image_path: "", // set immediately below, once the id is known
    })
    .select("id")
    .single();

  if (insertError || !item) {
    return { error: "saveFailed", values };
  }

  const path = `${user.id}/${wardrobe.id}/${item.id}/original.${extensionFor(image!.type)}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, image!, { contentType: image!.type, upsert: true });

  if (uploadError) {
    // Don't leave a row pointing at an image that was never stored.
    await supabase.from("clothing_items").delete().eq("id", item.id);
    return { error: "uploadFailed", values };
  }

  await supabase
    .from("clothing_items")
    .update({ image_path: path })
    .eq("id", item.id);

  await saveTags(item.id, parsed.data.tags, { replace: false });

  revalidatePath(`/${locale}/app/wardrobe`);
  redirect({ href: "/app/wardrobe", locale });
}

export async function updateClothingItem(
  locale: string,
  itemId: string,
  _prevState: WardrobeFormState,
  formData: FormData,
): Promise<WardrobeFormState> {
  const user = await requireUser(locale);
  const supabase = await createClient();
  const values = echo(formData);

  // RLS also enforces ownership; this gives a clean error instead of a no-op.
  const { data: existing } = await supabase
    .from("clothing_items")
    .select("id, wardrobe_id, image_path")
    .eq("id", itemId)
    .maybeSingle();

  if (!existing) {
    return { error: "notFound", values };
  }

  const image = formData.get("image") as File | null;
  const imageError = validateImage(image, { required: false });
  if (imageError) {
    return { fieldErrors: { image: imageError }, values };
  }

  const parsed = ClothingItemSchema.safeParse({
    ...values,
    tags: values.tags as string[],
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  let imagePath = existing.image_path;
  if (image && image.size > 0) {
    const path = `${user.id}/${existing.wardrobe_id}/${itemId}/original.${extensionFor(image.type)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, image, { contentType: image.type, upsert: true });
    if (uploadError) {
      return { error: "uploadFailed", values };
    }
    // A different extension means a new object; drop the stale one.
    if (existing.image_path && existing.image_path !== path) {
      await supabase.storage.from(BUCKET).remove([existing.image_path]);
    }
    imagePath = path;
  }

  const { error: updateError } = await supabase
    .from("clothing_items")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory ?? null,
      color: parsed.data.color ?? null,
      season: parsed.data.season ?? null,
      formality: parsed.data.formality ?? null,
      brand: parsed.data.brand ?? null,
      size: parsed.data.size ?? null,
      notes: parsed.data.notes ?? null,
      image_path: imagePath,
    })
    .eq("id", itemId);

  if (updateError) {
    return { error: "saveFailed", values };
  }

  await saveTags(itemId, parsed.data.tags, { replace: true });

  revalidatePath(`/${locale}/app/wardrobe`);
  redirect({ href: "/app/wardrobe", locale });
}

export async function setArchived(
  locale: string,
  itemId: string,
  archived: boolean,
) {
  await requireUser(locale);
  const supabase = await createClient();

  await supabase
    .from("clothing_items")
    .update({ is_archived: archived })
    .eq("id", itemId);

  revalidatePath(`/${locale}/app/wardrobe`);
}

export async function deleteClothingItem(locale: string, itemId: string) {
  await requireUser(locale);
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("clothing_items")
    .select("image_path")
    .eq("id", itemId)
    .maybeSingle();

  // Remove the image first — an orphaned object is worse than an orphaned row,
  // since the row is what the UI lists.
  if (item?.image_path) {
    await supabase.storage.from(BUCKET).remove([item.image_path]);
  }

  await supabase.from("clothing_items").delete().eq("id", itemId);

  revalidatePath(`/${locale}/app/wardrobe`);
}

/** Tags are stored raw; replacing means delete-then-insert the whole set. */
async function saveTags(
  itemId: string,
  tags: string[],
  { replace }: { replace: boolean },
) {
  const supabase = await createClient();

  if (replace) {
    await supabase.from("clothing_item_tags").delete().eq("clothing_item_id", itemId);
  }
  if (tags.length === 0) return;

  await supabase.from("clothing_item_tags").insert(
    tags.map((tag) => ({ clothing_item_id: itemId, tag })),
  );
}
