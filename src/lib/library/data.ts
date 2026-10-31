import "server-only";

import { createClient } from "@/lib/supabase/server";
import { signImageUrls } from "@/lib/wardrobe/images";
import type { Slot } from "@/lib/suggestions/rules";
import type { LibraryStatus } from "@/lib/library/rules";

// Owner-only, through RLS: another owner's entries simply aren't returned.

export type LibraryEntryView = {
  id: string;
  title: string | null;
  notes: string | null;
  status: LibraryStatus;
  wornOn: string | null;
  createdAt: string;
  // null once the suggestion or its request was deleted.
  request: { id: string; title: string } | null;
  items: {
    itemId: string;
    name: string;
    category: string;
    slot: Slot;
    imageUrl: string | null;
    // The item was deleted from the wardrobe after this was saved.
    deleted: boolean;
  }[];
};

type EntryRow = {
  id: string;
  title: string | null;
  notes: string | null;
  status: LibraryStatus;
  worn_on: string | null;
  created_at: string;
  source: { styling_requests: { id: string; title: string } | null } | null;
  outfit_library_items: {
    id: string;
    item_name: string;
    item_category: string;
    slot: Slot;
    sort_order: number;
    clothing_items: { image_path: string } | null;
  }[];
};

const ENTRY_SELECT =
  "id, title, notes, status, worn_on, created_at, source:outfit_suggestions(styling_requests(id, title)), outfit_library_items(id, item_name, item_category, slot, sort_order, clothing_items(image_path))";

async function toViews(rows: EntryRow[]): Promise<LibraryEntryView[]> {
  const urls = await signImageUrls(
    rows.flatMap((e) => e.outfit_library_items.map((i) => i.clothing_items?.image_path)),
  );
  return rows.map((e) => ({
    id: e.id,
    title: e.title,
    notes: e.notes,
    status: e.status,
    wornOn: e.worn_on,
    createdAt: e.created_at,
    request: e.source?.styling_requests ?? null,
    items: [...e.outfit_library_items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        itemId: i.id,
        name: i.item_name,
        category: i.item_category,
        slot: i.slot,
        imageUrl: i.clothing_items ? (urls.get(i.clothing_items.image_path) ?? null) : null,
        deleted: !i.clothing_items,
      })),
  }));
}

export async function listLibrary(status: LibraryStatus | null): Promise<LibraryEntryView[]> {
  const supabase = await createClient();
  let query = supabase.from("outfit_library_entries").select(ENTRY_SELECT);
  if (status) query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false }).returns<EntryRow[]>();
  if (error) throw new Error(`library lookup failed: ${error.message}`);
  return toViews(data);
}

export async function getLibraryEntry(entryId: string): Promise<LibraryEntryView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_library_entries")
    .select(ENTRY_SELECT)
    .eq("id", entryId)
    .returns<EntryRow[]>()
    .maybeSingle();
  if (error) throw new Error(`library lookup failed: ${error.message}`);
  return data ? (await toViews([data]))[0] : null;
}

// How many times each suggestion was saved to the library.
export async function countLibraryEntries(suggestionIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (suggestionIds.length === 0) return counts;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_library_entries")
    .select("source_suggestion_id")
    .in("source_suggestion_id", suggestionIds);
  if (error) throw new Error(`library lookup failed: ${error.message}`);
  for (const row of data) {
    const id = row.source_suggestion_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
