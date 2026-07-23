#!/usr/bin/env bash
set -euo pipefail

# Tier 2 demo seed.
#
# The checked-in seed (supabase/seeds/seed.sql) is Tier 1: a small, hand-authored,
# deterministic fixture that the pgTAP suite and the E2E suites assert against.
# It must stay small.
#
# This script is Tier 2: a generated population sized to what one pilot
# organization plausibly looks like after a year. It exists so the directory,
# Help, and search surfaces can be exercised at realistic scale instead of at
# eight rows. It layers on top of Tier 1 and never modifies Tier 1's rows.
#
# It is deliberately NOT a load test. The test-*-query-plans.sh scripts already
# generate larger volumes inside a rolled-back transaction to validate indexes.
# The difference is that this data persists, so you can actually look at it.
#
# Every generated row carries a 'dddddddd-' UUID prefix, which is what makes the
# script re-runnable: it deletes its own previous output before regenerating.
#
# Usage, from app/:
#   pnpm seed:demo                      # 1200 members into Chadwick International
#   DEMO_MEMBERS=2500 pnpm seed:demo    # a larger population
#   DEMO_SEED=other pnpm seed:demo      # a different but still reproducible one
#   DEMO_ORG_ID=1111... pnpm seed:demo  # target Chadwick School instead
#
# Generated members exist in public.users only, with no auth.users row, so they
# are visible in the directory but cannot sign in. Sign in as a Tier 1 persona
# (richard@example.com) and look at the app around them.

db_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
members="${DEMO_MEMBERS:-1200}"
demo_seed="${DEMO_SEED:-bridgecircle}"
# Defaults to Chadwick International, which the runbook designates as the rich
# fixture. Chadwick School is the tested fixture and pgTAP asserts on its exact
# directory roster, so generating into it will fail the suite.
org_id="${DEMO_ORG_ID:-22222222-2222-4222-8222-222222222222}"

if ! command -v psql >/dev/null 2>&1; then
  echo "seed-demo: psql is required but was not found on PATH" >&2
  exit 1
fi

if [[ ! "$members" =~ ^[0-9]+$ ]] || (( members < 10 || members > 50000 )); then
  echo "seed-demo: DEMO_MEMBERS must be an integer between 10 and 50000 (got '$members')" >&2
  exit 1
fi

# This writes committed data. Refuse anything that is not obviously a local
# disposable stack unless the caller opts in explicitly, and refuse production
# outright regardless of the opt-in.
if [[ "$db_url" == *prod* || "$db_url" == *production* ]]; then
  echo "seed-demo: refusing to run against a URL containing a production identifier" >&2
  exit 1
fi

if [[ "$db_url" != *127.0.0.1* && "$db_url" != *localhost* ]]; then
  if [[ "${DEMO_ALLOW_REMOTE:-0}" != "1" ]]; then
    echo "seed-demo: target is not local. Re-run with DEMO_ALLOW_REMOTE=1 if that is intended." >&2
    exit 1
  fi
  echo "seed-demo: WARNING — running against a non-local database." >&2
fi

psql_base=(psql "$db_url" -v ON_ERROR_STOP=1 -X -q)

organization_name="$("${psql_base[@]}" -t -A -c \
  "select name from public.organizations where id = '${org_id}'")"

if [[ -z "$organization_name" ]]; then
  echo "seed-demo: organization ${org_id} does not exist. Run 'pnpm db:reset' first." >&2
  exit 1
fi

echo "seed-demo: generating ${members} members into ${organization_name}"
echo "seed-demo: seed='${demo_seed}' (same seed and count always produce the same population)"

"${psql_base[@]}" \
  -v members="$members" \
  -v demo_seed="$demo_seed" \
  -v org_id="$org_id" <<'SQL'
begin;

-- Remove any previous run's output so the script is re-runnable. Order matters:
-- asks reference conversations with on delete restrict.
delete from public.ask_offers
  where ask_id in (select id from public.asks where id::text like 'dddddddd-2222-%');
