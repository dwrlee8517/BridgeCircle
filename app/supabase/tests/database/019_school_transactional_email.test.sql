begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(15);

select extensions.has_column(
  'public', 'event_rsvps', 'reminder_sent_at',
  'event attendance records retain durable reminder state'
);
select extensions.has_function(
  'api', 'run_school_maintenance', array['timestamp with time zone', 'integer'],
  'the service worker can run School maintenance'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated', 'api.run_school_maintenance(timestamp with time zone,integer)', 'execute'
  ),
  'members cannot run School maintenance'
);
select extensions.ok(
  has_function_privilege(
    'service_role', 'api.run_school_maintenance(timestamp with time zone,integer)', 'execute'
  ),
  'the service worker retains the narrow maintenance grant'
);

update public.events
set status = 'published',
    published_at = coalesce(published_at, now()),
    starts_at = now() + interval '23 hours',
    ends_at = now() + interval '25 hours'
where id = 'eeee0000-0000-4000-8000-000000000001';

insert into public.event_rsvps (
  organization_id, event_id, organization_membership_id, status, responded_at,
  reminder_sent_at, updated_at
) values (
  '11111111-1111-4111-8111-111111111111',
  'eeee0000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'going', now(), null, now()
)
on conflict (event_id, organization_membership_id) do update
set status = 'going', reminder_sent_at = null, updated_at = now();

select * from private.run_school_maintenance(now(), 100);

select extensions.ok(
  (
    select reminder_sent_at is not null
    from public.event_rsvps
    where event_id = 'eeee0000-0000-4000-8000-000000000001'
      and organization_membership_id = '20000000-0000-4000-8000-000000000001'
  ),
  'T-1 day maintenance records the reminder before enqueueing delivery'
);
select extensions.ok(
  exists (
    select 1 from private.outbox_jobs
    where job_type = 'create_notification'
      and payload->>'type' = 'event_reminder'
      and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000001'
      and payload->>'recipientUserId' = '10000000-0000-4000-8000-000000000001'
  ),
  'T-1 day maintenance creates a durable event reminder job'
);

select * from private.run_school_maintenance(now(), 100);
select extensions.is(
  (
    select count(*)::bigint from private.outbox_jobs
    where job_type = 'create_notification'
      and payload->>'type' = 'event_reminder'
      and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000001'
      and payload->>'recipientUserId' = '10000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'replayed maintenance does not duplicate an event reminder'
);

update private.outbox_jobs
set status = 'processing', attempts = 1, locked_at = now(), locked_by = 'school-email-test'
where job_type = 'create_notification'
  and payload->>'type' = 'event_reminder'
  and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000001'
  and payload->>'recipientUserId' = '10000000-0000-4000-8000-000000000001';

select extensions.is(
  (
    select result_code
    from private.materialize_notification_job(
      (
        select id from private.outbox_jobs
        where job_type = 'create_notification'
          and payload->>'type' = 'event_reminder'
          and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000001'
          and payload->>'recipientUserId' = '10000000-0000-4000-8000-000000000001'
      ),
      'school-email-test'
    )
  ),
  'materialized',
  'the locked notification transaction materializes the reminder'
);
select extensions.ok(
  exists (
    select 1 from public.notifications
    where type = 'event_reminder'
      and target_type = 'event'
      and target_id = 'eeee0000-0000-4000-8000-000000000001'
      and recipient_user_id = '10000000-0000-4000-8000-000000000001'
  ),
  'the event reminder is retained in the member notification history'
);
select extensions.ok(
  exists (
    select 1 from private.outbox_jobs
    where job_type = 'send_email'
      and payload->>'notificationType' = 'event_reminder'
      and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000001'
  ),
  'an email-enabled reminder fans out to one durable email job'
);

update private.outbox_jobs
set status = 'processing', attempts = 1, locked_at = now(), locked_by = 'school-email-test'
where job_type = 'send_email'
  and payload->>'notificationType' = 'event_reminder'
  and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000001';

select extensions.ok(
  exists (
    select 1
    from private.get_outbox_email_context(
      (
        select id from private.outbox_jobs
        where job_type = 'send_email'
          and payload->>'notificationType' = 'event_reminder'
          and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000001'
      ),
      'school-email-test'
    )
    where target_type = 'event'
      and target_id = 'eeee0000-0000-4000-8000-000000000001'
      and idempotency_key like 'outbox:%'
  ),
  'the email worker receives only the claimed event context and stable key'
);

insert into public.notification_preferences (
  user_id, notification_type, in_app_enabled, email_enabled
) values (
  '10000000-0000-4000-8000-000000000002', 'event_changed', true, false
)
on conflict (user_id, notification_type) do update
set in_app_enabled = true, email_enabled = false;

insert into private.outbox_jobs (job_type, payload, dedupe_key)
values (
  'create_notification',
  jsonb_build_object(
    'type', 'event_changed',
    'recipientUserId', '10000000-0000-4000-8000-000000000002',
    'eventId', 'eeee0000-0000-4000-8000-000000000001',
    'eventTitle', 'Preference test event'
  ),
  'school-email-preference-test'
);
update private.outbox_jobs
set status = 'processing', attempts = 1, locked_at = now(), locked_by = 'school-email-test'
where dedupe_key = 'school-email-preference-test';
select * from private.materialize_notification_job(
  (select id from private.outbox_jobs where dedupe_key = 'school-email-preference-test'),
  'school-email-test'
);

select extensions.ok(
  exists (
    select 1 from public.notifications
    where dedupe_key = 'school-email-preference-test'
      and recipient_user_id = '10000000-0000-4000-8000-000000000002'
  ),
  'an in-app School notification remains visible when email is disabled'
);
select extensions.ok(
  not exists (
    select 1 from private.outbox_jobs
    where dedupe_key = 'send_email:school-email-preference-test'
  ),
  'the member email preference suppresses only the School email job'
);

update public.event_rsvps
set reminder_sent_at = now()
where event_id = 'eeee0000-0000-4000-8000-000000000001'
  and organization_membership_id = '20000000-0000-4000-8000-000000000001';
update public.events
set starts_at = starts_at + interval '7 days',
    ends_at = ends_at + interval '7 days'
where id = 'eeee0000-0000-4000-8000-000000000001';

select extensions.ok(
  (
    select reminder_sent_at is null
    from public.event_rsvps
    where event_id = 'eeee0000-0000-4000-8000-000000000001'
      and organization_membership_id = '20000000-0000-4000-8000-000000000001'
  ),
  'changing an event schedule resets reminder eligibility for the new date'
);

select extensions.is(
  (
    select count(*)::bigint
    from private.outbox_jobs
    where dedupe_key = 'send_email:school-email-preference-test'
  ),
  0::bigint,
  'email suppression remains deterministic after materialization'
);

select * from extensions.finish();
rollback;
