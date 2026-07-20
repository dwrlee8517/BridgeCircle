#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local concurrency contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

cleanup() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
delete from private.audit_log
where organization_id = '60000000-0000-4000-8000-000000000021'
   or actor_user_id = '70000000-0000-4000-8000-000000000035';
delete from public.organization_profiles
where organization_id = '60000000-0000-4000-8000-000000000021';
delete from public.invites
where id = '80000000-0000-4000-8000-000000000015';
delete from public.organization_memberships
where organization_id = '60000000-0000-4000-8000-000000000021';
delete from public.profiles
where user_id = '70000000-0000-4000-8000-000000000035';
delete from public.users
where id = '70000000-0000-4000-8000-000000000035';
delete from auth.users
where id = '70000000-0000-4000-8000-000000000035';
delete from public.organizations
where id = '60000000-0000-4000-8000-000000000021';
SQL
}

cleanup
trap cleanup EXIT

psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
insert into public.organizations (
  id, slug, name, requires_admin_approval
) values (
  '60000000-0000-4000-8000-000000000021',
  'foundation-concurrency', 'Foundation Concurrency', false
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '70000000-0000-4000-8000-000000000035',
  'authenticated', 'authenticated', 'accept-concurrent@example.com',
  extensions.crypt('foundation-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Concurrent Member"}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into public.invites (
  id, organization_id, email, email_normalized, token_hash, status,
  full_name, graduation_year, expires_at
) values (
  '80000000-0000-4000-8000-000000000015',
  '60000000-0000-4000-8000-000000000021',
  'accept-concurrent@example.com', 'accept-concurrent@example.com',
  extensions.digest('foundation-concurrent-accept-token-00001', 'sha256'),
  'pending', 'Concurrent Member', 2011, now() + interval '1 day'
);
SQL

accept_and_hold_lock() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-4000-8000-000000000035',
  true
);
select * from api.accept_invite('foundation-concurrent-accept-token-00001');
select pg_sleep(1);
commit;
SQL
}

accept_while_locked() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-4000-8000-000000000035',
  true
);
select * from api.accept_invite('foundation-concurrent-accept-token-00001');
commit;
SQL
}

accept_and_hold_lock &
first_pid=$!
sleep 0.2
accept_while_locked &
second_pid=$!

first_status=0
second_status=0
wait "$first_pid" || first_status=$?
wait "$second_pid" || second_status=$?
if (( first_status != 0 || second_status != 0 )); then
  echo "concurrent invite calls did not both complete successfully" >&2
  exit 1
fi

psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
do $$
begin
  if (
    select count(*)
    from public.organization_memberships
    where organization_id = '60000000-0000-4000-8000-000000000021'
      and user_id = '70000000-0000-4000-8000-000000000035'
      and status = 'active'
  ) <> 1 then
    raise exception 'expected exactly one active membership';
  end if;

  if (
    select count(*)
    from public.organization_profiles
    where organization_id = '60000000-0000-4000-8000-000000000021'
  ) <> 1 then
    raise exception 'expected exactly one organization profile';
  end if;

  if not exists (
    select 1
    from public.invites
    where id = '80000000-0000-4000-8000-000000000015'
      and status = 'accepted'
      and accepted_by_user_id = '70000000-0000-4000-8000-000000000035'
      and accepted_at is not null
  ) then
    raise exception 'expected one accepted invite owned by the caller';
  end if;

  if (
    select count(*)
    from private.audit_log
    where organization_id = '60000000-0000-4000-8000-000000000021'
      and action = 'membership.joined'
      and target_type = 'invite'
      and target_id = '80000000-0000-4000-8000-000000000015'
  ) <> 1 then
    raise exception 'expected exactly one membership.joined audit event';
  end if;
end;
$$;
SQL

echo "Concurrent invite acceptance preserved one durable result"
