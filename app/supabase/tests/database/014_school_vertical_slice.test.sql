begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(64);

select extensions.has_table('public', 'event_schedule_items', 'School events have ordered schedules');
select extensions.has_table('public', 'event_facts', 'School events have structured facts');
select extensions.has_table('public', 'announcement_reads', 'announcement reads are durable');
select extensions.has_table('public', 'newsletter_issues', 'newsletter issues have a first-class archive');
select extensions.has_table('public', 'newsletter_sections', 'newsletter issues have ordered sections');
select extensions.has_column('public', 'event_rsvps', 'offer_expires_at', 'waitlist offers have a deadline');
select extensions.ok(
  pg_get_constraintdef((
    select c.oid from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'event_rsvps'
      and c.conname = 'event_rsvps_status_check'
  )) like '%offered%',
  'RSVP status admits a held offer without auto-confirming attendance'
);
select extensions.ok(
  exists (select 1 from pg_indexes where schemaname = 'public'
    and tablename = 'events' and indexname = 'events_school_hub_idx'),
  'School hub ordering has a purpose-built partial index'
);
select extensions.ok(
  exists (select 1 from pg_indexes where schemaname = 'public'
    and tablename = 'event_rsvps' and indexname = 'event_rsvps_open_offer_idx'),
  'offer expiry maintenance has a purpose-built partial index'
);

