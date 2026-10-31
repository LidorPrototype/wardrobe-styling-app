-- Milestone 7 — likes on outfit suggestions, and comments on a suggestion or
-- on the request as a whole.
--
-- Same access model as suggestions: owners through RLS, guests through
-- server code with the secret key after the guest session check.

-- ---------------------------------------------------------------------------
-- votes: one like per person per suggestion
-- ---------------------------------------------------------------------------
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.outfit_suggestions (id) on delete cascade,
  guest_identity_id uuid references public.guest_identities (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete cascade,
  -- Likes only for now; the column leaves room for other values later.
  value integer not null default 1 check (value = 1),
  created_at timestamptz not null default now(),
  check (num_nonnulls(guest_identity_id, owner_id) = 1),
  unique (suggestion_id, guest_identity_id),
  unique (suggestion_id, owner_id)
);

create index votes_suggestion_idx on public.votes (suggestion_id);

-- ---------------------------------------------------------------------------
-- comments: on a suggestion, or on the request when suggestion_id is null
-- ---------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.styling_requests (id) on delete cascade,
  suggestion_id uuid references public.outfit_suggestions (id) on delete cascade,
  guest_identity_id uuid references public.guest_identities (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(guest_identity_id, owner_id) = 1)
);

create index comments_request_idx on public.comments (request_id, created_at);
create index comments_suggestion_idx on public.comments (suggestion_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Guards that hold for every client (owner via RLS, guest via secret key).
-- ---------------------------------------------------------------------------
create or replace function public.guard_vote()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s record;
begin
  select os.request_id, os.guest_identity_id as author_guest, os.owner_id as author_owner,
         r.status, r.owner_id as request_owner
    into s
    from public.outfit_suggestions os
    join public.styling_requests r on r.id = os.request_id
   where os.id = new.suggestion_id;

  -- Owners run this under RLS, so another owner's suggestion isn't found.
  if not found then
    raise exception 'suggestion not found' using errcode = 'check_violation';
  end if;
  if s.status = 'finished' then
    raise exception 'styling request is finished' using errcode = 'check_violation';
  end if;
  if new.guest_identity_id is not null and not exists (
    select 1 from public.guest_identities
    where id = new.guest_identity_id and request_id = s.request_id
  ) then
    raise exception 'guest does not belong to this request' using errcode = 'check_violation';
  end if;
  if new.owner_id is not null and new.owner_id <> s.request_owner then
    raise exception 'only the request owner can vote as owner' using errcode = 'check_violation';
  end if;
  if new.guest_identity_id = s.author_guest or new.owner_id = s.author_owner then
    raise exception 'cannot like your own suggestion' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger votes_guard
  before insert on public.votes
  for each row execute function public.guard_vote();

create or replace function public.guard_comment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only the text of a comment can change after it's written.
  if tg_op = 'UPDATE' and (
    new.request_id <> old.request_id
    or new.suggestion_id is distinct from old.suggestion_id
    or new.guest_identity_id is distinct from old.guest_identity_id
    or new.owner_id is distinct from old.owner_id
  ) then
    raise exception 'only the comment text can be changed' using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from public.styling_requests
    where id = new.request_id and status = 'finished'
  ) then
    raise exception 'styling request is finished' using errcode = 'check_violation';
  end if;

  if new.suggestion_id is not null and not exists (
    select 1 from public.outfit_suggestions
    where id = new.suggestion_id and request_id = new.request_id
  ) then
    raise exception 'suggestion does not belong to this request' using errcode = 'check_violation';
  end if;

  if new.guest_identity_id is not null and not exists (
    select 1 from public.guest_identities
    where id = new.guest_identity_id and request_id = new.request_id
  ) then
    raise exception 'guest does not belong to this request' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger comments_guard
  before insert or update on public.comments
  for each row execute function public.guard_comment();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.votes enable row level security;
alter table public.comments enable row level security;

create policy "votes_select_own_requests"
  on public.votes for select
  to authenticated
  using (
    exists (
      select 1
      from public.outfit_suggestions s
      join public.styling_requests r on r.id = s.request_id
      where s.id = suggestion_id and r.owner_id = (select auth.uid())
    )
  );

create policy "votes_insert_own"
  on public.votes for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and guest_identity_id is null
    and exists (
      select 1
      from public.outfit_suggestions s
      join public.styling_requests r on r.id = s.request_id
      where s.id = suggestion_id and r.owner_id = (select auth.uid())
    )
  );

create policy "votes_delete_own"
  on public.votes for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "comments_select_own_requests"
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1 from public.styling_requests r
      where r.id = request_id and r.owner_id = (select auth.uid())
    )
  );

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and guest_identity_id is null
    and exists (
      select 1 from public.styling_requests r
      where r.id = request_id and r.owner_id = (select auth.uid())
    )
  );

create policy "comments_update_own"
  on public.comments for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- The owner may remove any comment on their request, not just their own.
create policy "comments_delete_on_own_requests"
  on public.comments for delete
  to authenticated
  using (
    exists (
      select 1 from public.styling_requests r
      where r.id = request_id and r.owner_id = (select auth.uid())
    )
  );
