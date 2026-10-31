import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const WARDROBE_BUCKET = "wardrobe-items";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Signs all paths in one request rather than one per card. Guests have no
 * session, so guest pages pass the admin client after checking access.
 */
export async function signImageUrls(
  paths: (string | null | undefined)[],
  client?: SupabaseClient,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const supabase = client ?? (await createClient());
  const { data } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);

  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) {
      map.set(entry.path, entry.signedUrl);
    }
  }
  return map;
}

export async function signImageUrl(path: string | null | undefined) {
  if (!path) return null;
  const map = await signImageUrls([path]);
  return map.get(path) ?? null;
}
