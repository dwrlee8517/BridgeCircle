-- Database v2 Messages vertical slice: fixed inbox projections, stable
-- Connection commands, owner-topic invalidations, and shell attention.

-- Serialize every mutation for an unordered user pair on one transaction-
-- scoped key. The v2 baseline used SELECT FOR UPDATE on the RLS-protected
-- users table; under the authenticated role that path can crash the local
-- Supabase Postgres build. Pair state is the resource being protected, so a
-- canonical advisory lock is also the narrower lock and avoids blocking
-- unrelated profile/account writes.
create or replace function private.lock_user_pair(p_user_a_id uuid, p_user_b_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locked_count integer;
  v_pair_key bigint;
begin
  if p_user_a_id is null or p_user_b_id is null or p_user_a_id = p_user_b_id then
    raise exception using errcode = '22023', message = 'invalid_user_pair';
  end if;

  v_pair_key := pg_catalog.hashtextextended(
    least(p_user_a_id, p_user_b_id)::text || ':' ||
      greatest(p_user_a_id, p_user_b_id)::text,
    0
  );
  perform pg_catalog.pg_advisory_xact_lock(v_pair_key);

  select count(*)::integer into v_locked_count
  from public.users user_account
  where user_account.id in (p_user_a_id, p_user_b_id);

  if v_locked_count <> 2 then
    raise exception using errcode = 'P0002', message = 'user_pair_not_found';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Canonical conversation and Waiting projections
-- ---------------------------------------------------------------------------

create function private.get_conversation_summary_base()
returns table (
  conversation_id uuid,
  conversation_kind text,
  organization_id uuid,
  ask_id uuid,
  counterpart_user_id uuid,
  counterpart_display_name text,
  counterpart_preferred_name text,
  counterpart_avatar_path text,
  counterpart_graduation_year smallint,
  is_connected boolean,
  can_send boolean,
  read_only_reason text,
  ask_question text,
  ask_status text,
  latest_message_id bigint,
  latest_message_kind text,
  latest_sender_user_id uuid,
  latest_body text,
  latest_created_at timestamptz,
  unread_count integer,
  needs_reply boolean,
  priority_tier smallint,
  activity_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with participant as (
    select c.*
    from public.conversations c
    where c.user_a_id = (select auth.uid())

    union all

    select c.*
    from public.conversations c
    where c.user_b_id = (select auth.uid())
  ), enriched as (
    select
      c.id as conversation_id,
      case when ask.id is null then 'direct' else 'ask' end as conversation_kind,
      ask.organization_id,
      ask.id as ask_id,
      c.created_at,
      counterpart.id as counterpart_user_id,
      counterpart.account_state as counterpart_account_state,
      case
        when counterpart.account_state = 'active'
          then coalesce(nullif(profile.preferred_name, ''), profile.display_name, 'Member')
        else 'Deleted member'
      end as counterpart_display_name,
      case when counterpart.account_state = 'active' then profile.preferred_name end
        as counterpart_preferred_name,
      case when counterpart.account_state = 'active' then profile.avatar_path end
        as counterpart_avatar_path,
      case when counterpart.account_state = 'active' then class_year.graduation_year end
        as counterpart_graduation_year,
      private.is_connected(c.user_a_id, c.user_b_id) as is_connected,
      private.can_send_to_conversation(c.id) as can_send,
      ask.question as ask_question,
      ask.status as ask_status,
      latest.id as latest_message_id,
      latest.kind as latest_message_kind,
      latest.sender_user_id as latest_sender_user_id,
      latest.body as latest_body,
      latest.created_at as latest_created_at,
      unread.unread_count,
      coalesce(
        latest_user.sender_user_id = counterpart.id
          and latest_user.id > coalesce(viewer_read.last_read_message_id, 0),
        false
      ) as needs_reply,
      coalesce(latest.created_at, c.created_at) as activity_at
    from participant c
    join public.users viewer
      on viewer.id = (select auth.uid())
     and viewer.account_state = 'active'
    join public.users counterpart
      on counterpart.id = case
        when c.user_a_id = (select auth.uid()) then c.user_b_id
        else c.user_a_id
      end
    left join public.profiles profile on profile.user_id = counterpart.id
    left join lateral (
      select linked_ask.id, linked_ask.organization_id, linked_ask.question,
             linked_ask.status, linked_ask.accepted_at, linked_ask.created_at
      from public.asks linked_ask
      where linked_ask.conversation_id = c.id
      order by
        (linked_ask.status = 'accepted') desc,
        coalesce(linked_ask.accepted_at, linked_ask.created_at) desc,
        linked_ask.id desc
      limit 1
    ) ask on true
    left join public.conversation_reads viewer_read
      on viewer_read.conversation_id = c.id
     and viewer_read.user_id = (select auth.uid())
    left join lateral (
      select organization_profile.graduation_year
      from public.organization_memberships mine
      join public.organization_memberships theirs
        on theirs.organization_id = mine.organization_id
       and theirs.user_id = counterpart.id
       and theirs.status = 'active'
      left join public.organization_profiles organization_profile
        on organization_profile.organization_id = theirs.organization_id
       and organization_profile.organization_membership_id = theirs.id
      where mine.user_id = (select auth.uid())
        and mine.status = 'active'
      order by
        case when mine.organization_id = ask.organization_id then 0 else 1 end,
        mine.organization_id
      limit 1
    ) class_year on true
    left join lateral (
      select message.id, message.kind, message.sender_user_id,
             message.body, message.created_at
      from public.messages message
      where message.conversation_id = c.id
      order by message.id desc
      limit 1
    ) latest on true
    left join lateral (
      select message.id, message.sender_user_id
      from public.messages message
      where message.conversation_id = c.id
        and message.kind = 'user'
      order by message.id desc
      limit 1
    ) latest_user on true
    cross join lateral (
      select count(*)::integer as unread_count
      from public.messages message
      where message.conversation_id = c.id
        and message.kind = 'user'
        and message.sender_user_id = counterpart.id
        and message.id > coalesce(viewer_read.last_read_message_id, 0)
    ) unread
    where not private.is_blocked(c.user_a_id, c.user_b_id)
  )
  select
    enriched.conversation_id,
    enriched.conversation_kind,
    enriched.organization_id,
    enriched.ask_id,
    enriched.counterpart_user_id,
    enriched.counterpart_display_name,
    enriched.counterpart_preferred_name,
    enriched.counterpart_avatar_path,
    enriched.counterpart_graduation_year,
    enriched.is_connected,
    enriched.can_send,
    case
      when enriched.can_send then null
      when enriched.counterpart_account_state <> 'active' then 'account_unavailable'
      when enriched.conversation_kind = 'direct' and not enriched.is_connected
        then 'connection_required'
      when enriched.conversation_kind = 'ask' then 'ask_unavailable'
      else 'not_available'
    end as read_only_reason,
    enriched.ask_question,
    enriched.ask_status,
    enriched.latest_message_id,
    enriched.latest_message_kind,
    enriched.latest_sender_user_id,
    enriched.latest_body,
    enriched.latest_created_at,
    enriched.unread_count,
    enriched.needs_reply,
    case
      when enriched.needs_reply then 1
      when enriched.can_send then 2
      else 3
    end::smallint as priority_tier,
    enriched.activity_at
  from enriched;
$$;

create function private.list_conversation_summaries(
  p_filter text default 'all',
  p_query text default null,
  p_before_priority smallint default null,
  p_before_activity_at timestamptz default null,
  p_before_conversation_id uuid default null,
  p_limit integer default 30
)
returns table (
  conversation_id uuid,
  conversation_kind text,
  organization_id uuid,
  ask_id uuid,
  counterpart_user_id uuid,
  counterpart_display_name text,
  counterpart_preferred_name text,
  counterpart_avatar_path text,
  counterpart_graduation_year smallint,
  is_connected boolean,
  can_send boolean,
  read_only_reason text,
  ask_question text,
  ask_status text,
  latest_message_id bigint,
  latest_message_kind text,
  latest_sender_user_id uuid,
  latest_body text,
  latest_created_at timestamptz,
  unread_count integer,
  needs_reply boolean,
  priority_tier smallint,
  activity_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_filter text := lower(btrim(coalesce(p_filter, 'all')));
  v_query text := nullif(btrim(p_query), '');
  v_has_cursor boolean := p_before_priority is not null
    or p_before_activity_at is not null
    or p_before_conversation_id is not null;
begin
  if v_filter not in ('all', 'unread', 'my_circle', 'open_asks')
     or p_limit is null or p_limit not between 1 and 50
     or char_length(coalesce(v_query, '')) > 100
     or (
       v_has_cursor and (
         p_before_priority is null
         or p_before_activity_at is null
         or p_before_conversation_id is null
         or p_before_priority not between 1 and 3
       )
     ) then
    raise exception using errcode = '22023', message = 'invalid_messages_query';
  end if;

  return query
  select summary.*
  from private.get_conversation_summary_base() summary
  where (
      v_filter = 'all'
      or (v_filter = 'unread' and summary.unread_count > 0)
      or (v_filter = 'my_circle' and summary.is_connected)
      or (
        v_filter = 'open_asks'
        and exists (
          select 1
          from public.asks ask
          where ask.conversation_id = summary.conversation_id
            and ask.status = 'accepted'
        )
      )
    )
    and (
      v_query is null
      or summary.counterpart_display_name ilike '%' || v_query || '%'
      or coalesce(summary.ask_question, '') ilike '%' || v_query || '%'
      or exists (
        select 1
        from public.asks ask
        where ask.conversation_id = summary.conversation_id
          and ask.question ilike '%' || v_query || '%'
      )
    )
    and (
      not v_has_cursor
      or summary.priority_tier > p_before_priority
      or (
        summary.priority_tier = p_before_priority
        and summary.activity_at < p_before_activity_at
      )
      or (
        summary.priority_tier = p_before_priority
        and summary.activity_at = p_before_activity_at
        and summary.conversation_id < p_before_conversation_id
      )
    )
  order by summary.priority_tier, summary.activity_at desc, summary.conversation_id desc
  limit p_limit;
end;
$$;

create function private.get_messages_waiting_base()
returns table (
  item_kind text,
  item_id uuid,
  organization_id uuid,
  counterpart_user_id uuid,
  counterpart_display_name text,
  counterpart_preferred_name text,
  counterpart_avatar_path text,
  counterpart_graduation_year smallint,
  question text,
  message text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    'direct_ask'::text,
    ask.id,
    ask.organization_id,
    asker_user.id,
    coalesce(nullif(asker_profile.preferred_name, ''), asker_profile.display_name, 'Member'),
    asker_profile.preferred_name,
    asker_profile.avatar_path,
    asker_organization_profile.graduation_year,
    ask.question,
    ask.request_message,
    ask.created_at
  from public.asks ask
  join public.organization_memberships recipient
    on recipient.id = ask.recipient_membership_id
   and recipient.user_id = (select auth.uid())
   and recipient.status = 'active'
  join public.organization_memberships asker
    on asker.id = ask.asker_membership_id
   and asker.status = 'active'
  join public.users asker_user
    on asker_user.id = asker.user_id
   and asker_user.account_state = 'active'
  left join public.profiles asker_profile on asker_profile.user_id = asker_user.id
  left join public.organization_profiles asker_organization_profile
    on asker_organization_profile.organization_id = ask.organization_id
   and asker_organization_profile.organization_membership_id = asker.id
  where ask.kind = 'direct'
    and ask.status = 'waiting'
    and not private.is_blocked(recipient.user_id, asker.user_id)

  union all

  select
    'connection_request'::text,
    request.id,
    request.origin_organization_id,
    requester.id,
    coalesce(nullif(requester_profile.preferred_name, ''), requester_profile.display_name, 'Member'),
    requester_profile.preferred_name,
    requester_profile.avatar_path,
    requester_organization_profile.graduation_year,
    null::text,
    request.intro_message,
    request.created_at
  from public.connection_requests request
  join public.users viewer
    on viewer.id = (select auth.uid())
   and viewer.account_state = 'active'
  join public.users requester
    on requester.id = request.requester_user_id
   and requester.account_state = 'active'
  left join public.profiles requester_profile on requester_profile.user_id = requester.id
  left join public.organization_memberships requester_membership
    on requester_membership.organization_id = request.origin_organization_id
   and requester_membership.user_id = requester.id
   and requester_membership.status = 'active'
  left join public.organization_profiles requester_organization_profile
    on requester_organization_profile.organization_id = request.origin_organization_id
   and requester_organization_profile.organization_membership_id = requester_membership.id
  where request.recipient_user_id = (select auth.uid())
    and request.status = 'pending'
    and not private.is_blocked(request.requester_user_id, request.recipient_user_id);
$$;

create function private.list_messages_waiting()
returns table (
  item_kind text,
  item_id uuid,
  organization_id uuid,
  counterpart_user_id uuid,
  counterpart_display_name text,
  counterpart_preferred_name text,
  counterpart_avatar_path text,
  counterpart_graduation_year smallint,
  question text,
  message text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select waiting.*
  from private.get_messages_waiting_base() waiting
  order by waiting.created_at desc, waiting.item_id desc
  limit 50;
$$;

create function private.get_messages_counts()
returns table (
  all_count integer,
  unread_count integer,
  my_circle_count integer,
  open_asks_count integer,
  waiting_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with summaries as materialized (
    select * from private.get_conversation_summary_base()
  ), waiting as materialized (
    select * from private.get_messages_waiting_base()
  )
  select
    count(*)::integer,
    count(*) filter (where summaries.unread_count > 0)::integer,
    count(*) filter (where summaries.is_connected)::integer,
    count(*) filter (
      where exists (
        select 1
        from public.asks ask
        where ask.conversation_id = summaries.conversation_id
          and ask.status = 'accepted'
      )
    )::integer,
    (select count(*)::integer from waiting)
  from summaries;
$$;

create function api.list_conversation_summaries(
  p_filter text default 'all',
  p_query text default null,
  p_before_priority smallint default null,
  p_before_activity_at timestamptz default null,
  p_before_conversation_id uuid default null,
  p_limit integer default 30
)
returns table (
  conversation_id uuid,
  conversation_kind text,
  organization_id uuid,
  ask_id uuid,
  counterpart_user_id uuid,
  counterpart_display_name text,
  counterpart_preferred_name text,
  counterpart_avatar_path text,
  counterpart_graduation_year smallint,
  is_connected boolean,
  can_send boolean,
  read_only_reason text,
  ask_question text,
  ask_status text,
  latest_message_id bigint,
  latest_message_kind text,
  latest_sender_user_id uuid,
  latest_body text,
  latest_created_at timestamptz,
  unread_count integer,
  needs_reply boolean,
  priority_tier smallint,
  activity_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from private.list_conversation_summaries(
    p_filter, p_query, p_before_priority, p_before_activity_at,
    p_before_conversation_id, p_limit
  );
$$;

create function api.list_messages_waiting()
returns table (
  item_kind text,
  item_id uuid,
  organization_id uuid,
  counterpart_user_id uuid,
  counterpart_display_name text,
  counterpart_preferred_name text,
  counterpart_avatar_path text,
  counterpart_graduation_year smallint,
  question text,
  message text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$ select * from private.list_messages_waiting(); $$;

create function api.get_messages_counts()
returns table (
  all_count integer,
  unread_count integer,
  my_circle_count integer,
  open_asks_count integer,
  waiting_count integer
)
language sql
stable
security definer
set search_path = ''
as $$ select * from private.get_messages_counts(); $$;

-- ---------------------------------------------------------------------------
-- Owner-topic invalidations
-- ---------------------------------------------------------------------------

create or replace function private.broadcast_user_control_event(
  p_user_id uuid,
  p_event text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  if p_user_id is null
     or jsonb_typeof(v_payload) <> 'object'
     or v_payload ? 'id'
     or p_event not in (
       'conversation.permissions_changed',
       'conversation.revoked',
       'help.changed',
       'messages.changed',
       'connections.changed',
       'profile.changed'
     ) then
    raise exception using errcode = '22023', message = 'invalid_user_control_event';
  end if;

  if p_event = 'help.changed' and (
       not (v_payload ? 'askId')
       or (v_payload - array['askId', 'offerId']::text[]) <> '{}'::jsonb
     ) then
    raise exception using errcode = '22023', message = 'invalid_help_change_payload';
  elsif p_event = 'messages.changed' and (
       not (v_payload ? 'conversationId')
       or (v_payload - 'conversationId') <> '{}'::jsonb
     ) then
    raise exception using errcode = '22023', message = 'invalid_messages_change_payload';
  elsif p_event = 'connections.changed' and (
       not (v_payload ? 'requestId' or v_payload ? 'conversationId')
       or (v_payload - array['requestId', 'conversationId']::text[]) <> '{}'::jsonb
     ) then
    raise exception using errcode = '22023', message = 'invalid_connections_change_payload';
  elsif p_event = 'profile.changed' and (
       not (v_payload ? 'membershipId')
       or (v_payload - 'membershipId') <> '{}'::jsonb
     ) then
    raise exception using errcode = '22023', message = 'invalid_profile_change_payload';
  elsif p_event in ('conversation.permissions_changed', 'conversation.revoked') and (
       not (v_payload ? 'conversationId')
       or (v_payload - 'conversationId') <> '{}'::jsonb
     ) then
    raise exception using errcode = '22023', message = 'invalid_conversation_control_payload';
  end if;

  begin
    if p_event = 'help.changed' then
      perform (v_payload ->> 'askId')::uuid;
      if v_payload ? 'offerId' then perform (v_payload ->> 'offerId')::uuid; end if;
    elsif p_event in (
      'messages.changed', 'conversation.permissions_changed', 'conversation.revoked'
    ) then
      perform (v_payload ->> 'conversationId')::uuid;
    elsif p_event = 'connections.changed' then
      if v_payload ? 'requestId' then perform (v_payload ->> 'requestId')::uuid; end if;
      if v_payload ? 'conversationId' then perform (v_payload ->> 'conversationId')::uuid; end if;
    elsif p_event = 'profile.changed' then
      perform (v_payload ->> 'membershipId')::uuid;
    end if;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'invalid_user_control_payload_id';
  end;

  v_payload := v_payload || jsonb_build_object('id', gen_random_uuid());
  perform realtime.send(
    v_payload,
    p_event,
    'user:' || p_user_id::text,
    true
  );
end;
$$;

create or replace function private.broadcast_help_change(
  p_ask_id uuid,
  p_offer_id uuid default null,
  p_only_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_payload jsonb := jsonb_strip_nulls(jsonb_build_object(
    'askId', p_ask_id,
    'offerId', p_offer_id
  ));
begin
  if p_ask_id is null then
    raise exception using errcode = '22023', message = 'help_change_ask_required';
  end if;

  if p_only_user_id is not null then
    perform private.broadcast_user_control_event(p_only_user_id, 'help.changed', v_payload);
    return;
  end if;

  for v_user_id in
    select distinct affected.user_id
    from (
      select asker.user_id
      from public.asks ask
      join public.organization_memberships asker on asker.id = ask.asker_membership_id
      where ask.id = p_ask_id

      union all

      select recipient.user_id
      from public.asks ask
      join public.organization_memberships recipient on recipient.id = ask.recipient_membership_id
      where ask.id = p_ask_id

      union all

      select helper.user_id
      from public.ask_offers offer
      join public.organization_memberships helper on helper.id = offer.helper_membership_id
      where offer.ask_id = p_ask_id
        and (p_offer_id is null or offer.id = p_offer_id)
    ) affected
    where affected.user_id is not null
    order by affected.user_id
  loop
    perform private.broadcast_user_control_event(v_user_id, 'help.changed', v_payload);
  end loop;
end;
$$;

-- Owner invalidations are emitted by the transactional command that owns each
-- durable change. They are intentionally not table triggers: bulk maintenance
-- and fixture writes must not manufacture member events, and one command can
-- collapse several inserts into one authoritative refetch signal.

create or replace function private.insert_system_message(
  p_conversation_id uuid,
  p_event_type text,
  p_event_key text,
  p_body text,
  p_actor_user_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message_id bigint;
  v_created boolean := false;
  v_user_a_id uuid;
  v_user_b_id uuid;
begin
  insert into public.messages (
    conversation_id, kind, body, system_event_type, system_event_key,
    system_actor_user_id
  ) values (
    p_conversation_id, 'system', p_body, p_event_type, p_event_key,
    p_actor_user_id
  )
  on conflict (conversation_id, system_event_key)
    where system_event_key is not null
  do nothing
  returning id into v_message_id;

  v_created := found;

  if v_message_id is null then
    select message.id into v_message_id
    from public.messages message
    where message.conversation_id = p_conversation_id
      and message.system_event_key = p_event_key;
  end if;

  if v_created then
    select conversation.user_a_id, conversation.user_b_id
      into v_user_a_id, v_user_b_id
    from public.conversations conversation
    where conversation.id = p_conversation_id;

    perform private.broadcast_user_control_event(
      v_user_a_id,
      'messages.changed',
      jsonb_build_object('conversationId', p_conversation_id)
    );
    perform private.broadcast_user_control_event(
      v_user_b_id,
      'messages.changed',
      jsonb_build_object('conversationId', p_conversation_id)
    );
  end if;

  return v_message_id;
end;
$$;

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
      v_user_a_id,
      'messages.changed',
      jsonb_build_object('conversationId', p_conversation_id)
    );
    perform private.broadcast_user_control_event(
      v_user_b_id,
      'messages.changed',
      jsonb_build_object('conversationId', p_conversation_id)
    );
  end if;

  return query select
    v_result.result_code::text,
    v_result.message_id::bigint,
    v_result.created_at::timestamptz;
end;
$$;

create or replace function api.mark_conversation_read(
  p_conversation_id uuid,
  p_message_id bigint
)
returns table(result_code text, last_read_message_id bigint, last_read_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result record;
begin
  select * into v_result
  from private.mark_conversation_read(p_conversation_id, p_message_id);

  if v_result.result_code = 'advanced' then
    perform private.broadcast_user_control_event(
      (select auth.uid()),
      'messages.changed',
      jsonb_build_object('conversationId', p_conversation_id)
    );
  end if;

  return query select
    v_result.result_code::text,
    v_result.last_read_message_id::bigint,
    v_result.last_read_at::timestamptz;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stable Connection commands
-- ---------------------------------------------------------------------------

drop function api.send_connection_request(uuid, uuid, text, uuid);
drop function private.send_connection_request(uuid, uuid, text, uuid);

create function private.send_connection_request(
  p_recipient_user_id uuid,
  p_origin_organization_id uuid,
  p_intro_message text,
  p_client_request_id uuid
)
returns table (result_code text, request_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requester_user_id uuid := (select auth.uid());
  v_organization_id uuid := p_origin_organization_id;
  v_intro_message text := nullif(btrim(p_intro_message), '');
  v_existing public.connection_requests%rowtype;
begin
  if v_requester_user_id is null
     or p_client_request_id is null
     or p_recipient_user_id is null
     or p_recipient_user_id = v_requester_user_id
     or char_length(coalesce(v_intro_message, '')) > 2000 then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  if not exists (
    select 1
    from public.users requester
    join public.users recipient on recipient.id = p_recipient_user_id
    where requester.id = v_requester_user_id
      and requester.account_state = 'active'
      and recipient.account_state = 'active'
  ) then
    return query select 'not_available'::text, null::uuid;
    return;
  end if;

  perform private.lock_user_pair(v_requester_user_id, p_recipient_user_id);

  select * into v_existing
  from public.connection_requests request
  where request.requester_user_id = v_requester_user_id
    and request.client_request_id = p_client_request_id
  for update;
  if found then
    if v_existing.recipient_user_id is distinct from p_recipient_user_id
       or v_existing.intro_message is distinct from v_intro_message
       or (
         p_origin_organization_id is not null
         and v_existing.origin_organization_id is distinct from p_origin_organization_id
       ) then
      return query select 'idempotency_conflict'::text, null::uuid;
    else
      return query select 'existing'::text, v_existing.id;
    end if;
    return;
  end if;

  if private.is_blocked(v_requester_user_id, p_recipient_user_id) then
    return query select 'not_available'::text, null::uuid;
    return;
  end if;
  if private.is_connected(v_requester_user_id, p_recipient_user_id) then
    return query select 'already_connected'::text, null::uuid;
    return;
  end if;

  select * into v_existing
  from public.connection_requests request
  where request.status = 'pending'
    and least(request.requester_user_id, request.recipient_user_id)
      = least(v_requester_user_id, p_recipient_user_id)
    and greatest(request.requester_user_id, request.recipient_user_id)
      = greatest(v_requester_user_id, p_recipient_user_id)
  for update;
  if found then
    if v_existing.requester_user_id = p_recipient_user_id then
      return query select 'incoming_pending'::text, v_existing.id;
    else
      return query select 'existing'::text, v_existing.id;
    end if;
    return;
  end if;

  if v_organization_id is null then
    select mine.organization_id into v_organization_id
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
     and theirs.user_id = p_recipient_user_id
     and theirs.status = 'active'
    where mine.user_id = v_requester_user_id
      and mine.status = 'active'
    order by mine.created_at, mine.organization_id
    limit 1;
  elsif not (
    private.is_active_member_of(v_organization_id)
    and exists (
      select 1 from public.organization_memberships membership
      where membership.organization_id = v_organization_id
        and membership.user_id = p_recipient_user_id
        and membership.status = 'active'
    )
  ) then
    return query select 'not_available'::text, null::uuid;
    return;
  end if;

  if v_organization_id is null then
    return query select 'not_available'::text, null::uuid;
    return;
  end if;

  insert into public.connection_requests (
    requester_user_id, recipient_user_id, origin_organization_id,
    intro_message, client_request_id
  ) values (
    v_requester_user_id, p_recipient_user_id, v_organization_id,
    v_intro_message, p_client_request_id
  ) returning * into v_existing;

  perform private.enqueue_outbox(
    'create_notification',
    jsonb_build_object(
      'type', 'connection_requested', 'recipientUserId', p_recipient_user_id,
      'actorUserId', v_requester_user_id, 'connectionRequestId', v_existing.id
    ),
    'connection_requested:' || v_existing.id::text
  );
  perform private.broadcast_user_control_event(
    v_requester_user_id,
    'connections.changed',
    jsonb_build_object('requestId', v_existing.id)
  );
  perform private.broadcast_user_control_event(
    p_recipient_user_id,
    'connections.changed',
    jsonb_build_object('requestId', v_existing.id)
  );
  return query select 'created'::text, v_existing.id;
end;
$$;

create function api.send_connection_request(
  p_recipient_user_id uuid,
  p_origin_organization_id uuid,
  p_intro_message text,
  p_client_request_id uuid
)
returns table (result_code text, request_id uuid)
language sql
security definer
set search_path = ''
as $$
  select * from private.send_connection_request(
    p_recipient_user_id, p_origin_organization_id, p_intro_message, p_client_request_id
  );
$$;

drop function api.respond_to_connection_request(uuid, text);
drop function private.respond_to_connection_request(uuid, text);

create function private.respond_to_connection_request(
  p_request_id uuid,
  p_decision text
)
returns table (result_code text, connection_id uuid, conversation_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient_user_id uuid := (select auth.uid());
  v_request public.connection_requests%rowtype;
  v_connection_id uuid;
  v_conversation_id uuid;
begin
  if p_request_id is null or p_decision not in ('accept', 'decline') then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  select * into v_request
  from public.connection_requests request
  where request.id = p_request_id
    and request.recipient_user_id = v_recipient_user_id;
  if not found then
    return query select 'not_available'::text, null::uuid, null::uuid;
    return;
  end if;

  perform private.lock_user_pair(v_request.requester_user_id, v_request.recipient_user_id);

  select * into v_request
  from public.connection_requests request
  where request.id = p_request_id
    and request.recipient_user_id = v_recipient_user_id
  for update;
  if not found
     or private.is_blocked(v_request.requester_user_id, v_request.recipient_user_id)
     or not exists (
       select 1
       from public.users requester
       join public.users recipient on recipient.id = v_request.recipient_user_id
       where requester.id = v_request.requester_user_id
         and requester.account_state = 'active'
         and recipient.account_state = 'active'
     ) then
    return query select 'not_available'::text, null::uuid, null::uuid;
    return;
  end if;

  if v_request.status <> 'pending' then
    if v_request.status = 'accepted' then
      select connection.id into v_connection_id
      from public.connections connection
      where connection.connection_request_id = p_request_id;
      select conversation.id into v_conversation_id
      from public.conversations conversation
      where conversation.user_a_id = least(
          v_request.requester_user_id, v_request.recipient_user_id
        )
        and conversation.user_b_id = greatest(
          v_request.requester_user_id, v_request.recipient_user_id
        );
    end if;
    return query select 'already_decided'::text, v_connection_id, v_conversation_id;
    return;
  end if;

  if p_decision = 'decline' then
    update public.connection_requests
    set status = 'declined', responded_at = now()
    where id = p_request_id;
    perform private.broadcast_user_control_event(
      v_request.requester_user_id,
      'connections.changed',
      jsonb_build_object('requestId', p_request_id)
    );
    perform private.broadcast_user_control_event(
      v_request.recipient_user_id,
      'connections.changed',
      jsonb_build_object('requestId', p_request_id)
    );
    return query select 'declined'::text, null::uuid, null::uuid;
    return;
  end if;

  update public.connection_requests
  set status = 'accepted', responded_at = now()
  where id = p_request_id;

  insert into public.connections (
    user_a_id, user_b_id, origin_organization_id, connection_request_id
  ) values (
    least(v_request.requester_user_id, v_request.recipient_user_id),
    greatest(v_request.requester_user_id, v_request.recipient_user_id),
    v_request.origin_organization_id, p_request_id
  )
  on conflict (user_a_id, user_b_id) do update
    set connection_request_id = coalesce(
      public.connections.connection_request_id,
      excluded.connection_request_id
    )
  returning id into v_connection_id;

  v_conversation_id := private.get_or_create_pair_conversation(
    v_request.requester_user_id,
    v_request.recipient_user_id
  );

  perform private.insert_system_message(
    v_conversation_id,
    'connection_accepted',
    'connection_accepted:' || p_request_id::text,
    'Connection accepted.',
    v_request.recipient_user_id
  );

  if v_request.intro_message is not null then
    insert into public.messages (
      conversation_id, sender_user_id, kind, body, client_nonce
    ) values (
      v_conversation_id, v_request.requester_user_id, 'user',
      v_request.intro_message, v_request.client_request_id
    )
    on conflict do nothing;
  end if;

  perform private.enqueue_outbox(
    'create_notification',
    jsonb_build_object(
      'type', 'connection_accepted',
      'recipientUserId', v_request.requester_user_id,
      'actorUserId', v_request.recipient_user_id,
      'connectionRequestId', p_request_id,
      'conversationId', v_conversation_id
    ),
    'connection_accepted:' || p_request_id::text
  );
  perform private.broadcast_user_control_event(
    v_request.requester_user_id,
    'connections.changed',
    jsonb_build_object(
      'requestId', p_request_id,
      'conversationId', v_conversation_id
    )
  );
  perform private.broadcast_user_control_event(
    v_request.recipient_user_id,
    'connections.changed',
    jsonb_build_object(
      'requestId', p_request_id,
      'conversationId', v_conversation_id
    )
  );
  return query select 'accepted'::text, v_connection_id, v_conversation_id;
end;
$$;

create function api.respond_to_connection_request(p_request_id uuid, p_decision text)
returns table (result_code text, connection_id uuid, conversation_id uuid)
language sql
security definer
set search_path = ''
as $$ select * from private.respond_to_connection_request(p_request_id, p_decision); $$;

drop function api.disconnect(uuid);
create function api.disconnect(p_other_user_id uuid)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or p_other_user_id is null or v_user_id = p_other_user_id then
    return query select 'not_available'::text;
    return;
  end if;
  if not exists (
    select 1 from public.users mine
    join public.users other on other.id = p_other_user_id
    where mine.id = v_user_id
      and mine.account_state = 'active'
      and other.account_state = 'active'
  ) then
    return query select 'not_available'::text;
    return;
  end if;
  perform private.lock_user_pair(v_user_id, p_other_user_id);
  if not private.is_connected(v_user_id, p_other_user_id) then
    return query select 'unchanged'::text;
    return;
  end if;
  perform private.disconnect(p_other_user_id);
  return query select 'disconnected'::text;
end;
$$;

drop function api.block_member(uuid);
create function api.block_member(p_blocked_user_id uuid)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_request_id uuid;
begin
  if v_user_id is null or p_blocked_user_id is null or v_user_id = p_blocked_user_id then
    return query select 'not_available'::text;
    return;
  end if;
  if not exists (
    select 1 from public.users mine
    join public.users other on other.id = p_blocked_user_id
    where mine.id = v_user_id
      and mine.account_state = 'active'
      and other.account_state = 'active'
  ) then
    return query select 'not_available'::text;
    return;
  end if;
  perform private.lock_user_pair(v_user_id, p_blocked_user_id);
  if private.is_blocked(v_user_id, p_blocked_user_id) then
    return query select 'unchanged'::text;
    return;
  end if;
  select request.id into v_request_id
  from public.connection_requests request
  where request.status = 'pending'
    and least(request.requester_user_id, request.recipient_user_id)
      = least(v_user_id, p_blocked_user_id)
    and greatest(request.requester_user_id, request.recipient_user_id)
      = greatest(v_user_id, p_blocked_user_id)
  for update;
  perform private.block_member(p_blocked_user_id);
  if v_request_id is not null then
    perform private.broadcast_user_control_event(
      v_user_id, 'connections.changed', jsonb_build_object('requestId', v_request_id)
    );
    perform private.broadcast_user_control_event(
      p_blocked_user_id, 'connections.changed', jsonb_build_object('requestId', v_request_id)
    );
  end if;
  return query select 'blocked'::text;
end;
$$;

-- ---------------------------------------------------------------------------
-- Conversation detail and shell attention
-- ---------------------------------------------------------------------------

drop function api.get_conversation_detail(uuid);
drop function private.get_conversation_detail(uuid);

create function private.get_conversation_detail(p_conversation_id uuid)
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
  can_request_connection boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    conversation.id,
    summary.conversation_kind,
    summary.organization_id,
    summary.ask_id,
    conversation.created_at,
    conversation.last_message_at,
    summary.counterpart_user_id,
    summary.counterpart_display_name,
    summary.counterpart_avatar_path,
    summary.counterpart_graduation_year,
    summary.can_send,
    viewer_read.last_read_message_id,
    viewer_read.last_read_at,
    counterpart_read.last_read_message_id,
    counterpart_read.last_read_at,
    summary.latest_message_id,
    summary.counterpart_preferred_name,
    case when counterpart.account_state = 'active' then profile.headline end,
    case when counterpart.account_state = 'active' then profile.current_employer end,
    case when counterpart.account_state = 'active' then profile.current_title end,
    summary.is_connected,
    summary.read_only_reason,
    case
      when summary.is_connected then 'connected'
      when pending_request.recipient_user_id = (select auth.uid()) then 'incoming_pending'
      when pending_request.requester_user_id = (select auth.uid()) then 'outgoing_pending'
      else 'none'
    end,
    pending_request.id,
    ask.question,
    ask.status,
    ask.outcome_note,
    coalesce(help_state.open_to_help, false),
    summary.conversation_kind = 'ask'
      and counterpart.account_state = 'active'
      and not summary.is_connected
      and pending_request.id is null
      and exists (
        select 1 from public.messages mine
        where mine.conversation_id = conversation.id
          and mine.kind = 'user'
          and mine.sender_user_id = (select auth.uid())
      )
      and exists (
        select 1 from public.messages theirs
        where theirs.conversation_id = conversation.id
          and theirs.kind = 'user'
          and theirs.sender_user_id = summary.counterpart_user_id
      )
  from public.conversations conversation
  join private.get_conversation_summary_base() summary
    on summary.conversation_id = conversation.id
  join public.users counterpart on counterpart.id = summary.counterpart_user_id
  left join public.profiles profile on profile.user_id = counterpart.id
  left join public.asks ask on ask.id = summary.ask_id
  left join public.conversation_reads viewer_read
    on viewer_read.conversation_id = conversation.id
   and viewer_read.user_id = (select auth.uid())
  left join public.conversation_reads counterpart_read
    on counterpart_read.conversation_id = conversation.id
   and counterpart_read.user_id = summary.counterpart_user_id
  left join lateral (
    select request.id, request.requester_user_id, request.recipient_user_id
    from public.connection_requests request
    where request.status = 'pending'
      and least(request.requester_user_id, request.recipient_user_id)
        = least((select auth.uid()), summary.counterpart_user_id)
      and greatest(request.requester_user_id, request.recipient_user_id)
        = greatest((select auth.uid()), summary.counterpart_user_id)
    order by request.created_at desc, request.id desc
    limit 1
  ) pending_request on true
  left join lateral (
    select preference.open_to_help
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
     and theirs.user_id = summary.counterpart_user_id
     and theirs.status = 'active'
    join public.helper_preferences preference
      on preference.organization_id = theirs.organization_id
     and preference.organization_membership_id = theirs.id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and (
        summary.organization_id is null
        or mine.organization_id = summary.organization_id
      )
    order by
      case when mine.organization_id = summary.organization_id then 0 else 1 end,
      mine.organization_id
    limit 1
  ) help_state on true
  where conversation.id = p_conversation_id;
$$;

create function api.get_conversation_detail(p_conversation_id uuid)
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
  can_request_connection boolean
)
language sql
stable
security definer
set search_path = ''
as $$ select * from private.get_conversation_detail(p_conversation_id); $$;

drop function api.get_my_member_context(uuid);
create function api.get_my_member_context(p_preferred_membership_id uuid default null)
returns table (
  account_state text,
  onboarding_completed_at timestamptz,
  delete_scheduled_for timestamptz,
  delete_initiated_by_admin boolean,
  deleted_at timestamptz,
  selected_membership_id uuid,
  requires_circle_choice boolean,
  unread_notification_count bigint,
  messages_attention_count bigint,
  memberships jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    context.account_state,
    context.onboarding_completed_at,
    context.delete_scheduled_for,
    context.delete_initiated_by_admin,
    context.deleted_at,
    context.selected_membership_id,
    context.requires_circle_choice,
    context.unread_notification_count,
    (counts.unread_count + counts.waiting_count)::bigint,
    context.memberships
  from private.get_my_member_context(p_preferred_membership_id) context
  cross join private.get_messages_counts() counts;
$$;

-- ---------------------------------------------------------------------------
-- Grants: fixed API only, no raw Connection tables
-- ---------------------------------------------------------------------------

revoke all on table public.connection_requests from anon, authenticated;
revoke all on table public.connections from anon, authenticated;

revoke execute on function private.get_conversation_summary_base() from public, anon, authenticated;
revoke execute on function private.list_conversation_summaries(text, text, smallint, timestamptz, uuid, integer) from public, anon, authenticated;
revoke execute on function private.get_messages_waiting_base() from public, anon, authenticated;
revoke execute on function private.list_messages_waiting() from public, anon, authenticated;
revoke execute on function private.get_messages_counts() from public, anon, authenticated;
revoke execute on function private.send_connection_request(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke execute on function private.respond_to_connection_request(uuid, text) from public, anon, authenticated;
revoke execute on function private.get_conversation_detail(uuid) from public, anon, authenticated;
revoke execute on function private.insert_system_message(uuid, text, text, text, uuid) from public, anon, authenticated;

revoke execute on function api.list_conversation_summaries(text, text, smallint, timestamptz, uuid, integer) from public, anon;
revoke execute on function api.list_messages_waiting() from public, anon;
revoke execute on function api.get_messages_counts() from public, anon;
revoke execute on function api.send_connection_request(uuid, uuid, text, uuid) from public, anon;
revoke execute on function api.respond_to_connection_request(uuid, text) from public, anon;
revoke execute on function api.disconnect(uuid) from public, anon;
revoke execute on function api.block_member(uuid) from public, anon;
revoke execute on function api.get_conversation_detail(uuid) from public, anon;
revoke execute on function api.get_my_member_context(uuid) from public, anon;

grant execute on function api.list_conversation_summaries(text, text, smallint, timestamptz, uuid, integer) to authenticated;
grant execute on function api.list_messages_waiting() to authenticated;
grant execute on function api.get_messages_counts() to authenticated;
grant execute on function api.send_connection_request(uuid, uuid, text, uuid) to authenticated;
grant execute on function api.respond_to_connection_request(uuid, text) to authenticated;
grant execute on function api.disconnect(uuid) to authenticated;
grant execute on function api.block_member(uuid) to authenticated;
grant execute on function api.get_conversation_detail(uuid) to authenticated;
grant execute on function api.get_my_member_context(uuid) to authenticated;
