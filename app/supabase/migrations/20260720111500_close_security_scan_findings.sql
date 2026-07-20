-- Close the two P2 findings from the database-v2 security diff review.
--
-- Direct Ask decisions require both organization memberships to remain
-- current. Queued provider-backed matching consumes an actor/hour budget that
-- is derived from the claimed job rather than trusted outbox payload identity.

-- ---------------------------------------------------------------------------
-- Direct Ask decision-time membership authorization
-- ---------------------------------------------------------------------------

create or replace function private.enforce_current_help_decision_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'asks' then
    if old.kind = 'direct'
       and old.status = 'waiting'
       and new.status in ('accepted', 'declined') then
      if not exists (
        select 1
        from public.organization_memberships asker
        join public.users account
          on account.id = asker.user_id
         and account.account_state = 'active'
        where asker.id = old.asker_membership_id
          and asker.organization_id = old.organization_id
          and asker.status = 'active'
      ) then
        raise exception using errcode = '42501', message = 'direct_ask_asker_not_current';
      end if;

      if not exists (
        select 1
        from public.organization_memberships recipient
        join public.users account
          on account.id = recipient.user_id
         and account.account_state = 'active'
        where recipient.id = old.recipient_membership_id
          and recipient.organization_id = old.organization_id
          and recipient.user_id = (select auth.uid())
          and recipient.status = 'active'
      ) then
        raise exception using errcode = '42501', message = 'direct_ask_recipient_not_current';
      end if;
    end if;
  end if;

  if tg_table_name = 'ask_offers' then
    if old.status = 'pending'
       and new.status in ('accepted', 'declined')
       and not exists (
         select 1
         from public.organization_memberships helper
         join public.users account
           on account.id = helper.user_id
          and account.account_state = 'active'
         where helper.id = old.helper_membership_id
           and helper.organization_id = old.organization_id
           and helper.status = 'active'
       ) then
      raise exception using errcode = '42501', message = 'offer_helper_not_current';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function private.enforce_current_help_decision_membership()
  from public, anon, authenticated;

create or replace function api.respond_to_direct_ask(
  p_ask_id uuid,
  p_decision text,
  p_opening_message text default null,
  p_decline_reason_code text default null,
  p_decline_note text default null,
  p_client_nonce uuid default null
)
returns table (
  result_code text,
  ask_id uuid,
  conversation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_message text;
begin
  if p_decision not in ('accept', 'decline') then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  v_conversation_id := private.respond_to_direct_ask(
    p_ask_id, p_decision, p_opening_message, p_decline_reason_code,
    p_decline_note, p_client_nonce
  );
  return query select
    case when p_decision = 'accept' then 'accepted' else 'declined' end,
    p_ask_id,
    v_conversation_id;
exception when others then
  v_message := sqlerrm;
  if v_message in (
    'direct_ask_not_found', 'direct_ask_not_recipient', 'ask_blocked',
    'direct_ask_asker_not_current', 'direct_ask_recipient_not_current'
  ) then
    return query select 'not_available'::text, null::uuid, null::uuid;
  elsif v_message = 'ask_already_decided' then
    return query select 'already_decided'::text, p_ask_id, null::uuid;
  elsif v_message in (
    'opening_message_required', 'decline_note_required', 'invalid_direct_ask_decision'
  ) then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
  else
    raise;
  end if;
end;
$$;

grant execute on function api.respond_to_direct_ask(uuid, text, text, text, text, uuid)
  to authenticated;
revoke execute on function api.respond_to_direct_ask(uuid, text, text, text, text, uuid)
  from public, anon;

-- ---------------------------------------------------------------------------
-- Queued Ask matching provider budget
-- ---------------------------------------------------------------------------

alter table private.security_usage_windows
  drop constraint security_usage_windows_resource_check;
alter table private.security_usage_windows
  add constraint security_usage_windows_resource_check check (resource in (
    'linkedin_import', 'resume_import', 'profile_index', 'message_send',
    'ask_matching_provider'
  ));

create or replace function private.consume_security_budget(
  p_actor_user_id uuid,
  p_resource text,
  p_resource_key text,
  p_window_started_at timestamptz,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_actor_user_id is null
     or p_resource is null
     or p_resource not in (
       'linkedin_import', 'resume_import', 'profile_index', 'message_send',
       'ask_matching_provider'
     )
     or p_resource_key is null
     or char_length(p_resource_key) > 200
     or p_window_started_at is null
     or p_limit is null
     or p_limit not between 1 and 1000 then
    return false;
  end if;

  insert into private.security_usage_windows (
    actor_user_id, resource, resource_key, window_started_at, request_count
  ) values (
    p_actor_user_id, p_resource, p_resource_key, p_window_started_at, 1
  )
  on conflict (actor_user_id, resource, resource_key, window_started_at) do update
    set request_count = private.security_usage_windows.request_count + 1,
        updated_at = now()
    where private.security_usage_windows.request_count < p_limit
  returning request_count into v_count;

  return v_count is not null;
end;
$$;

revoke execute on function private.consume_security_budget(
  uuid, text, text, timestamptz, integer
) from public, anon, authenticated;

create or replace function api.consume_ask_matching_provider_budget(
  p_job_id bigint,
  p_worker_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
begin
  if p_job_id is null or nullif(btrim(coalesce(p_worker_id, '')), '') is null then
    return 'not_available';
  end if;

  select membership.user_id
    into v_actor_user_id
  from private.outbox_jobs job
  join public.asks ask
    on ask.id = private.safe_uuid(job.payload ->> 'askId')
   and ask.kind = 'circle'
   and ask.status = 'open'
   and ask.reach = 'matched'
  join public.organization_memberships membership
    on membership.id = ask.asker_membership_id
   and membership.organization_id = ask.organization_id
   and membership.status = 'active'
  join public.users account
    on account.id = membership.user_id
   and account.account_state = 'active'
  where job.id = p_job_id
    and job.job_type = 'run_ask_matching'
    and job.status = 'processing'
    and job.locked_by = p_worker_id;

  if not found then
    return 'not_available';
  end if;

  if private.consume_security_budget(
    v_actor_user_id,
    'ask_matching_provider',
    '',
    date_trunc('hour', clock_timestamp()),
    10
  ) then
    return 'allowed';
  end if;
  return 'limited';
end;
$$;

grant execute on function api.consume_ask_matching_provider_budget(bigint, text)
  to service_role;
revoke execute on function api.consume_ask_matching_provider_budget(bigint, text)
  from public, anon, authenticated;
