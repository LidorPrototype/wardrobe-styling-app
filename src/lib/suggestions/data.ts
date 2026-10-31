import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { signImageUrls } from "@/lib/wardrobe/images";
import { guestSafeDisplayName } from "@/lib/profile/displayName";
import type { Slot } from "@/lib/suggestions/rules";

// These read with the secret key so guest and owner pages share one shape.
// Callers must already have checked access to the request (guest session or
// an RLS-scoped owner lookup).

export type BuilderItem = {
  id: string;
  name: string;
  category: string;
  color: string | null;
  tags: string[];
  imageUrl: string | null;
};

export async function loadRequestWardrobe(wardrobeId: string): Promise<BuilderItem[]> {
  const admin = createAdminClient();
  const { data: items, error } = await admin
    .from("clothing_items")
    .select("id, name, category, color, image_path, clothing_item_tags(tag)")
    .eq("wardrobe_id", wardrobeId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`wardrobe lookup failed: ${error.message}`);

  const urls = await signImageUrls(
    items.map((i) => i.image_path),
    admin,
  );
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    color: i.color,
    tags: (i.clothing_item_tags as { tag: string }[]).map((t) => t.tag),
    imageUrl: i.image_path ? (urls.get(i.image_path) ?? null) : null,
  }));
}

export type SuggestionView = {
  id: string;
  title: string | null;
  notes: string | null;
  createdAt: string;
  author:
    | { kind: "guest"; guestIdentityId: string; nickname: string }
    | { kind: "owner"; name: string | null };
  items: { slot: Slot; itemId: string; name: string; imageUrl: string | null }[];
};

type SuggestionRow = {
  id: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  guest_identity_id: string | null;
  guest: { nickname: string } | null;
  owner: { display_name: string | null } | null;
  outfit_suggestion_items: {
    slot: Slot;
    sort_order: number;
    clothing_items: { id: string; name: string; image_path: string };
  }[];
};

export async function listSuggestions(requestId: string): Promise<SuggestionView[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("outfit_suggestions")
    .select(
      "id, title, notes, created_at, guest_identity_id, guest:guest_identities(nickname), owner:profiles(display_name), outfit_suggestion_items(slot, sort_order, clothing_items(id, name, image_path))",
    )
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .returns<SuggestionRow[]>();
  if (error) throw new Error(`suggestion lookup failed: ${error.message}`);

  const urls = await signImageUrls(
    data.flatMap((s) => s.outfit_suggestion_items.map((i) => i.clothing_items.image_path)),
    admin,
  );

  return data.map((s) => ({
    id: s.id,
    title: s.title,
    notes: s.notes,
    createdAt: s.created_at,
    author:
      s.guest_identity_id && s.guest
        ? { kind: "guest", guestIdentityId: s.guest_identity_id, nickname: s.guest.nickname }
        : { kind: "owner", name: guestSafeDisplayName(s.owner?.display_name) },
    items: [...s.outfit_suggestion_items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        slot: i.slot,
        itemId: i.clothing_items.id,
        name: i.clothing_items.name,
        imageUrl: urls.get(i.clothing_items.image_path) ?? null,
      })),
  }));
}
