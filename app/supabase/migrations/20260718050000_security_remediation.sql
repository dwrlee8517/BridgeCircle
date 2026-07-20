-- Security remediation for the v2 cutover review.
--
-- The invariants in this migration are intentionally enforced at the
-- transaction boundary: current membership/account checks, command-specific
-- roles, atomic provider/message budgets, semantic reuse, and worker-time
-- authorization. Application checks remain defense in depth.

-- ---------------------------------------------------------------------------
-- Shared atomic usage ledger
-- ---------------------------------------------------------------------------

create table private.security_usage_windows (
  actor_user_id uuid not null references public.users(id) on delete cascade,
  resource text not null,
  resource_key text not null default '',
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (actor_user_id, resource, resource_key, window_started_at),
  constraint security_usage_windows_resource_check check (resource in (
    'linkedin_import', 'resume_import', 'profile_index', 'message_send'
  )),
  constraint security_usage_windows_key_check
    check (char_length(resource_key) <= 200),
  constraint security_usage_windows_count_check check (request_count > 0)
);

create index if not exists security_usage_windows_cleanup_idx
  on private.security_usage_windows (window_started_at);

alter table private.security_usage_windows enable row level security;
revoke all on table private.security_usage_windows from public, anon, authenticated;
grant all privileges on table private.security_usage_windows to service_role;

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
     or p_resource not in ('linkedin_import', 'resume_import', 'profile_index', 'message_send')
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

-- ---------------------------------------------------------------------------
-- Current-state identity and visibility helpers
-- ---------------------------------------------------------------------------

