-- P5: create_post — insert a post with its location built server-side from
-- lat/lng (PostgREST can't write a geography column directly). Applied via MCP
-- "p5_create_post_rpc". SECURITY INVOKER so the posts INSERT RLS policy
-- (author_id = auth.uid()) still applies; table CHECK constraints enforce the
-- text/media consistency rules.
create or replace function public.create_post(
  lat double precision,
  lng double precision,
  post_type public.post_type,
  body text default null,
  media_path text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  new_id uuid;
begin
  insert into public.posts (author_id, type, body, media_path, location)
  values (
    (select auth.uid()),
    post_type,
    nullif(btrim(body), ''),
    media_path,
    ST_MakePoint(lng, lat)::geography
  )
  returning id into new_id;
  return new_id;
end;
$$;
