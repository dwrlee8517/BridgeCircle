-- Demo access windows: the time-boxed gate behind the hosted-dev demo door.
--
-- The /demo route signs a visitor into the seeded demo persona, but only while
-- an "armed" window row here is open. Arming happens on /demo/arm, restricted
-- to allowlisted operator accounts. The route itself is additionally gated by
-- DEMO_LOGIN_ENABLED + APP_ENV=dev + the exact dev origin (see
-- src/lib/demo/gate.ts), so on production this table exists but is inert:
-- nothing reads it and the door route 404s unconditionally.
--
-- Plaintext tokens are never stored — only sha256 hashes. The shareable link
-- is shown once, at arm time.

create table public.demo_access_windows (
  id uuid primary key default gen_random_uuid(),
  -- unique doubles as the door's lookup index; hashes are 32 random bytes,
  -- so collisions never happen in practice.
  token_hash text not null unique,
  -- References the public.users mirror (schema-wide convention), so the
  -- arming audit trail survives auth-account deletion as a tombstone.
  armed_by_user_id uuid references public.users (id) on delete set null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint demo_access_windows_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint demo_access_windows_expiry_check check (expires_at > created_at)
);

comment on table public.demo_access_windows is
  'Time-boxed authorization windows for the hosted-dev demo door (/demo). Service-role only.';

create index if not exists demo_access_windows_active_idx
  on public.demo_access_windows (expires_at)
  where revoked_at is null;

-- Service-role only: the door and arm surfaces go through the admin client.
-- No policies on purpose — anon/authenticated get nothing, and force ensures
-- even the table owner goes through RLS.
alter table public.demo_access_windows enable row level security;
alter table public.demo_access_windows force row level security;
revoke all on public.demo_access_windows from public, anon, authenticated;
grant all on public.demo_access_windows to service_role;

-- Ends lingering demo sessions when a window is armed or closed. Scope is
-- deliberately narrow: only users whose active memberships are exclusively in
-- the demo organization (slug 'demo'). A real person who also joined the demo
-- org to poke around is never signed out, and on databases with no demo org
-- this is a no-op. auth.refresh_tokens rows cascade with their session.
create or replace function api.demo_revoke_sessions()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from auth.sessions
  where user_id in (
    select membership.user_id
    from public.organization_memberships membership
    join public.organizations organization
      on organization.id = membership.organization_id
    where organization.slug = 'demo'
      and membership.status = 'active'
      and not exists (
        select 1
        from public.organization_memberships other_membership
        join public.organizations other_organization
          on other_organization.id = other_membership.organization_id
        where other_membership.user_id = membership.user_id
          and other_organization.slug <> 'demo'
      )
  );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function api.demo_revoke_sessions() from public, anon, authenticated;
grant execute on function api.demo_revoke_sessions() to service_role;
