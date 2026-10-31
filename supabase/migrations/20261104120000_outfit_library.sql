-- Milestone 8 — the owner's decision on a suggestion, and the outfit library.
--
-- Marking a suggestion chosen, worn or favorite saves a new library entry
-- every time, so the same outfit worn twice is two entries with their own
-- date and notes. Rejected only changes the suggestion's status.
-- Owner-only: guests never read or write any of this.

-- ---------------------------------------------------------------------------
-- outfit_library_entries: one occurrence of an outfit
-- ---------------------------------------------------------------------------
create table public.outfit_library_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  -- Kept when the suggestion or its request is deleted.
  source_suggestion_id uuid references public.outfit_suggestions (id) on delete set null,
  title text check (char_length(title) <= 80),
  notes text check (char_length(notes) <= 1000),
  status text not null check (status in ('chosen', 'worn', 'favorite')),
  worn_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outfit_library_entries_owner_idx
  on public.outfit_library_entries (owner_id, created_at desc);
create index outfit_library_entries_source_idx
  on public.outfit_library_entries (source_suggestion_id);

create trigger outfit_library_entries_set_updated_at
  before update on public.outfit_library_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- outfit_library_items: the items, snapshotted when the entry is saved
-- ---------------------------------------------------------------------------
create table public.outfit_library_items (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.outfit_library_entries (id) on delete cascade,
  -- Null once the item is deleted from the wardrobe; the name stays.
  clothing_item_id uuid references public.clothing_items (id) on delete set null,
  item_name text not null,
  item_category text not null,
  slot text not null
    check (slot in ('top', 'bottom', 'shoes', 'outerwear', 'accessory', 'other')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index outfit_library_items_entry_idx on public.outfit_library_items (entry_id);
create index outfit_library_items_item_idx on public.outfit_library_items (clothing_item_id);

-- ---------------------------------------------------------------------------
-- RLS: the owner manages their own library.
-- ---------------------------------------------------------------------------
alter table public.outfit_library_entries enable row level security;
alter table public.outfit_library_items enable row level security;

create policy "outfit_library_entries_select_own"
  on public.outfit_library_entries for select
  to authenticated
  using (owner_id = (select auth.uid()));

-- Entries are created by record_outfit_decision; a direct insert must still
-- point at a suggestion on one of the owner's own requests.
create policy "outfit_library_entries_insert_own"
  on public.outfit_library_entries for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      source_suggestion_id is null
      or exists (
        select 1
        from public.outfit_suggestions s
        join public.styling_requests r on r.id = s.request_id
        where s.id = source_suggestion_id and r.owner_id = (select auth.uid())
      )
    )
  );

create policy "outfit_library_entries_update_own"
  on public.outfit_library_entries for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "outfit_library_entries_delete_own"
  on public.outfit_library_entries for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- Only the date and notes of an entry change after it's saved.
revoke update on public.outfit_library_entries from authenticated;
grant update (worn_on, notes) on public.outfit_library_entries to authenticated;

create policy "outfit_library_items_select_own"
  on public.outfit_library_items for select
  to authenticated
  using (
    exists (
      select 1 from public.outfit_library_entries e
      where e.id = entry_id and e.owner_id = (select auth.uid())
    )
  );

create policy "outfit_library_items_insert_own"
  on public.outfit_library_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.outfit_library_entries e
      where e.id = entry_id and e.owner_id = (select auth.uid())
    )
    and (
      clothing_item_id is null
      or exists (
        select 1 from public.clothing_items ci
        where ci.id = clothing_item_id and ci.owner_id = (select auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- The owner decides on any suggestion on their requests, finished ones
-- included (an outfit is usually worn after the event). Only the status
-- column can change.
-- ---------------------------------------------------------------------------
create policy "outfit_suggestions_update_own_requests"
  on public.outfit_suggestions for update
  to authenticated
  using (
    exists (
      select 1 from public.styling_requests r
      where r.id = request_id and r.owner_id = (select auth.uid())
    )
  );

revoke update on public.outfit_suggestions from authenticated;
grant update (status) on public.outfit_suggestions to authenticated;

-- Sets the status and, for chosen/worn/favorite, saves a new library entry
-- with a snapshot of the items, in one transaction. Runs as the caller, so
-- RLS decides which suggestions they can reach.
create or replace function public.record_outfit_decision(
  p_suggestion_id uuid,
  p_status text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s record;
  new_entry uuid;
begin
  update public.outfit_suggestions
     set status = p_status
   where id = p_suggestion_id
  returning request_id, title into s;

  if not found then
    raise exception 'suggestion not found' using errcode = 'no_data_found';
  end if;

  if p_status not in ('chosen', 'worn', 'favorite') then
    return null;
  end if;

  insert into public.outfit_library_entries (owner_id, source_suggestion_id, title, status, worn_on)
  select r.owner_id, p_suggestion_id, s.title, p_status,
         -- A worn outfit defaults to the event's date, else today.
         case when p_status = 'worn' then coalesce(r.event_at::date, current_date) end
    from public.styling_requests r
   where r.id = s.request_id
  returning id into new_entry;

  insert into public.outfit_library_items (entry_id, clothing_item_id, item_name, item_category, slot, sort_order)
  select new_entry, ci.id, ci.name, ci.category, osi.slot, osi.sort_order
    from public.outfit_suggestion_items osi
    join public.clothing_items ci on ci.id = osi.clothing_item_id
   where osi.suggestion_id = p_suggestion_id;

  return new_entry;
end;
$$;

revoke execute on function public.record_outfit_decision(uuid, text) from public, anon;
grant execute on function public.record_outfit_decision(uuid, text) to authenticated;
