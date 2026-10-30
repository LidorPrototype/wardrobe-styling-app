import type { SupabaseClient } from "@supabase/supabase-js";

// Must go through the Storage API: deleting `storage.objects` rows with SQL
// (e.g. from a trigger) removes the index but leaves the file in the backend.

export const WARDROBE_BUCKET = "wardrobe-items";

/** Storage list() returns folders as entries with a null id. */
function isFolder(entry: { id: string | null }) {
  return entry.id === null;
}

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

export async function listOwnerFolders(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .list("", { limit: 1000 });

  if (error || !data) return [];
  return data.filter(isFolder).map((e) => e.name);
}

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
 * Owner folders with no `profiles` row. Deleting an auth user cascades database
 * rows but never storage. Needs a client that can read all profiles.
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
