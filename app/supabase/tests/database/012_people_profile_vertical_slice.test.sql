begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(51);

select extensions.has_column(
  'public', 'profiles', 'industry',
  'profiles store a bounded industry facet for the directory'
);
select extensions.hasnt_column(
  'public', 'profiles', 'linkedin_url',
  'member-visible LinkedIn data is not stored on the global profile row'
);
select extensions.has_table(
  'public', 'profile_contact_links',
  'profile links are membership-scoped and independently visible'
);
select extensions.has_column(
  'public', 'profile_contact_links', 'audience',
  'every profile link owns its audience'
);
select extensions.ok(
  exists (
    select 1
    from pg_indexes i
    where i.schemaname = 'public'
      and i.tablename = 'profile_contact_links'
      and i.indexdef like '%organization_membership_id%audience%'
  ),
  'profile link authorization has a membership and audience index'
);
select extensions.ok(
  not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'profile_field_visibility'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%contact_links%'
  ),
  'contact links no longer share one section-wide visibility setting'
);

select extensions.has_function(
  'api', 'list_people',
  array[
    'uuid', 'text', 'text', 'text', 'smallint', 'smallint',
    'text', 'text', 'text', 'text', 'extensions.vector', 'integer'
  ],
  'People uses one fixed bounded directory projection'
);
select extensions.has_function(
  'api', 'get_member_profile', array['uuid', 'uuid'],
  'member profiles use one viewer-shaped projection'
);
select extensions.has_function(
  'api', 'save_profile_about', array['uuid', 'text'],
  'self profile About saves through one fixed command'
);
select extensions.has_function(
  'api', 'save_profile_visibility', array['uuid', 'jsonb'],
  'self profile section audiences save atomically'
);
select extensions.has_function(
  'api', 'save_profile_links', array['uuid', 'jsonb'],
  'self profile links and per-item audiences save atomically'
);

select extensions.ok(
  coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure(
        'api.list_people(uuid,text,text,text,smallint,smallint,text,text,text,text,extensions.vector,integer)'
      ),
      'execute'
    ),
    false
  ),
  'authenticated members can execute the directory projection'
);
select extensions.ok(
  coalesce(
    has_function_privilege(
      'authenticated', to_regprocedure('api.get_member_profile(uuid,uuid)'), 'execute'
    ),
    false
  ),
  'authenticated members can execute the viewer-shaped profile projection'
);
select extensions.ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in (
        'list_people', 'get_member_profile', 'save_profile_about',
        'save_profile_visibility', 'save_profile_links'
      )
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  'anonymous clients cannot execute People/Profile APIs'
);
select extensions.ok(
  (
    select bool_and(p.prosecdef)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in (
        'list_people', 'get_member_profile', 'save_profile_about',
        'save_profile_visibility', 'save_profile_links'
      )
  ),
  'People/Profile fixed APIs cross the revoked private boundary as security definers'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated members cannot select raw profiles'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.organization_profiles', 'select'),
  'authenticated members cannot select raw organization profile fields'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profile_experiences', 'select'),
  'authenticated members cannot select raw career history'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profile_education', 'select'),
  'authenticated members cannot select raw education history'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profile_skills', 'select'),
  'authenticated members cannot select raw profile skills'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profile_field_visibility', 'select'),
  'authenticated members cannot select raw visibility overrides'
);
select extensions.ok(
  coalesce(
    lower(pg_get_functiondef(to_regprocedure('private.broadcast_user_control_event(uuid,text,jsonb)')))
      like '%profile.changed%',
    false
  ),
  'the owner topic accepts profile invalidations'
);

insert into public.profile_experiences (
  user_id, employer, title, start_year, sort_order
) values (
  '10000000-0000-4000-8000-000000000004',
  'Hyundai Motor', 'Product Director', 2020, 0
);
insert into public.profile_field_visibility (
  organization_membership_id, organization_id, field_key, audience
) values (
  '20000000-0000-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111111',
  'career_history', 'connections'
);
update public.profiles
set resume_path = 'private/mark-resume.pdf', resume_uploaded_at = now()
where user_id = '10000000-0000-4000-8000-000000000003';

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true
);
set local role authenticated;

