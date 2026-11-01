-- Milestone 9 — outfit groups. A library entry (one occurrence of an
-- outfit) can sit in any number of the owner's groups: "Dating", "Work",
-- "Summer". Owner-only.

create table public.outfit_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  description text check (char_length(description) <= 200),
  -- "Work" and " work " are the same group.
  name_key text generated always as (lower(btrim(name))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name_key)
);

create trigger outfit_groups_set_updated_at
  before update on public.outfit_groups
  for each row execute function public.set_updated_at();

create table public.outfit_group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.outfit_groups (id) on delete cascade,
  entry_id uuid not null references public.outfit_library_entries (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, entry_id)
);

create index outfit_group_memberships_entry_idx on public.outfit_group_memberships (entry_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.outfit_groups enable row level security;
alter table public.outfit_group_memberships enable row level security;

create policy "outfit_groups_select_own"
  on public.outfit_groups for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "outfit_groups_insert_own"
  on public.outfit_groups for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "outfit_groups_update_own"
  on public.outfit_groups for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "outfit_groups_delete_own"
  on public.outfit_groups for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- A group is renamed or described, never handed to someone else.
revoke update on public.outfit_groups from authenticated;
grant update (name, description) on public.outfit_groups to authenticated;

create policy "outfit_group_memberships_select_own"
  on public.outfit_group_memberships for select
  to authenticated
  using (
    exists (
      select 1 from public.outfit_groups g
      where g.id = group_id and g.owner_id = (select auth.uid())
    )
  );

-- Both the group and the entry must be the owner's.
create policy "outfit_group_memberships_insert_own"
  on public.outfit_group_memberships for insert
  to authenticated
  with check (
    exists (
      select 1 from public.outfit_groups g
      where g.id = group_id and g.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.outfit_library_entries e
      where e.id = entry_id and e.owner_id = (select auth.uid())
    )
  );

create policy "outfit_group_memberships_delete_own"
  on public.outfit_group_memberships for delete
  to authenticated
  using (
    exists (
      select 1 from public.outfit_groups g
      where g.id = group_id and g.owner_id = (select auth.uid())
    )
  );

-- Memberships are added or removed, never edited.
revoke update on public.outfit_group_memberships from authenticated;
