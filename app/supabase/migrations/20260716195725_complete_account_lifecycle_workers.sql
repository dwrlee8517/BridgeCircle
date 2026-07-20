-- Finish the durable account lifecycle: delayed deletion, service-only
-- finalization, export state convergence, and private Storage cleanup.

create or replace function private.schedule_my_account_deletion()
returns table(result_code text, delete_scheduled_for timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.users%rowtype;
begin
  select * into v_user
  from public.users
  where id = (select auth.uid())
  for update;

  if not found or v_user.account_state = 'deleted' then
    return query select 'not_available'::text, null::timestamptz;
    return;
  end if;
  if v_user.account_state = 'deletion_scheduled' then
    return query select 'scheduled'::text, v_user.delete_scheduled_for;
    return;
  end if;

  update public.users
  set account_state = 'deletion_scheduled',
      delete_scheduled_for = now() + interval '7 days',
      delete_reason = 'member_requested',
      delete_initiated_by_admin = false
  where id = v_user.id
  returning * into v_user;

  insert into private.audit_log (
    actor_user_id, action, target_type, target_id, payload
  ) values (
    v_user.id, 'account.deletion_scheduled', 'user', v_user.id::text,
    jsonb_build_object('deleteScheduledFor', v_user.delete_scheduled_for)
  );

  insert into private.outbox_jobs (
    job_type, payload, dedupe_key, status, attempts, max_attempts,
    available_at, locked_at, locked_by, last_error, completed_at
  ) values (
    'process_account_deletion',
    jsonb_build_object('userId', v_user.id),
    'account_deletion:' || v_user.id::text,
    'pending', 0, 8, v_user.delete_scheduled_for, null, null, null, null
  )
  on conflict (dedupe_key) do update
  set payload = excluded.payload,
      status = 'pending',
      attempts = 0,
      max_attempts = excluded.max_attempts,
      available_at = excluded.available_at,
      locked_at = null,
      locked_by = null,
      last_error = null,
      completed_at = null,
      updated_at = now();

  return query select 'scheduled'::text, v_user.delete_scheduled_for;
end;
$$;

create function private.start_account_export(p_export_request_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select r.status into v_status
  from private.account_export_requests r
  join public.users u on u.id = r.user_id
  where r.id = p_export_request_id
    and u.account_state = 'active'
  for update of r;

  if not found then return 'not_available'; end if;
  if v_status = 'ready' then return 'ready'; end if;
  if v_status not in ('queued', 'processing') then return 'not_available'; end if;

  update private.account_export_requests
  set status = 'processing',
      started_at = coalesce(started_at, now()),
      last_error = null
  where id = p_export_request_id;
  return 'processing';
end;
$$;

create function private.fail_account_export(
  p_export_request_id uuid,
  p_error text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.account_export_requests
  set status = 'failed',
      last_error = coalesce(left(nullif(btrim(p_error), ''), 500), 'export_failed'),
      storage_bucket = null,
      storage_path = null,
      completed_at = null,
      expires_at = null
  where id = p_export_request_id
    and status in ('queued', 'processing');

  if not found then return 'not_available'; end if;
  return 'failed';
end;
$$;

create function private.process_scheduled_account_deletion(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.users%rowtype;
begin
  select * into v_user
  from public.users
  where id = p_user_id
  for update;

  if not found then return 'not_available'; end if;
  if v_user.account_state = 'deleted' then return 'already_deleted'; end if;
  if v_user.account_state <> 'deletion_scheduled' then return 'cancelled'; end if;
  if v_user.delete_scheduled_for is null or v_user.delete_scheduled_for > now() then
    return 'not_due';
  end if;

  perform private.pseudonymize_user(p_user_id);
  return 'deleted';
end;
$$;

create function private.expire_account_exports(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request record;
  v_count integer := 0;
begin
  for v_request in
    select r.id, r.user_id, r.storage_bucket, r.storage_path
    from private.account_export_requests r
    where r.status = 'ready'
      and r.expires_at <= now()
    order by r.expires_at, r.id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 1000))
  loop
    update private.account_export_requests
    set status = 'expired'
    where id = v_request.id;

    if v_request.storage_bucket is not null and v_request.storage_path is not null then
      perform private.enqueue_outbox(
        'delete_storage_objects',
        jsonb_build_object(
          'userId', v_request.user_id,
          'bucket', v_request.storage_bucket,
          'paths', jsonb_build_array(v_request.storage_path)
        ),
        'delete_account_export:' || v_request.id::text
      );
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function private.cleanup_entry_operations_after_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.account_state is distinct from 'deleted' and new.account_state = 'deleted' then
    -- Delete by the private owner prefix instead of trusting request rows to be
    -- exhaustive. This also catches an artifact uploaded immediately before a
    -- worker interruption and remains idempotent when the prefix is empty.
    perform private.enqueue_outbox(
      'delete_storage_objects',
      jsonb_build_object(
        'userId', new.id,
        'buckets', jsonb_build_array('account-exports'),
        'pathPrefix', new.id::text || '/'
      ),
      'delete_account_exports:' || new.id::text
    );

    delete from public.user_communication_preferences where user_id = new.id;
    delete from private.onboarding_drafts where user_id = new.id;
    delete from private.account_export_requests where user_id = new.id;
    delete from private.invite_operation_requests where actor_user_id = new.id;
  end if;
  return new;
end;
$$;

create function api.start_account_export(p_export_request_id uuid)
returns text
language sql
set search_path = ''
as $$ select private.start_account_export(p_export_request_id); $$;

create function api.fail_account_export(p_export_request_id uuid, p_error text)
returns text
language sql
set search_path = ''
as $$ select private.fail_account_export(p_export_request_id, p_error); $$;

create function api.process_scheduled_account_deletion(p_user_id uuid)
returns text
language sql
set search_path = ''
as $$ select private.process_scheduled_account_deletion(p_user_id); $$;

create function api.expire_account_exports(p_limit integer default 100)
returns integer
language sql
set search_path = ''
as $$ select private.expire_account_exports(p_limit); $$;

revoke all on function private.start_account_export(uuid),
  private.fail_account_export(uuid, text),
  private.process_scheduled_account_deletion(uuid),
  private.expire_account_exports(integer),
  api.start_account_export(uuid),
  api.fail_account_export(uuid, text),
  api.process_scheduled_account_deletion(uuid),
  api.expire_account_exports(integer)
from public, anon, authenticated;

grant execute on function private.start_account_export(uuid),
  private.fail_account_export(uuid, text),
  private.process_scheduled_account_deletion(uuid),
  private.expire_account_exports(integer),
  api.start_account_export(uuid),
  api.fail_account_export(uuid, text),
  api.process_scheduled_account_deletion(uuid),
  api.expire_account_exports(integer)
to service_role;
