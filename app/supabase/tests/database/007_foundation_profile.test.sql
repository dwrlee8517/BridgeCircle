begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(43);

select (to_regprocedure('api.get_my_profile(uuid)') is not null)::integer
  as get_profile_exists \gset
select (to_regprocedure('api.save_profile_identity(uuid,text,text,text,smallint)') is not null)::integer
  as save_identity_exists \gset
select (to_regprocedure('api.save_profile_education(uuid,text,text,jsonb)') is not null)::integer
  as save_education_exists \gset
select (to_regprocedure('api.save_profile_current(uuid,text,text,text,text,text)') is not null)::integer
  as save_current_exists \gset
select (to_regprocedure('api.save_profile_history(uuid,jsonb,text[])') is not null)::integer
  as save_history_exists \gset
select (to_regprocedure('api.save_profile_preferences(uuid,text,boolean,text[],text,text,text,boolean)') is not null)::integer
  as save_preferences_exists \gset
select (to_regprocedure('api.set_my_avatar_path(uuid,text)') is not null)::integer
  as set_avatar_exists \gset
select (to_regprocedure('api.complete_onboarding(uuid)') is not null)::integer
  as complete_onboarding_exists \gset

insert into public.organizations (
  id, slug, name, requires_admin_approval
) values
  (
    '60000000-0000-4000-8000-000000000030',
    'foundation-profile', 'Foundation Profile', false
  ),
  (
    '60000000-0000-4000-8000-000000000031',
    'foundation-profile-other', 'Foundation Profile Other', false
  );

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', person.id,
  'authenticated', 'authenticated', person.email,
  extensions.crypt('foundation-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb, now(), now(), '', '', '', ''
from (values
  ('70000000-0000-4000-8000-000000000041'::uuid, 'profile-owner@example.com'),
  ('70000000-0000-4000-8000-000000000042'::uuid, 'profile-other@example.com'),
  ('70000000-0000-4000-8000-000000000043'::uuid, 'profile-pending@example.com'),
  ('70000000-0000-4000-8000-000000000044'::uuid, 'profile-blank@example.com')
) as person(id, email);

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  (
    '61000000-0000-4000-8000-000000000041',
    '70000000-0000-4000-8000-000000000041',
    '60000000-0000-4000-8000-000000000030', 'active', now()
  ),
  (
    '61000000-0000-4000-8000-000000000042',
    '70000000-0000-4000-8000-000000000042',
    '60000000-0000-4000-8000-000000000030', 'active', now()
  ),
  (
    '61000000-0000-4000-8000-000000000043',
    '70000000-0000-4000-8000-000000000043',
    '60000000-0000-4000-8000-000000000030', 'pending', null
  ),
  (
    '61000000-0000-4000-8000-000000000044',
    '70000000-0000-4000-8000-000000000044',
    '60000000-0000-4000-8000-000000000030', 'active', now()
  );

insert into public.profiles (
  user_id, display_name, preferred_name, headline, current_employer,
  current_title, city, university, major, linkedin_url
) values
  (
    '70000000-0000-4000-8000-000000000041', 'Profile Owner', 'Owner',
    'Owner headline', 'Owner Co', 'Founder', 'Los Angeles',
    'Owner University', 'History', 'https://www.linkedin.com/in/profile-owner'
  ),
  (
    '70000000-0000-4000-8000-000000000042', 'Profile Other', null,
    null, null, null, null, null, null, null
  ),
  (
    '70000000-0000-4000-8000-000000000043', 'Profile Pending', null,
    null, null, null, null, null, null, null
  );

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
) values
  (
    '61000000-0000-4000-8000-000000000041',
    '60000000-0000-4000-8000-000000000030', 2009, 'Owner bio'
  ),
  (
    '61000000-0000-4000-8000-000000000042',
    '60000000-0000-4000-8000-000000000030', 2010, null
  ),
  (
    '61000000-0000-4000-8000-000000000043',
    '60000000-0000-4000-8000-000000000030', null, null
  );

insert into public.profile_education (
  user_id, school, degree, field, start_year, end_year, sort_order
) values
  (
    '70000000-0000-4000-8000-000000000041',
    'Second School', 'MBA', null, 2015, 2017, 1
  ),
  (
    '70000000-0000-4000-8000-000000000041',
    'First School', 'BA', 'History', 2005, 2009, 0
  );

