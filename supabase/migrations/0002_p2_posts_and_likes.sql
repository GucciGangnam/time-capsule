-- P2: posts, likes, blocks, RLS. Applied to DEV project via MCP "p2_posts_and_likes".

-- PostGIS for geo queries (kept in the extensions schema per Supabase guidance)
create extension if not exists postgis with schema extensions;

-- Post media type (also drives the pin icon)
create type public.post_type as enum ('text', 'photo', 'video');

-- Posts: permanent, geo-pinned. Carries text and/or exactly one media item.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type public.post_type not null,
  body text,
  media_path text,
  location extensions.geography(Point, 4326) not null,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint posts_has_content check (body is not null or media_path is not null),
  constraint posts_media_matches_type check (
    (type = 'text'  and media_path is null) or
    (type <> 'text' and media_path is not null)
  )
);

create index posts_location_gix on public.posts using gist (location);
create index posts_rank_idx on public.posts (like_count desc, id desc);
create index posts_author_idx on public.posts (author_id);

comment on table public.posts is
  'Permanent geo-pinned posts. No updates (immutable); like_count maintained by trigger.';

-- Likes: one per (post, user). Trigger keeps posts.like_count in sync.
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_idx on public.post_likes (user_id);

-- SECURITY DEFINER so a liker (who has no UPDATE rights on posts) can bump the
-- denormalized counter. Not callable via RPC (returns trigger); execute revoked.
create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = like_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;
revoke all on function public.sync_post_like_count() from public, anon, authenticated;

create trigger post_likes_sync_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_like_count();

-- Blocks: used by the radius RPC to hide blocked authors. (Reports/moderation = P7.)
create table public.blocked_users (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

-- RLS -----------------------------------------------------------------------
alter table public.posts enable row level security;
create policy "Posts are viewable by everyone"
  on public.posts for select to authenticated, anon using (true);
create policy "Users insert their own posts"
  on public.posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users delete their own posts"
  on public.posts for delete to authenticated using ((select auth.uid()) = author_id);

alter table public.post_likes enable row level security;
create policy "Likes are viewable by everyone"
  on public.post_likes for select to authenticated, anon using (true);
create policy "Users like as themselves"
  on public.post_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users remove their own likes"
  on public.post_likes for delete to authenticated using ((select auth.uid()) = user_id);

alter table public.blocked_users enable row level security;
create policy "Users view their own blocks"
  on public.blocked_users for select to authenticated using ((select auth.uid()) = blocker_id);
create policy "Users create their own blocks"
  on public.blocked_users for insert to authenticated with check ((select auth.uid()) = blocker_id);
create policy "Users remove their own blocks"
  on public.blocked_users for delete to authenticated using ((select auth.uid()) = blocker_id);