create or replace function private.users_share_active_organization(
  p_viewer_user_id uuid,
  p_target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_viewer_user_id is not null
    and p_target_user_id is not null
    and exists (
      select 1
      from public.organization_memberships viewer
      join public.organization_memberships target
        on target.organization_id = viewer.organization_id
       and target.user_id = p_target_user_id
       and target.status = 'active'
      join public.users viewer_account
        on viewer_account.id = viewer.user_id
       and viewer_account.account_state = 'active'
      join public.users target_account
        on target_account.id = target.user_id
       and target_account.account_state = 'active'
      where viewer.user_id = p_viewer_user_id
        and viewer.status = 'active'
        and not private.is_blocked(p_viewer_user_id, p_target_user_id)
    );
$$;

create or replace function private.can_reveal_anonymous_asker(p_ask_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.asks ask
    join public.organization_memberships asker
      on asker.id = ask.asker_membership_id
    join public.users asker_account
      on asker_account.id = asker.user_id
     and asker_account.account_state = 'active'
    where ask.id = p_ask_id
      and asker.status = 'active'
      and (
        asker.user_id = (select auth.uid())
        or exists (
          select 1
          from public.ask_offers offer
          join public.organization_memberships helper
            on helper.id = offer.helper_membership_id
           and helper.status = 'active'
          join public.users helper_account
            on helper_account.id = helper.user_id
           and helper_account.account_state = 'active'
          where offer.ask_id = ask.id
            and offer.status = 'accepted'
            and helper.user_id = (select auth.uid())
        )
      )
  );
$$;

create or replace function private.user_is_active_member_of_organization(
  p_user_id uuid,
  p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.users account
      on account.id = membership.user_id
     and account.account_state = 'active'
    where membership.user_id = p_user_id
      and membership.organization_id = p_organization_id
      and membership.status = 'active'
  );
$$;

revoke execute on function private.users_share_active_organization(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function private.can_reveal_anonymous_asker(uuid)
  from public, anon, authenticated;
revoke execute on function private.user_is_active_member_of_organization(uuid, uuid)
  from public, anon, authenticated;

create or replace function private.can_view_ask(p_ask_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_asker_user_id uuid;
  v_organization_id uuid;
  v_recipient_membership_id uuid;
  v_kind text;
  v_reach text;
begin
  if v_user_id is null then return false; end if;

  select asker.user_id, ask.organization_id, ask.recipient_membership_id,
         ask.kind, ask.reach
    into v_asker_user_id, v_organization_id, v_recipient_membership_id,
         v_kind, v_reach
  from public.asks ask
  join public.organization_memberships asker
    on asker.id = ask.asker_membership_id
   and asker.status = 'active'
  join public.users asker_account
    on asker_account.id = asker.user_id
   and asker_account.account_state = 'active'
  where ask.id = p_ask_id;

  if not found or private.is_blocked(v_user_id, v_asker_user_id) then
    return false;
  end if;

  if v_user_id = v_asker_user_id then return true; end if;

  if v_kind = 'direct' then
    return exists (
      select 1
      from public.organization_memberships recipient
      join public.users recipient_account
        on recipient_account.id = recipient.user_id
       and recipient_account.account_state = 'active'
      where recipient.id = v_recipient_membership_id
        and recipient.user_id = v_user_id
        and recipient.status = 'active'
    );
  end if;

  if not private.is_active_member_of(v_organization_id) then return false; end if;
  if v_reach = 'organization' then return true; end if;

  return exists (
    select 1
    from private.ask_matches match
    join public.organization_memberships helper
      on helper.id = match.helper_membership_id
     and helper.status = 'active'
    join public.users helper_account
      on helper_account.id = helper.user_id
     and helper_account.account_state = 'active'
    where match.ask_id = p_ask_id
      and helper.user_id = v_user_id
  ) or exists (
    select 1
    from public.ask_offers offer
    join public.organization_memberships helper
      on helper.id = offer.helper_membership_id
     and helper.status = 'active'
    join public.users helper_account
      on helper_account.id = helper.user_id
     and helper_account.account_state = 'active'
    where offer.ask_id = p_ask_id
      and helper.user_id = v_user_id
      and offer.status = 'accepted'
  );
end;
$$;

-- Mask the two legacy Ask projections after their original authorization has
-- run. Renamed implementations are private to the wrapper owner.
alter function api.get_ask_detail(uuid)
  rename to get_ask_detail_pre_security_remediation;
alter function api.get_ask_detail_pre_security_remediation(uuid)
  set schema private;
revoke execute on function private.get_ask_detail_pre_security_remediation(uuid)
  from public, anon, authenticated, service_role;

create or replace function api.get_ask_detail(p_ask_id uuid)
returns table (
  ask_id uuid, organization_id uuid, kind text, status text, question text,
  request_message text, reach text, anonymous_until_accepted boolean,
  asker_user_id uuid, recipient_user_id uuid, decline_reason_code text,
  decline_note text, closure_reason text, outcome_note text,
  accepted_at timestamptz, ended_at timestamptz,
  expires_at timestamptz, created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select detail.ask_id, detail.organization_id, detail.kind, detail.status,
    detail.question, detail.request_message, detail.reach,
    detail.anonymous_until_accepted,
    case
      when detail.anonymous_until_accepted
       and not private.can_reveal_anonymous_asker(detail.ask_id) then null
      else detail.asker_user_id
    end,
    detail.recipient_user_id, detail.decline_reason_code, detail.decline_note,
    detail.closure_reason, detail.outcome_note, detail.accepted_at,
    detail.ended_at, detail.expires_at, detail.created_at
  from private.get_ask_detail_pre_security_remediation(p_ask_id) detail;
$$;

alter function api.get_help_ask_detail(uuid)
  rename to get_help_ask_detail_pre_security_remediation;
alter function api.get_help_ask_detail_pre_security_remediation(uuid)
  set schema private;
revoke execute on function private.get_help_ask_detail_pre_security_remediation(uuid)
  from public, anon, authenticated, service_role;

create or replace function api.get_help_ask_detail(p_ask_id uuid)
returns table (
  ask_id uuid,
  organization_id uuid,
  kind text,
  status text,
  question text,
  request_message text,
  reach text,
  anonymous_until_accepted boolean,
  asker_preview jsonb,
  recipient_preview jsonb,
  decline_reason_code text,
  decline_note text,
  closure_reason text,
  outcome_note text,
  conversation_id uuid,
  offers jsonb,
  history jsonb,
  accepted_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select detail.ask_id, detail.organization_id, detail.kind, detail.status,
    detail.question, detail.request_message, detail.reach,
    detail.anonymous_until_accepted,
    case
      when detail.anonymous_until_accepted
       and not private.can_reveal_anonymous_asker(detail.ask_id)
      then jsonb_strip_nulls(jsonb_build_object(
        'displayName', 'A member',
        'graduationYear', detail.asker_preview -> 'graduationYear'
      ))
      else detail.asker_preview
    end,
    case
      when detail.recipient_preview is null then null
      when private.user_is_active_member_of_organization(
        (detail.recipient_preview ->> 'userId')::uuid,
        detail.organization_id
      ) and not private.is_blocked(
        (select auth.uid()), (detail.recipient_preview ->> 'userId')::uuid
      ) then detail.recipient_preview
      else null
    end,
    detail.decline_reason_code, detail.decline_note,
    detail.closure_reason, detail.outcome_note, detail.conversation_id,
    coalesce((
      select jsonb_agg(
        case
          when private.user_is_active_member_of_organization(
            (offer_item -> 'helper' ->> 'userId')::uuid,
            detail.organization_id
          ) and not private.is_blocked(
            (select auth.uid()), (offer_item -> 'helper' ->> 'userId')::uuid
          ) then offer_item
          else jsonb_set(
            offer_item,
            '{helper}',
            jsonb_build_object('displayName', 'Former member'),
            false
          )
        end
        order by offer_ordinality
      )
      from jsonb_array_elements(detail.offers)
        with ordinality as offer_rows(offer_item, offer_ordinality)
      where not private.is_blocked(
        (select auth.uid()), (offer_item -> 'helper' ->> 'userId')::uuid
      )
    ), '[]'::jsonb),
    detail.history, detail.accepted_at, detail.ended_at,
    detail.expires_at, detail.created_at
  from private.get_help_ask_detail_pre_security_remediation(p_ask_id) detail;
$$;

grant execute on function api.get_ask_detail(uuid) to authenticated;
grant execute on function api.get_help_ask_detail(uuid) to authenticated;
revoke execute on function api.get_ask_detail(uuid) from public, anon;
revoke execute on function api.get_help_ask_detail(uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- Command-specific authorization and decision-time membership checks
-- ---------------------------------------------------------------------------

create or replace function private.can_publish_school_announcement(p_membership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.users account
      on account.id = membership.user_id
     and account.account_state = 'active'
    join public.admin_role_assignments assignment
      on assignment.organization_id = membership.organization_id
     and assignment.organization_membership_id = membership.id
     and assignment.role in ('super_admin', 'admin')
    where membership.id = p_membership_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

revoke execute on function private.can_publish_school_announcement(uuid)
  from public, anon, authenticated;

alter function private.publish_admin_school_announcement(uuid, text, text, text, boolean)
  rename to publish_admin_school_announcement_pre_security_remediation;
revoke execute on function private.publish_admin_school_announcement_pre_security_remediation(
  uuid, text, text, text, boolean
) from public, anon, authenticated, service_role;

create or replace function private.publish_admin_school_announcement(
  p_membership_id uuid,
  p_title text,
  p_body text,
  p_tag text,
  p_pinned boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.can_publish_school_announcement(p_membership_id) then
    return jsonb_build_object('resultCode', 'not_available');
  end if;
  return private.publish_admin_school_announcement_pre_security_remediation(
    p_membership_id, p_title, p_body, p_tag, p_pinned
  );
end;
$$;

revoke execute on function private.publish_admin_school_announcement(
  uuid, text, text, text, boolean
) from public, anon, authenticated;

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
       and new.status in ('accepted', 'declined')
       and not exists (
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

-- Profile reports use the same current common-organization and block posture
-- as the profile read projection before the original report transaction runs.
alter function private.submit_report(text, text, text, text)
  rename to submit_report_pre_security_remediation;
revoke execute on function private.submit_report_pre_security_remediation(
  text, text, text, text
) from public, anon, authenticated, service_role;

create or replace function private.submit_report(
  p_target_type text,
  p_target_id text,
  p_reason text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_user_id uuid;
begin
  if p_target_type = 'profile' then
    begin
      v_target_user_id := p_target_id::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '42501', message = 'report_target_not_accessible';
    end;
    if not private.users_share_active_organization(
      (select auth.uid()), v_target_user_id
    ) then
      raise exception using errcode = '42501', message = 'report_target_not_accessible';
    end if;
  end if;

  return private.submit_report_pre_security_remediation(
    p_target_type, p_target_id, p_reason, p_note
  );
end;
$$;

revoke execute on function private.submit_report(text, text, text, text)
  from public, anon, authenticated;

create or replace function api.submit_report(
  p_target_type text,
  p_target_id text,
  p_reason text,
  p_note text default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.submit_report(p_target_type, p_target_id, p_reason, p_note);
$$;

grant execute on function api.submit_report(text, text, text, text)
  to authenticated;
revoke execute on function api.submit_report(text, text, text, text)
  from public, anon;

-- ---------------------------------------------------------------------------
-- Conversation privacy and message rate limiting
-- ---------------------------------------------------------------------------

alter function api.get_conversation_detail(uuid)
  rename to get_conversation_detail_pre_security_remediation;
alter function api.get_conversation_detail_pre_security_remediation(uuid)
  set schema private;
revoke execute on function private.get_conversation_detail_pre_security_remediation(uuid)
  from public, anon, authenticated, service_role;

create or replace function api.get_conversation_detail(p_conversation_id uuid)
returns table(
  conversation_id uuid,
  kind text,
  organization_id uuid,
  ask_id uuid,
  created_at timestamptz,
  last_message_at timestamptz,
  counterpart_user_id uuid,
  counterpart_display_name text,
  counterpart_avatar_path text,
  counterpart_graduation_year smallint,
  can_send boolean,
  viewer_last_read_message_id bigint,
  viewer_last_read_at timestamptz,
  counterpart_last_read_message_id bigint,
  counterpart_last_read_at timestamptz,
  latest_message_id bigint,
  counterpart_preferred_name text,
  counterpart_headline text,
  counterpart_current_employer text,
  counterpart_current_title text,
  is_connected boolean,
  read_only_reason text,
  connection_state text,
  pending_connection_request_id uuid,
  ask_question text,
  ask_status text,
  ask_outcome_note text,
  counterpart_open_to_help boolean,
  can_request_connection boolean,
  viewer_outcome_share_story boolean,
  viewer_outcome_share_identity boolean,
  outcome_story_eligible boolean,
  outcome_identity_eligible boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select detail.conversation_id, detail.kind, detail.organization_id,
    detail.ask_id, detail.created_at, detail.last_message_at,
    detail.counterpart_user_id, detail.counterpart_display_name,
    detail.counterpart_avatar_path, detail.counterpart_graduation_year,
    detail.can_send, detail.viewer_last_read_message_id,
    detail.viewer_last_read_at, detail.counterpart_last_read_message_id,
    detail.counterpart_last_read_at, detail.latest_message_id,
    detail.counterpart_preferred_name,
    case when private.users_share_active_organization(
      (select auth.uid()), detail.counterpart_user_id
    ) then detail.counterpart_headline end,
    case when private.users_share_active_organization(
      (select auth.uid()), detail.counterpart_user_id
    ) then detail.counterpart_current_employer end,
    case when private.users_share_active_organization(
      (select auth.uid()), detail.counterpart_user_id
    ) then detail.counterpart_current_title end,
    detail.is_connected, detail.read_only_reason, detail.connection_state,
    detail.pending_connection_request_id, detail.ask_question,
    detail.ask_status, detail.ask_outcome_note,
    detail.counterpart_open_to_help, detail.can_request_connection,
    detail.viewer_outcome_share_story, detail.viewer_outcome_share_identity,
    detail.outcome_story_eligible, detail.outcome_identity_eligible
  from private.get_conversation_detail_pre_security_remediation(p_conversation_id) detail;
$$;

grant execute on function api.get_conversation_detail(uuid) to authenticated;
revoke execute on function api.get_conversation_detail(uuid) from public, anon;

create or replace function private.send_message(
  p_conversation_id uuid,
  p_body text,
  p_client_nonce uuid
)
returns table(result_code text, message_id bigint, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_a_id uuid;
  v_user_b_id uuid;
  v_sender_state text;
  v_recipient_state text;
  v_message_id bigint;
  v_created_at timestamptz;
  v_recipient_user_id uuid;
begin
  if p_client_nonce is null
     or char_length(btrim(coalesce(p_body, ''))) not between 1 and 10000 then
    return query select 'invalid_message'::text, null::bigint, null::timestamptz;
    return;
  end if;

  select conversation.user_a_id, conversation.user_b_id
    into v_user_a_id, v_user_b_id
  from public.conversations conversation
  where conversation.id = p_conversation_id;
  if not found or v_user_id not in (v_user_a_id, v_user_b_id) then
    return query select 'not_available'::text, null::bigint, null::timestamptz;
    return;
  end if;

  perform private.lock_user_pair(v_user_a_id, v_user_b_id);

  select conversation.user_a_id, conversation.user_b_id,
         sender.account_state, recipient.account_state,
         case when conversation.user_a_id = v_user_id
           then conversation.user_b_id else conversation.user_a_id end
    into v_user_a_id, v_user_b_id, v_sender_state, v_recipient_state,
         v_recipient_user_id
  from public.conversations conversation
  join public.users sender on sender.id = v_user_id
  join public.users recipient
    on recipient.id = case when conversation.user_a_id = v_user_id
      then conversation.user_b_id else conversation.user_a_id end
  where conversation.id = p_conversation_id
    and v_user_id in (conversation.user_a_id, conversation.user_b_id)
  for update of conversation;

  if not found or v_sender_state <> 'active' or v_recipient_state <> 'active'
     or private.is_blocked(v_user_a_id, v_user_b_id) then
    return query select 'not_available'::text, null::bigint, null::timestamptz;
    return;
  end if;

  if not private.is_connected(v_user_a_id, v_user_b_id)
     and not exists (
       select 1 from public.asks ask
       where ask.conversation_id = p_conversation_id
         and ask.status in ('accepted', 'resolved')
     ) then
    return query select 'connection_required'::text, null::bigint, null::timestamptz;
    return;
  end if;

  select message.id, message.created_at
    into v_message_id, v_created_at
  from public.messages message
  where message.conversation_id = p_conversation_id
    and message.sender_user_id = v_user_id
    and message.client_nonce = p_client_nonce;
  if found then
    return query select 'duplicate'::text, v_message_id, v_created_at;
    return;
  end if;

  if not private.consume_security_budget(
    v_user_id,
    'message_send',
    p_conversation_id::text,
    date_trunc('minute', clock_timestamp()),
    30
  ) then
    return query select 'rate_limited'::text, null::bigint, null::timestamptz;
    return;
  end if;

  insert into public.messages (
    conversation_id, sender_user_id, kind, body, client_nonce
  ) values (
    p_conversation_id, v_user_id, 'user', p_body, p_client_nonce
  )
  returning id, public.messages.created_at into v_message_id, v_created_at;

  perform private.enqueue_outbox(
    'create_notification',
    jsonb_build_object(
      'type', 'message_received', 'recipientUserId', v_recipient_user_id,
      'actorUserId', v_user_id, 'conversationId', p_conversation_id,
      'messageId', v_message_id
    ),
    'message_received:' || v_message_id::text
  );
  return query select 'sent'::text, v_message_id, v_created_at;
end;
$$;

revoke execute on function private.send_message(uuid, text, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Worker-time notification and email authorization
-- ---------------------------------------------------------------------------

create or replace function private.safe_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function private.safe_bigint(p_value text)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::bigint;
exception when invalid_text_representation or numeric_value_out_of_range then
  return null;
end;
$$;

create or replace function private.notification_recipient_is_authorized(
  p_type text,
  p_recipient_user_id uuid,
  p_payload jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ask_id uuid := private.safe_uuid(p_payload ->> 'askId');
  v_offer_id uuid := private.safe_uuid(p_payload ->> 'offerId');
  v_conversation_id uuid := private.safe_uuid(p_payload ->> 'conversationId');
  v_connection_request_id uuid := private.safe_uuid(p_payload ->> 'connectionRequestId');
  v_event_id uuid := private.safe_uuid(p_payload ->> 'eventId');
  v_announcement_id uuid := private.safe_uuid(p_payload ->> 'announcementId');
  v_actor_user_id uuid := private.safe_uuid(p_payload ->> 'actorUserId');
  v_message_id bigint := private.safe_bigint(p_payload ->> 'messageId');
begin
  if p_recipient_user_id is null
     or jsonb_typeof(p_payload) <> 'object'
     or not exists (
       select 1 from public.users account
       where account.id = p_recipient_user_id
         and account.account_state = 'active'
     ) then
    return false;
  end if;

  if p_type in ('connection_requested', 'connection_accepted') then
    return exists (
      select 1
      from public.connection_requests request
      join public.users requester
        on requester.id = request.requester_user_id
       and requester.account_state = 'active'
      join public.users recipient
        on recipient.id = request.recipient_user_id
       and recipient.account_state = 'active'
      join public.organization_memberships requester_membership
        on requester_membership.organization_id = request.origin_organization_id
       and requester_membership.user_id = request.requester_user_id
       and requester_membership.status = 'active'
      join public.organization_memberships recipient_membership
        on recipient_membership.organization_id = request.origin_organization_id
       and recipient_membership.user_id = request.recipient_user_id
       and recipient_membership.status = 'active'
      where request.id = v_connection_request_id
        and not private.is_blocked(request.requester_user_id, request.recipient_user_id)
        and (
          (p_type = 'connection_requested'
            and request.status = 'pending'
            and request.recipient_user_id = p_recipient_user_id
            and v_actor_user_id = request.requester_user_id)
          or
          (p_type = 'connection_accepted'
            and request.status = 'accepted'
            and request.requester_user_id = p_recipient_user_id
            and v_actor_user_id = request.recipient_user_id
            and exists (
              select 1 from public.connections connection
              where connection.user_a_id = least(
                request.requester_user_id, request.recipient_user_id
              )
                and connection.user_b_id = greatest(
                  request.requester_user_id, request.recipient_user_id
                )
            ))
        )
    );
  elsif p_type = 'ask_received' then
    return exists (
      select 1
      from public.asks ask
      join public.organization_memberships recipient
        on recipient.id = ask.recipient_membership_id
       and recipient.status = 'active'
      where ask.id = v_ask_id
        and ask.kind = 'direct'
        and ask.status = 'waiting'
        and recipient.user_id = p_recipient_user_id
        and exists (
          select 1
          from public.organization_memberships asker
          join public.users asker_account
            on asker_account.id = asker.user_id
           and asker_account.account_state = 'active'
          where asker.id = ask.asker_membership_id
            and asker.status = 'active'
            and asker.user_id = v_actor_user_id
            and not private.is_blocked(asker.user_id, recipient.user_id)
        )
    );
  elsif p_type = 'ask_reminder' then
    return exists (
      select 1
      from public.asks ask
      join public.organization_memberships recipient
        on recipient.id = ask.recipient_membership_id
       and recipient.status = 'active'
      where ask.id = v_ask_id
        and ask.kind = 'direct'
        and ask.status = 'waiting'
        and recipient.user_id = p_recipient_user_id
        and exists (
          select 1
          from public.organization_memberships asker
          join public.users asker_account
            on asker_account.id = asker.user_id
           and asker_account.account_state = 'active'
          where asker.id = ask.asker_membership_id
            and asker.status = 'active'
            and asker.user_id = v_actor_user_id
            and not private.is_blocked(asker.user_id, recipient.user_id)
        )
    );
  elsif p_type in (
    'ask_accepted', 'ask_declined', 'ask_closed', 'circle_ask_closed'
  ) then
    return exists (
      select 1
      from public.asks ask
      join public.organization_memberships asker
        on asker.id = ask.asker_membership_id
       and asker.status = 'active'
      where ask.id = v_ask_id
        and asker.user_id = p_recipient_user_id
        and (
          (p_type = 'ask_accepted' and ask.status in ('accepted', 'resolved'))
          or (p_type = 'ask_declined' and ask.status = 'declined')
          or (p_type = 'ask_closed' and ask.kind = 'direct' and ask.status = 'closed')
          or (p_type = 'circle_ask_closed' and ask.kind = 'circle'
            and ask.status = 'closed')
        )
        and (
          p_type in ('ask_closed', 'circle_ask_closed')
            and v_actor_user_id is null
          or p_type in ('ask_accepted', 'ask_declined')
            and exists (
              select 1
              from public.organization_memberships recipient
              join public.users recipient_account
                on recipient_account.id = recipient.user_id
               and recipient_account.account_state = 'active'
              where recipient.id = ask.recipient_membership_id
                and recipient.status = 'active'
                and recipient.user_id = v_actor_user_id
                and not private.is_blocked(asker.user_id, recipient.user_id)
            )
        )
    );
  elsif p_type in ('offer_received') then
    return exists (
      select 1
      from public.ask_offers offer
      join public.asks ask on ask.id = offer.ask_id
      join public.organization_memberships asker
        on asker.id = ask.asker_membership_id
       and asker.status = 'active'
      where offer.id = v_offer_id
        and asker.user_id = p_recipient_user_id
        and offer.status = 'pending'
        and exists (
          select 1
          from public.organization_memberships helper
          join public.users helper_account
            on helper_account.id = helper.user_id
           and helper_account.account_state = 'active'
          where helper.id = offer.helper_membership_id
            and helper.status = 'active'
            and helper.user_id = v_actor_user_id
            and not private.is_blocked(asker.user_id, helper.user_id)
        )
    );
  elsif p_type in ('offer_accepted', 'offer_declined', 'offer_closed') then
    return exists (
      select 1
      from public.ask_offers offer
      join public.organization_memberships helper
        on helper.id = offer.helper_membership_id
       and helper.status = 'active'
      where offer.id = v_offer_id
        and helper.user_id = p_recipient_user_id
        and (
          (p_type = 'offer_accepted' and offer.status = 'accepted')
          or (p_type = 'offer_declined' and offer.status = 'declined')
          or (p_type = 'offer_closed' and offer.status = 'closed')
        )
        and exists (
          select 1
          from public.asks ask
          join public.organization_memberships asker
            on asker.id = ask.asker_membership_id
           and asker.status = 'active'
          join public.users asker_account
            on asker_account.id = asker.user_id
           and asker_account.account_state = 'active'
          where ask.id = offer.ask_id
            and asker.user_id = v_actor_user_id
            and not private.is_blocked(asker.user_id, helper.user_id)
        )
    );
  elsif p_type = 'circle_ask_match' then
    return exists (
      select 1
      from public.asks ask
      join public.organization_memberships helper
        on helper.organization_id = ask.organization_id
       and helper.user_id = p_recipient_user_id
       and helper.status = 'active'
      where ask.id = v_ask_id
        and ask.status = 'open'
        and exists (
          select 1
          from public.organization_memberships asker
          join public.users asker_account
            on asker_account.id = asker.user_id
           and asker_account.account_state = 'active'
          where asker.id = ask.asker_membership_id
            and asker.status = 'active'
            and not private.is_blocked(asker.user_id, helper.user_id)
            and (
              (ask.anonymous_until_accepted and v_actor_user_id is null)
              or (not ask.anonymous_until_accepted
                and asker.user_id = v_actor_user_id)
            )
        )
        and exists (
          select 1 from private.ask_matches match
          where match.ask_id = ask.id
            and match.helper_membership_id = helper.id
        )
    );
  elsif p_type = 'message_received' then
    return exists (
      select 1
      from public.conversations conversation
      join public.users counterpart
        on counterpart.id = case
          when conversation.user_a_id = p_recipient_user_id
            then conversation.user_b_id
          else conversation.user_a_id
        end
       and counterpart.account_state = 'active'
      where conversation.id = v_conversation_id
        and p_recipient_user_id in (
          conversation.user_a_id, conversation.user_b_id
        )
        and not private.is_blocked(
          conversation.user_a_id, conversation.user_b_id
        )
        and v_actor_user_id = case
          when conversation.user_a_id = p_recipient_user_id
            then conversation.user_b_id
          else conversation.user_a_id
        end
        and exists (
          select 1
          from public.messages message
          where message.id = v_message_id
            and message.conversation_id = conversation.id
            and message.sender_user_id = v_actor_user_id
            and message.kind = 'user'
        )
        and (
          private.is_connected(conversation.user_a_id, conversation.user_b_id)
          or exists (
            select 1 from public.asks ask
            where ask.conversation_id = conversation.id
              and ask.status in ('accepted', 'resolved')
          )
        )
    );
  elsif p_type in (
    'event_changed', 'event_cancelled', 'event_reminder',
    'event_waitlist_spot_opened'
  ) then
    return exists (
      select 1
      from public.events event
      join public.organization_memberships membership
        on membership.organization_id = event.organization_id
       and membership.user_id = p_recipient_user_id
       and membership.status = 'active'
      where event.id = v_event_id
        and (
          (p_type = 'event_changed' and event.status = 'published' and exists (
            select 1 from public.event_rsvps rsvp
            where rsvp.event_id = event.id
              and rsvp.organization_membership_id = membership.id
              and rsvp.status in ('going', 'waitlisted', 'offered')
          ))
          or (p_type = 'event_cancelled' and event.status = 'cancelled' and exists (
            select 1 from public.event_rsvps rsvp
            where rsvp.event_id = event.id
              and rsvp.organization_membership_id = membership.id
              and rsvp.status in ('going', 'waitlisted', 'offered')
          ))
          or (p_type = 'event_reminder'
            and event.status = 'published'
            and event.starts_at > now()
            and exists (
            select 1 from public.event_rsvps rsvp
            where rsvp.event_id = event.id
              and rsvp.organization_membership_id = membership.id
              and rsvp.status = 'going'
          ))
          or (p_type = 'event_waitlist_spot_opened'
            and event.status = 'published'
            and event.starts_at > now()
            and exists (
            select 1 from public.event_rsvps rsvp
            where rsvp.event_id = event.id
              and rsvp.organization_membership_id = membership.id
              and rsvp.status = 'offered'
              and rsvp.offer_expires_at > now()
          ))
        )
    );
  elsif p_type = 'announcement_published' then
    return exists (
      select 1
      from public.announcements announcement
      join public.organization_memberships membership
        on membership.organization_id = announcement.organization_id
       and membership.user_id = p_recipient_user_id
       and membership.status = 'active'
      where announcement.id = v_announcement_id
        and announcement.status = 'published'
    );
  end if;

  return false;
end;
$$;

revoke execute on function private.safe_uuid(text)
  from public, anon, authenticated;
revoke execute on function private.safe_bigint(text)
  from public, anon, authenticated;
revoke execute on function private.notification_recipient_is_authorized(
  text, uuid, jsonb
) from public, anon, authenticated;

alter function private.materialize_notification_job(bigint, text)
  rename to materialize_notification_job_pre_security_remediation;
revoke execute on function private.materialize_notification_job_pre_security_remediation(
  bigint, text
) from public, anon, authenticated, service_role;

create or replace function private.materialize_notification_job(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  result_code text,
  notification_id bigint,
  email_job_id bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.outbox_jobs%rowtype;
  v_recipient_user_id uuid;
  v_result record;
begin
  select * into v_job
  from private.outbox_jobs job
  where job.id = p_job_id
    and job.job_type = 'create_notification'
    and job.status = 'processing'
    and job.locked_by = p_worker_id
  for update;
  if not found then
    return query select 'not_available'::text, null::bigint, null::bigint;
    return;
  end if;

  v_recipient_user_id := private.safe_uuid(v_job.payload ->> 'recipientUserId');
  if not private.notification_recipient_is_authorized(
    v_job.payload ->> 'type', v_recipient_user_id, v_job.payload
  ) then
    return query select 'not_available'::text, null::bigint, null::bigint;
    return;
  end if;

  select * into v_result
  from private.materialize_notification_job_pre_security_remediation(
    p_job_id, p_worker_id
  );
  if v_result.email_job_id is not null and v_job.payload ? 'messageId' then
    update private.outbox_jobs email_job
    set payload = email_job.payload || jsonb_build_object(
      'messageId', v_job.payload -> 'messageId'
    )
    where email_job.id = v_result.email_job_id
      and email_job.job_type = 'send_email';
  end if;
  return query select v_result.result_code::text,
    v_result.notification_id::bigint, v_result.email_job_id::bigint;
end;
$$;

revoke execute on function private.materialize_notification_job(bigint, text)
  from public, anon, authenticated;

alter function private.get_outbox_email_context(bigint, text)
  rename to get_outbox_email_context_pre_security_remediation;
revoke execute on function private.get_outbox_email_context_pre_security_remediation(
  bigint, text
) from public, anon, authenticated, service_role;

create or replace function private.get_outbox_email_context(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  job_id bigint,
  notification_type text,
  recipient_user_id uuid,
  recipient_email text,
  recipient_display_name text,
  actor_display_name text,
  target_type text,
  target_id text,
  idempotency_key text,
  provider_result_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  select context.job_id, context.notification_type,
    context.recipient_user_id, context.recipient_email,
    context.recipient_display_name, context.actor_display_name,
    context.target_type, context.target_id, context.idempotency_key,
    context.provider_result_id
  from private.get_outbox_email_context_pre_security_remediation(
    p_job_id, p_worker_id
  ) context
  join private.outbox_jobs job on job.id = context.job_id
  where private.notification_recipient_is_authorized(
    context.notification_type, context.recipient_user_id, job.payload
  );
$$;

revoke execute on function private.get_outbox_email_context(bigint, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profile import replay, bounds, reuse, and provider budgets
-- ---------------------------------------------------------------------------

create or replace function private.profile_import_attempts_are_bounded(p_attempts jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_attempt jsonb;
begin
  if p_attempts is null
     or jsonb_typeof(p_attempts) <> 'array'
     or jsonb_array_length(p_attempts) > 12
     or pg_catalog.octet_length(p_attempts::text) > 65536 then
    return false;
  end if;
  for v_attempt in select value from jsonb_array_elements(p_attempts)
  loop
    if jsonb_typeof(v_attempt) <> 'object'
       or coalesce(v_attempt ->> 'provider', '') not in ('linkdapi', 'brightdata', 'pdl')
       or coalesce(v_attempt ->> 'purpose', '') not in (
         'onboarding_import', 'fallback_verification'
       )
       or coalesce(v_attempt ->> 'status', '') not in (
         'succeeded', 'no_match', 'failed'
       )
       or coalesce(v_attempt ->> 'costUnits', '') !~ '^[0-9]{1,9}$'
       or coalesce(char_length(v_attempt ->> 'fingerprint'), 0) > 500
       or coalesce(char_length(v_attempt ->> 'error'), 0) > 1000 then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

revoke execute on function private.profile_import_attempts_are_bounded(jsonb)
  from public, anon, authenticated;

alter function private.begin_profile_import(uuid, uuid, text, text)
  rename to begin_profile_import_pre_security_remediation;
revoke execute on function private.begin_profile_import_pre_security_remediation(
  uuid, uuid, text, text
) from public, anon, authenticated, service_role;

create or replace function private.begin_profile_import(
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
  v_hash bytea;
  v_existing private.profile_import_requests%rowtype;
  v_limit integer;
begin
  if v_user_id is null or p_client_request_id is null
     or p_source is null
     or p_source not in ('linkedin', 'resume')
     or nullif(btrim(p_source_key), '') is null
     or char_length(p_source_key) > 1000 then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;
  if not exists (
    select 1
    from public.organization_memberships membership
    join public.users account
      on account.id = membership.user_id
     and account.account_state = 'active'
    where membership.id = p_membership_id
      and membership.user_id = v_user_id
      and membership.status in ('active', 'pending')
  ) then
    return query select 'not_available'::text, null::uuid, null::uuid;
    return;
  end if;

  v_hash := extensions.digest(btrim(p_source_key), 'sha256');
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'profile_import:' || v_user_id::text || ':' || p_source,
      0
    )
  );

  select * into v_existing
  from private.profile_import_requests request
  where request.user_id = v_user_id
    and request.client_request_id = p_client_request_id
  for update;
  if found then
    if v_existing.source <> p_source or v_existing.source_key_hash <> v_hash then
      return query select 'idempotency_conflict'::text,
        v_existing.id, v_existing.proposal_id;
      return;
    elsif v_existing.status = 'ready' and exists (
      select 1
      from private.profile_change_proposals proposal
      where proposal.id = v_existing.proposal_id
        and proposal.user_id = v_user_id
        and proposal.status = 'pending'
        and proposal.expires_at > now()
    ) then
      return query select 'existing'::text,
        v_existing.id, v_existing.proposal_id;
      return;
    elsif v_existing.status = 'processing'
      and v_existing.updated_at > now() - interval '2 minutes' then
      return query select 'in_progress'::text,
        v_existing.id, v_existing.proposal_id;
      return;
    elsif v_existing.status = 'ready' then
      update private.profile_import_requests
      set status = 'failed', proposal_id = null,
          last_error_code = 'proposal_unavailable', updated_at = now()
      where id = v_existing.id;
      v_existing.status := 'failed';
    end if;
  end if;

  select * into v_existing
  from private.profile_import_requests request
  where request.user_id = v_user_id
    and request.organization_membership_id = p_membership_id
    and request.source = p_source
    and request.source_key_hash = v_hash
    and (
      (request.status = 'ready' and exists (
        select 1
        from private.profile_change_proposals proposal
        where proposal.id = request.proposal_id
          and proposal.user_id = v_user_id
          and proposal.status = 'pending'
          and proposal.expires_at > now()
      ))
      or
      (request.status = 'processing'
        and request.updated_at > now() - interval '15 minutes')
    )
  order by request.updated_at desc, request.id
  limit 1
  for update;
  if found then
    return query select
      case when v_existing.status = 'ready' then 'existing' else 'in_progress' end,
      v_existing.id,
      v_existing.proposal_id;
    return;
  end if;

  v_limit := case when p_source = 'linkedin' then 3 else 5 end;
  if not private.consume_security_budget(
    v_user_id,
    case when p_source = 'linkedin' then 'linkedin_import' else 'resume_import' end,
    '',
    date_trunc('hour', clock_timestamp()),
    v_limit
  ) then
    return query select 'limited'::text, null::uuid, null::uuid;
    return;
  end if;

  return query
  select original.result_code, original.request_id, original.proposal_id
  from private.begin_profile_import_pre_security_remediation(
    p_membership_id, p_client_request_id, p_source, p_source_key
  ) original;
end;
$$;

revoke execute on function private.begin_profile_import(uuid, uuid, text, text)
  from public, anon, authenticated;

alter function private.finish_profile_import(
  uuid, jsonb, jsonb, text, jsonb, jsonb, numeric
) rename to finish_profile_import_pre_security_remediation;
revoke execute on function private.finish_profile_import_pre_security_remediation(
  uuid, jsonb, jsonb, text, jsonb, jsonb, numeric
) from public, anon, authenticated, service_role;

create or replace function private.finish_profile_import(
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
begin
  if not exists (
    select 1
    from private.profile_import_requests request
    join public.organization_memberships membership
      on membership.id = request.organization_membership_id
     and membership.user_id = request.user_id
     and membership.status in ('active', 'pending')
    join public.users account
      on account.id = request.user_id
     and account.account_state = 'active'
    where request.id = p_request_id
      and request.user_id = (select auth.uid())
  ) then
    return query select 'not_owned'::text, null::uuid;
    return;
  end if;
  if p_source is null
     or p_source not in ('linkdapi', 'brightdata', 'pdl', 'resume')
     or p_current_snapshot is null
     or jsonb_typeof(p_current_snapshot) <> 'object'
     or p_proposed_snapshot is null
     or jsonb_typeof(p_proposed_snapshot) <> 'object'
     or jsonb_typeof(coalesce(p_source_metadata, '{}'::jsonb)) <> 'object'
     or p_confidence is null
     or p_confidence not between 0 and 1
     or not private.profile_import_attempts_are_bounded(
    coalesce(p_attempts, '[]'::jsonb)
  )
     or pg_catalog.octet_length(coalesce(p_current_snapshot, '{}'::jsonb)::text) > 131072
     or pg_catalog.octet_length(coalesce(p_proposed_snapshot, '{}'::jsonb)::text) > 131072
     or pg_catalog.octet_length(coalesce(p_source_metadata, '{}'::jsonb)::text) > 32768 then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  return query
  select finished.result_code, finished.proposal_id
  from private.finish_profile_import_pre_security_remediation(
    p_request_id, p_current_snapshot, p_proposed_snapshot, p_source,
    p_source_metadata, p_attempts, p_confidence
  ) finished;
end;
$$;

revoke execute on function private.finish_profile_import(
  uuid, jsonb, jsonb, text, jsonb, jsonb, numeric
) from public, anon, authenticated;

alter function private.fail_profile_import(uuid, text, jsonb)
  rename to fail_profile_import_pre_security_remediation;
revoke execute on function private.fail_profile_import_pre_security_remediation(
  uuid, text, jsonb
) from public, anon, authenticated, service_role;

create or replace function private.fail_profile_import(
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
  v_status text;
begin
  select request.status into v_status
  from private.profile_import_requests request
  where request.id = p_request_id
    and request.user_id = (select auth.uid())
  for update;
  if not found then return 'not_owned'; end if;
  if v_status <> 'processing' then return 'not_processing'; end if;
  if nullif(btrim(p_error_code), '') is null
     or char_length(p_error_code) > 100
     or not private.profile_import_attempts_are_bounded(
       coalesce(p_attempts, '[]'::jsonb)
     ) then
    return 'invalid_input';
  end if;
  return private.fail_profile_import_pre_security_remediation(
    p_request_id, p_error_code, p_attempts
  );
end;
$$;

revoke execute on function private.fail_profile_import(uuid, text, jsonb)
  from public, anon, authenticated;

-- Interactive candidate search consumes its provider budget only after the
-- permission-gated lexical query has returned at least one candidate.
alter table private.help_ai_usage_windows
  drop constraint help_ai_usage_action_check;
alter table private.help_ai_usage_windows
  add constraint help_ai_usage_action_check check (action in (
    'ask_draft', 'offer_note', 'match_explanation', 'decline_note',
    'candidate_search'
  ));

create or replace function api.consume_help_ai_budget(p_action text)
returns table (
  result_code text,
  remaining integer,
  resets_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_window_started_at timestamptz := date_trunc('hour', now());
  v_limit integer;
  v_count integer;
begin
  v_limit := case p_action
    when 'ask_draft' then 12
    when 'offer_note' then 20
    when 'match_explanation' then 20
    when 'decline_note' then 20
    when 'candidate_search' then 10
    else null
  end;
  if v_limit is null or v_user_id is null
     or not exists (
       select 1 from public.users account
       where account.id = v_user_id and account.account_state = 'active'
     ) then
    return query select 'not_available'::text, 0,
      v_window_started_at + interval '1 hour';
    return;
  end if;

  insert into private.help_ai_usage_windows (
    user_id, action, window_started_at, request_count
  ) values (
    v_user_id, p_action, v_window_started_at, 1
  )
  on conflict (user_id, action, window_started_at) do update
    set request_count = private.help_ai_usage_windows.request_count + 1,
        updated_at = now()
    where private.help_ai_usage_windows.request_count < v_limit
  returning request_count into v_count;

  if v_count is null then
    return query select 'limited'::text, 0,
      v_window_started_at + interval '1 hour';
  else
    return query select 'allowed'::text, greatest(v_limit - v_count, 0),
      v_window_started_at + interval '1 hour';
  end if;
end;
$$;

grant execute on function api.consume_help_ai_budget(text) to authenticated;
revoke execute on function api.consume_help_ai_budget(text) from public, anon;

-- ---------------------------------------------------------------------------
-- Profile indexing semantic coalescing and provider budget
-- ---------------------------------------------------------------------------

alter table private.profile_embedding_status
  add column last_source_fingerprint text,
  add column processing_source_fingerprint text,
  add column processing_job_id bigint,
  add constraint profile_embedding_status_last_source_fingerprint_check
    check (last_source_fingerprint is null
      or last_source_fingerprint ~ '^[0-9a-f]{64}$'),
  add constraint profile_embedding_status_processing_source_fingerprint_check
    check (processing_source_fingerprint is null
      or processing_source_fingerprint ~ '^[0-9a-f]{64}$'),
  add constraint profile_embedding_status_processing_pair_check
    check ((processing_source_fingerprint is null) = (processing_job_id is null));

create or replace function private.begin_profile_index_attempt(
  p_job_id bigint,
  p_worker_id text,
  p_source_fingerprint text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership public.organization_memberships%rowtype;
  v_status private.profile_embedding_status%rowtype;
begin
  if p_source_fingerprint is null
     or p_source_fingerprint !~ '^[0-9a-f]{64}$' then
    return 'invalid_input';
  end if;

  select membership.* into v_membership
  from private.outbox_jobs job
  join public.organization_memberships membership
    on membership.id::text = job.payload ->> 'membershipId'
   and membership.organization_id::text = job.payload ->> 'organizationId'
   and membership.user_id::text = job.payload ->> 'userId'
   and membership.status = 'active'
  join public.users account
    on account.id = membership.user_id
   and account.account_state = 'active'
  where job.id = p_job_id
    and job.job_type = 'index_profile'
    and job.status = 'processing'
    and job.locked_by = p_worker_id;
  if not found then return 'not_available'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'profile_index_attempt:' || v_membership.id::text,
      0
    )
  );

  if not exists (
    select 1
    from private.outbox_jobs job
    join public.organization_memberships membership
      on membership.id = v_membership.id
     and membership.id::text = job.payload ->> 'membershipId'
     and membership.organization_id::text = job.payload ->> 'organizationId'
     and membership.user_id::text = job.payload ->> 'userId'
     and membership.status = 'active'
    join public.users account
      on account.id = membership.user_id
     and account.account_state = 'active'
    where job.id = p_job_id
      and job.job_type = 'index_profile'
      and job.status = 'processing'
      and job.locked_by = p_worker_id
  ) then
    return 'not_available';
  end if;

  select * into v_status
  from private.profile_embedding_status status
  where status.organization_membership_id = v_membership.id
  for update;
  if not found then return 'not_available'; end if;

  if v_status.last_source_fingerprint = p_source_fingerprint then
    update private.profile_embedding_status
    set status = 'ready', dirty_reason = null, dirty_since = null,
        locked_at = null, locked_by = null,
        processing_source_fingerprint = null, processing_job_id = null,
        last_error = null
    where organization_membership_id = v_membership.id;
    return 'unchanged';
  end if;

  if v_status.processing_job_id is not null
     and v_status.processing_job_id <> p_job_id
     and v_status.locked_at > now() - interval '15 minutes' then
    return case
      when v_status.processing_source_fingerprint = p_source_fingerprint
        then 'coalesced'
      else 'busy'
    end;
  end if;

  if not private.consume_security_budget(
    v_membership.user_id,
    'profile_index',
    v_membership.id::text,
    date_trunc('hour', clock_timestamp()),
    6
  ) then
    return 'limited';
  end if;

  if v_status.processing_job_id = p_job_id
     and v_status.processing_source_fingerprint = p_source_fingerprint then
    update private.profile_embedding_status
    set locked_at = now(), locked_by = p_worker_id
    where organization_membership_id = v_membership.id;
    return 'allowed';
  end if;

  update private.profile_embedding_status
  set status = 'indexing', locked_at = now(), locked_by = p_worker_id,
      processing_source_fingerprint = p_source_fingerprint,
      processing_job_id = p_job_id, last_error = null
  where organization_membership_id = v_membership.id;
  return 'allowed';
end;
$$;

alter function private.sync_profile_index(bigint, text, text[], jsonb)
  rename to sync_profile_index_pre_security_remediation;
revoke execute on function private.sync_profile_index_pre_security_remediation(
  bigint, text, text[], jsonb
) from public, anon, authenticated, service_role;

create or replace function private.sync_profile_index(
  p_job_id bigint,
  p_worker_id text,
  p_desired_fingerprints text[],
  p_new_chunks jsonb
)
returns table(result_code text, chunk_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result record;
  v_membership_id uuid;
  v_processing_source_fingerprint text;
begin
  select private.safe_uuid(job.payload ->> 'membershipId')
    into v_membership_id
  from private.outbox_jobs job
  where job.id = p_job_id
    and job.job_type = 'index_profile'
    and job.status = 'processing'
    and job.locked_by = p_worker_id;
  if v_membership_id is null then
    return query select 'not_available'::text, 0;
    return;
  end if;

  select status.processing_source_fingerprint
    into v_processing_source_fingerprint
  from private.profile_embedding_status status
  where status.organization_membership_id = v_membership_id
    and status.processing_job_id = p_job_id
    and status.locked_by = p_worker_id
    and status.processing_source_fingerprint is not null
  for update;
  if not found then
    return query select 'not_available'::text, 0;
    return;
  end if;

  select * into v_result
  from private.sync_profile_index_pre_security_remediation(
    p_job_id, p_worker_id, p_desired_fingerprints, p_new_chunks
  );

  if v_result.result_code = 'synced' then
    update private.profile_embedding_status
    set last_source_fingerprint = v_processing_source_fingerprint,
        processing_source_fingerprint = null,
        processing_job_id = null,
        locked_at = null,
        locked_by = null
    where organization_membership_id = v_membership_id
      and processing_job_id = p_job_id
      and processing_source_fingerprint = v_processing_source_fingerprint;
  end if;

  return query select v_result.result_code::text, v_result.chunk_count::integer;
end;
$$;

create or replace function api.begin_profile_index_attempt(
  p_job_id bigint,
  p_worker_id text,
  p_source_fingerprint text
)
returns text
language sql
security definer
set search_path = ''
as $$
  select private.begin_profile_index_attempt(
    p_job_id, p_worker_id, p_source_fingerprint
  );
$$;

revoke execute on function private.begin_profile_index_attempt(bigint, text, text)
  from public, anon, authenticated;
revoke execute on function private.sync_profile_index(bigint, text, text[], jsonb)
  from public, anon, authenticated;
revoke execute on function api.begin_profile_index_attempt(bigint, text, text)
  from public, anon, authenticated;
grant execute on function api.begin_profile_index_attempt(bigint, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- Canonical invite email validation
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from public.invites invite
    where invite.email_normalized !~
      '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:[.][A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$'
  ) then
    raise exception using errcode = '23514',
      message = 'invite_email_constraint_preflight_failed';
  end if;
end;
$$;

alter table public.invites
  add constraint invites_email_format_check check (
    email_normalized ~
      '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:[.][A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$'
  ) not valid;
alter table public.invites validate constraint invites_email_format_check;

alter function private.issue_invite(uuid, text, text, smallint, uuid)
  rename to issue_invite_pre_security_remediation;
revoke execute on function private.issue_invite_pre_security_remediation(
  uuid, text, text, smallint, uuid
) from public, anon, authenticated, service_role;

create or replace function private.issue_invite(
  p_organization_id uuid,
  p_email text,
  p_full_name text,
  p_graduation_year smallint,
  p_request_id uuid
)
returns table(
  result_code text,
  invite_id uuid,
  invite_status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_email !~
    '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:[.][A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$'
  then
    return query select 'invalid_input'::text, null::uuid,
      null::text, null::timestamptz;
    return;
  end if;

  return query
  select issued.result_code, issued.invite_id, issued.invite_status,
         issued.expires_at
  from private.issue_invite_pre_security_remediation(
    p_organization_id, v_email, p_full_name, p_graduation_year, p_request_id
  ) issued;
end;
$$;

revoke execute on function private.issue_invite(
  uuid, text, text, smallint, uuid
) from public, anon, authenticated;

-- Reassert exact public RPC boundaries after replacing private functions.
create or replace function api.send_message(
  p_conversation_id uuid,
  p_body text,
  p_client_nonce uuid
)
returns table(result_code text, message_id bigint, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result record;
  v_user_a_id uuid;
  v_user_b_id uuid;
begin
  select * into v_result
  from private.send_message(p_conversation_id, p_body, p_client_nonce);

  if v_result.result_code = 'sent' then
    select conversation.user_a_id, conversation.user_b_id
      into v_user_a_id, v_user_b_id
    from public.conversations conversation
    where conversation.id = p_conversation_id;
    perform private.broadcast_user_control_event(
      v_user_a_id, 'messages.changed',
      jsonb_build_object('conversationId', p_conversation_id)
    );
    perform private.broadcast_user_control_event(
      v_user_b_id, 'messages.changed',
      jsonb_build_object('conversationId', p_conversation_id)
    );
  end if;

  return query select v_result.result_code::text,
    v_result.message_id::bigint, v_result.created_at::timestamptz;
end;
$$;

grant execute on function api.send_message(uuid, text, uuid) to authenticated;
revoke execute on function api.send_message(uuid, text, uuid) from public, anon;

create or replace function api.publish_admin_school_announcement(
  p_membership_id uuid,
  p_title text,
  p_body text,
  p_tag text,
  p_pinned boolean default false
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.publish_admin_school_announcement(
    p_membership_id, p_title, p_body, p_tag, p_pinned
  );
$$;

create or replace function api.materialize_notification_job(
  p_job_id bigint,
  p_worker_id text
)
returns table(
  result_code text,
  notification_id bigint,
  email_job_id bigint
)
language sql
security definer
set search_path = ''
as $$
  select * from private.materialize_notification_job(p_job_id, p_worker_id);
$$;

create or replace function api.get_outbox_email_context(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  job_id bigint,
  notification_type text,
  recipient_user_id uuid,
  recipient_email text,
  recipient_display_name text,
  actor_display_name text,
  target_type text,
  target_id text,
  idempotency_key text,
  provider_result_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from private.get_outbox_email_context(p_job_id, p_worker_id);
$$;

create or replace function api.begin_profile_import(
  p_membership_id uuid,
  p_client_request_id uuid,
  p_source text,
  p_source_key text
)
returns table(result_code text, request_id uuid, proposal_id uuid)
language sql
security definer
set search_path = ''
as $$
  select * from private.begin_profile_import(
    p_membership_id, p_client_request_id, p_source, p_source_key
  );
$$;

create or replace function api.finish_profile_import(
  p_request_id uuid,
  p_current_snapshot jsonb,
  p_proposed_snapshot jsonb,
  p_source text,
  p_source_metadata jsonb,
  p_attempts jsonb,
  p_confidence numeric
)
returns table(result_code text, proposal_id uuid)
language sql
security definer
set search_path = ''
as $$
  select * from private.finish_profile_import(
    p_request_id, p_current_snapshot, p_proposed_snapshot, p_source,
    p_source_metadata, p_attempts, p_confidence
  );
$$;

create or replace function api.fail_profile_import(
  p_request_id uuid,
  p_error_code text,
  p_attempts jsonb
)
returns text
language sql
security definer
set search_path = ''
as $$
  select private.fail_profile_import(p_request_id, p_error_code, p_attempts);
$$;

create or replace function api.sync_profile_index(
  p_job_id bigint,
  p_worker_id text,
  p_desired_fingerprints text[],
  p_new_chunks jsonb
)
returns table(result_code text, chunk_count integer)
language sql
security definer
set search_path = ''
as $$
  select * from private.sync_profile_index(
    p_job_id, p_worker_id, p_desired_fingerprints, p_new_chunks
  );
$$;

create or replace function api.issue_invite(
  p_organization_id uuid,
  p_email text,
  p_full_name text,
  p_graduation_year smallint,
  p_request_id uuid
)
returns table(
  result_code text,
  invite_id uuid,
  invite_status text,
  expires_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select * from private.issue_invite(
    p_organization_id, p_email, p_full_name, p_graduation_year, p_request_id
  );
$$;

revoke execute on function api.publish_admin_school_announcement(
  uuid, text, text, text, boolean
) from public, anon;
grant execute on function api.publish_admin_school_announcement(
  uuid, text, text, text, boolean
) to authenticated;

revoke execute on function api.materialize_notification_job(bigint, text)
  from public, anon, authenticated;
revoke execute on function api.get_outbox_email_context(bigint, text)
  from public, anon, authenticated;
revoke execute on function api.sync_profile_index(bigint, text, text[], jsonb)
  from public, anon, authenticated;
grant execute on function api.materialize_notification_job(bigint, text)
  to service_role;
grant execute on function api.get_outbox_email_context(bigint, text)
  to service_role;
grant execute on function api.sync_profile_index(bigint, text, text[], jsonb)
  to service_role;

revoke execute on function api.begin_profile_import(uuid, uuid, text, text)
  from public, anon;
revoke execute on function api.finish_profile_import(
  uuid, jsonb, jsonb, text, jsonb, jsonb, numeric
) from public, anon;
revoke execute on function api.fail_profile_import(uuid, text, jsonb)
  from public, anon;
revoke execute on function api.issue_invite(uuid, text, text, smallint, uuid)
  from public, anon;
grant execute on function api.begin_profile_import(uuid, uuid, text, text)
  to authenticated;
grant execute on function api.finish_profile_import(
  uuid, jsonb, jsonb, text, jsonb, jsonb, numeric
) to authenticated;
grant execute on function api.fail_profile_import(uuid, text, jsonb)
  to authenticated;
grant execute on function api.issue_invite(uuid, text, text, smallint, uuid)
  to authenticated;

-- Create the decision guards last so their table locks are held for the
-- shortest possible portion of the migration transaction.
drop trigger if exists asks_enforce_current_decision_membership on public.asks;
create trigger asks_enforce_current_decision_membership
  before update of status on public.asks
  for each row execute function private.enforce_current_help_decision_membership();

drop trigger if exists ask_offers_enforce_current_decision_membership on public.ask_offers;
create trigger ask_offers_enforce_current_decision_membership
  before update of status on public.ask_offers
  for each row execute function private.enforce_current_help_decision_membership();
