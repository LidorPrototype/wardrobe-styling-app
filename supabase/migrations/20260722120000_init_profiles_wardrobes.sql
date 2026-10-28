-- Milestone 1 — profiles + wardrobes, multi-tenant via Row Level Security.
-- Each owner sees and mutates only their own rows (id / owner_id = auth.uid()).

-- Shared trigger to keep updated_at fresh on any row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated owner, keyed by auth.users.id.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_locale text not null default 'en',
  background_photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- wardrobes: one default wardrobe per owner in MVP (schema supports more).
-- ---------------------------------------------------------------------------
create table public.wardrobes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wardrobes_owner_id_idx on public.wardrobes (owner_id);

alter table public.wardrobes enable row level security;

create policy "wardrobes_select_own"
  on public.wardrobes for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "wardrobes_insert_own"
  on public.wardrobes for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "wardrobes_update_own"
  on public.wardrobes for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "wardrobes_delete_own"
  on public.wardrobes for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create trigger wardrobes_set_updated_at
  before update on public.wardrobes
  for each row execute function public.set_updated_at();
