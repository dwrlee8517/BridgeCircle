#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for local People/Profile query-plan checks" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
required=(
  "api.list_people(uuid,text,text,text,smallint,smallint,text,text,text,text,extensions.vector,integer)"
  "api.get_member_profile(uuid,uuid)"
)
missing=()
for signature in "${required[@]}"; do
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('$signature') is not null")" != "t" ]]; then
    missing+=("$signature")
  fi
done

if (( ${#missing[@]} > 0 )); then
  printf 'People/Profile query-plan fixtures are ready; planned target is missing: %s\n' "${missing[@]}" >&2
  exit 1
fi

plan_output="$(${psql_base[@]} <<'SQL'
begin;

insert into public.users (id)
select md5('people-plan-user-' || fixture)::uuid
from generate_series(1, 2500) fixture;

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
)
select
  md5('people-plan-membership-' || fixture)::uuid,
  md5('people-plan-user-' || fixture)::uuid,
  '11111111-1111-4111-8111-111111111111',
  'active',
  now() - fixture * interval '1 minute'
from generate_series(1, 2500) fixture;

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, updated_at
)
select
  md5('people-plan-user-' || fixture)::uuid,
  case when fixture = 2500 then 'People plan needle' else 'Plan Member ' || fixture end,
  case when fixture = 2500 then 'Specialized ocean infrastructure' else 'Pilot member' end,
  'Plan Employer ' || (fixture % 25),
  'Plan Role',
  case when fixture % 2 = 0 then 'Technology' else 'Education' end,
  case when fixture % 3 = 0 then 'Los Angeles' else 'Seoul' end,
  now() - fixture * interval '1 minute'
from generate_series(1, 2500) fixture;

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year
)
select
  md5('people-plan-membership-' || fixture)::uuid,
  '11111111-1111-4111-8111-111111111111',
  (1980 + fixture % 45)::smallint
from generate_series(1, 2500) fixture;

insert into public.profile_contact_links (
  organization_membership_id, organization_id, kind, value, audience, sort_order
)
select
  md5('people-plan-membership-' || fixture)::uuid,
  '11111111-1111-4111-8111-111111111111',
  'website',
  'https://profiles.example.com/' || fixture,
  case when fixture % 2 = 0 then 'organization' else 'connections' end,
  0
from generate_series(1, 2500) fixture;

analyze public.organization_memberships;
analyze public.profiles;
analyze public.organization_profiles;
analyze public.profile_contact_links;

explain (analyze, buffers, costs off)
select membership.user_id
from public.organization_memberships membership
where membership.organization_id = '11111111-1111-4111-8111-111111111111'
  and membership.status = 'active'
order by membership.user_id
limit 50;

explain (analyze, buffers, costs off)
select profile.user_id
from public.profiles profile
where profile.directory_search_vector
  @@ websearch_to_tsquery('simple'::regconfig, 'ocean infrastructure')
limit 50;

-- At pilot cardinality PostgreSQL may correctly prefer a sub-millisecond
-- sequential scan. This companion proves the maintained GIN path is valid
-- without overriding the planner for the production-shaped measurement.
set local enable_seqscan = off;
explain (analyze, buffers, costs off)
select profile.user_id
from public.profiles profile
where profile.directory_search_vector
  @@ websearch_to_tsquery('simple'::regconfig, 'ocean infrastructure')
limit 50;
set local enable_seqscan = on;

explain (analyze, buffers, costs off)
select link.id
from public.profile_contact_links link
where link.organization_membership_id = md5('people-plan-membership-2500')::uuid
  and link.audience = 'organization'
order by link.sort_order;

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000002';
select case
  when count(*) = 50 and min(total_count) = 2504 then 'bounded-directory-ok'
  else 'bounded-directory-failed:' || count(*) || ':' || coalesce(min(total_count), -1)
end
from api.list_people('20000000-0000-4000-8000-000000000002');
reset role;

rollback;
SQL
)"

required_indexes=(
  organization_memberships_org_active_idx
  profiles_directory_search_idx
  profile_contact_links_membership_audience_idx
)
for index_name in "${required_indexes[@]}"; do
  if [[ "$plan_output" != *"$index_name"* ]]; then
    echo "representative People/Profile plan did not use expected index: $index_name" >&2
    echo "$plan_output" >&2
    exit 1
  fi
done
if [[ "$plan_output" != *"bounded-directory-ok"* ]]; then
  echo "representative People directory did not enforce its 50-row hard cap" >&2
  echo "$plan_output" >&2
  exit 1
fi

echo "People/Profile query plans use organization, full-text, and link-visibility indexes with the 50-row cap"
