#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for local Home query-plan checks" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
required=(
  "api.get_home_native(uuid)"
  "api.save_ask_outcome_share(uuid,boolean,boolean)"
)
for signature in "${required[@]}"; do
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('$signature') is not null")" != "t" ]]; then
    echo "Home query-plan target is missing: $signature" >&2
    exit 1
  fi
done

plan_output="$(${psql_base[@]} <<'SQL'
begin;

insert into public.users (id)
select md5('home-plan-user-' || fixture)::uuid
from generate_series(1, 1800) fixture;

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
)
select
  md5('home-plan-membership-' || fixture)::uuid,
  md5('home-plan-user-' || fixture)::uuid,
  '11111111-1111-4111-8111-111111111111',
  'active', now() - fixture * interval '1 hour'
from generate_series(1, 1800) fixture;

insert into public.profiles (user_id, display_name, updated_at)
select
  md5('home-plan-user-' || fixture)::uuid,
  'Home Plan Member ' || fixture,
  now() - fixture * interval '1 hour'
from generate_series(1, 1800) fixture;

insert into public.profile_experiences (
  user_id, employer, title, start_year, start_month
)
select
  md5('home-plan-user-' || fixture)::uuid,
  'Home Plan Employer ' || fixture,
  'Home Plan Role',
  extract(year from now())::smallint,
  extract(month from now())::smallint
from generate_series(1, 1800) fixture;

analyze public.organization_memberships;
analyze public.profiles;
analyze public.profile_experiences;
analyze private.ask_outcome_shares;

set local enable_seqscan = off;
explain (analyze, buffers, costs off)
select membership.user_id
from public.organization_memberships membership
where membership.organization_id = '11111111-1111-4111-8111-111111111111'
  and membership.status = 'active'
  and membership.joined_at >= date_trunc('week', now());

explain (analyze, buffers, costs off)
select experience.id
from public.profile_experiences experience
where experience.user_id = md5('home-plan-user-1800')::uuid
order by experience.sort_order, experience.id;

explain (analyze, buffers, costs off)
select share.ask_id
from private.ask_outcome_shares share
where share.participant_user_id = '10000000-0000-4000-8000-000000000002'
order by share.updated_at desc, share.ask_id;
reset enable_seqscan;

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000002';
select case
  when api.get_home_native('20000000-0000-4000-8000-000000000002')->>'resultCode' = 'ok'
  then 'bounded-home-native-ok'
  else 'bounded-home-native-failed'
end;
reset role;

rollback;
SQL
)"

required_indexes=(
  organization_memberships_org_active_idx
  profile_experiences_user_sort_idx
  ask_outcome_shares_participant_idx
)
for index_name in "${required_indexes[@]}"; do
  if [[ "$plan_output" != *"$index_name"* ]]; then
    echo "representative Home plan did not use expected index: $index_name" >&2
    echo "$plan_output" >&2
    exit 1
  fi
done
if [[ "$plan_output" != *"bounded-home-native-ok"* ]]; then
  echo "Home-native projection did not preserve its bounded member contract" >&2
  echo "$plan_output" >&2
  exit 1
fi

echo "Home pulse, recognition, and consent plans use their intended indexes"
