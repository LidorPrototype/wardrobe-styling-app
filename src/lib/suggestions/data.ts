import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { signImageUrls } from "@/lib/wardrobe/images";
import { guestSafeDisplayName } from "@/lib/profile/displayName";
import type { Slot } from "@/lib/suggestions/rules";
import type { Author } from "@/lib/activity/rules";

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
  author: Author;
  items: { slot: Slot; itemId: string; name: string; category: string; imageUrl: string | null }[];
  // Oldest like first.
  likes: Author[];
};

type AuthorColumns = {
  guest_identity_id: string | null;
  guest: { nickname: string } | null;
  owner: { display_name: string | null } | null;
};

function toAuthor(row: AuthorColumns): Author {
  return row.guest_identity_id && row.guest
    ? { kind: "guest", guestIdentityId: row.guest_identity_id, nickname: row.guest.nickname }
    : { kind: "owner", name: guestSafeDisplayName(row.owner?.display_name) };
}

// Both foreign keys are embedded by table name; each table is referenced once.
const AUTHOR_SELECT = "guest_identity_id, guest:guest_identities(nickname), owner:profiles(display_name)";

type SuggestionRow = AuthorColumns & {
  id: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  votes: (AuthorColumns & { created_at: string })[];
  outfit_suggestion_items: {
    slot: Slot;
    sort_order: number;
    clothing_items: { id: string; name: string; category: string; image_path: string };
  }[];
};

export async function listSuggestions(requestId: string): Promise<SuggestionView[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("outfit_suggestions")
    .select(
      `id, title, notes, created_at, ${AUTHOR_SELECT}, votes(created_at, ${AUTHOR_SELECT}), outfit_suggestion_items(slot, sort_order, clothing_items(id, name, category, image_path))`,
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
    author: toAuthor(s),
    items: [...s.outfit_suggestion_items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        slot: i.slot,
        itemId: i.clothing_items.id,
        name: i.clothing_items.name,
        category: i.clothing_items.category,
        imageUrl: urls.get(i.clothing_items.image_path) ?? null,
      })),
    likes: [...s.votes].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(toAuthor),
  }));
}

export type CommentView = {
  id: string;
  // null: a comment on the request as a whole.
  suggestionId: string | null;
  body: string;
  createdAt: string;
  edited: boolean;
  author: Author;
};

type CommentRow = AuthorColumns & {
  id: string;
  suggestion_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

// Oldest first, like a conversation.
export async function listComments(requestId: string): Promise<CommentView[]> {
  const { data, error } = await createAdminClient()
    .from("comments")
    .select(`id, suggestion_id, body, created_at, updated_at, ${AUTHOR_SELECT}`)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();
  if (error) throw new Error(`comment lookup failed: ${error.message}`);

  return data.map((c) => ({
    id: c.id,
    suggestionId: c.suggestion_id,
    body: c.body,
    createdAt: c.created_at,
    edited: c.updated_at !== c.created_at,
    author: toAuthor(c),
  }));
}

export async function loadHeadPhotoUrl(ownerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("head_photo_path")
    .eq("id", ownerId)
    .single();
  if (error) throw new Error(`profile lookup failed: ${error.message}`);
  if (!data.head_photo_path) return null;
  const urls = await signImageUrls([data.head_photo_path], admin);
  return urls.get(data.head_photo_path) ?? null;
}
