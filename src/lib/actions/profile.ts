"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { parseDisplayName } from "@/lib/profile/displayName";
import { imageExtension, validateImage } from "@/lib/validation/wardrobe";
import { WARDROBE_BUCKET } from "@/lib/wardrobe/images";

export async function updateDisplayName(
  locale: string,
  raw: string,
): Promise<{ value?: string | null; error?: string }> {
  const user = await requireUser(locale);

  const parsed = parseDisplayName(raw);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.value })
    .eq("id", user.id);

  if (error) return { error: "nameSaveFailed" };

  revalidatePath(`/${locale}/app/requests`, "layout");
  return { value: parsed.value };
}

export type HeadPhotoState = { error?: string; saved?: boolean } | undefined;

// Shown to guests above every outfit, through short-lived signed URLs.
export async function uploadHeadPhoto(
  locale: string,
  _prev: HeadPhotoState,
  formData: FormData,
): Promise<HeadPhotoState> {
  const user = await requireUser(locale);
  const photo = formData.get("photo") as File | null;
  const invalid = validateImage(photo, { required: true });
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("head_photo_path")
    .eq("id", user.id)
    .single();
  if (readError) return { error: "uploadFailed" };

  const path = `${user.id}/profile/head.${imageExtension(photo!.type)}`;
  const { error: uploadError } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .upload(path, photo!, { contentType: photo!.type, upsert: true });
  if (uploadError) return { error: "uploadFailed" };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ head_photo_path: path })
    .eq("id", user.id);
  if (updateError) return { error: "uploadFailed" };

  // A different extension is a different object; drop the stale one.
  if (profile.head_photo_path && profile.head_photo_path !== path) {
    await supabase.storage.from(WARDROBE_BUCKET).remove([profile.head_photo_path]);
  }

  revalidatePath(`/${locale}/app`, "layout");
  return { saved: true };
}

export async function removeHeadPhoto(locale: string) {
  const user = await requireUser(locale);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("head_photo_path")
    .eq("id", user.id)
    .single();
  if (!profile?.head_photo_path) return;

  await supabase.storage.from(WARDROBE_BUCKET).remove([profile.head_photo_path]);
  await supabase.from("profiles").update({ head_photo_path: null }).eq("id", user.id);

  revalidatePath(`/${locale}/app`, "layout");
}
