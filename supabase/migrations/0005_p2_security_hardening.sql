-- P2: security/perf hardening from the advisors. Applied via MCP "p2_security_hardening".

-- Public buckets don't need a SELECT policy for object-URL access; a broad one
-- lets clients list every file. (0004 already omits it; this is idempotent.)
drop policy if exists "post-media is publicly readable" on storage.objects;

-- Pre-existing RLS-auto-enable event-trigger helper is needlessly exposed as an
-- RPC. Revoke execute (event triggers fire regardless of EXECUTE grants).
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Cover the blocked_users.blocked_id FK (checked on profile-delete cascade).
create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked_id);
