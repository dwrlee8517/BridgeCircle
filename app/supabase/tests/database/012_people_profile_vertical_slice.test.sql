begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(22);

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

select * from extensions.finish();
rollback;
