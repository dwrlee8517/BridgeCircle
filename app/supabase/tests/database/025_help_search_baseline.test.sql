-- Contract test for the deterministic Help-search baseline
-- (20260815090000_help_search_deterministic_baseline.sql). Contract only:
-- shape, grants, eligibility gates, stemming sanity, determinism — asserted on
-- the hand-authored Tier 1 personas. Search QUALITY lives in the golden
-- dataset (`pnpm eval:search` against the Evalfield School corpus), not here.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(15);

-- Shape: parameters unchanged (the dormant p_query_embedding is the seam for
-- a future semantic stage), both wrappers recreated.
select extensions.has_function(
  'api', 'search_help_candidates',
  array['uuid', 'text', 'extensions.vector', 'integer'],
  'api.search_help_candidates keeps its parameter signature'
);
select extensions.has_function(
  'private', 'search_help_candidates',
  array['uuid', 'uuid', 'text', 'extensions.vector', 'integer'],
  'private.search_help_candidates keeps its parameter signature'
);
select extensions.has_function(
  'api', 'search_ask_matching_candidates',
  array['bigint', 'text', 'extensions.vector', 'integer'],
  'the worker matching wrapper keeps its parameter signature'
);

-- Grants.
select extensions.ok(
  has_function_privilege('authenticated', to_regprocedure('api.search_help_candidates(uuid, text, extensions.vector, integer)'), 'execute'),
  'members can execute the member search wrapper'
);
select extensions.ok(
  not has_function_privilege('anon', to_regprocedure('api.search_help_candidates(uuid, text, extensions.vector, integer)'), 'execute'),
  'anon cannot execute the member search wrapper'
);
select extensions.ok(
  not has_function_privilege('authenticated', to_regprocedure('private.search_help_candidates(uuid, uuid, text, extensions.vector, integer)'), 'execute'),
  'members cannot execute the private worker directly'
);
select extensions.ok(
  not has_function_privilege('authenticated', to_regprocedure('api.search_ask_matching_candidates(bigint, text, extensions.vector, integer)'), 'execute'),
  'members cannot execute the worker matching wrapper'
);
select extensions.ok(
  has_function_privilege('service_role', to_regprocedure('api.search_ask_matching_candidates(bigint, text, extensions.vector, integer)'), 'execute'),
  'service role can execute the worker matching wrapper'
);

-- Behavior, as Mei (only Consulting helper in Chadwick Local is Mark).
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;

select extensions.is(
  (select c.helper_membership_id
   from api.search_help_candidates('20000000-0000-4000-8000-000000000004', 'consulting', null, 5) c
   limit 1),
  '20000000-0000-4000-8000-000000000003'::uuid,
  'the topic holder ranks first for their declared topic'
);
select extensions.ok(
  (select c.score > 0 and c.matched_fields @> array['topics']
   from api.search_help_candidates('20000000-0000-4000-8000-000000000004', 'consulting', null, 5) c
   limit 1),
  'the new score and matched_fields columns carry the match'
);
select extensions.ok(
  exists (
    select 1
    from api.search_help_candidates('20000000-0000-4000-8000-000000000004', 'a consultant''s perspective before I decide', null, 5) c
    where c.helper_membership_id = '20000000-0000-4000-8000-000000000003'
  ),
  'stemming: consultant reaches the Consulting topic (the old substring test failed this)'
);
select extensions.is(
  (select count(*)
   from api.search_help_candidates('20000000-0000-4000-8000-000000000004', 'consulting', null, 40) c
   where c.helper_membership_id in (
     '20000000-0000-4000-8000-000000000001',  -- Amy: no helper preferences
     '20000000-0000-4000-8000-000000000005'   -- Sam: no helper preferences
   )),
  0::bigint,
  'members who never opted in are invisible at any rank'
);
select extensions.results_eq(
  $q$select c.helper_membership_id from api.search_help_candidates('20000000-0000-4000-8000-000000000004', 'consulting', null, 5) c$q$,
  $q$select c.helper_membership_id from api.search_help_candidates('20000000-0000-4000-8000-000000000004', 'consulting', null, 5) c$q$,
  'identical calls return identical row order'
);

-- Self-exclusion: Richard is the only Venture capital helper; asking as
-- Richard must never return himself (others may legitimately text-match, e.g.
-- Jordan's employer 'Northstar Ventures').
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.is(
  (select count(*)
   from api.search_help_candidates('20000000-0000-4000-8000-000000000002', 'venture capital', null, 40) c
   where c.helper_membership_id = '20000000-0000-4000-8000-000000000002'),
  0::bigint,
  'the viewer never surfaces in their own search'
);

-- Capacity gate: fill Mark to max_pending_requests (10) with waiting direct
-- asks; he must become invisible, not deprioritized.
reset role;
insert into public.asks (
  organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, client_request_id
)
select
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000002',
  'direct', 'waiting',
  '20000000-0000-4000-8000-000000000003',
  'Capacity filler ' || n, 'Capacity filler', gen_random_uuid()
from generate_series(1, 10) n;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select extensions.is(
  (select count(*)
   from api.search_help_candidates('20000000-0000-4000-8000-000000000004', 'consulting', null, 40) c
   where c.helper_membership_id = '20000000-0000-4000-8000-000000000003'),
  0::bigint,
  'a helper at max pending capacity is invisible'
);

select * from extensions.finish();
rollback;
