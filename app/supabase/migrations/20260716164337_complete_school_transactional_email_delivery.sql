-- Complete the v2 School notification pipeline locally: durable T-1 day
-- reminder generation, preference-aware email fan-out, and worker-safe event
-- and announcement email context.

alter table public.event_rsvps
  add column reminder_sent_at timestamptz;

create index event_rsvps_due_reminder_idx
  on public.event_rsvps (event_id, organization_membership_id)
  where status = 'going' and reminder_sent_at is null;

create function private.reset_school_event_reminders_after_schedule_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.starts_at is distinct from new.starts_at then
    update public.event_rsvps
    set reminder_sent_at = null
    where event_id = new.id
      and status = 'going';
  end if;
  return new;
end;
$$;

create trigger events_reset_reminders_after_schedule_change
  after update of starts_at on public.events
  for each row
  when (old.starts_at is distinct from new.starts_at)
  execute function private.reset_school_event_reminders_after_schedule_change();

create or replace function private.run_school_maintenance(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns table(expired_offers integer, opened_offers integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer record;
  v_reminder record;
  v_expired integer := 0;
  v_opened integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 1000));
begin
  if p_now is null then
    raise exception using errcode = '22023', message = 'maintenance_time_required';
  end if;

  for v_offer in
    select r.event_id, r.organization_membership_id
    from public.event_rsvps r
    where r.status = 'offered' and r.offer_expires_at <= p_now
    order by r.offer_expires_at, r.event_id, r.organization_membership_id
    for update skip locked
    limit v_limit
  loop
    update public.event_rsvps set status = 'not_going', offered_at = null,
      offer_expires_at = null, responded_at = p_now, updated_at = p_now
    where event_id = v_offer.event_id
      and organization_membership_id = v_offer.organization_membership_id
      and status = 'offered';
    if found then
      v_expired := v_expired + 1;
      if private.offer_next_school_waiter(v_offer.event_id, p_now) is not null then
        v_opened := v_opened + 1;
      end if;
    end if;
  end loop;

  for v_reminder in
    select r.event_id, r.organization_membership_id, m.user_id,
           e.title, e.starts_at
    from public.event_rsvps r
    join public.events e on e.id = r.event_id
    join public.organization_memberships m
      on m.id = r.organization_membership_id
     and m.organization_id = r.organization_id
     and m.status = 'active'
    join public.users u on u.id = m.user_id and u.account_state = 'active'
    where r.status = 'going'
      and r.reminder_sent_at is null
      and e.status = 'published'
      and e.starts_at > p_now
      and e.starts_at <= p_now + interval '1 day'
    order by e.starts_at, r.event_id, r.organization_membership_id
    for update of r skip locked
    limit v_limit
  loop
    update public.event_rsvps
    set reminder_sent_at = p_now
    where event_id = v_reminder.event_id
      and organization_membership_id = v_reminder.organization_membership_id
      and status = 'going'
      and reminder_sent_at is null;

    if found then
      perform private.enqueue_outbox(
        'create_notification',
        jsonb_build_object(
          'type', 'event_reminder',
          'recipientUserId', v_reminder.user_id,
          'eventId', v_reminder.event_id,
          'eventTitle', v_reminder.title
        ),
        'event_reminder:' || v_reminder.event_id::text || ':' ||
          v_reminder.organization_membership_id::text || ':' ||
          extract(epoch from v_reminder.starts_at)::bigint::text
      );
    end if;
  end loop;

  return query select v_expired, v_opened;
end;
$$;

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
  v_type text;
  v_recipient_user_id uuid;
  v_actor_user_id uuid;
  v_organization_id uuid;
  v_target_type text;
  v_target_id text;
  v_notification_id bigint;
  v_email_job_id bigint;
  v_in_app_enabled boolean;
  v_email_enabled boolean;
  v_email_payload jsonb;
