begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(15);

select extensions.has_table('private', 'profile_import_requests', 'private import request ledger exists');
select extensions.has_column('private', 'profile_change_proposals', 'source_metadata', 'proposal source metadata exists');
select extensions.has_function('api', 'begin_profile_import', array['uuid','uuid','text','text'], 'begin import API exists');
select extensions.has_function('api', 'finish_profile_import', array['uuid','jsonb','jsonb','text','jsonb','jsonb','numeric'], 'finish import API exists');
select extensions.has_function('api', 'get_my_profile_import', array['uuid','uuid'], 'proposal read API exists');
select extensions.has_function('api', 'apply_profile_import', array['uuid','uuid','jsonb','boolean'], 'atomic apply API exists');
select extensions.has_function('api', 'decline_profile_import', array['uuid','uuid'], 'decline API exists');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);

select extensions.is(
  (select result_code from api.get_my_profile_import('20000000-0000-4000-8000-000000000007', null)),
  'ok',
  'owner can read the pending proposal'
);

select extensions.is(
  (select result_code from api.begin_profile_import(
    '20000000-0000-4000-8000-000000000007',
    '94000000-0000-4000-8000-000000000001',
    'linkedin',
    'https://www.linkedin.com/in/alex-morgan'
  )),
  'started',
  'first request starts'
);

select extensions.is(
  (select result_code from api.begin_profile_import(
    '20000000-0000-4000-8000-000000000007',
    '94000000-0000-4000-8000-000000000001',
    'linkedin',
    'https://www.linkedin.com/in/alex-morgan'
  )),
  'in_progress',
  'duplicate request does not duplicate provider work'
);

select extensions.is(
  api.apply_profile_import(
    '20000000-0000-4000-8000-000000000007',
    '91000000-0000-4000-8000-000000000001',
    '{
      "identity":{"displayName":"Alex Morgan","preferredName":"Alex","nameOther":null,"graduationYear":2018},
      "education":{"university":"UCLA","major":"Public Policy","education":[{"school":"UCLA","degree":"B.A.","field":"Public Policy","startYear":2018,"startMonth":null,"endYear":2022,"endMonth":null,"description":null}]},
      "current":{"currentEmployer":"Civic Futures","currentTitle":"Program Associate","city":"Los Angeles, CA","headline":"Climate programs and community partnerships","industry":null},
      "history":{"experiences":[{"employer":"Civic Futures","title":"Program Associate","startYear":2024,"startMonth":7,"endYear":null,"endMonth":null,"description":"Builds partnerships for climate career programs."}],"skills":["community partnerships","climate programs","program management"]}
    }'::jsonb,
    false
  ),
  'applied',
  'proposal applies all profile sections atomically'
);

select extensions.is(
  (select current_employer from public.profiles where user_id = '10000000-0000-4000-8000-000000000007'),
  'Civic Futures',
  'current role was applied'
);
select extensions.is(
  (select count(*)::integer from public.profile_education where user_id = '10000000-0000-4000-8000-000000000007'),
  1,
  'education was applied'
);
select extensions.is(
  (select count(*)::integer from public.profile_skills where user_id = '10000000-0000-4000-8000-000000000007'),
  3,
  'skills were applied'
);

select extensions.is(
  api.apply_profile_import(
    '20000000-0000-4000-8000-000000000007',
    '91000000-0000-4000-8000-000000000001',
    '{}'::jsonb,
    false
  ),
  'already_reviewed',
  'a proposal cannot be applied twice'
);

select * from extensions.finish();
rollback;
