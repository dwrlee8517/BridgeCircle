begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(17);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated has no raw profile SELECT grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.invites', 'select'),
  'authenticated has no raw invite SELECT grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.audit_log', 'select'),
  'authenticated has no audit-log SELECT grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.outbox_jobs', 'select'),
  'authenticated has no outbox SELECT grant'
);
select extensions.ok(
  not exists (
    select 1
    from information_schema.usage_privileges p
    where p.grantee = 'authenticated'
      and p.object_schema = 'public'
      and p.object_type = 'SEQUENCE'
      and p.privilege_type = 'USAGE'
  ),
  'authenticated has no blanket public sequence usage'
);

select extensions.is(
  (
    select array_agg(p.proname::text order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and has_function_privilege('authenticated', p.oid, 'execute')
  ),
  array[
    'accept_invite', 'apply_profile_import', 'begin_profile_import', 'block_member', 'cancel_admin_school_event',
    'cancel_my_account_deletion', 'clear_my_onboarding_draft', 'complete_onboarding',
    'consume_help_ai_budget', 'create_circle_ask', 'create_direct_ask',
    'decide_membership', 'decide_offer', 'decline_profile_import', 'delete_admin_school_event', 'disconnect',
    'fail_profile_import', 'finish_profile_import',
    'get_admin_school_announcements', 'get_admin_school_events', 'get_ask_detail',
    'get_conversation_detail', 'get_help_ask_detail', 'get_help_home',
    'get_helper_preferences', 'get_home_native', 'get_member_profile', 'get_messages_counts',
    'get_my_account_export', 'get_my_account_export_download', 'get_my_communication_preferences',
    'get_my_member_context', 'get_my_notification_preferences',
    'get_my_onboarding_draft', 'get_my_profile', 'get_my_profile_import', 'get_newsletter_issue',
    'get_or_create_direct_conversation', 'get_school_announcement', 'get_school_event',
    'get_school_home', 'issue_invite', 'list_conversation_messages_after',
    'list_conversation_messages_before', 'list_conversation_summaries',
    'list_give_help', 'list_help_matches', 'list_invites',
    'list_messages_waiting', 'list_my_asks', 'list_my_blocked_members',
    'list_my_notifications', 'list_newsletter_issues', 'list_pending_memberships',
    'list_people', 'list_school_announcements',
    'list_school_event_attendees',
    'mark_conversation_read',
    'mark_notifications_read', 'mark_notifications_read_before',
    'mark_school_announcement_read', 'offer_to_help',
    'publish_admin_school_announcement', 'publish_conversation_typing',
    'request_my_account_export', 'resend_invite', 'resolve_ask',
    'respond_school_event', 'respond_to_connection_request', 'respond_to_direct_ask',
    'retract_ask', 'revoke_invite',
    'save_admin_school_event', 'save_ask_outcome_share', 'save_helper_preferences',
    'save_my_communication_preferences', 'save_my_notification_preference',
    'save_my_onboarding_draft', 'save_my_onboarding_progress', 'save_profile_about',
    'save_profile_current', 'save_profile_education', 'save_profile_history',
    'save_profile_identity', 'save_profile_links', 'save_profile_preferences',
    'save_profile_visibility',
    'schedule_my_account_deletion', 'search_help_candidates',
    'send_connection_request', 'send_message',
    'set_my_avatar_path', 'submit_report', 'unblock_member'
  ]::text[],
  'authenticated API execution matches the reviewed allowlist'
);

select extensions.is(
  (
    select array_agg(p.proname::text order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and has_function_privilege('authenticated', p.oid, 'execute')
  ),
  array[
    'accept_invite', 'block_member', 'can_access_conversation_topic',
    'can_access_user_topic', 'can_view_ask', 'can_view_conversation',
    'cancel_my_account_deletion', 'clear_my_onboarding_draft', 'complete_onboarding',
    'decide_membership',
    'disconnect', 'get_ask_detail', 'get_my_account_export', 'get_my_account_export_download',
    'get_my_communication_preferences', 'get_my_member_context',
    'get_my_notification_preferences', 'get_my_onboarding_draft', 'get_my_profile',
    'get_or_create_direct_conversation',
    'is_active_member_of', 'is_admin_of', 'is_blocked', 'is_connected',
    'issue_invite',
    'list_conversation_messages_after', 'list_conversation_messages_before',
    'list_help_matches', 'list_invites',
    'list_my_blocked_members', 'list_my_notifications', 'list_pending_memberships',
    'mark_conversation_read', 'mark_notifications_read',
    'mark_notifications_read_before', 'owns_membership',
    'publish_conversation_typing', 'request_my_account_export',
    'resend_invite', 'revoke_invite', 'save_my_communication_preferences',
    'save_my_notification_preference', 'save_my_onboarding_draft',
    'save_my_onboarding_progress',
    'save_profile_current',
    'save_profile_education', 'save_profile_history', 'save_profile_identity',
    'save_profile_preferences', 'schedule_my_account_deletion', 'send_message',
    'set_my_avatar_path', 'submit_report', 'unblock_member'
  ]::text[],
  'authenticated private execution matches API implementations and RLS helpers'
);

select extensions.ok(
  not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('private.claim_outbox_jobs(text,integer,text[])'),
      'execute'
    ),
    false
  ),
  'members cannot claim outbox jobs'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated', 'private.close_expired_asks(integer)', 'execute'
  ),
  'members cannot run scheduled Ask expiry'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated', 'private.pseudonymize_user(uuid)', 'execute'
  ),
  'members cannot pseudonymize accounts'
);