delete from public.asks where id::text like 'dddddddd-2222-%';
delete from public.connections
  where user_a_id::text like 'dddddddd-0000-%' or user_b_id::text like 'dddddddd-0000-%';
delete from public.conversation_reads
  where conversation_id in (select id from public.conversations where id::text like 'dddddddd-4444-%');
delete from public.messages
  where conversation_id in (select id from public.conversations where id::text like 'dddddddd-4444-%');
delete from public.conversations where id::text like 'dddddddd-4444-%';
delete from public.helper_topics where organization_membership_id::text like 'dddddddd-1111-%';
delete from public.helper_preferences where organization_membership_id::text like 'dddddddd-1111-%';
delete from public.profile_skills where user_id::text like 'dddddddd-0000-%';
delete from public.profile_education where user_id::text like 'dddddddd-0000-%';
delete from public.profile_experiences where user_id::text like 'dddddddd-0000-%';
delete from public.organization_profiles where organization_membership_id::text like 'dddddddd-1111-%';
delete from public.organization_memberships where id::text like 'dddddddd-1111-%';
delete from public.profiles where user_id::text like 'dddddddd-0000-%';
delete from public.users where id::text like 'dddddddd-0000-%';

-- One row per generated member, with every derived attribute resolved up front.
--
-- Six independent hashes per member, each 28 bits, are carved into several
-- fields by different moduli. Everything is a pure function of (seed, n), so the
-- same inputs always rebuild the same population.
create temporary table demo_member on commit drop as
select
  n,
  ('dddddddd-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid as user_id,
  ('dddddddd-1111-4000-8000-' || lpad(n::text, 12, '0'))::uuid as membership_id,

  -- Class years run 2013 (the first graduating class) to 2026, deliberately
  -- skewed recent: newer alumni adopt an alumni product faster, so the median
  -- member sits well after the midpoint. Cohorts are contiguous in n, which is
  -- what lets the connection graph cluster by class year further down.
  (2013 + least(13, floor(14 * power((n - 1)::numeric / greatest(:members, 1), 0.6))::int))::smallint as graduation_year,

  -- Profile completeness is the single most important distribution here. The
  -- modal member of a real network has almost nothing filled in, and a seed
  -- where everyone is complete makes every surface look better than it will.
  case
    when h.ha % 100 < 12 then 'rich'
    when h.ha % 100 < 45 then 'partial'
    else 'sparse'
  end as tier,

  (array[
    'Alex','Grace','Daniel','Sophia','Ethan','Hana','Lucas','Mia','Noah','Yuna',
    'Oliver','Chloe','Nathan','Ava','Ryan','Elise','Adrian','Nina','Kevin','Jasmine',
    'Marcus','Leah','Sebastian','Irene','Julian','Clara','Aaron','Maya','Victor','Erin',
    'Simon','Tessa','Felix','Joy','Dominic','Ruby','Elliot','Sena','Caleb','Iris'
  ])[1 + (h.ha / 100) % 40] as first_name,

  (array[
    'Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Chen','Wang',
    'Liu','Zhang','Tan','Lim','Ng','Sato','Tanaka','Nakamura','Patel','Sharma',
    'Nguyen','Tran','Bennett','Carter','Whitfield','Okafor','Adeyemi','Alvarez','Castro','Romero',
    'Muller','Schneider','Rossi','Ferrari','Novak','Andersen','Larsen','Dubois','Moreau','Hansen'
  ])[1 + (h.ha / 4000) % 40] as last_name,

  -- An international school in Songdo whose alumni scatter. Korea and the US
  -- dominate; the tail is long and genuinely global.
  (case
    when h.hb % 100 < 18 then 'Seoul, South Korea'
    when h.hb % 100 < 26 then 'Songdo, South Korea'
    when h.hb % 100 < 34 then 'New York, NY'
    when h.hb % 100 < 42 then 'Los Angeles, CA'
    when h.hb % 100 < 49 then 'San Francisco, CA'
    when h.hb % 100 < 55 then 'Boston, MA'
    when h.hb % 100 < 61 then 'London, United Kingdom'
    when h.hb % 100 < 66 then 'Singapore'
    when h.hb % 100 < 71 then 'Tokyo, Japan'
    when h.hb % 100 < 76 then 'Hong Kong'
    when h.hb % 100 < 81 then 'Shanghai, China'
    when h.hb % 100 < 85 then 'Toronto, Canada'
    when h.hb % 100 < 89 then 'Sydney, Australia'
    when h.hb % 100 < 92 then 'Berlin, Germany'
    when h.hb % 100 < 95 then 'Paris, France'
    when h.hb % 100 < 97 then 'Dubai, United Arab Emirates'
    when h.hb % 100 < 99 then 'Vancouver, Canada'
    else 'Melbourne, Australia'
  end) as city,

  (array[
    'Samsung Electronics','Naver','Kakao','Coupang','Hyundai Motor','LG Chem','SK Hynix',
    'Goldman Sachs','McKinsey & Company','Bain & Company','Google','Meta','Stripe','Figma',
    'Notion','Airbnb','Bloomberg','Reuters','Pfizer','Genentech','Arup','Deloitte',
    'HSBC','Standard Chartered','Shopify','Canva','Atlassian','Siemens','Unilever','Nestle'
  ])[1 + (h.hb / 100) % 30] as employer,

  (array[
    'Analyst','Associate','Senior Associate','Manager','Senior Manager','Director',
    'Software Engineer','Senior Software Engineer','Product Manager','Product Designer',
    'Research Scientist','Consultant','Strategy Lead','Operations Lead','Founder',
    'Attorney','Reporter','Teacher','Physician','Engineer'
  ])[1 + (h.hb / 3000) % 20] as title,

  (array[
    'Technology','Finance','Consulting','Healthcare','Media','Education','Legal',
    'Manufacturing','Retail','Energy','Nonprofit','Government'
  ])[1 + (h.hc / 540) % 12] as industry,

  (array[
    'Yonsei University','Korea University','Seoul National University','KAIST',
    'Stanford University','Harvard University','Columbia University','New York University',
    'University of California, Berkeley','UCLA','Boston University','Northwestern University',
    'University of Michigan','Cornell University','Duke University','University of Chicago',
    'London School of Economics','University College London','Imperial College London',
    'National University of Singapore','University of Tokyo','University of Toronto',
    'University of Melbourne','ETH Zurich','IE University'
  ])[1 + (h.hd / 100) % 25] as university,

  (array[
    'Economics','Computer Science','Business Administration','Biology','Political Science',
    'Mechanical Engineering','English Literature','Psychology','Chemistry','Design',
    'International Relations','Mathematics','Communications','Public Policy','Statistics'
  ])[1 + (h.hf / 100) % 15] as major,

  -- Spread over eighteen months so recency-ordered surfaces mean something.
  (now() - ((h.hc % 540) || ' days')::interval) as joined_at,

  -- Connection degree follows a power law: half the members have none at all,
  -- most of the rest have a handful, and a thin tail are heavily connected.
  case
    when h.hd % 100 < 50 then 0
    when h.hd % 100 < 85 then 1 + (h.hd % 3)
    when h.hd % 100 < 97 then 4 + (h.hd % 9)
    else 25 + (h.hd % 40)
  end as degree_count,
  h.he % 100 as helper_roll,
  (h.he / 100) % 18 as topic_roll,
  h.hf % 100 as misc_roll
from generate_series(1, :members) as n,
lateral (
  select
    ('x' || substr(md5(:'demo_seed' || ':a:' || n::text), 1, 7))::bit(28)::int as ha,
    ('x' || substr(md5(:'demo_seed' || ':b:' || n::text), 1, 7))::bit(28)::int as hb,
    ('x' || substr(md5(:'demo_seed' || ':c:' || n::text), 1, 7))::bit(28)::int as hc,
    ('x' || substr(md5(:'demo_seed' || ':d:' || n::text), 1, 7))::bit(28)::int as hd,
    ('x' || substr(md5(:'demo_seed' || ':e:' || n::text), 1, 7))::bit(28)::int as he,
    ('x' || substr(md5(:'demo_seed' || ':f:' || n::text), 1, 7))::bit(28)::int as hf
) h;

create index demo_member_n_idx on demo_member (n);

insert into public.users (id, onboarding_completed_at, created_at)
select user_id, joined_at, joined_at from demo_member;

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at, created_at
)
select membership_id, user_id, :'org_id', 'active', joined_at, joined_at
from demo_member;

