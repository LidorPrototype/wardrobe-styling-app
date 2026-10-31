-- Milestone 6a — outfit suggestions: a set of wardrobe items in slots, made
-- by a guest or by the request's owner.
--
-- Owners reach these tables through RLS. Guests have no Supabase session, so
-- their reads and writes go through server code with the secret key after
-- the guest session is checked; there are no guest policies.

create table public.outfit_suggestions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.styling_requests (id) on delete cascade,
  guest_identity_id uuid references public.guest_identities (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete cascade,
  title text check (char_length(title) <= 80),
  notes text check (char_length(notes) <= 1000),
  status text not null default 'suggested'
    check (status in ('suggested', 'chosen', 'worn', 'rejected', 'favorite')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Exactly one author: a guest or the owner.
  check (num_nonnulls(guest_identity_id, owner_id) = 1)
);

create index outfit_suggestions_request_idx
  on public.outfit_suggestions (request_id, created_at desc);

create table public.outfit_suggestion_items (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.outfit_suggestions (id) on delete cascade,
  clothing_item_id uuid not null references public.clothing_items (id) on delete cascade,
  slot text not null
    check (slot in ('top', 'bottom', 'shoes', 'outerwear', 'accessory', 'other')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (suggestion_id, clothing_item_id)
);

create index outfit_suggestion_items_suggestion_idx
  on public.outfit_suggestion_items (suggestion_id);
create index outfit_suggestion_items_item_idx
  on public.outfit_suggestion_items (clothing_item_id);

create trigger outfit_suggestions_set_updated_at
  before update on public.outfit_suggestions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Guards that hold no matter which client writes (owner via RLS, guest via
-- the secret key).
-- ---------------------------------------------------------------------------
create or replace function public.guard_outfit_suggestion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.styling_requests
    where id = new.request_id and status = 'finished'
  ) then
    raise exception 'styling request % is finished', new.request_id
      using errcode = 'check_violation';
  end if;

  if new.guest_identity_id is not null and not exists (
    select 1 from public.guest_identities
    where id = new.guest_identity_id and request_id = new.request_id
  ) then
    raise exception 'guest does not belong to request %', new.request_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger outfit_suggestions_guard
  before insert on public.outfit_suggestions
  for each row execute function public.guard_outfit_suggestion();

create or replace function public.guard_outfit_suggestion_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The item must come from the wardrobe the request is about.
  if not exists (
    select 1
    from public.outfit_suggestions s
    join public.styling_requests r on r.id = s.request_id
    join public.clothing_items ci on ci.wardrobe_id = r.wardrobe_id
    where s.id = new.suggestion_id and ci.id = new.clothing_item_id
  ) then
    raise exception 'item % is not in this request''s wardrobe', new.clothing_item_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger outfit_suggestion_items_guard
  before insert on public.outfit_suggestion_items
  for each row execute function public.guard_outfit_suggestion_item();

-- ---------------------------------------------------------------------------
-- RLS: owners see every suggestion on their requests and manage their own.
-- ---------------------------------------------------------------------------
alter table public.outfit_suggestions enable row level security;
alter table public.outfit_suggestion_items enable row level security;

create policy "outfit_suggestions_select_own_requests"
  on public.outfit_suggestions for select
  to authenticated
  using (
    exists (
      select 1 from public.styling_requests r
      where r.id = request_id and r.owner_id = (select auth.uid())
    )
  );

create policy "outfit_suggestions_insert_own"
  on public.outfit_suggestions for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and guest_identity_id is null
    and exists (
      select 1 from public.styling_requests r
      where r.id = request_id and r.owner_id = (select auth.uid())
    )
  );

create policy "outfit_suggestions_delete_own"
  on public.outfit_suggestions for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "outfit_suggestion_items_select_own_requests"
  on public.outfit_suggestion_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.outfit_suggestions s
      join public.styling_requests r on r.id = s.request_id
      where s.id = suggestion_id and r.owner_id = (select auth.uid())
    )
  );

create policy "outfit_suggestion_items_insert_own"
  on public.outfit_suggestion_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.outfit_suggestions s
      where s.id = suggestion_id and s.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Creates a suggestion and its items in one transaction. Runs as the caller,
-- so RLS and the guards above still apply.
-- p_items: [{ "item_id": uuid, "slot": text, "sort_order": int }, ...]
-- ---------------------------------------------------------------------------
create or replace function public.create_outfit_suggestion(
  p_request_id uuid,
  p_guest_identity_id uuid,
  p_owner_id uuid,
  p_title text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.outfit_suggestions (request_id, guest_identity_id, owner_id, title, notes)
  values (p_request_id, p_guest_identity_id, p_owner_id, p_title, p_notes)
  returning id into new_id;

  insert into public.outfit_suggestion_items (suggestion_id, clothing_item_id, slot, sort_order)
  select new_id, (e ->> 'item_id')::uuid, e ->> 'slot', coalesce((e ->> 'sort_order')::integer, 0)
  from jsonb_array_elements(p_items) as e;

  return new_id;
end;
$$;

revoke execute on function public.create_outfit_suggestion(uuid, uuid, uuid, text, text, jsonb)
  from public, anon;
grant execute on function public.create_outfit_suggestion(uuid, uuid, uuid, text, text, jsonb)
  to authenticated, service_role;
