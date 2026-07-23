begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(33);

select extensions.has_table(
  'private', 'ask_outcome_shares',
  'Home outcome consent uses private participant-scoped storage'
);
select extensions.has_column(
  'private', 'ask_outcome_shares', 'share_story',
  'story consent is explicit'
);
select extensions.has_column(
  'private', 'ask_outcome_shares', 'share_identity',
  'identity consent is separately explicit'
);
select extensions.ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'private'
      and tablename = 'ask_outcome_shares'
      and indexname = 'ask_outcome_shares_participant_idx'
  ),
  'participant consent lookup has a purpose-built index'
);
select extensions.has_function(
  'api', 'get_home_native', array['uuid'],
  'Home-native facts use one membership-scoped projection'
);
select extensions.has_function(
  'api', 'save_ask_outcome_share', array['uuid', 'boolean', 'boolean'],
  'outcome sharing uses one idempotent participant command'
);
select extensions.ok(
  has_function_privilege('authenticated', 'api.get_home_native(uuid)', 'execute'),
  'authenticated members can load Home-native facts'
);
select extensions.ok(
  has_function_privilege(
    'authenticated', 'api.save_ask_outcome_share(uuid,boolean,boolean)', 'execute'
  ),
  'authenticated participants can reach the guarded consent command'
);
select extensions.ok(
  not has_function_privilege('anon', 'api.get_home_native(uuid)', 'execute'),
  'anonymous callers cannot load Home-native facts'
);
select extensions.ok(
  not has_function_privilege(
    'anon', 'api.save_ask_outcome_share(uuid,boolean,boolean)', 'execute'
  ),
  'anonymous callers cannot save outcome consent'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.ask_outcome_shares', 'select'),
  'members cannot inspect raw bilateral consent'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated', 'private.save_ask_outcome_share(uuid,boolean,boolean)', 'execute'
  ),
  'members cannot bypass the API consent boundary'
);
select extensions.ok(
  pg_get_constraintdef((
    select constraint_row.oid
    from pg_constraint constraint_row
    join pg_class relation on relation.oid = constraint_row.conrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'private'
      and relation.relname = 'ask_outcome_shares'
      and constraint_row.conname = 'ask_outcome_shares_identity_requires_story_check'
  )) like '%NOT share_identity%share_story%',
  'identity can never be shared without story consent'
);
select extensions.ok(
  exists (
    select 1
    from pg_trigger trigger_row
    join pg_class relation on relation.oid = trigger_row.tgrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'private'
      and relation.relname = 'ask_outcome_shares'
      and trigger_row.tgname = 'enforce_ask_outcome_share_participant'
      and not trigger_row.tgisinternal
  ),
  'raw consent writes are guarded by resolved-Ask participation'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select extensions.is(
  api.get_home_native('20000000-0000-4000-8000-000000000002')->>'resultCode',
  'ok',
  'the selected active membership can load Home-native facts'
);
select extensions.is(
  api.get_home_native('20000000-0000-4000-8000-000000000001')->>'resultCode',
  'not_available',
  'another member membership cannot be used as a Home scope'
);
select extensions.ok(
  jsonb_typeof(
    api.get_home_native('20000000-0000-4000-8000-000000000002')->'weeklyPulse'->'newMembers'
  ) = 'number',
  'weekly new-member pulse is a count, not member identity'
);
select extensions.is(
  (select viewer_outcome_share_story
   from api.get_conversation_detail('50000000-0000-4000-8000-000000000003')),
  false,
  'conversation detail starts with only the viewer own false consent'
);
select extensions.is(
  (select outcome_story_eligible
   from api.get_conversation_detail('50000000-0000-4000-8000-000000000003')),
  false,
  'one missing participant choice does not reveal or enable a story'
);
select extensions.is(
  (select result_code from api.save_ask_outcome_share(
    '30000000-0000-4000-8000-000000000004', false, true
  )),
  'invalid_input',
  'identity consent without story consent is rejected'
);
select extensions.is(
  (select result_code from api.save_ask_outcome_share(
    '30000000-0000-4000-8000-000000000004', true, false
  )),
  'saved',
  'a resolved Ask participant can share the story anonymously'
);
select extensions.is(
  (select viewer_outcome_share_story
   from api.get_conversation_detail('50000000-0000-4000-8000-000000000003')),
  true,
  'conversation detail returns the viewer own saved choice'
);
select extensions.is(
  (select outcome_story_eligible
   from api.get_conversation_detail('50000000-0000-4000-8000-000000000003')),
  false,
  'the counterpart private choice remains folded into aggregate ineligibility'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select extensions.is(
  (select result_code from api.save_ask_outcome_share(
    '30000000-0000-4000-8000-000000000004', true, false
  )),
  'not_available',
  'a nonparticipant cannot save consent for someone else resolved Ask'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select extensions.is(
  (select result_code from api.save_ask_outcome_share(
    '30000000-0000-4000-8000-000000000004', true, false
  )),
  'saved',
  'the other participant can independently consent'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  (select outcome_story_eligible
   from api.get_conversation_detail('50000000-0000-4000-8000-000000000003')),
  true,
  'bilateral story consent becomes one aggregate eligibility bit'
);
select extensions.is(
  api.get_home_native('20000000-0000-4000-8000-000000000002')
    ->'outcomeStory'->>'identityMode',
  'anonymous',
  'bilateral story consent keeps the outcome anonymous by default'
);
select extensions.ok(
  not (
    api.get_home_native('20000000-0000-4000-8000-000000000002')->'outcomeStory'
      ? 'helperName'
  ),
  'anonymous outcomes omit participant names entirely'
);
select api.save_ask_outcome_share(
  '30000000-0000-4000-8000-000000000004', true, true
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select api.save_ask_outcome_share(
  '30000000-0000-4000-8000-000000000004', true, true
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.get_home_native('20000000-0000-4000-8000-000000000002')
    ->'outcomeStory'->>'identityMode',
  'identified',
  'names become eligible only after both participants explicitly opt in'
);
select extensions.is(
  api.get_home_native('20000000-0000-4000-8000-000000000002')
    ->'outcomeStory'->>'askerName',
  'Sam Rivera',
  'identified outcomes use the current participant profile name'
);
select api.save_ask_outcome_share(
  '30000000-0000-4000-8000-000000000004', false, false
);
select extensions.is(
  api.get_home_native('20000000-0000-4000-8000-000000000002')->'outcomeStory',
  'null'::jsonb,
  'either participant can revoke and immediately remove the Home story'
);
reset role;

select extensions.throws_ok(
  $$insert into private.ask_outcome_shares (
      ask_id, participant_user_id, share_story, first_shared_at
    ) values (
      '30000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000006',
      true, now()
    )$$,
  '23514',
  'invalid_ask_outcome_participant',
  'the table guard rejects a nonparticipant even for privileged writes'
);

update public.organization_memberships
set joined_at = now() - interval '1 year'
where id = '20000000-0000-4000-8000-000000000004';
insert into public.profile_experiences (
  user_id, employer, title, start_year, start_month
) values (
  '10000000-0000-4000-8000-000000000004',
  'New Horizon', 'Product VP',
  extract(year from now())::smallint,
  extract(month from now())::smallint
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.get_home_native('20000000-0000-4000-8000-000000000002')
    ->'recognition'->>'userId',
  '10000000-0000-4000-8000-000000000004',
  'recognition includes a single recent current role visible to the viewer'
);
reset role;

select * from extensions.finish();
rollback;
