begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(43);

-- A self-contained tenant fixture keeps this matrix independent from product
-- seed copy while exercising every authorization persona against one target.
insert into public.organizations (id, slug, name) values
  ('81000000-0000-4000-8000-000000000001', 'privacy-matrix', 'Privacy Matrix'),
  ('81000000-0000-4000-8000-000000000002', 'privacy-matrix-other', 'Privacy Matrix Other');

insert into public.users (
  id, account_state, delete_scheduled_for, deleted_at
) values
  ('82000000-0000-4000-8000-000000000001', 'active', null, null),
  ('82000000-0000-4000-8000-000000000002', 'active', null, null),
  ('82000000-0000-4000-8000-000000000003', 'active', null, null),
  ('82000000-0000-4000-8000-000000000004', 'active', null, null),
  ('82000000-0000-4000-8000-000000000005', 'active', null, null),
  ('82000000-0000-4000-8000-000000000006', 'active', null, null),
  ('82000000-0000-4000-8000-000000000007', 'active', null, null),
  (
    '82000000-0000-4000-8000-000000000008',
    'deletion_scheduled', now() + interval '7 days', null
  ),
  ('82000000-0000-4000-8000-000000000009', 'active', null, null),
  ('82000000-0000-4000-8000-000000000010', 'deleted', null, now()),
  ('82000000-0000-4000-8000-000000000011', 'active', null, null);

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  (
    '83000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000002',
    '82000000-0000-4000-8000-000000000002',
    '81000000-0000-4000-8000-000000000001', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000003',
    '82000000-0000-4000-8000-000000000003',
    '81000000-0000-4000-8000-000000000001', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000004',
    '82000000-0000-4000-8000-000000000004',
    '81000000-0000-4000-8000-000000000001', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000005',
    '82000000-0000-4000-8000-000000000005',
    '81000000-0000-4000-8000-000000000002', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000006',
    '82000000-0000-4000-8000-000000000006',
    '81000000-0000-4000-8000-000000000001', 'pending', null
  ),
  (
    '83000000-0000-4000-8000-000000000007',
    '82000000-0000-4000-8000-000000000007',
    '81000000-0000-4000-8000-000000000001', 'revoked', null
  ),
  (
    '83000000-0000-4000-8000-000000000008',
    '82000000-0000-4000-8000-000000000008',
    '81000000-0000-4000-8000-000000000001', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000009',
    '82000000-0000-4000-8000-000000000009',
    '81000000-0000-4000-8000-000000000001', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000010',
    '82000000-0000-4000-8000-000000000010',
    '81000000-0000-4000-8000-000000000001', 'active', now()
  ),
  (
    '83000000-0000-4000-8000-000000000011',
    '82000000-0000-4000-8000-000000000011',
    '81000000-0000-4000-8000-000000000001', 'revoked', null
  );

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, university, major
) values
  (
    '82000000-0000-4000-8000-000000000001', 'Privacy Owner',
    'Directory-safe headline', 'Directory-safe employer', 'Directory-safe title',
    'Technology', 'Los Angeles', 'Directory-safe university', 'History'
  ),
  ('82000000-0000-4000-8000-000000000002', 'Privacy Stranger', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000003', 'Privacy Connection', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000004', 'Privacy Blocked', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000005', 'Privacy Outsider', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000006', 'Privacy Pending', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000007', 'Privacy Revoked', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000008', 'Privacy Inactive', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000009', 'Privacy Admin', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000010', 'Privacy Deleted Target', null, null, null, null, null, null, null),
  ('82000000-0000-4000-8000-000000000011', 'Privacy Revoked Target', null, null, null, null, null, null, null);

update public.profiles
set resume_path = 'private/privacy-resume-sentinel.pdf', resume_uploaded_at = now()
where user_id = '82000000-0000-4000-8000-000000000001';

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
) values
  (
    '83000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001', 2008,
    'Organization-visible bio sentinel'
  ),
  ('83000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', 2009, null),
  ('83000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000001', 2010, null),
  ('83000000-0000-4000-8000-000000000004', '81000000-0000-4000-8000-000000000001', 2011, null),
  ('83000000-0000-4000-8000-000000000005', '81000000-0000-4000-8000-000000000002', 2012, null),
  ('83000000-0000-4000-8000-000000000006', '81000000-0000-4000-8000-000000000001', 2013, null),
  ('83000000-0000-4000-8000-000000000007', '81000000-0000-4000-8000-000000000001', 2014, null),
  ('83000000-0000-4000-8000-000000000008', '81000000-0000-4000-8000-000000000001', 2015, null),
  ('83000000-0000-4000-8000-000000000009', '81000000-0000-4000-8000-000000000001', 2016, null),
  ('83000000-0000-4000-8000-000000000010', '81000000-0000-4000-8000-000000000001', 2017, null),
  ('83000000-0000-4000-8000-000000000011', '81000000-0000-4000-8000-000000000001', 2018, null);

