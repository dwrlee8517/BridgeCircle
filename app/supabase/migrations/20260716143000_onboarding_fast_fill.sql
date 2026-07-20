-- Review-first LinkedIn and resume imports for onboarding.
-- External extraction happens in the application; this migration owns the
-- idempotent request ledger, private proposals, and atomic profile apply.

alter table private.profile_change_proposals
  add column source_metadata jsonb not null default '{}'::jsonb,
  add constraint profile_change_proposals_source_metadata_check
    check (jsonb_typeof(source_metadata) = 'object');

create table private.profile_import_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_membership_id uuid not null
    references public.organization_memberships(id) on delete cascade,
  client_request_id uuid not null,
  source text not null,
  source_key_hash bytea not null,
  status text not null default 'processing',
  proposal_id uuid references private.profile_change_proposals(id) on delete set null,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_import_requests_source_check check (source in ('linkedin', 'resume')),
  constraint profile_import_requests_status_check check (status in ('processing', 'ready', 'failed')),
  constraint profile_import_requests_error_check check (
    (status = 'failed' and last_error_code is not null)
    or (status <> 'failed' and last_error_code is null)
  ),
  unique (user_id, client_request_id)
);

create index profile_import_requests_user_created_idx
  on private.profile_import_requests (user_id, created_at desc);
create index profile_import_requests_membership_idx
  on private.profile_import_requests (organization_membership_id);
create index profile_import_requests_proposal_idx
  on private.profile_import_requests (proposal_id)
  where proposal_id is not null;
create index profile_import_requests_processing_idx
  on private.profile_import_requests (updated_at)
  where status = 'processing';

alter table private.profile_import_requests enable row level security;
revoke all on table private.profile_import_requests from public, anon, authenticated;

