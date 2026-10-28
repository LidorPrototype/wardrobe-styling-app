-- Milestone 3 — styling requests: "help me pick an outfit for X".
-- Owner-scoped for now; guest access arrives with invite links in Milestone 4.
--
-- Note on enum columns (occasion, status): same convention as clothing_items —
-- language-neutral codes, no CHECK constraints. The canonical lists live in
-- src/lib/enums/requests.ts and are enforced server-side by Zod. The one
-- exception is `status`, whose two values are load-bearing for the read-only
-- guard below, so it is constrained.

-- ---------------------------------------------------------------------------
-- styling_requests
-- ---------------------------------------------------------------------------
create table public.styling_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  wardrobe_id uuid not null references public.wardrobes (id) on delete cascade,
  title text not null,
  occasion text,
  -- Deliberately `timestamp` (no time zone), not timestamptz: an event time is
  -- a wall-clock fact ("the wedding starts at 19:30"), not an instant. Storing
  -- it naive means it never shifts when the owner or a guest reads it from
  -- another zone. See src/lib/requests/eventDate.ts for the read/write helpers.
  event_at timestamp,
  notes text,
  status text not null default 'open' check (status in ('open', 'finished')),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index styling_requests_owner_id_idx on public.styling_requests (owner_id);
create index styling_requests_wardrobe_id_idx on public.styling_requests (wardrobe_id);
-- Default list view: grouped by status, newest first within each group.
create index styling_requests_owner_status_idx
  on public.styling_requests (owner_id, status, created_at desc);

alter table public.styling_requests enable row level security;

create policy "styling_requests_select_own"
  on public.styling_requests for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "styling_requests_insert_own"
  on public.styling_requests for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "styling_requests_update_own"
  on public.styling_requests for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "styling_requests_delete_own"
  on public.styling_requests for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create trigger styling_requests_set_updated_at
  before update on public.styling_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- A finished request is read-only. Enforced here rather than only in the UI and
-- the server action, so a direct API call cannot edit a closed request either.
-- Reopening (finished -> open) stays allowed, which is what lets an owner
-- correct a mistake.
-- ---------------------------------------------------------------------------
create or replace function public.guard_finished_styling_request()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'finished' and new.status = 'finished' then
    raise exception 'styling request % is finished and cannot be modified', old.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger styling_requests_guard_finished
  before update on public.styling_requests
  for each row execute function public.guard_finished_styling_request();