insert into public.profile_experiences (
  user_id, employer, title, start_year, end_year, sort_order
) values
  (
    '70000000-0000-4000-8000-000000000041',
    'Earlier Co', 'Analyst', 2009, 2012, 1
  ),
  (
    '70000000-0000-4000-8000-000000000041',
    'Current Co', 'Lead', 2013, null, 0
  );

insert into public.profile_skills (user_id, name, normalized_name, sort_order)
values
  ('70000000-0000-4000-8000-000000000041', 'Strategy', 'strategy', 0),
  ('70000000-0000-4000-8000-000000000041', 'Design', 'design', 1);

insert into public.profile_field_visibility (
  organization_membership_id, organization_id, field_key, audience
) values (
  '61000000-0000-4000-8000-000000000041',
  '60000000-0000-4000-8000-000000000030', 'career_history', 'connections'
);

insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help
) values (
  '61000000-0000-4000-8000-000000000041',
  '60000000-0000-4000-8000-000000000030', true
);

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
) values
  (
    '61000000-0000-4000-8000-000000000041',
    '60000000-0000-4000-8000-000000000030', 'Career change', 'career change', 0
  ),
  (
    '61000000-0000-4000-8000-000000000041',
    '60000000-0000-4000-8000-000000000030', 'Startups', 'startups', 1
  );

insert into private.profile_enrichment_settings (
  user_id, linkedin_url, refresh_policy, refresh_interval, consented_at
) values (
  '70000000-0000-4000-8000-000000000041',
  'https://www.linkedin.com/in/profile-owner',
  'review_before_update', 'monthly', now()
);

insert into public.member_blocks (blocker_user_id, blocked_user_id)
values (
  '70000000-0000-4000-8000-000000000042',
  '70000000-0000-4000-8000-000000000041'
);

select extensions.has_function(
  'api', 'get_my_profile', array['uuid'],
  'owner-only self-profile projection exists'
);

\if :get_profile_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000041', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'ok'
      and profile #>> '{identity,displayName}' = 'Profile Owner'
      and profile #>> '{membership,status}' = 'active'
      and profile #>> '{education,0,school}' = 'First School'
      and profile #>> '{experiences,0,employer}' = 'Current Co'
      and profile #>> '{visibility,career_history}' = 'connections'
      and profile #>> '{preferences,helperTopics,0,name}' = 'Career change'
    from api.get_my_profile('61000000-0000-4000-8000-000000000041')
  ),
  'owner receives one complete, deterministically ordered edit projection'
);
select extensions.ok(
  (
    select result_code = 'not_found' and profile is null
    from api.get_my_profile('61000000-0000-4000-8000-000000000042')
  ),
  'an orgmate cannot request another member edit projection'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000042', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'not_found' and profile is null
    from api.get_my_profile('61000000-0000-4000-8000-000000000041')
  ),
  'a blocked orgmate receives the same non-revealing denial'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000043', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'ok'
      and profile #>> '{membership,status}' = 'pending'
      and profile #>> '{identity,displayName}' = 'Profile Pending'
    from api.get_my_profile('61000000-0000-4000-8000-000000000043')
  ),
  'a pending owner can resume their own profile setup'
);
select extensions.ok(
  (
    select result_code = 'not_found' and profile is null
    from api.get_my_profile('ffffffff-ffff-4fff-8fff-ffffffffffff')
  ),
  'an invalid membership returns the non-revealing not_found result'
);
reset role;
\else
select * from extensions.skip(5, 'self-profile projection is not implemented yet');
\endif

select extensions.has_function(
  'api', 'save_profile_identity', array['uuid', 'text', 'text', 'text', 'smallint'],
  'atomic identity command exists'
);

