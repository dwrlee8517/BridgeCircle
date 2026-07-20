-- Home composes the existing Help, Messages, and School projections. This
-- migration adds only Home-native facts and bilateral consent for resolved
-- Ask outcome stories.

create table private.ask_outcome_shares (
  ask_id uuid not null references public.asks(id) on delete cascade,
  participant_user_id uuid not null references public.users(id) on delete cascade,
  share_story boolean not null default false,
  share_identity boolean not null default false,
  first_shared_at timestamptz,
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (ask_id, participant_user_id),
  constraint ask_outcome_shares_identity_requires_story_check
    check (not share_identity or share_story),
  constraint ask_outcome_shares_timestamp_shape_check check (
    (share_story and first_shared_at is not null and revoked_at is null)
    or
    (not share_story and share_identity = false)
  )
);

create index ask_outcome_shares_participant_idx
  on private.ask_outcome_shares (participant_user_id, updated_at desc, ask_id);

create function private.get_ask_outcome_participants(p_ask_id uuid)
returns table (
  organization_id uuid,
  asker_user_id uuid,
  helper_user_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    ask.organization_id,
    asker.user_id,
    case
      when ask.kind = 'direct' then recipient.user_id
      else accepted_helper.user_id
    end
  from public.asks ask
  join public.organization_memberships asker
    on asker.id = ask.asker_membership_id
   and asker.organization_id = ask.organization_id
  left join public.organization_memberships recipient
    on recipient.id = ask.recipient_membership_id
   and recipient.organization_id = ask.organization_id
  left join public.ask_offers accepted_offer
    on accepted_offer.ask_id = ask.id
   and accepted_offer.status = 'accepted'
  left join public.organization_memberships accepted_helper
    on accepted_helper.id = accepted_offer.helper_membership_id
   and accepted_helper.organization_id = ask.organization_id
  where ask.id = p_ask_id
    and ask.status = 'resolved'
    and nullif(btrim(ask.outcome_note), '') is not null
    and case
      when ask.kind = 'direct' then recipient.user_id
      else accepted_helper.user_id
    end is not null;
$$;

create function private.enforce_ask_outcome_share_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from private.get_ask_outcome_participants(new.ask_id) participant
    where new.participant_user_id in (
      participant.asker_user_id,
      participant.helper_user_id
    )
  ) then
    raise exception using errcode = '23514', message = 'invalid_ask_outcome_participant';
  end if;
  return new;
end;
$$;

create trigger enforce_ask_outcome_share_participant
  before insert or update of ask_id, participant_user_id
  on private.ask_outcome_shares
  for each row execute function private.enforce_ask_outcome_share_participant();