-- Only the rich tier gets a full profile. The partial tier gets a headline and
-- a workplace. The sparse majority gets a name and, sometimes, a city.
insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, university, major, updated_at
)
select
  user_id,
  first_name || ' ' || last_name,
  case tier
    when 'rich' then
      case misc_roll % 4
        -- Deliberately varied lengths. Most real headlines are short; the long
        -- ones are what actually exercise truncation.
        when 0 then title || ' at ' || employer
        when 1 then 'Working on ' || lower(industry) || ' in ' || split_part(city, ',', 1)
        when 2 then 'Happy to talk about ' || lower(industry) || ', careers, and moving abroad'
        else title || ' at ' || employer || '. Previously ' || major || ' at ' || university
             || ', and still glad to talk to anyone weighing that path.'
      end
    when 'partial' then
      case misc_roll % 3
        when 0 then title || ' at ' || employer
        when 1 then lower(industry)
        else 'Alum'
      end
    else null
  end,
  case when tier in ('rich', 'partial') then employer else null end,
  case when tier = 'rich' then title else null end,
  case when tier = 'rich' then industry else null end,
  case when tier in ('rich', 'partial') or misc_roll % 3 = 0 then city else null end,
  case when tier = 'rich' then university else null end,
  case when tier = 'rich' then major else null end,
  joined_at