select extensions.has_function('api', 'get_school_home', array['uuid'], 'School home is one fixed snapshot');
select extensions.has_function('api', 'get_school_event', array['uuid', 'uuid'], 'event detail is viewer-shaped');
select extensions.has_function(
  'api', 'list_school_event_attendees', array['uuid', 'uuid', 'integer'],
  'attendee identity is projected through one privacy boundary'
);
select extensions.has_function(
  'api', 'respond_school_event', array['uuid', 'uuid', 'text'],
  'RSVP and held-offer decisions share one transaction command'
);
select extensions.has_function(
  'api', 'list_school_announcements', array['uuid', 'text', 'integer'],
  'announcement filters use one bounded projection'
);
select extensions.has_function(
  'api', 'mark_school_announcement_read', array['uuid', 'uuid'],
  'announcement reads use an idempotent command'
);
select extensions.has_function(
  'api', 'list_newsletter_issues', array['uuid', 'integer'],
  'newsletter archive uses one bounded projection'
);
select extensions.has_function(
  'api', 'get_newsletter_issue', array['uuid', 'text'],
  'newsletter reader uses one issue projection'
);
select extensions.has_function(
  'api', 'run_school_maintenance', array['timestamp with time zone', 'integer'],
  'expired School offers have one service command'
);
select extensions.has_function(
  'api', 'get_admin_school_events', array['uuid'],
  'School event administration uses a fixed projection'
);
select extensions.has_function(
  'api', 'save_admin_school_event',
  array['uuid', 'uuid', 'text', 'text', 'text', 'timestamp with time zone', 'integer'],
  'School event administration uses a fixed mutation'
);
select extensions.has_function(
  'api', 'publish_admin_school_announcement',
  array['uuid', 'text', 'text', 'text', 'boolean'],
  'School announcements publish through the durable outbox seam'
);
select extensions.ok(
  (
    select bool_and(p.prosecdef)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api' and p.proname in (
      'get_school_home', 'get_school_event', 'list_school_event_attendees',
      'respond_school_event', 'list_school_announcements',
      'get_school_announcement', 'mark_school_announcement_read',
      'list_newsletter_issues', 'get_newsletter_issue', 'run_school_maintenance',
      'get_admin_school_events', 'save_admin_school_event',
      'cancel_admin_school_event', 'delete_admin_school_event',
      'get_admin_school_announcements', 'publish_admin_school_announcement'
    )
  ),
  'all School API functions cross the revoked private boundary as security definers'
);
select extensions.ok(
  has_function_privilege('authenticated', 'api.get_school_home(uuid)', 'execute'),
  'authenticated members can load School home'
);
select extensions.ok(
  has_function_privilege('authenticated', 'api.get_admin_school_events(uuid)', 'execute'),
  'authenticated callers can reach the role-checking School admin projection'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated', 'api.run_school_maintenance(timestamp with time zone,integer)', 'execute'
  ),
  'members cannot run offer-expiry maintenance'
);
select extensions.ok(
  has_function_privilege(
    'service_role', 'api.run_school_maintenance(timestamp with time zone,integer)', 'execute'
  ),
  'service workers can run offer-expiry maintenance'
);
select extensions.ok(
  not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api' and p.proname like '%school%'
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  'anonymous callers cannot execute School APIs'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.events', 'select'),
  'members cannot select raw events'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.event_rsvps', 'select'),
  'members cannot select raw RSVPs'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.announcements', 'select'),
  'members cannot select raw announcements'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.event_schedule_items', 'select'),
  'members cannot select raw event schedules'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.newsletter_issues', 'select'),
  'members cannot select raw newsletter issues'
);
select extensions.ok(
  to_regprocedure('api.set_event_rsvp(uuid,uuid,text)') is null,
  'the legacy RSVP API is removed'
);
select extensions.ok(
  to_regprocedure('private.set_event_rsvp(uuid,uuid,text)') is null,
  'the legacy RSVP implementation is removed'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select extensions.is(
  api.get_school_home('20000000-0000-4000-8000-000000000002')->>'resultCode',
  'ok',
  'an active member can load the School hub'
);
select extensions.is(
  jsonb_array_length(api.get_school_home('20000000-0000-4000-8000-000000000002')->'events'),
  3,
  'School hub includes every upcoming published event and no cancelled or past event'
);
select extensions.is(
  api.get_school_home('20000000-0000-4000-8000-000000000002')->'events'->0->>'id',
  'eeee0000-0000-4000-8000-000000000003',
  'the nearest event Richard is attending is first'
);
select extensions.is(
  api.get_school_event(
    '20000000-0000-4000-8000-000000000002',
    'eeee0000-0000-4000-8000-000000000003'
  )->'event'->>'joinUrl',
  'https://meet.example.com/chadwick-office-hours',
  'a confirmed attendee sees the online join URL inside its release window'
);
select extensions.is(
  jsonb_array_length(api.get_school_event(
    '20000000-0000-4000-8000-000000000002',
    'eeee0000-0000-4000-8000-000000000002'
  )->'event'->'schedule'),
  3,
  'event detail returns the ordered dinner schedule'
);
select extensions.is(
  api.get_school_event(
    '20000000-0000-4000-8000-000000000002',
    'eeee0000-0000-4000-8000-000000000004'
  )->'event'->>'phase',
  'cancelled',
  'published cancellations remain readable as cancelled records'
);
select extensions.is(
  api.get_school_event(
    '20000000-0000-4000-8000-000000000002',
    'eeee0000-0000-4000-8000-000000000005'
  )->'event'->>'phase',
  'past',
  'completed events remain readable as past records'
);
select extensions.is(
  api.list_school_event_attendees(
    '20000000-0000-4000-8000-000000000002',
    'eeee0000-0000-4000-8000-000000000001'
  )->>'totalCount',
  '3',
  'attendee projection reports the seeded gathering attendance without leaking RSVP rows'
);
select extensions.is(
  jsonb_array_length(api.list_school_announcements(
    '20000000-0000-4000-8000-000000000002', 'reunion'
  )->'items'),
  1,
  'announcement category filters compose inside the projection'
);
select extensions.is(
  api.list_school_announcements(
    '20000000-0000-4000-8000-000000000002', 'general'
  )->'items'->0->>'unread',
  'false',
  'the archive reports Richard seeded general announcement as read'
);
select extensions.is(
  api.mark_school_announcement_read(
    '20000000-0000-4000-8000-000000000002',
    'aaaa0000-0000-4000-8000-000000000002'
  ),
  'read',
  'opening an announcement records its read state'
);
select api.mark_school_announcement_read(
  '20000000-0000-4000-8000-000000000002',
  'aaaa0000-0000-4000-8000-000000000002'
);
reset role;
select extensions.is(
  (select count(*)::integer from public.announcement_reads
   where organization_membership_id = '20000000-0000-4000-8000-000000000002'
     and announcement_id = 'aaaa0000-0000-4000-8000-000000000002'),
  1,
  'repeated announcement reads stay idempotent'
);

set local role authenticated;
select extensions.is(
  jsonb_array_length(api.list_newsletter_issues(
    '20000000-0000-4000-8000-000000000002'
  )->'items'),
  2,
  'newsletter archive returns published and archived issues'
);
select extensions.is(
  jsonb_array_length(api.get_newsletter_issue(
    '20000000-0000-4000-8000-000000000002', 'july-2026'
  )->'issue'->'sections'),
  3,
  'newsletter reader returns ordered issue sections'
);
select extensions.is(
  api.get_school_home('20000000-0000-4000-8000-000000000001')->>'resultCode',
  'not_available',
  'a caller cannot borrow another user membership ID'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select extensions.ok(
  not (api.get_school_event(
    '20000000-0000-4000-8000-000000000004',
    'eeee0000-0000-4000-8000-000000000003'
  )->'event' ? 'joinUrl'),
  'a member who is not going cannot see the online join URL'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.respond_school_event(
    '20000000-0000-4000-8000-000000000002',
    'eeee0000-0000-4000-8000-000000000002', 'going'
  ),
  'waitlisted',
  'a full event places a member on the waitlist instead of overbooking'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  api.respond_school_event(
    '20000000-0000-4000-8000-000000000001',
    'eeee0000-0000-4000-8000-000000000002', 'not_going'
  ),
  'not_going',
  'a confirmed attendee can release a capacity slot'
);
reset role;
select extensions.is(
  (select status from public.event_rsvps
   where event_id = 'eeee0000-0000-4000-8000-000000000002'
     and organization_membership_id = '20000000-0000-4000-8000-000000000002'),
  'offered',
  'releasing a slot creates a held offer rather than auto-confirming the waiter'
);
select extensions.ok(
  (select offer_expires_at > now() and offer_expires_at <= now() + interval '1 day'
   from public.event_rsvps
   where event_id = 'eeee0000-0000-4000-8000-000000000002'
     and organization_membership_id = '20000000-0000-4000-8000-000000000002'),
  'the held offer expires within one day'
);
select extensions.ok(
  exists (select 1 from private.outbox_jobs
    where job_type = 'create_notification'
      and payload->>'type' = 'event_waitlist_spot_opened'
      and payload->>'eventId' = 'eeee0000-0000-4000-8000-000000000002'),
  'opening a held spot queues one durable notification job'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.respond_school_event(
    '20000000-0000-4000-8000-000000000002',
    'eeee0000-0000-4000-8000-000000000002', 'accept_offer'
  ),
  'going',
  'the offered member must explicitly accept before becoming confirmed'
);
reset role;
select extensions.ok(
  (select status = 'going' and offered_at is null and offer_expires_at is null
   from public.event_rsvps
   where event_id = 'eeee0000-0000-4000-8000-000000000002'
     and organization_membership_id = '20000000-0000-4000-8000-000000000002'),
  'acceptance clears the offer metadata atomically'
);
select extensions.is(
  (select count(*)::integer from public.event_rsvps
   where event_id = 'eeee0000-0000-4000-8000-000000000002' and status = 'going'),
  1,
  'held-offer acceptance never overbooks event capacity'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  api.get_admin_school_events('20000000-0000-4000-8000-000000000001')->>'resultCode',
  'ok',
  'an organization admin can load the fixed School event admin projection'
);
select extensions.is(
  api.save_admin_school_event(
    p_membership_id => '20000000-0000-4000-8000-000000000001',
    p_title => 'Database contract gathering',
    p_description => 'Created inside the School pgTAP transaction.',
    p_location => 'Main Court Patio',
    p_starts_at => now() + interval '60 days',
    p_capacity => 20
  )->>'resultCode',
  'created',
  'School admins can publish an event through the fixed command'
);
select extensions.is(
  api.publish_admin_school_announcement(
    '20000000-0000-4000-8000-000000000001',
    'Database contract announcement',
    'This announcement exists only inside the pgTAP transaction.',
    'general', false
  )->>'resultCode',
  'published',
  'School admins can publish an announcement through the fixed command'
);
reset role;
select extensions.ok(
  exists (select 1 from private.outbox_jobs
    where job_type = 'create_notification'
      and payload->>'type' = 'announcement_published'
      and payload->>'announcementTitle' = 'Database contract announcement'),
  'announcement publication queues durable member notifications'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.get_admin_school_events('20000000-0000-4000-8000-000000000002')->>'resultCode',
  'not_available',
  'a regular member cannot use the School admin projection'
);
select extensions.is(
  api.save_admin_school_event(
    p_membership_id => '20000000-0000-4000-8000-000000000002',
    p_title => 'Unauthorized event',
    p_location => 'Nowhere',
    p_starts_at => now() + interval '60 days'
  )->>'resultCode',
  'not_available',
  'a regular member cannot mutate School events'
);

select * from extensions.finish();
rollback;
