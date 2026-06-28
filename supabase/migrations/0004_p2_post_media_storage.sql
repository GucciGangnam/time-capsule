-- P2: storage for post media. Applied via MCP "p2_post_media_storage" +
-- "p2_security_hardening". Path convention: post-media/{userId}/{uuid}.
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- Writes/deletes scoped to the owner's folder. No SELECT policy: public buckets
-- serve object URLs without one, and a broad SELECT policy would let clients
-- list every file (see p2_security_hardening, which dropped the initial one).
create policy "Users upload to their own post-media folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete their own post-media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