from demo_member;

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio, updated_at
)
select
  membership_id, :'org_id', graduation_year,
  case
    when tier = 'rich' then
      'Class of ' || graduation_year || '. ' || title || ' at ' || employer
      || ', based in ' || split_part(city, ',', 1) || '.'
    when tier = 'partial' and misc_roll % 2 = 0 then
      'Class of ' || graduation_year || '.'
    else null
  end,
  joined_at
from demo_member;

-- Career and education history for the rich tier only. Note the deliberate
-- single open-ended role per member: Home recognition suppresses anyone with
-- two concurrent current roles, so a second open-ended row would silently
-- remove them from that surface.
insert into public.profile_experiences (
  user_id, employer, title, start_year, end_year, description, sort_order
)
select user_id, employer, title, graduation_year + 2, null, null, 0
from demo_member where tier = 'rich';

insert into public.profile_experiences (
  user_id, employer, title, start_year, end_year, description, sort_order
)
select
  user_id,
  (array['Kearney','EY','KPMG','Accenture','Samsung SDS','LINE','Grab','Rakuten'])[1 + misc_roll % 8],
  'Analyst',
  graduation_year,
  graduation_year + 2,
  null,
  1
from demo_member where tier = 'rich' and misc_roll % 2 = 0;

insert into public.profile_education (
  user_id, school, degree, field, start_year, end_year, sort_order
)
select user_id, university, 'B.A.', major, graduation_year, graduation_year + 4, 0
from demo_member where tier = 'rich';

insert into public.profile_skills (user_id, name, normalized_name, sort_order)
select user_id, industry, lower(industry), 0
from demo_member where tier = 'rich';

-- Roughly a quarter of members are open to help, concentrated in the rich tier,
-- with a realistic slice paused. A directory where everyone is available is the
-- most misleading thing a seed can do to a Help product.
insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help,
  max_pending_requests, consecutive_timeouts, paused_at, pause_reason
)
select
  membership_id, :'org_id',
  helper_roll >= 8,
  case when helper_roll % 2 = 0 then 5 else 10 end,
  case when helper_roll < 8 then 3 else helper_roll % 3 end,
  case when helper_roll < 8 then joined_at + interval '200 days' else null end,
  case when helper_roll < 4 then 'unresponsive'
       when helper_roll < 8 then 'manual'
       else null end
