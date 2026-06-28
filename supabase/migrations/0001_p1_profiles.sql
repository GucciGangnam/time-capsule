-- P1: profiles
-- One row per auth user, created at onboarding when a username is chosen.
-- Applied to the DEV-Time-Capule Supabase project via MCP migration "p1_profiles".

-- Case-insensitive text for usernames (kept out of public schema per Supabase guidance)
create extension if not exists citext with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique
    constraint username_format check (
      char_length(username::text) between 3 and 12
      and username ~ '^[A-Za-z0-9_]+$'
    ),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Public user profiles. Username is immutable once set at onboarding.';

-- Username is immutable: reject any change after insert.
create or replace function public.prevent_username_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.username is distinct from old.username then
    raise exception 'username is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_username_immutable
  before update on public.profiles
  for each row execute function public.prevent_username_change();

-- RLS: world-readable, owner-writable. No delete policy — profiles are removed
-- via the auth.users ON DELETE CASCADE during account deletion.
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to authenticated, anon
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
