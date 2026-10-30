"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { parseDisplayName } from "@/lib/profile/displayName";

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
