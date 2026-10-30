import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Owner-scoped storage cleanup.
 *
 * Everything here goes through the Storage API on purpose. Deleting rows from
 * `storage.objects` with SQL removes only the metadata — the underlying file
 * stays in the storage backend, still billed and now unfindable, because the
 * row was the index. So a DB trigger is NOT a valid cleanup path here.
 * See https://supabase.com/docs/guides/storage/management/delete-objects
 *
 * These functions take the Supabase client as an argument (rather than building
 * one) so the same logic runs from a server action and from a CLI script.
 */

export const WARDROBE_BUCKET = "wardrobe-items";

/** Storage list() returns folders as entries with a null id. */
function isFolder(entry: { id: string | null }) {
  return entry.id === null;
}

/**
 * Every object path under a prefix, walking nested folders.
 * Covers `{owner}/{wardrobe}/{item}/original.*` and, from Milestone 6,
 * `{owner}/profile/full-body.*` — anything under the owner's folder.
 */
export async function listObjectsUnder(
  supabase: SupabaseClient,
  prefix: string,
  maxDepth = 6,
): Promise<string[]> {
  if (maxDepth < 0) return [];

  const { data, error } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .list(prefix, { limit: 1000 });

  if (error || !data) return [];

  const paths: string[] = [];
  for (const entry of data) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (isFolder(entry)) {
      paths.push(...(await listObjectsUnder(supabase, full, maxDepth - 1)));
    } else {
      paths.push(full);
    }
  }
  return paths;
}

/** Top-level folder names in the bucket — one per owner id. */
export async function listOwnerFolders(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .list("", { limit: 1000 });

  if (error || !data) return [];
  return data.filter(isFolder).map((e) => e.name);
}

/**
 * Deletes every stored object belonging to one owner. Safe to call for an owner
 * with no objects. Returns the paths that were removed.
 */
export async function deleteOwnerStorage(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<{ deleted: string[]; error: string | null }> {
  const paths = await listObjectsUnder(supabase, ownerId);
  if (paths.length === 0) return { deleted: [], error: null };

  // remove() caps at 1000 paths per call.
  const deleted: string[] = [];
  for (let i = 0; i < paths.length; i += 1000) {
    const batch = paths.slice(i, i + 1000);
    const { error } = await supabase.storage
      .from(WARDROBE_BUCKET)
      .remove(batch);
    if (error) return { deleted, error: error.message };
    deleted.push(...batch);
  }
  return { deleted, error: null };
}

/**
 * Owner folders in the bucket with no matching `profiles` row — i.e. storage
 * left behind by a deleted account. Deleting an auth user cascades the database
 * rows but never touches storage, so these accumulate silently, including when
 * the deletion is done from the Supabase dashboard.
 *
 * Requires a client that can read all profiles (the secret key).
 */
export async function findOrphanedOwnerIds(
  supabase: SupabaseClient,
): Promise<string[]> {
  const folders = await listOwnerFolders(supabase);
  if (folders.length === 0) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .in("id", folders);

  if (error) throw new Error(`could not read profiles: ${error.message}`);

  const live = new Set((profiles ?? []).map((p) => p.id as string));
  return folders.filter((id) => !live.has(id));
}