insert into public.profile_experiences (
  user_id, employer, title, start_year, sort_order
) values (
  '82000000-0000-4000-8000-000000000001',
  'Connections-only career sentinel', 'Private role', 2020, 0
);

insert into public.profile_education (
  user_id, school, degree, start_year, sort_order
) values (
  '82000000-0000-4000-8000-000000000001',
  'Self-only education sentinel', 'Private degree', 2004, 0
);

insert into public.profile_skills (user_id, name, normalized_name, sort_order)
values (
  '82000000-0000-4000-8000-000000000001',
  'Organization skill sentinel', 'organization skill sentinel', 0
);

insert into public.profile_field_visibility (
  organization_membership_id, organization_id, field_key, audience
) values
  ('83000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', 'career_history', 'connections'),
  ('83000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', 'education_history', 'self');

insert into public.profile_contact_links (
  organization_membership_id, organization_id, kind, label, value, audience,
  sort_order
) values
  (
    '83000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001',
    'website', 'Organization link', 'https://organization-link.example.com',
    'organization', 0
  ),
  (
    '83000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001',
    'website', 'Connection link', 'https://connection-link.example.com',
    'connections', 1
  ),
  (
    '83000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001',
    'website', 'Self link', 'https://self-link.example.com', 'self', 2
  );

insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help, max_pending_requests
) values (
  '83000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001', true, 5
);

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
) values (
  '83000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'Privacy-safe helping topic', 'privacy-safe helping topic', 0
);

insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '82000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000003',
  '81000000-0000-4000-8000-000000000001'
);

insert into public.member_blocks (blocker_user_id, blocked_user_id)
values (
  '82000000-0000-4000-8000-000000000004',
  '82000000-0000-4000-8000-000000000001'
);

insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role
) values (
  '81000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000009', 'admin'
);

insert into private.profile_enrichment_settings (
  user_id, linkedin_url, linkedin_username, primary_provider_name,
  primary_provider_id, consented_at
) values (
  '82000000-0000-4000-8000-000000000001',
  'https://www.linkedin.com/in/privacy-owner', 'privacy-owner', 'pdl',
  'provider-id-sentinel', now()
);

insert into private.reports (
  reporter_user_id, reported_user_id, organization_id, reason, target_type,
  target_id, profile_user_id, evidence_snapshot
) values (
  '82000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'other', 'profile', '82000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  '{"privateReport":"report-evidence-sentinel"}'::jsonb
);

-- Owner: all three visibility tiers are available only in the owner-shaped
-- result, while self is still excluded from the directory.
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'ok'
      and profile #>> '{relationship,state}' = 'self'
      and profile #>> '{about}' = 'Organization-visible bio sentinel'
      and profile #>> '{experiences,0,employer}' = 'Connections-only career sentinel'
      and profile #>> '{education,0,school}' = 'Self-only education sentinel'
      and profile #>> '{skills,0}' = 'Organization skill sentinel'
      and jsonb_array_length(profile -> 'links') = 3
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'owner receives organization, connection, and self profile fields'
);
select extensions.ok(
  not exists (
    select 1
    from api.list_people('83000000-0000-4000-8000-000000000001')
    where target_user_id in (
      '82000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000004',
      '82000000-0000-4000-8000-000000000005',
      '82000000-0000-4000-8000-000000000010',
      '82000000-0000-4000-8000-000000000011'
    )
  ),
  'owner directory excludes self, blocked, other-organization, deleted, and revoked targets'
);
select extensions.ok(
  (
    select result_code = 'not_available' and recipient is null
    from api.get_direct_ask_target(
      '83000000-0000-4000-8000-000000000001',
      '83000000-0000-4000-8000-000000000001'
    )
  ),
  'a member cannot load themselves as a direct Ask target'
);
reset role;