create function private.begin_profile_import(
  p_membership_id uuid,
  p_client_request_id uuid,
  p_source text,
  p_source_key text
)
returns table(result_code text, request_id uuid, proposal_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_request private.profile_import_requests%rowtype;
  v_hash bytea;
  v_inserted_id uuid;
begin
  if v_user_id is null or p_client_request_id is null
    or p_source not in ('linkedin', 'resume')
    or nullif(btrim(p_source_key), '') is null
  then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  if not exists (
    select 1
    from public.organization_memberships m
    join public.users u on u.id = m.user_id and u.account_state = 'active'
    where m.id = p_membership_id
      and m.user_id = v_user_id
      and m.status in ('active', 'pending')
  ) then
    return query select 'not_available'::text, null::uuid, null::uuid;
    return;
  end if;

  v_hash := extensions.digest(btrim(p_source_key), 'sha256');

  insert into private.profile_import_requests (
    user_id, organization_membership_id, client_request_id, source, source_key_hash
  ) values (
    v_user_id, p_membership_id, p_client_request_id, p_source, v_hash
  )
  on conflict (user_id, client_request_id) do nothing
  returning id into v_inserted_id;

  select * into v_request
  from private.profile_import_requests r
  where r.user_id = v_user_id and r.client_request_id = p_client_request_id
  for update;

  if v_request.source <> p_source or v_request.source_key_hash <> v_hash then
    return query select 'idempotency_conflict'::text, v_request.id, v_request.proposal_id;
    return;
  elsif v_inserted_id is not null then
    return query select 'started'::text, v_request.id, null::uuid;
    return;
  elsif v_request.status = 'ready' then
    return query select 'existing'::text, v_request.id, v_request.proposal_id;
    return;
  elsif v_request.status = 'processing' and v_request.updated_at > now() - interval '2 minutes' then
    return query select 'in_progress'::text, v_request.id, v_request.proposal_id;
    return;
  end if;

  update private.profile_import_requests
  set status = 'processing', proposal_id = null, last_error_code = null, updated_at = now()
  where id = v_request.id;

  return query select 'started'::text, v_request.id, null::uuid;
end;
$$;

create function private.finish_profile_import(
  p_request_id uuid,
  p_current_snapshot jsonb,
  p_proposed_snapshot jsonb,
  p_source text,
  p_source_metadata jsonb,
  p_attempts jsonb,
  p_confidence numeric
)
returns table(result_code text, proposal_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_request private.profile_import_requests%rowtype;
  v_attempt jsonb;
  v_run_id uuid;
  v_success_run_id uuid;
  v_proposal_id uuid;
begin
  select * into v_request
  from private.profile_import_requests r
  where r.id = p_request_id and r.user_id = v_user_id
  for update;

  if not found then
    return query select 'not_owned'::text, null::uuid;
    return;
  end if;
  if v_request.status = 'ready' and v_request.proposal_id is not null then
    return query select 'existing'::text, v_request.proposal_id;
    return;
  end if;
  if v_request.status <> 'processing' then
    return query select 'not_processing'::text, null::uuid;
    return;
  end if;
  if p_source not in ('linkdapi', 'brightdata', 'pdl', 'resume')
    or jsonb_typeof(p_current_snapshot) <> 'object'
    or jsonb_typeof(p_proposed_snapshot) <> 'object'
    or jsonb_typeof(coalesce(p_source_metadata, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_attempts, '[]'::jsonb)) <> 'array'
    or (p_confidence is not null and p_confidence not between 0 and 1)
  then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  for v_attempt in select value from jsonb_array_elements(coalesce(p_attempts, '[]'::jsonb))
  loop
    if v_attempt ->> 'provider' in ('linkdapi', 'brightdata', 'pdl')
      and v_attempt ->> 'purpose' in ('onboarding_import', 'fallback_verification')
      and v_attempt ->> 'status' in ('succeeded', 'no_match', 'failed')
    then
      insert into private.profile_enrichment_runs (
        user_id, provider, purpose, status, cost_units, fingerprint, error, fetched_at
      ) values (
        v_user_id,
        v_attempt ->> 'provider',
        v_attempt ->> 'purpose',
        v_attempt ->> 'status',
        greatest(coalesce((v_attempt ->> 'costUnits')::integer, 0), 0),
        nullif(v_attempt ->> 'fingerprint', ''),
        nullif(left(v_attempt ->> 'error', 1000), ''),
        now()
      ) returning id into v_run_id;
      if v_attempt ->> 'status' = 'succeeded' then v_success_run_id := v_run_id; end if;
    end if;
  end loop;

  update private.profile_change_proposals
  set status = 'superseded', reviewed_at = now()
  where user_id = v_user_id and status = 'pending';

  insert into private.profile_change_proposals (
    user_id, source, current_snapshot, proposed_snapshot, diff,
    source_run_id, confidence, review_token_hash, expires_at, source_metadata
  ) values (
    v_user_id,
    p_source,
    p_current_snapshot,
    p_proposed_snapshot,
    '{}'::jsonb,
    v_success_run_id,
    p_confidence,
    extensions.digest(gen_random_uuid()::text || clock_timestamp()::text, 'sha256'),
    now() + interval '7 days',
    coalesce(p_source_metadata, '{}'::jsonb)
  ) returning id into v_proposal_id;

  update private.profile_import_requests
  set status = 'ready', proposal_id = v_proposal_id, last_error_code = null, updated_at = now()
  where id = v_request.id;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  )
  select v_user_id, m.organization_id, 'profile.import_ready', 'profile_change_proposal',
         v_proposal_id::text, jsonb_build_object('source', p_source)
  from public.organization_memberships m where m.id = v_request.organization_membership_id;

  return query select 'ready'::text, v_proposal_id;
end;
$$;

create function private.fail_profile_import(
  p_request_id uuid,
  p_error_code text,
  p_attempts jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_request private.profile_import_requests%rowtype;
  v_attempt jsonb;
begin
  select * into v_request
  from private.profile_import_requests r
  where r.id = p_request_id and r.user_id = v_user_id
  for update;
  if not found then return 'not_owned'; end if;
  if nullif(btrim(p_error_code), '') is null
    or jsonb_typeof(coalesce(p_attempts, '[]'::jsonb)) <> 'array'
  then return 'invalid_input'; end if;

  for v_attempt in select value from jsonb_array_elements(coalesce(p_attempts, '[]'::jsonb))
  loop
    if v_attempt ->> 'provider' in ('linkdapi', 'brightdata', 'pdl')
      and v_attempt ->> 'purpose' in ('onboarding_import', 'fallback_verification')
      and v_attempt ->> 'status' in ('succeeded', 'no_match', 'failed')
    then
      insert into private.profile_enrichment_runs (
        user_id, provider, purpose, status, cost_units, fingerprint, error, fetched_at
      ) values (
        v_user_id, v_attempt ->> 'provider', v_attempt ->> 'purpose',
        v_attempt ->> 'status', greatest(coalesce((v_attempt ->> 'costUnits')::integer, 0), 0),
        nullif(v_attempt ->> 'fingerprint', ''), nullif(left(v_attempt ->> 'error', 1000), ''), now()
      );
    end if;
  end loop;

  update private.profile_import_requests
  set status = 'failed', proposal_id = null, last_error_code = left(btrim(p_error_code), 100), updated_at = now()
  where id = v_request.id;
  return 'failed';
end;
$$;

create function private.get_my_profile_import(p_membership_id uuid, p_proposal_id uuid default null)
returns table(
  result_code text,
  proposal_id uuid,
  source text,
  status text,
  current_snapshot jsonb,
  proposed_snapshot jsonb,
  source_metadata jsonb,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if not exists (
    select 1 from public.organization_memberships m
    where m.id = p_membership_id and m.user_id = v_user_id and m.status in ('active', 'pending')
  ) then
    return query select 'not_available'::text, null::uuid, null::text, null::text,
      null::jsonb, null::jsonb, null::jsonb, null::timestamptz, null::timestamptz;
    return;
  end if;

  return query
  select 'ok'::text, p.id, p.source, p.status, p.current_snapshot, p.proposed_snapshot,
         p.source_metadata, p.expires_at, p.created_at
  from private.profile_change_proposals p
  where p.user_id = v_user_id
    and (p_proposal_id is null or p.id = p_proposal_id)
    and (p_proposal_id is not null or (p.status = 'pending' and p.expires_at > now()))
  order by p.created_at desc
  limit 1;

  if not found then
    return query select 'empty'::text, null::uuid, null::text, null::text,
      null::jsonb, null::jsonb, null::jsonb, null::timestamptz, null::timestamptz;
  end if;
end;
$$;

create function private.apply_profile_import(
  p_membership_id uuid,
  p_proposal_id uuid,
  p_payload jsonb,
  p_edited boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_proposal private.profile_change_proposals%rowtype;
  v_identity jsonb;
  v_education jsonb;
  v_current jsonb;
  v_history jsonb;
  v_result text;
  v_skills text[];
begin
  if jsonb_typeof(p_payload) <> 'object' or p_edited is null then return 'invalid_input'; end if;

  select * into v_proposal
  from private.profile_change_proposals p
  where p.id = p_proposal_id and p.user_id = v_user_id
  for update;
  if not found then return 'not_owned'; end if;
  if v_proposal.status <> 'pending' then return 'already_reviewed'; end if;
  if v_proposal.expires_at <= now() then
    update private.profile_change_proposals set status = 'expired', reviewed_at = now()
    where id = v_proposal.id;
    return 'expired';
  end if;

  v_identity := p_payload -> 'identity';
  v_education := p_payload -> 'education';
  v_current := p_payload -> 'current';
  v_history := p_payload -> 'history';
  if jsonb_typeof(v_identity) <> 'object' or jsonb_typeof(v_education) <> 'object'
    or jsonb_typeof(v_current) <> 'object' or jsonb_typeof(v_history) <> 'object'
    or jsonb_typeof(v_education -> 'education') <> 'array'
    or jsonb_typeof(v_history -> 'experiences') <> 'array'
    or jsonb_typeof(v_history -> 'skills') <> 'array'
  then return 'invalid_input'; end if;

  select coalesce(array_agg(value), '{}'::text[]) into v_skills
  from jsonb_array_elements_text(v_history -> 'skills');

  v_result := private.save_profile_identity(
    p_membership_id,
    v_identity ->> 'displayName',
    v_identity ->> 'preferredName',
    v_identity ->> 'nameOther',
    nullif(v_identity ->> 'graduationYear', '')::smallint
  );
  if v_result <> 'saved' then raise exception using errcode = 'BC001', message = v_result; end if;

  v_result := private.save_profile_education(
    p_membership_id, v_education ->> 'university', v_education ->> 'major', v_education -> 'education'
  );
  if v_result <> 'saved' then raise exception using errcode = 'BC001', message = v_result; end if;

  v_result := private.save_profile_current(
    p_membership_id, v_current ->> 'currentEmployer', v_current ->> 'currentTitle',
    v_current ->> 'city', v_current ->> 'headline', v_current ->> 'industry'
  );
  if v_result <> 'saved' then raise exception using errcode = 'BC001', message = v_result; end if;

  v_result := private.save_profile_history(
    p_membership_id, v_history -> 'experiences', v_skills
  );
  if v_result <> 'saved' then raise exception using errcode = 'BC001', message = v_result; end if;

  update private.profile_change_proposals
  set status = case when p_edited then 'edited' else 'accepted' end, reviewed_at = now()
  where id = v_proposal.id;

  if v_proposal.source in ('linkdapi', 'brightdata', 'pdl') then
    insert into private.profile_enrichment_settings (
      user_id, linkedin_url, linkedin_username, primary_provider_name, primary_provider_id,
      refresh_policy, refresh_interval, consented_at, last_checked_at, last_enriched_at,
      last_profile_fingerprint
    ) values (
      v_user_id,
      nullif(v_proposal.source_metadata ->> 'linkedinUrl', ''),
      nullif(v_proposal.source_metadata ->> 'linkedinUsername', ''),
      v_proposal.source,
      nullif(v_proposal.source_metadata ->> 'providerRecordId', ''),
      'review_before_update', 'monthly', now(), now(), now(),
      nullif(v_proposal.source_metadata ->> 'fingerprintHash', '')
    )
    on conflict (user_id) do update set
      linkedin_url = excluded.linkedin_url,
      linkedin_username = excluded.linkedin_username,
      primary_provider_name = excluded.primary_provider_name,
      primary_provider_id = excluded.primary_provider_id,
      refresh_policy = 'review_before_update',
      consented_at = coalesce(private.profile_enrichment_settings.consented_at, now()),
      last_checked_at = now(), last_enriched_at = now(),
      last_profile_fingerprint = excluded.last_profile_fingerprint,
      updated_at = now();
  end if;

  update private.profile_import_requests set updated_at = now()
  where proposal_id = v_proposal.id;

  return 'applied';
exception
  when sqlstate 'BC001' then return 'invalid_profile';
  when invalid_text_representation or numeric_value_out_of_range then return 'invalid_input';
end;
$$;

create function private.decline_profile_import(p_membership_id uuid, p_proposal_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if not exists (
    select 1 from public.organization_memberships m
    where m.id = p_membership_id and m.user_id = v_user_id and m.status in ('active', 'pending')
  ) then return 'not_available'; end if;

  update private.profile_change_proposals
  set status = 'declined', reviewed_at = now()
  where id = p_proposal_id and user_id = v_user_id and status = 'pending';
  if found then return 'declined'; end if;
  if exists (select 1 from private.profile_change_proposals where id = p_proposal_id and user_id = v_user_id)
    then return 'already_reviewed'; end if;
  return 'not_owned';
end;
$$;

create function api.begin_profile_import(
  p_membership_id uuid,
  p_client_request_id uuid,
  p_source text,
  p_source_key text
)
returns table(result_code text, request_id uuid, proposal_id uuid)
language sql security definer set search_path = ''
as $$ select * from private.begin_profile_import(p_membership_id, p_client_request_id, p_source, p_source_key); $$;

create function api.finish_profile_import(
  p_request_id uuid,
  p_current_snapshot jsonb,
  p_proposed_snapshot jsonb,
  p_source text,
  p_source_metadata jsonb,
  p_attempts jsonb,
  p_confidence numeric
)
returns table(result_code text, proposal_id uuid)
language sql security definer set search_path = ''
as $$ select * from private.finish_profile_import(
  p_request_id, p_current_snapshot, p_proposed_snapshot, p_source,
  p_source_metadata, p_attempts, p_confidence
); $$;

create function api.fail_profile_import(p_request_id uuid, p_error_code text, p_attempts jsonb)
returns text language sql security definer set search_path = ''
as $$ select private.fail_profile_import(p_request_id, p_error_code, p_attempts); $$;

create function api.get_my_profile_import(p_membership_id uuid, p_proposal_id uuid default null)
returns table(result_code text, proposal_id uuid, source text, status text, current_snapshot jsonb,
  proposed_snapshot jsonb, source_metadata jsonb, expires_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$ select * from private.get_my_profile_import(p_membership_id, p_proposal_id); $$;

create function api.apply_profile_import(
  p_membership_id uuid,
  p_proposal_id uuid,
  p_payload jsonb,
  p_edited boolean
)
returns text language sql security definer set search_path = ''
as $$ select private.apply_profile_import(p_membership_id, p_proposal_id, p_payload, p_edited); $$;

create function api.decline_profile_import(p_membership_id uuid, p_proposal_id uuid)
returns text language sql security definer set search_path = ''
as $$ select private.decline_profile_import(p_membership_id, p_proposal_id); $$;

grant execute on function api.begin_profile_import(uuid, uuid, text, text) to authenticated;
grant execute on function api.finish_profile_import(uuid, jsonb, jsonb, text, jsonb, jsonb, numeric) to authenticated;
grant execute on function api.fail_profile_import(uuid, text, jsonb) to authenticated;
grant execute on function api.get_my_profile_import(uuid, uuid) to authenticated;
grant execute on function api.apply_profile_import(uuid, uuid, jsonb, boolean) to authenticated;
grant execute on function api.decline_profile_import(uuid, uuid) to authenticated;

revoke execute on function private.begin_profile_import(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function private.finish_profile_import(uuid, jsonb, jsonb, text, jsonb, jsonb, numeric) from public, anon, authenticated;
revoke execute on function private.fail_profile_import(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function private.get_my_profile_import(uuid, uuid) from public, anon, authenticated;
revoke execute on function private.apply_profile_import(uuid, uuid, jsonb, boolean) from public, anon, authenticated;
revoke execute on function private.decline_profile_import(uuid, uuid) from public, anon, authenticated;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'resumes';

-- The account-state cleanup trigger handles immediate application deletion;
-- the FK cascade remains the final safety net for hard deletion.
create or replace function private.cleanup_entry_operations_after_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.account_state is distinct from 'deleted' and new.account_state = 'deleted' then
    delete from public.user_communication_preferences where user_id = new.id;
    delete from private.onboarding_drafts where user_id = new.id;
    delete from private.account_export_requests where user_id = new.id;
    delete from private.invite_operation_requests where actor_user_id = new.id;
    delete from private.profile_import_requests where user_id = new.id;
  end if;
  return new;
end;
$$;