begin
  select * into v_job
  from private.outbox_jobs j
  where j.id = p_job_id
    and j.job_type = 'create_notification'
    and j.status = 'processing'
    and j.locked_by = p_worker_id
  for update;
  if not found then
    return query select 'not_available'::text, null::bigint, null::bigint;
    return;
  end if;

  v_type := v_job.payload ->> 'type';
  begin
    v_recipient_user_id := (v_job.payload ->> 'recipientUserId')::uuid;
    v_actor_user_id := nullif(v_job.payload ->> 'actorUserId', '')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'invalid_notification_payload';
  end;
  if v_type is null or v_recipient_user_id is null then
    raise exception using errcode = '22023', message = 'invalid_notification_payload';
  end if;

  if v_job.payload ? 'conversationId' then
    v_target_type := 'conversation';
    v_target_id := v_job.payload ->> 'conversationId';
    select coalesce(
      (
        select ask.organization_id
        from public.asks ask
        where ask.conversation_id = c.id
        order by coalesce(ask.accepted_at, ask.created_at) desc, ask.id desc
        limit 1
      ),
      (
        select connection.origin_organization_id
        from public.connections connection
        where connection.user_a_id = c.user_a_id
          and connection.user_b_id = c.user_b_id
        limit 1
      )
    ) into v_organization_id
    from public.conversations c where c.id = v_target_id::uuid;
  elsif v_job.payload ? 'askId' then
    v_target_type := 'ask';
    v_target_id := v_job.payload ->> 'askId';
    select a.organization_id into v_organization_id
    from public.asks a where a.id = v_target_id::uuid;
  elsif v_job.payload ? 'offerId' then
    v_target_type := 'offer';
    v_target_id := v_job.payload ->> 'offerId';
    select ao.organization_id into v_organization_id
    from public.ask_offers ao where ao.id = v_target_id::uuid;
  elsif v_job.payload ? 'connectionRequestId' then
    v_target_type := 'connection_request';
    v_target_id := v_job.payload ->> 'connectionRequestId';
    select cr.origin_organization_id into v_organization_id
    from public.connection_requests cr where cr.id = v_target_id::uuid;
  elsif v_job.payload ? 'eventId' then
    v_target_type := 'event';
    v_target_id := v_job.payload ->> 'eventId';
    select e.organization_id into v_organization_id
    from public.events e where e.id = v_target_id::uuid;
  elsif v_job.payload ? 'announcementId' then
    v_target_type := 'announcement';
    v_target_id := v_job.payload ->> 'announcementId';
    select a.organization_id into v_organization_id
    from public.announcements a where a.id = v_target_id::uuid;
  else
    raise exception using errcode = '22023', message = 'invalid_notification_target';
  end if;
  if v_organization_id is null
     or not exists (
       select 1 from public.users u
       where u.id = v_recipient_user_id and u.account_state = 'active'
     ) then
    return query select 'not_available'::text, null::bigint, null::bigint;
    return;
  end if;

  select
    coalesce(np.in_app_enabled, true),
    coalesce(np.email_enabled, true)
    into v_in_app_enabled, v_email_enabled
  from (select 1) one
  left join public.notification_preferences np
    on np.user_id = v_recipient_user_id
   and np.notification_type = v_type;

  if v_in_app_enabled then
    insert into public.notifications (
      recipient_user_id, organization_id, actor_user_id, type,
      target_type, target_id, payload, dedupe_key
    ) values (
      v_recipient_user_id,
      v_organization_id,
      v_actor_user_id,
      v_type,
      v_target_type,
      v_target_id,
      jsonb_strip_nulls(jsonb_build_object(
        'askId', v_job.payload -> 'askId',
        'offerId', v_job.payload -> 'offerId',
        'conversationId', v_job.payload -> 'conversationId',
        'eventId', v_job.payload -> 'eventId',
        'event_title', v_job.payload -> 'eventTitle',
        'announcementId', v_job.payload -> 'announcementId',
        'title', v_job.payload -> 'announcementTitle'
      )),
      v_job.dedupe_key
    )
    on conflict (dedupe_key) do update
      set dedupe_key = excluded.dedupe_key
    returning id into v_notification_id;
  end if;

  if v_email_enabled and v_type in (
    'ask_received', 'ask_accepted', 'ask_declined', 'ask_reminder', 'ask_closed',
    'offer_received', 'offer_accepted', 'offer_declined', 'offer_closed',
    'circle_ask_match', 'circle_ask_closed', 'message_received',
    'announcement_published', 'event_changed', 'event_cancelled',
    'event_reminder', 'event_waitlist_spot_opened'
  ) then
    v_email_payload := jsonb_strip_nulls(jsonb_build_object(
      'notificationType', v_type,
      'recipientUserId', v_recipient_user_id,
      'actorUserId', v_actor_user_id,
      'askId', v_job.payload -> 'askId',
      'offerId', v_job.payload -> 'offerId',
      'conversationId', v_job.payload -> 'conversationId',
      'eventId', v_job.payload -> 'eventId',
      'announcementId', v_job.payload -> 'announcementId'
    ));
    perform private.enqueue_outbox(
      'send_email',
      v_email_payload,
      'send_email:' || v_job.dedupe_key
    );
    select j.id into v_email_job_id
    from private.outbox_jobs j
    where j.dedupe_key = 'send_email:' || v_job.dedupe_key;
  end if;

  return query select 'materialized'::text, v_notification_id, v_email_job_id;
end;
$$;

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
  select
    j.id,
    j.payload ->> 'notificationType',
    recipient.id,
    auth_recipient.email,
    recipient_profile.display_name,
    actor_profile.display_name,
    case
      when j.payload ? 'conversationId' then 'conversation'
      when j.payload ? 'askId' then 'ask'
      when j.payload ? 'offerId' then 'offer'
      when j.payload ? 'eventId' then 'event'
      when j.payload ? 'announcementId' then 'announcement'
      else null
    end,
    coalesce(
      j.payload ->> 'conversationId',
      j.payload ->> 'askId',
      j.payload ->> 'offerId',
      j.payload ->> 'eventId',
      j.payload ->> 'announcementId'
    ),
    'outbox:' || j.id::text,
    j.provider_result_id
  from private.outbox_jobs j
  join public.users recipient
    on recipient.id = (j.payload ->> 'recipientUserId')::uuid
   and recipient.account_state = 'active'
  join auth.users auth_recipient on auth_recipient.id = recipient.id
  join public.profiles recipient_profile on recipient_profile.user_id = recipient.id
  left join public.profiles actor_profile
    on actor_profile.user_id = nullif(j.payload ->> 'actorUserId', '')::uuid
  where j.id = p_job_id
    and j.job_type = 'send_email'
    and j.status = 'processing'
    and j.locked_by = p_worker_id;
$$;

revoke all on function private.reset_school_event_reminders_after_schedule_change()
from public, anon, authenticated;
