#!/usr/bin/env bash
set -euo pipefail

# Demo organization seed — the data half of the hosted-dev demo door.
#
# Creates (idempotently, safe to rerun):
#   - the demo organization (slug 'demo', fixed id, auto-join)
#   - one sign-in-able demo persona the /demo door signs visitors into
#   - curated School content (one upcoming event, one pinned announcement)
# and then, unless DEMO_ORG_MEMBERS=0, chains into seed-scale.sh to generate a
# realistic member population into the demo organization. seed-scale.sh's
# bridge step wires the persona into that population's connection graph and
# gives them a Help inbox, so the persona lands in a lived-in circle.
#
# Everything here is synthetic. The organization slug 'demo' is load-bearing:
# api.demo_revoke_sessions() only ends sessions for members of that slug.
#
# The persona has NO usable password — it gets a random one, rotated on every
# reseed. The /demo door signs visitors in by minting a one-time token via the
# auth admin API, so no standing credential exists to leak.
#
# Usage, from app/:
#   pnpm seed:demo-org                          # local stack
#   DEMO_ALLOW_REMOTE=1 SUPABASE_DB_URL=... pnpm seed:demo-org
#
# Production use is forbidden — the same guards as seed-scale.sh apply.
#
# Populations are org-scoped: chaining seed-scale.sh here regenerates only the
# demo organization's crowd. A crowd previously generated into another
# organization (e.g. Chadwick International) is untouched, as are Tier 1
# personas and their hand-authored fixtures.

db_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
org_id="99999999-9999-4999-8999-999999999999"
org_name="${DEMO_ORG_NAME:-Harborview School}"
user_id="99999999-0000-4000-8000-000000000001"
membership_id="99999999-1111-4000-8000-000000000001"
demo_email="${DEMO_USER_EMAIL:-demo-member@example.com}"
members="${DEMO_ORG_MEMBERS:-1200}"

# The shared guard refuses production outright and requires an explicit
# DEMO_ALLOW_REMOTE=1 opt-in for any non-local target.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/seed-guard.sh"
seed_guard "seed-demo-org" "$db_url"

psql_base=(psql "$db_url" -v ON_ERROR_STOP=1 -X -q)

echo "seed-demo-org: creating organization '${org_name}' (slug 'demo') and the demo persona"

"${psql_base[@]}" \
  -v org_id="$org_id" \
  -v org_name="$org_name" \
  -v user_id="$user_id" \
  -v membership_id="$membership_id" \
  -v demo_email="$demo_email" <<'SQL'
begin;

insert into public.organizations (id, slug, name, requires_admin_approval)
values (:'org_id', 'demo', :'org_name', false)
on conflict (slug) do update set name = excluded.name;

-- The persona is upserted rather than deleted-and-recreated: once the
-- population seed has woven it into conversations and asks, a hard delete
-- would trip restrict FKs. The password is random and unrecorded — nobody can
-- sign in as the persona through /sign-in; only the /demo door admits — and
-- every rerun rotates it.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  :'user_id',
  'authenticated',
  'authenticated',
  :'demo_email',
  extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', 'Jamie Rowe'),
  now(), now(), '', '', '', ''
)
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  updated_at = now();

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email', now(), now(), now()
from auth.users u
where u.id = :'user_id'::uuid
on conflict (provider_id, provider) do nothing;

insert into public.users (id, onboarding_completed_at, created_at)
values (:'user_id', now() - interval '400 days', now() - interval '400 days')
on conflict (id) do update set onboarding_completed_at = excluded.onboarding_completed_at;

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at, created_at
) values (
  :'membership_id', :'user_id', :'org_id', 'active',
  now() - interval '400 days', now() - interval '400 days'
)
on conflict (user_id, organization_id) do nothing;

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, university, major, updated_at
) values (
  :'user_id', 'Jamie Rowe',
  'Product manager in Seoul. Glad to compare notes on first jobs and moving abroad.',
  'Nabi Labs', 'Product Manager', 'Technology', 'Seoul, South Korea',
  'Yonsei University', 'Economics', now()
)
on conflict (user_id) do update set
  display_name = excluded.display_name,
  headline = excluded.headline,
  current_employer = excluded.current_employer,
  current_title = excluded.current_title,
  industry = excluded.industry,
  city = excluded.city,
  university = excluded.university,
  major = excluded.major,
  updated_at = now();

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio, updated_at
) values (
  :'membership_id', :'org_id', 2018,
  'Class of 2018. Product Manager at Nabi Labs, based in Seoul.', now()
)
on conflict (organization_membership_id) do update set
  graduation_year = excluded.graduation_year,
  bio = excluded.bio,
  updated_at = now();

-- Headroom of 10: the chained population seeds 4 waiting asks into Jamie's
-- inbox, and the help-inbox scene stages 3 more — the persona must stay
-- inside a capacity the command layer would allow.
insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help,
  max_pending_requests, consecutive_timeouts
) values (:'membership_id', :'org_id', true, 10, 0)
on conflict (organization_membership_id) do update set
  open_to_help = true,
  max_pending_requests = excluded.max_pending_requests,
  paused_at = null,
  pause_reason = null;

