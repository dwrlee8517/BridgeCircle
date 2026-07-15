-- Complete the helper-response contract for the database-v2 Help slice.
-- Public organization-reach Asks are browseable by design, so eligible active
-- helpers must be able to offer on them through the same transaction as
-- private matched Asks. Helper replies also receive their own bounded AI
-- assistance action instead of borrowing the asker-draft prompt and budget.

alter table private.help_ai_usage_windows
  drop constraint help_ai_usage_action_check;

alter table private.help_ai_usage_windows
  add constraint help_ai_usage_action_check
  check (action in ('ask_draft', 'offer_note', 'match_explanation', 'decline_note'));

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
    else null
  end;
  if v_limit is null or v_user_id is null
     or not exists (
       select 1 from public.users u
       where u.id = v_user_id and u.account_state = 'active'
     ) then
    return query select 'not_available'::text, 0, v_window_started_at + interval '1 hour';
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
    return query select 'limited'::text, 0, v_window_started_at + interval '1 hour';
  else
    return query select 'allowed'::text, greatest(v_limit - v_count, 0),
      v_window_started_at + interval '1 hour';
  end if;
end;
$$;

create or replace function private.offer_to_help(
  p_ask_id uuid,
  p_helper_membership_id uuid,
  p_offer_note text,
  p_client_request_id uuid
)
returns table (
  offer_id uuid,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask public.asks%rowtype;
  v_existing public.ask_offers%rowtype;
  v_asker_user_id uuid;
  v_helper_user_id uuid;
  v_offer_id uuid;
  v_offer_note text := btrim(coalesce(p_offer_note, ''));
begin
  if p_ask_id is null
     or p_helper_membership_id is null
     or p_client_request_id is null
     or char_length(v_offer_note) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'invalid_offer_input';
  end if;

  select * into v_ask from public.asks where id = p_ask_id for share;
  if not found
     or v_ask.kind <> 'circle'
     or v_ask.status <> 'open'
     or v_ask.reach not in ('matched', 'organization') then
    raise exception using errcode = '22023', message = 'circle_ask_not_open';
  end if;
  if not private.owns_membership(p_helper_membership_id, v_ask.organization_id) then
    raise exception using errcode = '42501', message = 'helper_membership_not_owned';
  end if;
  if not private.can_view_ask(p_ask_id) then
    raise exception using errcode = '42501', message = 'ask_not_visible';
  end if;

  select asker.user_id, helper.user_id
    into v_asker_user_id, v_helper_user_id
  from public.organization_memberships asker
  join public.organization_memberships helper on helper.id = p_helper_membership_id
  join public.helper_preferences hp
    on hp.organization_membership_id = helper.id
   and hp.open_to_help = true and hp.paused_at is null
  where asker.id = v_ask.asker_membership_id;

  if v_helper_user_id is null or private.is_blocked(v_asker_user_id, v_helper_user_id) then
    raise exception using errcode = '42501', message = 'offer_not_allowed';
  end if;

  perform pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'help:offer-helper:' || p_helper_membership_id::text,
      0
    )
  );

  select * into v_existing
  from public.ask_offers
  where helper_membership_id = p_helper_membership_id
    and client_request_id = p_client_request_id;
  if v_existing.id is not null then
    if v_existing.ask_id = p_ask_id and v_existing.offer_note = v_offer_note then
      return query select v_existing.id, false;
      return;
    end if;
    raise exception using errcode = 'P0001', message = 'idempotency_conflict';
  end if;

  select * into v_existing
  from public.ask_offers
  where ask_id = p_ask_id
    and helper_membership_id = p_helper_membership_id;
  if v_existing.id is not null then
    return query select v_existing.id, false;
    return;
  end if;

  insert into public.ask_offers (
    organization_id, ask_id, helper_membership_id, offer_note, client_request_id
  ) values (
    v_ask.organization_id, p_ask_id, p_helper_membership_id,
    v_offer_note, p_client_request_id
  ) returning id into v_offer_id;

  insert into private.ask_events (
    ask_id, organization_id, actor_user_id, event_type,
    payload
  ) values (
    p_ask_id, v_ask.organization_id, v_helper_user_id, 'offer_created',
    jsonb_build_object('offerId', v_offer_id)
  );

  perform private.enqueue_outbox(
    'create_notification',
    jsonb_build_object(
      'type', 'offer_received', 'recipientUserId', v_asker_user_id,
      'actorUserId', v_helper_user_id, 'askId', p_ask_id,
      'offerId', v_offer_id
    ),
    'offer_received:' || v_offer_id::text
  );
  perform private.broadcast_help_change(p_ask_id, v_offer_id);
  return query select v_offer_id, true;
end;
$$;