-- Same-organization stranger: organization fields only.
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'ok'
      and profile #>> '{about}' = 'Organization-visible bio sentinel'
      and jsonb_array_length(profile -> 'experiences') = 0
      and jsonb_array_length(profile -> 'education') = 0
      and profile #>> '{skills,0}' = 'Organization skill sentinel'
      and jsonb_array_length(profile -> 'links') = 1
      and profile #>> '{links,0,label}' = 'Organization link'
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'same-organization stranger receives only organization-visible fields and links'
);
select extensions.ok(
  (
    select profile #>> '{help,openToHelp}' = 'true'
      and profile #>> '{help,topics,0}' = 'Privacy-safe helping topic'
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'same-organization stranger receives the Help-owned public availability projection'
);
select extensions.ok(
  (
    select result_code = 'ok'
      and recipient #>> '{membershipId}' = '83000000-0000-4000-8000-000000000001'
      and recipient #>> '{userId}' = '82000000-0000-4000-8000-000000000001'
      and recipient #>> '{displayName}' = 'Privacy Owner'
      and recipient #>> '{topics,0}' = 'Privacy-safe helping topic'
      and recipient::text not like '%Connections-only career sentinel%'
      and recipient::text not like '%report-evidence-sentinel%'
    from api.get_direct_ask_target(
      '83000000-0000-4000-8000-000000000002',
      '83000000-0000-4000-8000-000000000001'
    )
  ),
  'a same-organization member gets only the direct Ask recipient projection'
);
select extensions.ok(
  (
    select profile::text not like '%Connections-only career sentinel%'
      and profile::text not like '%Self-only education sentinel%'
      and profile::text not like '%connection-link.example.com%'
      and profile::text not like '%self-link.example.com%'
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'stranger response omits hidden content instead of returning redacted raw values'
);
select extensions.ok(
  (
    select profile::text not like '%privacy-resume-sentinel%'
      and profile::text not like '%provider-id-sentinel%'
      and profile::text not like '%report-evidence-sentinel%'
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'member response never serializes resume, provider, or report internals'
);
select extensions.ok(
  not exists (
    select 1
    from api.list_people('83000000-0000-4000-8000-000000000002')
    where target_user_id in (
      '82000000-0000-4000-8000-000000000005',
      '82000000-0000-4000-8000-000000000006',
      '82000000-0000-4000-8000-000000000007',
      '82000000-0000-4000-8000-000000000008',
      '82000000-0000-4000-8000-000000000010',
      '82000000-0000-4000-8000-000000000011'
    )
  ),
  'directory excludes other-organization, pending, revoked, inactive-account, and deleted targets'
);
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000005'
    )
  ),
  'same-organization viewer cannot open an out-of-organization target'
);
select extensions.ok(
  (
    select result_code = 'not_available' and recipient is null
    from api.get_direct_ask_target(
      '83000000-0000-4000-8000-000000000002',
      '83000000-0000-4000-8000-000000000005'
    )
  ),
  'a same-organization member cannot load an out-of-organization direct Ask target'
);
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000010'
    )
  ),
  'deleted target is unavailable'
);
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000011'
    )
  ),
  'revoked target is unavailable'
);
reset role;
update public.helper_preferences
set open_to_help = false,
    paused_at = now(),
    pause_reason = 'manual'
where organization_membership_id = '83000000-0000-4000-8000-000000000001';
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'not_available' and recipient is null
    from api.get_direct_ask_target(
      '83000000-0000-4000-8000-000000000002',
      '83000000-0000-4000-8000-000000000001'
    )
  ),
  'a paused or closed helper is unavailable as a direct Ask target'
);
reset role;
update public.helper_preferences
set open_to_help = true,
    paused_at = null,
    pause_reason = null
where organization_membership_id = '83000000-0000-4000-8000-000000000001';

-- Connected viewer: connection tier is added, self tier remains absent.
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'ok'
      and profile #>> '{relationship,state}' = 'connected'
      and profile #>> '{experiences,0,employer}' = 'Connections-only career sentinel'
      and jsonb_array_length(profile -> 'education') = 0
      and jsonb_array_length(profile -> 'links') = 2
      and profile #>> '{links,1,label}' = 'Connection link'
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000003',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'connected viewer receives organization and connection tiers but not self tier'
);
select extensions.ok(
  (
    select profile::text not like '%Self-only education sentinel%'
      and profile::text not like '%self-link.example.com%'
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000003',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'connected response omits self-only section and link values'
);
reset role;

-- Blocked access is symmetric and intentionally indistinguishable from a
-- missing target.
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000004',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'blocked viewer receives the non-enumerating unavailable result'
);
select extensions.ok(
  (
    select result_code = 'not_available' and recipient is null
    from api.get_direct_ask_target(
      '83000000-0000-4000-8000-000000000004',
      '83000000-0000-4000-8000-000000000001'
    )
  ),
  'a blocked member receives the non-enumerating direct Ask target result'
);
select extensions.is(
  (
    select jsonb_build_object('resultCode', result_code, 'profile', profile)
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000004',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  (
    select jsonb_build_object('resultCode', result_code, 'profile', profile)
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000004',
      'ffffffff-ffff-4fff-8fff-ffffffffffff'
    )
  ),
  'blocked and nonexistent profile results are identical'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_people('83000000-0000-4000-8000-000000000004')
    where target_user_id = '82000000-0000-4000-8000-000000000001'
  ),
  0,
  'blocked pair is absent from the directory before count and ranking'
);
reset role;