-- Five, not four: Elena holds a membership in both pilot organizations, so she
-- appears in this directory as well as Chadwick International's.
select extensions.is(
  (select count(*)::integer from api.list_people(
    '20000000-0000-4000-8000-000000000002'
  )),
  5,
  'blank directory excludes self and the blocked seeded member before count'
);
select extensions.is(
  (select array_agg(target_user_id order by target_membership_id)
   from api.list_people('20000000-0000-4000-8000-000000000002')),
  array[
    '10000000-0000-4000-8000-000000000003'::uuid,
    '10000000-0000-4000-8000-000000000004'::uuid,
    '10000000-0000-4000-8000-000000000005'::uuid,
    '10000000-0000-4000-8000-000000000006'::uuid,
    '10000000-0000-4000-8000-000000000013'::uuid
  ],
  'directory membership IDs are stable and contain no blocked/self row'
);
select extensions.is(
  (select count(*)::integer from api.list_people(
    p_membership_id => '20000000-0000-4000-8000-000000000002',
    p_scope => 'in_circle'
  )),
  1,
  'in-circle scope uses the canonical Connection pair'
);
select extensions.is(
  (select count(*)::integer from api.list_people(
    p_membership_id => '20000000-0000-4000-8000-000000000002',
    p_scope => 'open_to_help'
  )),
  3,
  'open-to-help scope applies preference, pause, and capacity state'
);
select extensions.is(
  (select display_name from api.list_people(
    p_membership_id => '20000000-0000-4000-8000-000000000002',
    p_query => 'climate'
  )),
  'Jordan Kim',
  'keyword search uses directory-safe indexed facts'
);
select extensions.is(
  (select display_name from api.list_people(
    p_membership_id => '20000000-0000-4000-8000-000000000002',
    p_industry => 'management consulting'
  )),
  'Mark Chen',
  'industry filter is exact to the selected organization projection'
);
select extensions.ok(
  (select relationship_state = 'connected'
      and conversation_id = '50000000-0000-4000-8000-000000000001'
   from api.list_people('20000000-0000-4000-8000-000000000002')
   where target_user_id = '10000000-0000-4000-8000-000000000004'),
  'connected rows expose their canonical direct conversation'
);
select extensions.is(
  (select relationship_state
   from api.list_people('20000000-0000-4000-8000-000000000002')
   where target_user_id = '10000000-0000-4000-8000-000000000003'),
  'pending_incoming',
  'pending relationship direction is viewer-shaped'
);
select extensions.ok(
  (select result_code = 'not_available' and profile is null
   from api.get_member_profile(
     '20000000-0000-4000-8000-000000000002',
     '10000000-0000-4000-8000-000000000001'
   )),
  'blocked profile access converges on the non-enumerating unavailable result'
);
select extensions.is(
  (select jsonb_array_length(profile -> 'links')
   from api.get_member_profile(
     '20000000-0000-4000-8000-000000000002',
     '10000000-0000-4000-8000-000000000003'
   )),
  1,
  'organization-visible links appear to an active same-circle member'
);
select extensions.is(
  (select jsonb_array_length(profile -> 'links')
   from api.get_member_profile(
     '20000000-0000-4000-8000-000000000002',
     '10000000-0000-4000-8000-000000000004'
   )),
  1,
  'connections-visible links appear to the connected member'
);
select extensions.is(
  (select jsonb_array_length(profile -> 'experiences')
   from api.get_member_profile(
     '20000000-0000-4000-8000-000000000002',
     '10000000-0000-4000-8000-000000000004'
   )),
  1,
  'connections-visible career history appears to the connected member'
);
select extensions.is(
  (select jsonb_array_length(profile -> 'links')
   from api.get_my_profile('20000000-0000-4000-8000-000000000002')),
  1,
  'the owner edit projection includes their self-only link'
);
select extensions.ok(
  (select count(*) = 2 and min(total_count) = 5
   from api.list_people(
     p_membership_id => '20000000-0000-4000-8000-000000000002',
     p_limit => 2
   )),
  'row limit never changes the authorization-safe total'
);
select extensions.is(
  (select count(*)::integer from api.list_people(
    p_membership_id => '20000000-0000-4000-8000-000000000002',
    p_class_year_start => 2010::smallint,
    p_class_year_end => 2012::smallint
  )),
  2,
  'class-year range composes inside the fixed projection'
);
select extensions.is(
  (select display_name from api.list_people(
    p_membership_id => '20000000-0000-4000-8000-000000000002',
    p_topic => 'consulting'
  )),
  'Mark Chen',
  'help-topic filter uses the Help-owned source of truth'
);
select extensions.ok(
  (select profile::text not like '%private/mark-resume.pdf%'
   from api.get_member_profile(
     '20000000-0000-4000-8000-000000000002',
     '10000000-0000-4000-8000-000000000003'
   )),
  'viewer-shaped profile JSON never serializes the private resume path'
);
select extensions.is(
  api.save_profile_links(
    '20000000-0000-4000-8000-000000000002',
    '[{"kind":"website","label":null,"value":"https://richard.example.com","audience":"organization"}]'::jsonb
  ),
  'saved',
  'owner can atomically replace profile links'
);
select extensions.ok(
  (select jsonb_array_length(profile -> 'links') = 1
      and profile #>> '{links,0,kind}' = 'website'
      and profile #>> '{links,0,audience}' = 'organization'
   from api.get_my_profile('20000000-0000-4000-8000-000000000002')),
  'link replacement stores one normalized audience-scoped row'
);
select extensions.ok(
  api.save_profile_links(
    '20000000-0000-4000-8000-000000000002',
    '[{"kind":"website","label":null,"value":"http://unsafe.example.com","audience":"organization"}]'::jsonb
  ) = 'invalid_links'
  and (
    select jsonb_array_length(profile -> 'links') = 1
      and profile #>> '{links,0,value}' = 'https://richard.example.com'
    from api.get_my_profile('20000000-0000-4000-8000-000000000002')
  ),
  'invalid links roll back the entire replacement'
);
select extensions.is(
  api.save_profile_visibility(
    '20000000-0000-4000-8000-000000000002',
    '{"unknown":"self"}'::jsonb
  ),
  'invalid_visibility',
  'unknown profile sections cannot create visibility policy drift'
);
select extensions.is(
  api.save_profile_visibility(
    '20000000-0000-4000-8000-000000000002',
    '{"bio":"connections","career_history":"organization"}'::jsonb
  ),
  'saved',
  'owner can atomically replace supported visibility overrides'
);
select extensions.ok(
  (select profile #>> '{visibility,bio}' = 'connections'
      and not (profile -> 'visibility' ? 'career_history')
   from api.get_my_profile('20000000-0000-4000-8000-000000000002')),
  'default organization visibility is omitted from override storage'
);
select extensions.is(
  api.save_profile_about(
    '20000000-0000-4000-8000-000000000002',
    'A concise updated bio.'
  ),
  'saved',
  'owner can save the selected-membership About section'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true
);
set local role authenticated;
select extensions.is(
  (select jsonb_array_length(profile -> 'links')
   from api.get_member_profile(
     '20000000-0000-4000-8000-000000000005',
     '10000000-0000-4000-8000-000000000004'
   )),
  0,
  'connections-only link is absent for a same-circle stranger'
);
select extensions.is(
  (select jsonb_array_length(profile -> 'experiences')
   from api.get_member_profile(
     '20000000-0000-4000-8000-000000000005',
     '10000000-0000-4000-8000-000000000004'
   )),
  0,
  'connections-only career history is absent for a same-circle stranger'
);
select extensions.is(
  api.save_profile_about(
    '20000000-0000-4000-8000-000000000002',
    'A stolen bio.'
  ),
  'not_owned',
  'another member cannot save the owner About section'
);
select extensions.is(
  (select count(*)::integer from api.list_people(
    p_membership_id => '20000000-0000-4000-8000-000000000005',
    p_limit => 51
  )),
  0,
  'invalid result limits return no rows rather than widening the cap'
);
reset role;

select extensions.throws_ok(
  $$
    select private.broadcast_user_control_event(
      '10000000-0000-4000-8000-000000000002',
      'profile.changed',
      '{"membershipId":"20000000-0000-4000-8000-000000000002","name":"Richard"}'::jsonb
    )
  $$,
  '22023',
  'invalid_profile_change_payload',
  'profile invalidations reject content-bearing payloads'
);

select * from extensions.finish();
rollback;