from demo_member
where (tier = 'rich' and helper_roll < 80)
   or (tier = 'partial' and helper_roll < 40);

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
)
select
  preference.organization_membership_id, :'org_id',
  topic.name, lower(topic.name), topic.slot
from public.helper_preferences preference
join demo_member on demo_member.membership_id = preference.organization_membership_id
cross join lateral (
  select entry.name, entry.idx - 1 as slot
  from unnest((array[
    (array[
      'Career changes','Graduate school','First jobs','Interviewing','Working abroad',
      'Product management','Software engineering','Consulting','Investment banking','Startups',
      'Medicine','Law school','Journalism','Teaching','Nonprofit work','Design',
      'Research careers','Public policy'
    ])[1 + demo_member.topic_roll],
    (array[
      'Relocating','Negotiating an offer','Building a network','Changing industries',
      'Going independent','Managing people'
    ])[1 + demo_member.misc_roll % 6]
  ])[1:1 + (demo_member.misc_roll % 2)])
    with ordinality as entry(name, idx)
) as topic
where preference.organization_membership_id::text like 'dddddddd-1111-%';

-- The connection graph. Two properties matter more than the edge count:
-- clustering (real alumni connect within their class year, which is why cohorts
-- are contiguous in n and targets are drawn from a nearby index window) and
-- hubs (a handful of highly connected members). Uniform random edges produce
-- almost no mutual connections and no hot rows, which makes mutual-connection
-- features look broken and performance look better than it will be.
create temporary table demo_edge on commit drop as
select distinct
  least(source.user_id, target.user_id) as user_a_id,
  greatest(source.user_id, target.user_id) as user_b_id
from demo_member source
cross join lateral generate_series(1, source.degree_count) as slot
join lateral (
  select 1 + (
    case
      -- One edge in six reaches a hub: a small set of very well connected
      -- members, which is what a real network's degree distribution looks like.
      when (('x' || substr(md5('edge:' || source.n::text || ':' || slot::text), 1, 7))::bit(28)::int) % 6 = 0
        then (('x' || substr(md5('hub:' || source.n::text || ':' || slot::text), 1, 7))::bit(28)::int) % least(40, :members)
      -- The rest stay inside a nearby index window, which means inside or
      -- adjacent to the member's own graduation cohort.
      else (
        source.n - 1
        + (('x' || substr(md5('near:' || source.n::text || ':' || slot::text), 1, 7))::bit(28)::int) % 61
        - 30
        + :members
      ) % :members
    end
  ) as target_n
) as pick on true
join demo_member target on target.n = pick.target_n
where target.n <> source.n
  -- Members who never initiate also rarely receive. Without this, uniform
  -- target selection quietly connects almost the whole roster, and the
  -- no-connections empty state stops being reachable at all.
  and (
    target.degree_count > 0
    or (('x' || substr(md5('recv:' || source.n::text || ':' || slot::text), 1, 7))::bit(28)::int) % 8 = 0
  );

insert into public.connections (user_a_id, user_b_id, origin_organization_id, created_at)
select
  user_a_id, user_b_id, :'org_id',
  now() - ((('x' || substr(md5('conn:' || user_a_id::text || user_b_id::text), 1, 7))::bit(28)::int % 400) || ' days')::interval
from demo_edge
on conflict (user_a_id, user_b_id) do nothing;

-- Asks. About a fifth of members have ever asked, and among those the count is
-- skewed, so a handful account for a large share. Statuses are weighted toward
-- historical outcomes rather than a queue of everything being open at once.
create temporary table demo_asker on commit drop as
select n, user_id, membership_id, row_number() over (order by n) as slot
from demo_member
where misc_roll % 100 < 22;