-- Curated School surface content, replaced wholesale on rerun. Timestamps are
-- relative to the run so the event is always upcoming.
delete from public.announcements where id = '99999999-6666-4000-8000-000000000001';
delete from public.events where id in (
  '99999999-5555-4000-8000-000000000001',
  '99999999-5555-4000-8000-000000000002'
);

insert into public.events (
  id, organization_id, created_by_membership_id, host_membership_id, status,
  title, slug, category, summary, description, format, time_zone,
  location_name, join_url, starts_at, ends_at, capacity, published_at
) values (
  '99999999-5555-4000-8000-000000000001', :'org_id', :'membership_id', :'membership_id', 'published',
  'Seoul alumni dinner', 'seoul-alumni-dinner', 'Social',
  'An easy dinner for anyone in or near Seoul.',
  'An easy dinner for anyone in or near Seoul. Come as you are — new faces welcome, and bring a classmate if you can.',
  'in_person', 'Asia/Seoul', 'Seongsu-dong, Seoul',
  null,
  date_trunc('hour', now()) + interval '12 days' + interval '19 hours',
  date_trunc('hour', now()) + interval '12 days' + interval '21 hours',
  40,
  now() - interval '9 days'
), (
  '99999999-5555-4000-8000-000000000002', :'org_id', :'membership_id', :'membership_id', 'published',
  'Class of 2016 ten-year reunion planning call', 'class-of-2016-reunion-call', 'Reunion',
  'Twenty minutes to pick a date and split the work.',
  'A short call to pick a date and split the work. Twenty minutes, then back to your evening.',
  'online', 'Asia/Seoul', null,
  'https://meet.example.com/harborview-2016',
  date_trunc('hour', now()) + interval '26 days' + interval '20 hours',
  date_trunc('hour', now()) + interval '26 days' + interval '20 hours 30 minutes',
  null,
  now() - interval '4 days'
);

insert into public.announcements (
  id, organization_id, author_membership_id, status, title, body, pinned, published_at
) values (
  '99999999-6666-4000-8000-000000000001', :'org_id', :'membership_id', 'published',
  'The circle is open',
  E'Welcome in. Two hundred of your classmates joined in the first month — look around, find a familiar name, and say hello.\n\nIf you can spare a conversation now and then, turn on "open to help" from your profile. One good answer is plenty.',
  true, now() - interval '20 days'
);

commit;
SQL

if [[ "$members" == "0" ]]; then
  echo "seed-demo-org: skipping population (DEMO_ORG_MEMBERS=0)"
  if [[ -n "${DEMO_SCENE:-}" ]]; then
    echo "seed-demo-org: ignoring DEMO_SCENE — scenes stage crowd members, and the crowd was skipped" >&2
  fi
else
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  DEMO_ORG_ID="$org_id" DEMO_MEMBERS="$members" SUPABASE_DB_URL="$db_url" \
    DEMO_ALLOW_REMOTE="${DEMO_ALLOW_REMOTE:-0}" \
    bash "$script_dir/seed-scale.sh"

  # RSVPs from the generated population, so the curated event does not sit at
  # zero. Runs after the population exists; reruns of seed-scale.sh delete the
  # generated memberships, which cascades these rows, so this stays rerunnable.
  "${psql_base[@]}" -v org_id="$org_id" <<'SQL'
insert into public.event_rsvps (organization_id, event_id, organization_membership_id, status)
select
  :'org_id'::uuid,
  '99999999-5555-4000-8000-000000000001'::uuid,
  membership.id,
  case when membership.id::text like '%1' or membership.id::text like '%5' then 'not_going' else 'going' end
from public.organization_memberships membership
where membership.organization_id = :'org_id'::uuid
  and membership.id::text like 'dddddddd-1111-%'
  and membership.status = 'active'
order by membership.id
limit 31
on conflict (event_id, organization_membership_id) do nothing;
SQL

  # Optional scene overlays, e.g. DEMO_SCENE=help-inbox,thread — applied after
  # the crowd exists so scenes can query it. See scripts/scenes/README.md.
  if [[ -n "${DEMO_SCENE:-}" ]]; then
    IFS=',' read -ra scene_names <<< "$DEMO_SCENE"
    SUPABASE_DB_URL="$db_url" DEMO_ALLOW_REMOTE="${DEMO_ALLOW_REMOTE:-0}" \
      bash "$script_dir/seed-scene.sh" "${scene_names[@]}"
  fi
fi

echo
echo "seed-demo-org: done."
echo "seed-demo-org: door persona is ${demo_email} in organization '${org_name}' (slug 'demo')."
echo "seed-demo-org: set DEMO_USER_EMAIL in the app environment to match. The persona has no usable password."