create function private.save_ask_outcome_share(
  p_ask_id uuid,
  p_share_story boolean,
  p_share_identity boolean
)
returns table (
  result_code text,
  ask_id uuid,
  share_story boolean,
  share_identity boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_participants record;
  v_share private.ask_outcome_shares%rowtype;
begin
  if v_user_id is null
     or p_ask_id is null
     or p_share_story is null
     or p_share_identity is null then
    return query select 'not_available'::text, null::uuid, false, false;
    return;
  end if;

  if p_share_identity and not p_share_story then
    return query select 'invalid_input'::text, p_ask_id, false, false;
    return;
  end if;

  select * into v_participants
  from private.get_ask_outcome_participants(p_ask_id);

  if not found
     or v_user_id not in (
       v_participants.asker_user_id,
       v_participants.helper_user_id
     )
     or private.is_blocked(
       v_participants.asker_user_id,
       v_participants.helper_user_id
     ) then
    return query select 'not_available'::text, null::uuid, false, false;
    return;
  end if;

  insert into private.ask_outcome_shares (
    ask_id,
    participant_user_id,
    share_story,
    share_identity,
    first_shared_at,
    updated_at,
    revoked_at
  ) values (
    p_ask_id,
    v_user_id,
    p_share_story,
    p_share_identity,
    case when p_share_story then now() end,
    now(),
    case when p_share_story then null else now() end
  )
  on conflict on constraint ask_outcome_shares_pkey do update
    set share_story = excluded.share_story,
        share_identity = excluded.share_identity,
        first_shared_at = case
          when excluded.share_story
          then coalesce(private.ask_outcome_shares.first_shared_at, now())
          else private.ask_outcome_shares.first_shared_at
        end,
        updated_at = now(),
        revoked_at = case when excluded.share_story then null else now() end
  returning * into v_share;

  perform private.broadcast_help_change(p_ask_id);

  return query select
    'saved'::text,
    v_share.ask_id,
    v_share.share_story,
    v_share.share_identity;
end;
$$;

create function api.save_ask_outcome_share(
  p_ask_id uuid,
  p_share_story boolean,
  p_share_identity boolean
)
returns table (
  result_code text,
  ask_id uuid,
  share_story boolean,
  share_identity boolean
)
language sql
security definer
set search_path = ''
as $$
  select * from private.save_ask_outcome_share(
    p_ask_id,
    p_share_story,
    p_share_identity
  );
$$;

create function private.remove_deleted_user_outcome_shares()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.account_state <> 'deleted' and new.account_state = 'deleted' then
    delete from private.ask_outcome_shares share
    where share.participant_user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger remove_deleted_user_outcome_shares
  after update of account_state on public.users
  for each row execute function private.remove_deleted_user_outcome_shares();

create function private.get_home_native(p_membership_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_organization_id uuid;
  v_week_start timestamptz := date_trunc('week', now());
  v_new_members integer := 0;
  v_refreshed_profiles integer := 0;
  v_recognition jsonb;
  v_outcome jsonb;
begin
  select membership.organization_id
    into v_organization_id
  from public.organization_memberships membership
  join public.users viewer on viewer.id = membership.user_id
  where membership.id = p_membership_id
    and membership.user_id = v_user_id
    and membership.status = 'active'
    and viewer.account_state = 'active';

  if v_organization_id is null then
    return jsonb_build_object('resultCode', 'not_available');
  end if;

  select count(*)::integer
    into v_new_members
  from public.organization_memberships membership
  join public.users member_user on member_user.id = membership.user_id
  where membership.organization_id = v_organization_id
    and membership.status = 'active'
    and member_user.account_state = 'active'
    and membership.joined_at >= v_week_start
    and membership.user_id <> v_user_id
    and not private.is_blocked(v_user_id, membership.user_id);

  select count(*)::integer
    into v_refreshed_profiles
  from public.organization_memberships membership
  join public.users member_user on member_user.id = membership.user_id
  join public.profiles profile on profile.user_id = membership.user_id
  where membership.organization_id = v_organization_id
    and membership.status = 'active'
    and member_user.account_state = 'active'
    and membership.user_id <> v_user_id
    and membership.joined_at < v_week_start
    and profile.updated_at >= v_week_start
    and not private.is_blocked(v_user_id, membership.user_id);

  select jsonb_build_object(
    'membershipId', membership.id,
    'userId', membership.user_id,
    'displayName', profile.display_name,
    'preferredName', profile.preferred_name,
    'avatarPath', profile.avatar_path,
    'graduationYear', organization_profile.graduation_year,
    'title', experience.title,
    'employer', experience.employer,
    'startedAt', make_date(experience.start_year, experience.start_month, 1)
  )
    into v_recognition
  from public.organization_memberships membership
  join public.users member_user
    on member_user.id = membership.user_id
   and member_user.account_state = 'active'
  join public.profiles profile on profile.user_id = membership.user_id
  left join public.organization_profiles organization_profile
    on organization_profile.organization_membership_id = membership.id
  join public.profile_experiences experience
    on experience.user_id = membership.user_id
   and experience.end_year is null
   and experience.end_month is null
   and experience.start_year is not null
   and experience.start_month is not null
  left join public.profile_field_visibility visibility
    on visibility.organization_membership_id = membership.id
   and visibility.field_key = 'career_history'
  where membership.organization_id = v_organization_id
    and membership.status = 'active'
    and membership.user_id <> v_user_id
    and not private.is_blocked(v_user_id, membership.user_id)
    and make_date(experience.start_year, experience.start_month, 1)
      between (date_trunc('month', now()) - interval '2 months')::date
          and date_trunc('month', now())::date
    and not exists (
      select 1
      from public.profile_experiences other_experience
      where other_experience.user_id = experience.user_id
        and other_experience.id <> experience.id
        and other_experience.end_year is null
        and other_experience.end_month is null
    )
    and (
      coalesce(visibility.audience, 'organization') = 'organization'
      or (
        visibility.audience = 'connections'
        and private.is_connected(v_user_id, membership.user_id)
      )
    )
  order by
    experience.start_year desc,
    experience.start_month desc,
    experience.id desc
  limit 1;

  select jsonb_strip_nulls(jsonb_build_object(
    'askId', ask.id,
    'outcomeNote', ask.outcome_note,
    'sharedAt', greatest(asker_share.updated_at, helper_share.updated_at),
    'identityMode', case
      when asker_share.share_identity and helper_share.share_identity
      then 'identified'
      else 'anonymous'
    end,
    'askerName', case
      when asker_share.share_identity and helper_share.share_identity
      then asker_profile.display_name
    end,
    'helperName', case
      when asker_share.share_identity and helper_share.share_identity
      then helper_profile.display_name
    end
  ))
    into v_outcome
  from public.asks ask
  join private.get_ask_outcome_participants(ask.id) participants on true
  join public.organization_memberships asker_membership
    on asker_membership.organization_id = participants.organization_id
   and asker_membership.user_id = participants.asker_user_id
   and asker_membership.status = 'active'
  join public.organization_memberships helper_membership
    on helper_membership.organization_id = participants.organization_id
   and helper_membership.user_id = participants.helper_user_id
   and helper_membership.status = 'active'
  join public.users asker_user
    on asker_user.id = participants.asker_user_id
   and asker_user.account_state = 'active'
  join public.users helper_user
    on helper_user.id = participants.helper_user_id
   and helper_user.account_state = 'active'
  join public.profiles asker_profile
    on asker_profile.user_id = participants.asker_user_id
  join public.profiles helper_profile
    on helper_profile.user_id = participants.helper_user_id
  join private.ask_outcome_shares asker_share
    on asker_share.ask_id = ask.id
   and asker_share.participant_user_id = participants.asker_user_id
   and asker_share.share_story
  join private.ask_outcome_shares helper_share
    on helper_share.ask_id = ask.id
   and helper_share.participant_user_id = participants.helper_user_id
   and helper_share.share_story
  where ask.organization_id = v_organization_id
    and not private.is_blocked(v_user_id, participants.asker_user_id)
    and not private.is_blocked(v_user_id, participants.helper_user_id)
  order by ask.ended_at desc nulls last, ask.id desc
  limit 1;

  return jsonb_build_object(
    'resultCode', 'ok',
    'weeklyPulse', jsonb_build_object(
      'newMembers', v_new_members,
      'refreshedProfiles', v_refreshed_profiles
    ),
    'recognition', v_recognition,
    'outcomeStory', v_outcome
  );
end;
$$;

create function api.get_home_native(p_membership_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$ select private.get_home_native(p_membership_id); $$;

-- Extend the canonical conversation detail with only the viewer's own share
-- choice and aggregate eligibility. The counterpart's private choice is never
-- exposed independently.
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
      ),
    coalesce(viewer_share.share_story, false),
    coalesce(viewer_share.share_identity, false),
    coalesce(share_state.story_count = 2, false),
    coalesce(share_state.identity_count = 2, false)
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
  left join private.ask_outcome_shares viewer_share
    on viewer_share.ask_id = ask.id
   and viewer_share.participant_user_id = (select auth.uid())
  left join lateral (
    select
      count(*) filter (where share.share_story)::integer as story_count,
      count(*) filter (where share.share_identity)::integer as identity_count
    from private.get_ask_outcome_participants(ask.id) participants
    join private.ask_outcome_shares share
      on share.ask_id = ask.id
     and share.participant_user_id in (
       participants.asker_user_id,
       participants.helper_user_id
     )
  ) share_state on true
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
as $$ select * from private.get_conversation_detail(p_conversation_id); $$;

revoke all on table private.ask_outcome_shares from public, anon, authenticated;
revoke execute on function private.get_ask_outcome_participants(uuid) from public, anon, authenticated;
revoke execute on function private.enforce_ask_outcome_share_participant() from public, anon, authenticated;
revoke execute on function private.save_ask_outcome_share(uuid, boolean, boolean) from public, anon, authenticated;
revoke execute on function private.remove_deleted_user_outcome_shares() from public, anon, authenticated;
revoke execute on function private.get_home_native(uuid) from public, anon, authenticated;
revoke execute on function private.get_conversation_detail(uuid) from public, anon, authenticated;

revoke execute on function api.save_ask_outcome_share(uuid, boolean, boolean) from public, anon;
revoke execute on function api.get_home_native(uuid) from public, anon;
revoke execute on function api.get_conversation_detail(uuid) from public, anon;

grant execute on function api.save_ask_outcome_share(uuid, boolean, boolean) to authenticated;
grant execute on function api.get_home_native(uuid) to authenticated;
grant execute on function api.get_conversation_detail(uuid) to authenticated;