create temporary table demo_ask on commit drop as
select
  i,
  ('dddddddd-2222-4000-8000-' || lpad(i::text, 12, '0'))::uuid as ask_id,
  ('dddddddd-3333-4000-8000-' || lpad(i::text, 12, '0'))::uuid as client_request_id,
  asker.membership_id as asker_membership_id,
  asker.n as asker_n,
  hash.hv,
  (now() - ((hash.hv % 500) || ' days')::interval) as created_at
from generate_series(1, greatest(1, (:members * 4) / 10)) as i
cross join lateral (
  select ('x' || substr(md5(:'demo_seed' || ':ask:' || i::text), 1, 7))::bit(28)::int as hv
) hash
join lateral (
  select *
  from demo_asker
  -- Squaring two draws concentrates asks on a minority of the asker pool,
  -- rather than spreading them evenly across it.
  where slot = 1 + (
    ((hash.hv % (select count(*) from demo_asker))
     * ((hash.hv / 977) % (select count(*) from demo_asker)))
    / (select count(*) from demo_asker)
  ) % (select count(*) from demo_asker)
  limit 1
) asker on true;

-- Direct asks. Recipients are drawn from the open-to-help pool, which is how
-- the product routes them.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  decline_reason_code, decline_note, closure_reason,
  responded_at, ended_at, expires_at, created_at
)
select
  demo_ask.ask_id, :'org_id', demo_ask.asker_membership_id, 'direct',
  status.value,
  recipient.membership_id,
  question.value,
  'Any perspective would help, even a short one.',
  null, false, demo_ask.client_request_id,
  case when status.value = 'declined' then 'unavailable' else null end,
  case when status.value = 'declined' then 'Stretched thin this month — please do ask again later.' else null end,
  case when status.value = 'closed' then 'silence_timeout' else null end,
  case when status.value = 'declined' then demo_ask.created_at + interval '2 days' else null end,
  case when status.value in ('declined', 'retracted', 'closed')
       then demo_ask.created_at + interval '3 days' else null end,
  demo_ask.created_at + interval '14 days',
  demo_ask.created_at
from demo_ask
cross join lateral (
  select case
    when demo_ask.hv % 100 < 22 then 'waiting'
    when demo_ask.hv % 100 < 50 then 'closed'
    when demo_ask.hv % 100 < 72 then 'declined'
    else 'retracted'
  end as value
) status
cross join lateral (
  select case demo_ask.hv % 6
    when 0 then 'How did you decide what to do after graduating?'
    when 1 then 'Would you be open to a short conversation about your work?'
    when 2 then 'advice on grad school?'
    when 3 then 'I am weighing two offers and would value an outside read on how to compare them beyond the salary number.'
    when 4 then 'Any advice for someone moving to your city for a first job?'
    else 'How did you get into your industry?'
  end as value
) question
join lateral (
  select member.membership_id
  from demo_member member
  join public.helper_preferences preference
    on preference.organization_membership_id = member.membership_id
   and preference.open_to_help
  where member.n <> demo_ask.asker_n
  offset (demo_ask.hv % greatest(1, (select count(*) from public.helper_preferences where open_to_help
          and organization_membership_id::text like 'dddddddd-1111-%')))
  limit 1
) recipient on true
where demo_ask.hv % 100 < 70;

-- Circle asks, split across both reach values.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  closure_reason, ended_at, expires_at, created_at
)
select
  demo_ask.ask_id, :'org_id', demo_ask.asker_membership_id, 'circle',
  case when demo_ask.hv % 100 < 85 then 'open' else 'closed' end,
  null,
  case demo_ask.hv % 5
    when 0 then 'Has anyone here moved from consulting into an operating role?'
    when 1 then 'Who has hired for a first design role?'
    when 2 then 'anyone in biotech?'
    when 3 then 'Looking for anyone who has started a company outside their home country and would be willing to say what they wish they had known first.'
    else 'Who has relocated for work and would do it again?'
  end,
  null,
  case when demo_ask.hv % 3 = 0 then 'organization' else 'matched' end,
  demo_ask.hv % 9 = 0,
  demo_ask.client_request_id,
  case when demo_ask.hv % 100 >= 85 then 'silence_timeout' else null end,
  case when demo_ask.hv % 100 >= 85 then demo_ask.created_at + interval '15 days' else null end,
  demo_ask.created_at + interval '14 days',
  demo_ask.created_at