insert into public.organizations (id, slug, name) values
  ('60000000-0000-4000-8000-000000000001', 'foundation-other', 'Foundation Other');

insert into public.users (id) values
  ('70000000-0000-4000-8000-000000000011'),
  ('70000000-0000-4000-8000-000000000012'),
  ('70000000-0000-4000-8000-000000000013'),
  ('70000000-0000-4000-8000-000000000014');

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  (
    '71000000-0000-4000-8000-000000000011',
    '70000000-0000-4000-8000-000000000011',
    '11111111-1111-4111-8111-111111111111', 'pending', null
  ),
  (
    '71000000-0000-4000-8000-000000000012',
    '70000000-0000-4000-8000-000000000012',
    '11111111-1111-4111-8111-111111111111', 'rejected', null
  ),
  (
    '71000000-0000-4000-8000-000000000013',
    '70000000-0000-4000-8000-000000000013',
    '11111111-1111-4111-8111-111111111111', 'revoked', null
  ),
  (
    '71000000-0000-4000-8000-000000000014',
    '70000000-0000-4000-8000-000000000014',
    '60000000-0000-4000-8000-000000000001', 'active', now()
  );

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000011', true
);
set local role authenticated;
select extensions.is(
  (select status from public.organization_memberships
   where id = '71000000-0000-4000-8000-000000000011'),
  'pending',
  'pending member can read their own membership state'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000012', true
);
set local role authenticated;
select extensions.is(
  (select status from public.organization_memberships
   where id = '71000000-0000-4000-8000-000000000012'),
  'rejected',
  'rejected member can read their own membership state'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000013', true
);
set local role authenticated;
select extensions.is(
  (select status from public.organization_memberships
   where id = '71000000-0000-4000-8000-000000000013'),
  'revoked',
  'revoked member can read their own membership state'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true
);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint
    from public.organization_memberships
    where id in (
      '71000000-0000-4000-8000-000000000011',
      '71000000-0000-4000-8000-000000000012',
      '71000000-0000-4000-8000-000000000013'
    )
  ),
  0::bigint,
  'ordinary active member cannot browse inactive memberships'
);
select extensions.is(
  (
    select count(*)::bigint
    from public.organization_memberships
    where id = '20000000-0000-4000-8000-000000000003'
  ),
  1::bigint,
  'ordinary active member can browse an active same-org membership'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true
);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint
    from public.organization_memberships
    where id in (
      '71000000-0000-4000-8000-000000000011',
      '71000000-0000-4000-8000-000000000012',
      '71000000-0000-4000-8000-000000000013'
    )
  ),
  3::bigint,
  'same-org admin can read inactive memberships for decisions'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000014', true
);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint
    from public.organization_memberships
    where organization_id = '11111111-1111-4111-8111-111111111111'
  ),
  0::bigint,
  'active member cannot read another organization memberships'
);
reset role;

select * from extensions.finish();
rollback;
