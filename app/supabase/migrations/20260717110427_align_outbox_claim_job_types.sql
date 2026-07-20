-- Keep the database claim allowlist aligned with the worker's complete typed
-- handler registry. The entry/account lifecycle migrations added two durable
-- job types after the original claim function was created.

create or replace function private.claim_outbox_jobs(
  p_worker_id text,
  p_limit integer default 20,
  p_allowed_types text[] default null
)
returns setof private.outbox_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(btrim(coalesce(p_worker_id, ''))) not between 1 and 200 then
    raise exception using errcode = '22023', message = 'invalid_worker_id';
  end if;
  if p_allowed_types is null
     or cardinality(p_allowed_types) = 0
     or exists (
       select 1 from unnest(p_allowed_types) allowed(job_type)
       where allowed.job_type not in (
         'create_notification',
         'send_email',
         'run_ask_matching',
         'index_profile',
         'send_invite_email',
         'generate_account_export',
         'process_account_deletion',
         'delete_storage_objects'
       )
     ) then
    raise exception using errcode = '22023', message = 'invalid_allowed_job_types';
  end if;

  update private.outbox_jobs j
  set status = 'failed',
      last_error = coalesce(j.last_error, 'lock_timeout')
  where j.status = 'processing'
    and j.locked_at <= now() - interval '15 minutes'
    and j.attempts >= j.max_attempts;

  update private.outbox_jobs j
  set status = 'pending',
      locked_at = null,
      locked_by = null,
      last_error = coalesce(j.last_error, 'lock_timeout'),
      available_at = least(j.available_at, now())
  where j.status = 'processing'
    and j.locked_at <= now() - interval '15 minutes'
    and j.attempts < j.max_attempts;

  return query
  with claimable as (
    select j.id
    from private.outbox_jobs j
    where j.status = 'pending'
      and j.available_at <= now()
      and j.job_type = any(p_allowed_types)
    order by j.available_at, j.id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  )
  update private.outbox_jobs j
  set status = 'processing',
      locked_at = now(),
      locked_by = p_worker_id,
      attempts = attempts + 1
  where j.id in (select id from claimable)
  returning j.*;
end;
$$;

create or replace function api.claim_outbox_jobs(
  p_worker_id text,
  p_limit integer default 20,
  p_allowed_types text[] default array[
    'create_notification',
    'send_email',
    'run_ask_matching',
    'index_profile',
    'send_invite_email',
    'generate_account_export',
    'process_account_deletion',
    'delete_storage_objects'
  ]::text[]
)
returns table (
  id bigint,
  job_type text,
  payload jsonb,
  attempts integer,
  max_attempts integer,
  available_at timestamptz,
  locked_at timestamptz,
  locked_by text
)
language sql
set search_path = ''
as $$
  select
    j.id,
    j.job_type,
    j.payload,
    j.attempts,
    j.max_attempts,
    j.available_at,
    j.locked_at,
    j.locked_by
  from private.claim_outbox_jobs(p_worker_id, p_limit, p_allowed_types) j;
$$;