from demo_ask
where demo_ask.hv % 100 >= 70;

-- Wire the hand-authored Tier 1 personas into the generated graph.
--
-- Without this the demo population only ever connects to itself, so signing in
-- as a persona shows a large directory but an empty circle and no mutual
-- connections — which is exactly the thing this tier exists to fix. Members
-- still mid-onboarding are excluded on purpose: their cold-start empty state is
-- a fixture worth keeping.
create temporary table demo_bridge on commit drop as
select
  membership.id as membership_id,
  membership.user_id,
  organization_profile.graduation_year,
  6 + (('x' || substr(md5('bridge:' || membership.id::text), 1, 7))::bit(28)::int) % 30 as degree
from public.organization_memberships membership
join public.users account on account.id = membership.user_id
join public.organization_profiles organization_profile
  on organization_profile.organization_membership_id = membership.id
where membership.organization_id = :'org_id'::uuid
  and membership.status = 'active'
  and account.account_state = 'active'
  and account.onboarding_completed_at is not null
  and membership.id::text not like 'dddddddd-1111-%'
  and organization_profile.graduation_year is not null;

insert into public.connections (user_a_id, user_b_id, origin_organization_id, created_at)
select distinct
  least(bridge.user_id, peer.user_id),
  greatest(bridge.user_id, peer.user_id),
  :'org_id'::uuid,
  now() - ((('x' || substr(md5('bts:' || bridge.user_id::text || peer.user_id::text), 1, 7))::bit(28)::int % 400) || ' days')::interval
from demo_bridge bridge
cross join lateral generate_series(1, bridge.degree) as slot
join lateral (
  -- Same clustering rule as the generated graph: connect inside the persona's
  -- own class year, give or take one.
  select cohort.user_id
  from demo_member cohort
  where abs(cohort.graduation_year - bridge.graduation_year) <= 1
  offset (
    (('x' || substr(md5('btgt:' || bridge.membership_id::text || ':' || slot::text), 1, 7))::bit(28)::int)
    % greatest(1, (
      select count(*) from demo_member c2
      where abs(c2.graduation_year - bridge.graduation_year) <= 1
    ))
  )
  limit 1
) peer on true
where peer.user_id <> bridge.user_id
on conflict (user_a_id, user_b_id) do nothing;

-- Every accepted Connection owns exactly one conversation room.
--
-- This is a hard invariant, not a nicety: the People directory projection
-- rejects a connected member with no room outright
-- ("connected row has inconsistent durable IDs" in db/repositories/people.ts),
-- so generating connections without rooms breaks the directory for anyone who
-- has one. Tier 1 creates a room alongside every connection for the same reason.
insert into public.conversations (id, user_a_id, user_b_id, created_at, last_message_at)
select
  ('dddddddd-4444-4000-8000-' || lpad(
    (row_number() over (order by link.user_a_id, link.user_b_id))::text, 12, '0'))::uuid,
  link.user_a_id, link.user_b_id, link.created_at, link.created_at
from public.connections link
where (link.user_a_id::text like 'dddddddd-0000-%' or link.user_b_id::text like 'dddddddd-0000-%')
  and not exists (
    select 1 from public.conversations existing
    where existing.user_a_id = link.user_a_id
      and existing.user_b_id = link.user_b_id
  );

insert into public.messages (
  conversation_id, kind, body, system_event_type, system_event_key,
  system_actor_user_id, created_at
)
select
  room.id, 'system', 'Connection accepted.', 'connection_accepted',
  'demo:connection_accepted:' || room.id::text, room.user_b_id, room.created_at
