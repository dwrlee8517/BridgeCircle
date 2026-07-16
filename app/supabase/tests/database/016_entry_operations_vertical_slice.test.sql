begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(24);

select extensions.has_table(
  'private', 'onboarding_drafts',
  'private onboarding drafts exist'
);
select extensions.has_table(
  'public', 'user_communication_preferences',
  'user communication preferences exist'
);
select extensions.has_table(
  'private', 'account_export_requests',
  'private account export requests exist'
);

select extensions.has_function(
  'api', 'get_my_onboarding_draft', array['uuid'],
  'onboarding draft read API exists'
);
select extensions.has_function(
  'api', 'save_my_onboarding_progress', array['uuid', 'smallint'],
  'durable onboarding progress API exists'
);
select extensions.has_function(
  'api', 'save_my_onboarding_draft', array['uuid', 'text'],
  'onboarding draft save API exists'
);
select extensions.has_function(
  'api', 'clear_my_onboarding_draft', array['uuid'],
  'onboarding draft clear API exists'
);
select extensions.has_function(
  'api', 'issue_invite', array['uuid', 'text', 'text', 'smallint', 'uuid'],
  'administrator invite issue API exists'
);
select extensions.has_function(
  'api', 'list_invites', array['uuid', 'timestamptz', 'uuid', 'integer'],
  'administrator invite list API exists'
);
select extensions.has_function(
  'api', 'resend_invite', array['uuid', 'uuid'],
  'administrator invite resend API exists'
);
select extensions.has_function(
  'api', 'revoke_invite', array['uuid', 'uuid'],
  'administrator invite revoke API exists'
);
select extensions.has_function(
  'api', 'list_pending_memberships', array['uuid', 'timestamptz', 'uuid', 'integer'],
  'administrator approval queue API exists'
);
select extensions.has_function(
  'api', 'get_my_notification_preferences', array[]::text[],
  'notification preference read API exists'
);
select extensions.has_function(
  'api', 'save_my_notification_preference', array['text', 'boolean', 'boolean'],
  'notification preference save API exists'
);
select extensions.has_function(
  'api', 'get_my_communication_preferences', array[]::text[],
  'communication preference read API exists'
);
select extensions.has_function(
  'api', 'save_my_communication_preferences', array['boolean'],
  'communication preference save API exists'
);
select extensions.has_function(
  'api', 'list_my_blocked_members', array[]::text[],
  'blocked-member list API exists'
);
select extensions.has_function(
  'api', 'schedule_my_account_deletion', array[]::text[],
  'self account-deletion scheduling API exists'
);
select extensions.has_function(
  'api', 'cancel_my_account_deletion', array[]::text[],
  'self account-deletion cancellation API exists'
);
select extensions.has_function(
  'api', 'request_my_account_export', array['uuid'],
  'self account-export request API exists'
);
select extensions.has_function(
  'api', 'get_my_account_export', array[]::text[],
  'self account-export status API exists'
);
select extensions.has_function(
  'api', 'get_my_account_export_download', array[]::text[],
  'owner-only account-export download projection exists'
);
select extensions.has_function(
  'api', 'list_my_notifications', array['timestamptz', 'bigint', 'integer', 'boolean'],
  'keyset notification list API exists'
);
select extensions.has_function(
  'api', 'mark_notifications_read_before', array['timestamptz'],
  'timestamp-bounded mark-all API exists'
);

select * from extensions.finish();
rollback;
