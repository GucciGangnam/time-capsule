-- P2: the single geo hot path. Applied via MCP "p2_posts_within_radius_rpc".
-- Posts within radius_m of (lat,lng), with author username, distance, like
-- state, blocked authors excluded, ordered by popularity, keyset-paginated.
create or replace function public.posts_within_radius(
  lat double precision,
  lng double precision,
  radius_m double precision default 30,
  page_limit integer default 20,
  cursor_like_count integer default null,
  cursor_id uuid default null
)
returns table (
  id uuid,
  author_id uuid,
  author_username text,
  type public.post_type,
  body text,
  media_path text,
  distance_m double precision,
  like_count integer,
  liked_by_me boolean,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    p.id,
    p.author_id,
    pr.username::text,
    p.type,
    p.body,
    p.media_path,
    ST_Distance(p.location, ST_MakePoint(lng, lat)::geography) as distance_m,
    p.like_count,
    exists (
      select 1 from public.post_likes pl
      where pl.post_id = p.id and pl.user_id = (select auth.uid())
    ) as liked_by_me,
    p.created_at
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where ST_DWithin(p.location, ST_MakePoint(lng, lat)::geography, radius_m)
    and not exists (
      select 1 from public.blocked_users b
      where b.blocker_id = (select auth.uid()) and b.blocked_id = p.author_id
    )
    and (
      cursor_like_count is null
      or p.like_count < cursor_like_count
      or (p.like_count = cursor_like_count and p.id < cursor_id)
    )
  order by p.like_count desc, p.id desc
  limit least(greatest(page_limit, 1), 100);
$$;