-- Other-organization, pending, revoked, and inactive-account viewers cannot
-- use another membership ID as an authorization capability.
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000005',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'active outsider cannot open a target in another organization'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_people('83000000-0000-4000-8000-000000000005')
  ),
  0,
  'outsider directory remains scoped to their selected organization'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_people('83000000-0000-4000-8000-000000000001')
  ),
  0,
  'outsider cannot substitute the owner membership ID'
);
reset role;

select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000006',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'pending viewer cannot open member profiles'
);
select extensions.is(
  (select count(*)::integer from api.list_people('83000000-0000-4000-8000-000000000006')),
  0,
  'pending viewer cannot browse the directory'
);
reset role;

select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000007', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000007',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'revoked viewer cannot open member profiles'
);
select extensions.is(
  (select count(*)::integer from api.list_people('83000000-0000-4000-8000-000000000007')),
  0,
  'revoked viewer cannot browse the directory'
);
reset role;

select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000008', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'not_available' and profile is null
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000008',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'inactive-account viewer cannot open member profiles'
);
select extensions.is(
  (select count(*)::integer from api.list_people('83000000-0000-4000-8000-000000000008')),
  0,
  'inactive-account viewer cannot browse the directory'
);
reset role;

-- Organization administrators retain ordinary member privacy. Administrative
-- responsibilities never widen profile-field audiences or raw table grants.
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000009', true);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'ok'
      and profile #>> '{about}' = 'Organization-visible bio sentinel'
      and jsonb_array_length(profile -> 'experiences') = 0
      and jsonb_array_length(profile -> 'education') = 0
      and jsonb_array_length(profile -> 'links') = 1
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000009',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'organization admin receives the same profile audience as an orgmate stranger'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_people('83000000-0000-4000-8000-000000000009')
    where target_user_id = '82000000-0000-4000-8000-000000000001'
  ),
  1,
  'organization admin can find the active target through the ordinary directory'
);
select extensions.ok(
  (
    select profile::text not like '%Connections-only career sentinel%'
      and profile::text not like '%Self-only education sentinel%'
      and profile::text not like '%connection-link.example.com%'
      and profile::text not like '%self-link.example.com%'
    from api.get_member_profile(
      '83000000-0000-4000-8000-000000000009',
      '82000000-0000-4000-8000-000000000001'
    )
  ),
  'admin response contains no connection-only or self-only content'
);
reset role;

-- Grants are a separate boundary from RLS. Member and organization-admin
-- personas can use only the fixed projections; service jobs retain deliberate
-- raw access for trusted maintenance work.
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated role cannot bypass the projection through raw profiles'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.organization_profiles', 'select'),
  'authenticated role cannot bypass the projection through organization profile fields'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profile_field_visibility', 'select'),
  'authenticated role cannot read raw visibility policy'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profile_contact_links', 'select'),
  'authenticated role cannot read raw contact links'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.profile_enrichment_settings', 'select'),
  'authenticated role cannot read enrichment provider identifiers'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.reports', 'select'),
  'authenticated role cannot read private report evidence'
);
select extensions.ok(
  has_table_privilege('service_role', 'public.profiles', 'select')
    and has_table_privilege('service_role', 'public.profile_field_visibility', 'select')
    and has_table_privilege('service_role', 'public.profile_contact_links', 'select'),
  'service role retains deliberate raw profile maintenance access'
);
select extensions.ok(
  has_table_privilege('service_role', 'private.profile_enrichment_settings', 'select')
    and has_table_privilege('service_role', 'private.reports', 'select'),
  'service role retains deliberate private enrichment and safety access'
);
select extensions.ok(
  not has_function_privilege(
    'anon', to_regprocedure('api.get_member_profile(uuid,uuid)'), 'execute'
  )
  and not has_function_privilege(
    'anon',
    to_regprocedure(
      'api.list_people(uuid,text,text,text,smallint,smallint,text,text,text,text,extensions.vector,integer)'
    ),
    'execute'
  ),
  'anonymous role cannot execute either People/Profile member projection'
);
select extensions.ok(
  has_function_privilege(
    'authenticated', to_regprocedure('api.get_direct_ask_target(uuid,uuid)'), 'execute'
  ) and not has_function_privilege(
    'anon', to_regprocedure('api.get_direct_ask_target(uuid,uuid)'), 'execute'
  ),
  'only authenticated members can execute the direct Ask target projection'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated', to_regprocedure('private.get_direct_ask_target(uuid,uuid)'), 'execute'
  ),
  'members cannot bypass the direct Ask target API projection'
);

select * from extensions.finish();
rollback;
