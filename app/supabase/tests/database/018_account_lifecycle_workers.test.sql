begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(22);

select extensions.has_function(
  'api', 'start_account_export', array['uuid'],
  'service export start contract exists'
);
select extensions.has_function(
  'api', 'fail_account_export', array['uuid', 'text'],
  'service export failure contract exists'
);
select extensions.has_function(
  'api', 'process_scheduled_account_deletion', array['uuid'],
  'service deletion finalizer contract exists'
);
select extensions.has_function(
  'api', 'expire_account_exports', array['integer'],
  'service export expiry contract exists'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'api.start_account_export(uuid)', 'execute'),
  'members cannot start export worker state'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'api.fail_account_export(uuid,text)', 'execute'),
  'members cannot fail export jobs'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated', 'api.process_scheduled_account_deletion(uuid)', 'execute'
  ),
  'members cannot finalize account deletion'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '78000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'lifecycle-worker@example.test',
  crypt('Lifecycle-worker-password-1', gen_salt('bf')),
  now(), now(), now()
);

insert into private.account_export_requests (
  id, user_id, request_id, status
) values (
  '78100000-0000-4000-8000-000000000001',
  '78000000-0000-4000-8000-000000000001',
  '78200000-0000-4000-8000-000000000001',
  'queued'
);

select extensions.is(
  private.start_account_export('78100000-0000-4000-8000-000000000001'),
  'processing',
  'queued export moves to processing'
);
select extensions.is(
  (
    select status from private.account_export_requests
    where id = '78100000-0000-4000-8000-000000000001'
  ),
  'processing',
  'processing state is durable'
);
select extensions.is(
  private.fail_account_export(
    '78100000-0000-4000-8000-000000000001',
    'provider detail that is safe only in private state'
  ),
  'failed',
  'terminal export failure converges'
);
select extensions.ok(
  (
    select status = 'failed' and last_error is not null
    from private.account_export_requests
    where id = '78100000-0000-4000-8000-000000000001'
  ),
  'failed export retains a private diagnostic'
);

update public.users
set account_state = 'deletion_scheduled',
    delete_scheduled_for = now() + interval '1 day',
    delete_reason = 'member_requested'
where id = '78000000-0000-4000-8000-000000000001';

select extensions.is(
  private.process_scheduled_account_deletion('78000000-0000-4000-8000-000000000001'),
  'not_due',
  'deletion cannot finalize before the grace deadline'
);

update public.users
set account_state = 'active',
    delete_scheduled_for = null,
    delete_reason = null
where id = '78000000-0000-4000-8000-000000000001';

select extensions.is(
  private.process_scheduled_account_deletion('78000000-0000-4000-8000-000000000001'),
  'cancelled',
  'a cancelled deletion job is a safe no-op'
);

select set_config('request.jwt.claim.sub', '78000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select * from api.schedule_my_account_deletion();
reset role;

select extensions.ok(
  (
    select available_at >= u.delete_scheduled_for - interval '1 second'
      and available_at <= u.delete_scheduled_for + interval '1 second'
    from private.outbox_jobs j
    join public.users u on u.id = '78000000-0000-4000-8000-000000000001'
    where j.dedupe_key = 'account_deletion:78000000-0000-4000-8000-000000000001'
  ),
  'deletion worker is delayed until the grace deadline'
);

set local role authenticated;
select * from api.cancel_my_account_deletion();
reset role;

select extensions.is(
  (
    select account_state from public.users
    where id = '78000000-0000-4000-8000-000000000001'
  ),
  'active',
  'cancelling during the grace window restores the active state'
);

set local role authenticated;
select * from api.schedule_my_account_deletion();
reset role;

select extensions.is(
  (
    select status from private.outbox_jobs
    where dedupe_key = 'account_deletion:78000000-0000-4000-8000-000000000001'
  ),
  'pending',
  'rescheduling reactivates the same deduplicated deletion job'
);
select extensions.ok(
  (
    select available_at >= u.delete_scheduled_for - interval '1 second'
      and available_at <= u.delete_scheduled_for + interval '1 second'
    from private.outbox_jobs j
    join public.users u on u.id = '78000000-0000-4000-8000-000000000001'
    where j.dedupe_key = 'account_deletion:78000000-0000-4000-8000-000000000001'
  ),
  'rescheduling moves the worker back to the new grace deadline'
);

update public.users
set delete_scheduled_for = now() - interval '1 minute'
where id = '78000000-0000-4000-8000-000000000001';

select extensions.is(
  private.process_scheduled_account_deletion('78000000-0000-4000-8000-000000000001'),
  'deleted',
  'due deletion finalizes through the existing pseudonymization contract'
);
select extensions.is(
  (
    select account_state from public.users
    where id = '78000000-0000-4000-8000-000000000001'
  ),
  'deleted',
  'finalization leaves a deleted public tombstone'
);
select extensions.is(
  private.process_scheduled_account_deletion('78000000-0000-4000-8000-000000000001'),
  'already_deleted',
  'deletion finalization is idempotent'
);
select extensions.is(
  (
    select count(*)::bigint
    from private.outbox_jobs
    where dedupe_key = 'delete_storage_objects:78000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'finalization queues one idempotent user-storage cleanup'
);
select extensions.is(
  (
    select count(*)::bigint
    from private.account_export_requests
    where user_id = '78000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'deletion removes private export request state'
);

select * from extensions.finish();
rollback;
