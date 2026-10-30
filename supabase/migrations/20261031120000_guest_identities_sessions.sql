-- Milestone 5 — guest identities (nickname + passphrase per request) and
-- guest sessions (an httpOnly cookie holding a random token).
--
-- Guests have no Supabase account, so both tables are deny-all for the
-- browser roles: RLS is enabled with no policies. All access goes through
-- server code using the secret key, after checking the invite or session.

create table public.guest_identities (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.styling_requests (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 30),
  -- "Alice" and "alice" are the same guest; `nickname` keeps the display casing.
  nickname_key text generated always as (lower(btrim(nickname))) stored,
  passphrase_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (request_id, nickname_key)
);

alter table public.guest_identities enable row level security;

create table public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_identity_id uuid not null references public.guest_identities (id) on delete cascade,
  request_id uuid not null references public.styling_requests (id) on delete cascade,
  session_token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index guest_sessions_identity_idx on public.guest_sessions (guest_identity_id);

alter table public.guest_sessions enable row level security;

-- Counts a wrong passphrase in one statement, so concurrent guesses can't
-- read the same count and slip past the limit. Returns the new locked_until.
create or replace function public.record_guest_login_failure(
  p_identity_id uuid,
  p_max_attempts integer,
  p_lock_minutes integer
)
returns timestamptz
language sql
set search_path = ''
as $$
  update public.guest_identities
     set failed_attempts = case
           when failed_attempts + 1 >= p_max_attempts then 0
           else failed_attempts + 1
         end,
         locked_until = case
           when failed_attempts + 1 >= p_max_attempts
             then now() + make_interval(mins => p_lock_minutes)
           else locked_until
         end
   where id = p_identity_id
  returning locked_until;
$$;

revoke execute on function public.record_guest_login_failure(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.record_guest_login_failure(uuid, integer, integer)
  to service_role;
