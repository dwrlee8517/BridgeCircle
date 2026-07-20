#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local concurrency contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

cleanup() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
delete from public.profile_experiences
where user_id = '70000000-0000-4000-8000-000000000036';
delete from public.profile_skills
where user_id = '70000000-0000-4000-8000-000000000036';
delete from public.profiles
where user_id = '70000000-0000-4000-8000-000000000036';
delete from public.organization_memberships
where id = '62000000-0000-4000-8000-000000000036';
delete from public.users
where id = '70000000-0000-4000-8000-000000000036';
delete from auth.users
where id = '70000000-0000-4000-8000-000000000036';
delete from public.organizations
where id = '60000000-0000-4000-8000-000000000022';
SQL
}

cleanup
trap cleanup EXIT

psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
insert into public.organizations (
  id, slug, name, requires_admin_approval
) values (
  '60000000-0000-4000-8000-000000000022',
  'foundation-profile-lock', 'Foundation Profile Lock', false
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '70000000-0000-4000-8000-000000000036',
  'authenticated', 'authenticated', 'profile-lock@example.com',
  extensions.crypt('foundation-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values (
  '62000000-0000-4000-8000-000000000036',
  '70000000-0000-4000-8000-000000000036',
  '60000000-0000-4000-8000-000000000022', 'active', now()
);

insert into public.profiles (user_id, display_name)
values (
  '70000000-0000-4000-8000-000000000036', 'Profile Lock'
);
SQL

replace_and_hold_lock() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-4000-8000-000000000036',
  true
);
select api.save_profile_history(
  '62000000-0000-4000-8000-000000000036',
  '[{"employer":"First Lock Co","title":"First Role","startYear":2010}]'::jsonb,
  array['First Lock Skill']
);
select pg_sleep(1);
commit;
SQL
}

replace_while_locked() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-4000-8000-000000000036',
  true
);
select api.save_profile_history(
  '62000000-0000-4000-8000-000000000036',
  '[{"employer":"Final Co","title":"Lead","startYear":2020},{"employer":"Final Earlier Co","title":"Analyst","startYear":2015,"endYear":2019}]'::jsonb,
  array['Final Skill', 'Final Second Skill']
);
commit;
SQL
}

replace_and_hold_lock &
first_pid=$!
sleep 0.2
replace_while_locked &
second_pid=$!

first_status=0
second_status=0
wait "$first_pid" || first_status=$?
wait "$second_pid" || second_status=$?
if (( first_status != 0 || second_status != 0 )); then
  echo "concurrent profile replacements did not both complete successfully" >&2
  exit 1
fi

psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
do $$
begin
  if (
    select array_agg(employer order by sort_order, id)
    from public.profile_experiences
    where user_id = '70000000-0000-4000-8000-000000000036'
  ) is distinct from array['Final Co', 'Final Earlier Co']::text[] then
    raise exception 'expected one complete final experience aggregate';
  end if;

  if (
    select array_agg(normalized_name order by sort_order)
    from public.profile_skills
    where user_id = '70000000-0000-4000-8000-000000000036'
  ) is distinct from array['final skill', 'final second skill']::text[] then
    raise exception 'expected one complete final skills aggregate';
  end if;
end;
$$;
SQL

echo "Concurrent profile replacement preserved one complete aggregate"
