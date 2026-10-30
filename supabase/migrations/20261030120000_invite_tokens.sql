-- Milestone 4 — invite links for styling requests.
-- Only a SHA-256 hash of each token is stored; the raw token exists only in
-- the link the owner shares, so a database leak yields no working links.

create table public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.styling_requests (id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- At most one active token per request, even under concurrent requests.
create unique index invite_tokens_one_active_per_request
  on public.invite_tokens (request_id)
  where revoked_at is null;

alter table public.invite_tokens enable row level security;

-- Owners manage tokens of their own requests. Guests have no policy: invite
-- validation runs server-side with the secret key after checking the token.
create policy "invite_tokens_select_own"
  on public.invite_tokens for select
  to authenticated
  using (
    exists (
      select 1 from public.styling_requests r
      where r.id = request_id
        and r.owner_id = (select auth.uid())
    )
  );

create policy "invite_tokens_insert_own"
  on public.invite_tokens for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.styling_requests r
      where r.id = request_id
        and r.owner_id = (select auth.uid())
    )
  );

create policy "invite_tokens_update_own"
  on public.invite_tokens for update
  to authenticated
  using (
    exists (
      select 1 from public.styling_requests r
      where r.id = request_id
        and r.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.styling_requests r
      where r.id = request_id
        and r.owner_id = (select auth.uid())
    )
  );

-- Revoke the active token and insert the new one atomically. Runs as the
-- caller (security invoker), so the RLS policies above still apply.
create or replace function public.rotate_invite_token(p_request_id uuid, p_token_hash text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if exists (
    select 1 from public.styling_requests
    where id = p_request_id and status = 'finished'
  ) then
    raise exception 'styling request % is finished', p_request_id
      using errcode = 'check_violation';
  end if;

  update public.invite_tokens
     set revoked_at = now()
   where request_id = p_request_id
     and revoked_at is null;

  insert into public.invite_tokens (request_id, token_hash, created_by)
  values (p_request_id, p_token_hash, (select auth.uid()))
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function public.rotate_invite_token(uuid, text) from public, anon;
grant execute on function public.rotate_invite_token(uuid, text) to authenticated;
