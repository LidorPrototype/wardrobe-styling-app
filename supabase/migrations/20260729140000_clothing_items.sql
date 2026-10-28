-- Milestone 2 — clothing items, tags, and the wardrobe-items storage bucket.
-- Multi-tenant: every row and every stored object is scoped to its owner via RLS.
--
-- Note on enum columns (category, subcategory, color, season, formality): these
-- store language-neutral codes and are deliberately NOT constrained by CHECK
-- constraints. The canonical lists live in src/lib/enums/clothing.ts and are
-- enforced server-side by Zod, so adding a new code stays a code change plus a
-- translation, not a database migration.

-- ---------------------------------------------------------------------------
-- clothing_items
-- ---------------------------------------------------------------------------
create table public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  wardrobe_id uuid not null references public.wardrobes (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  image_path text not null,
  name text not null,
  category text not null,
  subcategory text,
  color text,
  season text,
  formality text,
  brand text,
  size text,
  notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clothing_items_owner_id_idx on public.clothing_items (owner_id);
create index clothing_items_wardrobe_id_idx on public.clothing_items (wardrobe_id);
create index clothing_items_category_idx on public.clothing_items (owner_id, category);
-- Default wardrobe view: newest first, archived hidden.
create index clothing_items_active_idx
  on public.clothing_items (owner_id, created_at desc)
  where is_archived = false;

alter table public.clothing_items enable row level security;

create policy "clothing_items_select_own"
  on public.clothing_items for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "clothing_items_insert_own"
  on public.clothing_items for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "clothing_items_update_own"
  on public.clothing_items for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "clothing_items_delete_own"
  on public.clothing_items for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create trigger clothing_items_set_updated_at
  before update on public.clothing_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- clothing_item_tags — raw free text in the owner's own vocabulary.
-- ---------------------------------------------------------------------------
create table public.clothing_item_tags (
  id uuid primary key default gen_random_uuid(),
  clothing_item_id uuid not null references public.clothing_items (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (clothing_item_id, tag)
);

create index clothing_item_tags_item_idx on public.clothing_item_tags (clothing_item_id);
create index clothing_item_tags_tag_idx on public.clothing_item_tags (tag);

alter table public.clothing_item_tags enable row level security;

-- Tags have no owner_id of their own; ownership is derived from the parent item.
create policy "clothing_item_tags_select_own"
  on public.clothing_item_tags for select
  to authenticated
  using (
    exists (
      select 1 from public.clothing_items ci
      where ci.id = clothing_item_id
        and ci.owner_id = (select auth.uid())
    )
  );

create policy "clothing_item_tags_insert_own"
  on public.clothing_item_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from public.clothing_items ci
      where ci.id = clothing_item_id
        and ci.owner_id = (select auth.uid())
    )
  );

create policy "clothing_item_tags_delete_own"
  on public.clothing_item_tags for delete
  to authenticated
  using (
    exists (
      select 1 from public.clothing_items ci
      where ci.id = clothing_item_id
        and ci.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: private bucket for wardrobe images.
-- Path convention: {owner_id}/{wardrobe_id}/{item_id}/original.<ext>
-- The first path segment is the owner id, which is what the policies check.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-items',
  'wardrobe-items',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "wardrobe_items_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wardrobe-items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "wardrobe_items_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wardrobe-items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "wardrobe_items_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'wardrobe-items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "wardrobe_items_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wardrobe-items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