from public.conversations room
where room.id::text like 'dddddddd-4444-%';

-- Give the personas who are open to help a Help inbox with something in it.
-- Counts stay under each helper's pending capacity so the seeded state is one
-- the command layer would actually allow.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  expires_at, created_at
)
select
  ('dddddddd-2222-4000-8000-' || lpad((900000 + row_number() over ())::text, 12, '0'))::uuid,
  :'org_id'::uuid,
  sender.membership_id,
  'direct', 'waiting',
  helper.organization_membership_id,
  case sender.n % 4
    when 0 then 'Could I ask you about how you got into your field?'
    when 1 then 'quick question about grad school if you have a minute'
    when 2 then 'I am about to graduate and would value twenty minutes with someone who has been through the first year already.'
    else 'Would you be open to a short conversation?'
  end,
  'Happy to work around your schedule.',
  null, false,
  ('dddddddd-3333-4000-8000-' || lpad((900000 + row_number() over ())::text, 12, '0'))::uuid,
  now() + interval '12 days',
  now() - ((sender.n % 21) || ' days')::interval
from public.helper_preferences helper
join demo_bridge bridge on bridge.membership_id = helper.organization_membership_id
cross join lateral (
  select member.n, member.membership_id
  from demo_member member
  offset (('x' || substr(md5('inbox:' || helper.organization_membership_id::text), 1, 7))::bit(28)::int) % greatest(1, :members - 4)
  limit least(4, greatest(1, helper.max_pending_requests - 2))
) sender
where helper.open_to_help;

commit;
SQL

echo
echo "seed-demo: done. Population summary:"
"${psql_base[@]}" -v org_id="$org_id" <<'SQL'
\pset border 2
select 'members' as metric, count(*)::text as value
  from public.organization_memberships where id::text like 'dddddddd-1111-%'
union all
select 'profiles with a headline',
       count(*) filter (where headline is not null)::text || ' of ' || count(*)::text
  from public.profiles where user_id::text like 'dddddddd-0000-%'
union all
select 'open to help',
       count(*) filter (where open_to_help)::text || ' (' ||
       count(*) filter (where paused_at is not null)::text || ' paused)'
  from public.helper_preferences where organization_membership_id::text like 'dddddddd-1111-%'
union all
select 'connections', count(*)::text
  from public.connections
  where user_a_id::text like 'dddddddd-0000-%' or user_b_id::text like 'dddddddd-0000-%'
union all
select 'persona circles (min-max)',
       coalesce(min(circle)::text || '-' || max(circle)::text, 'none')
  from (
    select count(*) as circle
    from public.organization_memberships m
    join public.connections c on c.user_a_id = m.user_id or c.user_b_id = m.user_id
    where m.organization_id = :'org_id'::uuid
      and m.status = 'active'
      and m.id::text not like 'dddddddd-1111-%'
    group by m.user_id
  ) persona
union all
select 'busiest member connections', max(degree)::text
  from (
    select count(*) as degree
    from (
      select user_a_id as u from public.connections where user_a_id::text like 'dddddddd-0000-%'
      union all
      select user_b_id from public.connections where user_b_id::text like 'dddddddd-0000-%'
    ) edges group by u
  ) degrees
union all
select 'members with no connections',
       (select count(*) from public.organization_memberships m
         where m.id::text like 'dddddddd-1111-%'
           and not exists (
             select 1 from public.connections c
             where c.user_a_id = m.user_id or c.user_b_id = m.user_id
           ))::text
union all
select 'asks', count(*)::text
  from public.asks where id::text like 'dddddddd-2222-%'
union all
select 'class years', min(graduation_year)::text || '-' || max(graduation_year)::text
  from public.organization_profiles where organization_membership_id::text like 'dddddddd-1111-%'
union all
select 'cities', count(distinct city)::text
  from public.profiles where user_id::text like 'dddddddd-0000-%' and city is not null;
SQL