\if :save_identity_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000043', true);
set local role authenticated;
select extensions.is(
  private.owns_membership(
    '61000000-0000-4000-8000-000000000043',
    '60000000-0000-4000-8000-000000000030'
  ),
  false,
  'the general ownership helper remains active-membership-only'
);
select extensions.is(
  api.save_profile_identity(
    '61000000-0000-4000-8000-000000000043',
    'Profile Pending', null, null, null
  ),
  'saved',
  'a pending owner can save onboarding profile fields'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  api.save_profile_identity(
    '61000000-0000-4000-8000-000000000044',
    '  Blank Member  ', '  Blank  ', null, 2011::smallint
  ),
  'saved',
  'identity command creates a missing global and organization profile'
);
reset role;
select extensions.ok(
  exists (
    select 1
    from public.profiles p
    join public.organization_profiles op
      on op.organization_membership_id = '61000000-0000-4000-8000-000000000044'
    where p.user_id = '70000000-0000-4000-8000-000000000044'
      and p.display_name = 'Blank Member'
      and p.preferred_name = 'Blank'
      and op.graduation_year = 2011
  ),
  'identity fields are normalized and committed together'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000041', true);
set local role authenticated;
select extensions.is(
  api.save_profile_identity(
    '61000000-0000-4000-8000-000000000044',
    'Stolen Name', null, null, 2012::smallint
  ),
  'not_owned',
  'identity command denies a non-owner'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.save_profile_identity(
  '61000000-0000-4000-8000-000000000044', '   ', null, null, 1899::smallint
) as invalid_identity_result \gset
reset role;
select extensions.ok(
  :'invalid_identity_result' = 'invalid_identity'
  and (
    select display_name = 'Blank Member'
    from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'invalid identity input makes no partial update'
);
\else
select * from extensions.skip(6, 'identity command is not implemented yet');
\endif

select extensions.has_function(
  'api', 'save_profile_education', array['uuid', 'text', 'text', 'jsonb'],
  'atomic education replacement command exists'
);

\if :save_education_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  api.save_profile_education(
    '61000000-0000-4000-8000-000000000044',
    'Primary University', 'Economics',
    '[{"school":"Primary University","degree":"BA","field":"Economics","startYear":2007,"endYear":2011},{"school":"Graduate School","degree":"MBA","startYear":2014,"endYear":2016}]'::jsonb
  ),
  'saved',
  'valid education aggregate is accepted'
);
reset role;
select extensions.ok(
  (
    select p.university = 'Primary University' and p.major = 'Economics'
    from public.profiles p
    where p.user_id = '70000000-0000-4000-8000-000000000044'
  )
  and (
    select array_agg(e.school order by e.sort_order, e.id)
      = array['Primary University', 'Graduate School']::text[]
    from public.profile_education e
    where e.user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'education summary and children preserve caller order'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.save_profile_education(
  '61000000-0000-4000-8000-000000000044',
  'Primary University', 'Economics',
  '[{"school":"Primary University","degree":"BA","field":"Economics","startYear":2007,"endYear":2011},{"school":"Graduate School","degree":"MBA","startYear":2014,"endYear":2016}]'::jsonb
) as education_retry_result \gset
reset role;
select extensions.ok(
  :'education_retry_result' = 'saved'
  and (
    select count(*) = 2
    from public.profile_education
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'education replacement is retry-safe without duplicate children'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.save_profile_education(
  '61000000-0000-4000-8000-000000000044',
  'Changed University', 'Changed Major',
  '[{"school":"Invalid School","startYear":2200}]'::jsonb
) as invalid_education_result \gset
reset role;
select extensions.ok(
  :'invalid_education_result' = 'invalid_education'
  and (
    select university = 'Primary University' and major = 'Economics'
    from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000044'
  )
  and (
    select count(*) = 2
    from public.profile_education
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'invalid education ranges roll back the whole replacement'
);
\else
select * from extensions.skip(4, 'education command is not implemented yet');
\endif

select extensions.has_function(
  'api', 'save_profile_current', array['uuid', 'text', 'text', 'text', 'text', 'text'],
  'current-profile command exists'
);

\if :save_current_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  api.save_profile_current(
    '61000000-0000-4000-8000-000000000044',
    'Bridge Co', 'Product Lead', 'Seoul', 'Building trusted networks',
    'https://www.linkedin.com/in/blank-member'
  ),
  'saved',
  'valid current-profile fields are accepted'
);
reset role;
select extensions.ok(
  (
    select current_employer = 'Bridge Co'
      and current_title = 'Product Lead'
      and city = 'Seoul'
      and headline = 'Building trusted networks'
      and linkedin_url = 'https://www.linkedin.com/in/blank-member'
    from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'current-profile fields commit together'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.save_profile_current(
  '61000000-0000-4000-8000-000000000044',
  'Changed Co', 'Changed title', 'Changed city', 'Changed headline',
  'http://linkedin.example.com/not-allowed'
) as invalid_current_result \gset
reset role;
select extensions.ok(
  :'invalid_current_result' = 'invalid_current'
  and (
    select current_employer = 'Bridge Co'
    from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'invalid current-profile input makes no partial update'
);
\else
select * from extensions.skip(3, 'current-profile command is not implemented yet');
\endif

select extensions.has_function(
  'api', 'save_profile_history', array['uuid', 'jsonb', 'text[]'],
  'experience and skills replacement command exists'
);

\if :save_history_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  api.save_profile_history(
    '61000000-0000-4000-8000-000000000044',
    '[{"employer":"Recent Co","title":"Lead","startYear":2018},{"employer":"Earlier Co","title":"Analyst","startYear":2012,"endYear":2017}]'::jsonb,
    array['Strategy', 'Community Building']
  ),
  'saved',
  'valid experience and skills aggregate is accepted'
);
reset role;
select extensions.ok(
  (
    select array_agg(e.employer order by e.sort_order, e.id)
      = array['Recent Co', 'Earlier Co']::text[]
    from public.profile_experiences e
    where e.user_id = '70000000-0000-4000-8000-000000000044'
  )
  and (
    select array_agg(s.normalized_name order by s.sort_order)
      = array['strategy', 'community building']::text[]
    from public.profile_skills s
    where s.user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'history children are normalized and preserve caller order'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.save_profile_history(
  '61000000-0000-4000-8000-000000000044',
  '[{"employer":"Recent Co","title":"Lead","startYear":2018},{"employer":"Earlier Co","title":"Analyst","startYear":2012,"endYear":2017}]'::jsonb,
  array['Strategy', 'Community Building']
) as history_retry_result \gset
reset role;
select extensions.ok(
  :'history_retry_result' = 'saved'
  and (
    select count(*) = 2
    from public.profile_experiences
    where user_id = '70000000-0000-4000-8000-000000000044'
  )
  and (
    select count(*) = 2
    from public.profile_skills
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'history replacement is retry-safe without duplicate children'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.save_profile_history(
  '61000000-0000-4000-8000-000000000044',
  '[{"employer":"Invalid Co","title":"Role","startYear":2020,"endYear":2010}]'::jsonb,
  array['Changed Skill']
) as invalid_history_result \gset
reset role;
select extensions.ok(
  :'invalid_history_result' = 'invalid_history'
  and (
    select count(*) = 2
    from public.profile_experiences
    where user_id = '70000000-0000-4000-8000-000000000044'
  )
  and (
    select count(*) = 2
    from public.profile_skills
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'invalid history input rolls back experience and skills together'
);
\else
select * from extensions.skip(4, 'history command is not implemented yet');
\endif

select extensions.has_function(
  'api', 'save_profile_preferences',
  array['uuid', 'text', 'boolean', 'text[]', 'text', 'text', 'text', 'boolean'],
  'profile preference aggregate command exists'
);

\if :save_preferences_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  api.save_profile_preferences(
    '61000000-0000-4000-8000-000000000044',
    'I can help with product transitions.', false,
    array['Product strategy', 'Career change'],
    'https://www.linkedin.com/in/blank-member',
    'review_before_update', 'quarterly', true
  ),
  'saved',
  'valid organization, helper, and freshness preferences are accepted'
);
reset role;
select extensions.ok(
  (
    select bio = 'I can help with product transitions.'
    from public.organization_profiles
    where organization_membership_id = '61000000-0000-4000-8000-000000000044'
  )
  and (
    select not open_to_help and paused_at is not null and pause_reason = 'manual'
    from public.helper_preferences
    where organization_membership_id = '61000000-0000-4000-8000-000000000044'
  )
  and (
    select array_agg(normalized_name order by sort_order)
      = array['product strategy', 'career change']::text[]
    from public.helper_topics
    where organization_membership_id = '61000000-0000-4000-8000-000000000044'
  )
  and (
    select refresh_interval = 'quarterly' and consented_at is not null
    from private.profile_enrichment_settings
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'preference aggregate is normalized and committed together'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.save_profile_preferences(
  '61000000-0000-4000-8000-000000000044',
  'Changed bio', true, array['Same', ' same '],
  'https://www.linkedin.com/in/blank-member',
  'review_before_update', 'monthly', true
) as invalid_preferences_result \gset
reset role;
select extensions.ok(
  :'invalid_preferences_result' = 'invalid_preferences'
  and (
    select bio = 'I can help with product transitions.'
    from public.organization_profiles
    where organization_membership_id = '61000000-0000-4000-8000-000000000044'
  ),
  'duplicate normalized topics reject the entire preference replacement'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000041', true);
set local role authenticated;
select extensions.is(
  api.save_profile_preferences(
    '61000000-0000-4000-8000-000000000044',
    'Stolen bio', true, array[]::text[], null,
    'manual_only', 'monthly', false
  ),
  'not_owned',
  'preference command denies a non-owner'
);
reset role;
\else
select * from extensions.skip(4, 'preference command is not implemented yet');
\endif

select extensions.has_function(
  'api', 'set_my_avatar_path', array['uuid', 'text'],
  'owner avatar-path command exists'
);

\if :set_avatar_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  api.set_my_avatar_path(
    '61000000-0000-4000-8000-000000000044',
    '70000000-0000-4000-8000-000000000044/avatar.webp'
  ),
  'saved',
  'owner avatar path is accepted'
);
reset role;
select extensions.is(
  (
    select avatar_path
    from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  '70000000-0000-4000-8000-000000000044/avatar.webp',
  'only the Storage object path is persisted'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select api.set_my_avatar_path(
  '61000000-0000-4000-8000-000000000044',
  '70000000-0000-4000-8000-000000000041/stolen.webp'
) as invalid_avatar_result \gset
reset role;
select extensions.ok(
  :'invalid_avatar_result' = 'invalid_avatar_path'
  and (
    select avatar_path = '70000000-0000-4000-8000-000000000044/avatar.webp'
    from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000044'
  ),
  'another user path prefix is rejected without changing the avatar'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000041', true);
set local role authenticated;
select extensions.is(
  api.set_my_avatar_path(
    '61000000-0000-4000-8000-000000000044', null
  ),
  'not_owned',
  'avatar command denies a non-owner'
);
reset role;
\else
select * from extensions.skip(4, 'avatar command is not implemented yet');
\endif

select extensions.has_function(
  'api', 'complete_onboarding', array['uuid'],
  'idempotent onboarding completion command exists'
);

\if :complete_onboarding_exists
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000043', true);
set local role authenticated;
select extensions.is(
  (select result_code from api.complete_onboarding('61000000-0000-4000-8000-000000000043')),
  'incomplete_profile',
  'onboarding requires the identity and graduation floor'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  (select result_code from api.complete_onboarding('61000000-0000-4000-8000-000000000044')),
  'completed',
  'complete profile can finish onboarding'
);
reset role;
select extensions.ok(
  (
    select onboarding_completed_at is not null
    from public.users
    where id = '70000000-0000-4000-8000-000000000044'
  )
  and (
    select count(*) = 1
    from private.audit_log
    where actor_user_id = '70000000-0000-4000-8000-000000000044'
      and organization_id = '60000000-0000-4000-8000-000000000030'
      and action = 'profile.onboarding_completed'
      and target_type = 'profile'
  )
  and (
    select count(*) = 1
    from private.outbox_jobs
    where job_type = 'index_profile'
      and dedupe_key = 'profile_index:61000000-0000-4000-8000-000000000044'
  ),
  'completion timestamps, audits, and enqueues indexing exactly once'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true);
set local role authenticated;
select extensions.is(
  (select result_code from api.complete_onboarding('61000000-0000-4000-8000-000000000044')),
  'completed',
  'repeated completion returns the durable result'
);
reset role;
select extensions.ok(
  (
    select count(*) = 1
    from private.audit_log
    where actor_user_id = '70000000-0000-4000-8000-000000000044'
      and action = 'profile.onboarding_completed'
  )
  and (
    select count(*) = 1
    from private.outbox_jobs
    where dedupe_key = 'profile_index:61000000-0000-4000-8000-000000000044'
  ),
  'onboarding retry does not duplicate side effects'
);
\else
select * from extensions.skip(5, 'onboarding completion is not implemented yet');
\endif

select * from extensions.finish();
rollback;
