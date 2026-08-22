-- Event composer v2, task 01 — two contract changes to public.events:
--
-- 1. `campus` leaves the platform. It was a Chadwick-shaped enum hardcoded
--    into a tenant-generic table; its check constraint blocked any second
--    pilot organization. Member surfaces fall back to location/format labels.
-- 2. `ends_at` becomes optional end-to-end. The column was always nullable;
--    only the save RPC (and the zod schema, changed alongside) forced it.
--
-- Also drops the v1 save function: it has had no application caller since the
-- v2 cutover and its body inserts a literal campus value, which would break
-- the moment the column goes.
--
-- Removing a parameter changes a function's signature, so the old v2 save
-- signatures are dropped before the 21-arg replacements are created.
-- Initiative: engineering-spec-obsidian-vault/Initiatives/event-composer-v2.

drop function if exists api.save_admin_school_event(
  uuid, uuid, text, text, text, timestamptz, integer
);
drop function if exists private.save_admin_school_event(
  uuid, uuid, text, text, text, timestamptz, integer
);

drop function if exists api.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
);
drop function if exists private.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
);

alter table public.events drop constraint if exists events_campus_check;
alter table public.events drop column if exists campus;

-- ---------------------------------------------------------------------------
-- Save (create + update), minus p_campus, with an optional end time.
-- Body otherwise identical to 20260722010000_complete_admin_operations.sql.
-- ---------------------------------------------------------------------------

create function private.save_admin_school_event_v2(
  p_membership_id uuid,
  p_event_id uuid,
  p_title text,
  p_summary text,
  p_description text,
  p_category text,
  p_format text,
  p_time_zone text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_location_name text,
  p_location_address text,
  p_maps_url text,
  p_join_url text,
  p_join_window_minutes integer,
  p_host_name text,
  p_capacity integer,
  p_allow_waitlist boolean,
  p_change_note text,
  p_schedule jsonb,
  p_facts jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.school_admin_organization(p_membership_id);
  v_event_id uuid;
  v_existing public.events%rowtype;
  v_changed_at timestamptz;
  v_change_note text;
  v_schedule jsonb;
  v_facts jsonb;
  v_existing_schedule jsonb;
  v_existing_facts jsonb;
  v_recipient record;
  v_change_id uuid;
begin
  if v_org is null then return jsonb_build_object('resultCode', 'not_available'); end if;
  p_schedule := coalesce(p_schedule, '[]'::jsonb);
  p_facts := coalesce(p_facts, '[]'::jsonb);

  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 300
     or char_length(btrim(coalesce(p_summary, ''))) not between 1 and 500
     or p_description is not null and char_length(btrim(p_description)) > 20000
     or char_length(btrim(coalesce(p_category, ''))) not between 1 and 80
     or p_format is null or p_format not in ('in_person', 'online', 'hybrid')
     or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_time_zone)
     or p_starts_at is null
     or (p_ends_at is not null and p_ends_at <= p_starts_at)
     or char_length(btrim(coalesce(p_host_name, ''))) not between 1 and 200
     or p_capacity is not null and p_capacity <= 0
     or coalesce(p_allow_waitlist, false) and p_capacity is null
     or coalesce(p_join_window_minutes, 0) not between 15 and 1440
     or p_location_name is not null and char_length(btrim(p_location_name)) > 300
     or p_location_address is not null and char_length(btrim(p_location_address)) > 1000
     or p_change_note is not null and char_length(btrim(p_change_note)) > 1000
     or p_maps_url is not null and char_length(btrim(p_maps_url)) > 2000
     or p_join_url is not null and char_length(btrim(p_join_url)) > 2000
     or p_maps_url is not null and p_maps_url !~ '^https://'
     or p_join_url is not null and p_join_url !~ '^https://'
     or (p_format = 'online' and p_join_url is null)
     or (p_format = 'in_person' and char_length(btrim(coalesce(p_location_name, ''))) = 0)
     or (p_format = 'hybrid' and (
       char_length(btrim(coalesce(p_location_name, ''))) = 0 or p_join_url is null
     )) then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;

  if jsonb_typeof(p_schedule) <> 'array'
     or jsonb_typeof(p_facts) <> 'array' then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;
  if jsonb_array_length(p_schedule) > 30 or jsonb_array_length(p_facts) > 30 then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_schedule) item
    where jsonb_typeof(item.value) <> 'object'
  ) or exists (
    select 1 from jsonb_array_elements(p_facts) item
    where jsonb_typeof(item.value) <> 'object'
  ) then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_schedule) as item("startsAt" text, label text)
    where char_length(btrim(coalesce(item.label, ''))) not between 1 and 500
  ) or exists (
    select 1 from jsonb_to_recordset(p_facts) as fact(
      label text, value text, "linkLabel" text, "linkUrl" text
    )
    where char_length(btrim(coalesce(fact.label, ''))) not between 1 and 100
      or char_length(btrim(coalesce(fact.value, ''))) not between 1 and 1000
      or (fact."linkLabel" is null) <> (fact."linkUrl" is null)
      or fact."linkLabel" is not null
        and char_length(btrim(fact."linkLabel")) not between 1 and 100
      or fact."linkUrl" is not null and fact."linkUrl" !~ '^https://'
  ) then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'startsAt', nullif(item.value ->> 'startsAt', '')::timestamptz,
    'label', btrim(item.value ->> 'label')
  ) order by item.ordinality), '[]'::jsonb)
  into v_schedule
  from jsonb_array_elements(p_schedule) with ordinality as item(value, ordinality);

  select coalesce(jsonb_agg(jsonb_build_object(
    'label', btrim(item.value ->> 'label'),
    'value', btrim(item.value ->> 'value'),
    'linkLabel', nullif(btrim(item.value ->> 'linkLabel'), ''),
    'linkUrl', nullif(btrim(item.value ->> 'linkUrl'), '')
  ) order by item.ordinality), '[]'::jsonb)
  into v_facts
  from jsonb_array_elements(p_facts) with ordinality as item(value, ordinality);

  if p_event_id is null then
    if p_starts_at <= now() then return jsonb_build_object('resultCode', 'past_start'); end if;
    v_event_id := gen_random_uuid();
    insert into public.events (
      id, organization_id, created_by_membership_id, status, slug, category,
      title, summary, description, format, time_zone, location,
      location_name, location_address, maps_url, join_url, join_window_minutes,
      host_name, starts_at, ends_at, capacity, allow_waitlist, published_at
    ) values (
      v_event_id, v_org, p_membership_id, 'published', v_event_id::text,
      btrim(p_category), btrim(p_title), btrim(p_summary),
      nullif(btrim(p_description), ''), p_format, p_time_zone,
      nullif(btrim(p_location_name), ''), nullif(btrim(p_location_name), ''),
      nullif(btrim(p_location_address), ''), nullif(btrim(p_maps_url), ''),
      nullif(btrim(p_join_url), ''), p_join_window_minutes, btrim(p_host_name),
      p_starts_at, p_ends_at, p_capacity, coalesce(p_allow_waitlist, false), now()
    );
  else
    select * into v_existing from public.events
    where id = p_event_id and organization_id = v_org for update;
    if not found then return jsonb_build_object('resultCode', 'not_available'); end if;
    if v_existing.status = 'cancelled' then return jsonb_build_object('resultCode', 'cancelled'); end if;
    if p_starts_at <= now() and p_starts_at <> v_existing.starts_at then
      return jsonb_build_object('resultCode', 'past_start');
    end if;
    v_event_id := p_event_id;
    select coalesce(jsonb_agg(jsonb_build_object(
      'startsAt', item.starts_at, 'label', item.label
    ) order by item.position, item.id), '[]'::jsonb)
    into v_existing_schedule
    from public.event_schedule_items item where item.event_id = v_event_id;
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', fact.label, 'value', fact.value,
      'linkLabel', fact.link_label, 'linkUrl', fact.link_url
    ) order by fact.position, fact.id), '[]'::jsonb)
    into v_existing_facts
    from public.event_facts fact where fact.event_id = v_event_id;
    if (v_existing.title, v_existing.summary, v_existing.description,
        v_existing.category, v_existing.format, v_existing.time_zone,
        v_existing.starts_at, v_existing.ends_at,
        v_existing.location_name, v_existing.location_address, v_existing.maps_url,
        v_existing.join_url, v_existing.join_window_minutes, v_existing.host_name,
        v_existing.capacity, v_existing.allow_waitlist)
       is distinct from
       (btrim(p_title), btrim(p_summary), nullif(btrim(p_description), ''),
        btrim(p_category), p_format, p_time_zone, p_starts_at, p_ends_at,
        nullif(btrim(p_location_name), ''), nullif(btrim(p_location_address), ''),
        nullif(btrim(p_maps_url), ''), nullif(btrim(p_join_url), ''),
        p_join_window_minutes, btrim(p_host_name), p_capacity,
        coalesce(p_allow_waitlist, false))
       or v_existing_schedule is distinct from v_schedule
       or v_existing_facts is distinct from v_facts then
      v_changed_at := clock_timestamp();
      v_change_id := gen_random_uuid();
    end if;
    v_change_note := case when v_changed_at is null then v_existing.change_note
      else coalesce(nullif(btrim(p_change_note), ''),
        'The event details changed. Please review the current information.') end;

    update public.events set
      title = btrim(p_title), summary = btrim(p_summary),
      description = nullif(btrim(p_description), ''), category = btrim(p_category),
      format = p_format, time_zone = p_time_zone,
      location = nullif(btrim(p_location_name), ''),
      location_name = nullif(btrim(p_location_name), ''),
      location_address = nullif(btrim(p_location_address), ''),
      maps_url = nullif(btrim(p_maps_url), ''), join_url = nullif(btrim(p_join_url), ''),
      join_window_minutes = p_join_window_minutes, host_name = btrim(p_host_name),
      starts_at = p_starts_at, ends_at = p_ends_at, capacity = p_capacity,
      allow_waitlist = coalesce(p_allow_waitlist, false),
      changed_at = coalesce(v_changed_at, changed_at), change_note = v_change_note,
      updated_at = now()
    where id = v_event_id;
  end if;

  delete from public.event_schedule_items where event_id = v_event_id;
  insert into public.event_schedule_items (
    organization_id, event_id, position, starts_at, label
  )
  select v_org, v_event_id, (item.ordinality - 1)::smallint,
    nullif(item.value ->> 'startsAt', '')::timestamptz,
    btrim(item.value ->> 'label')
  from jsonb_array_elements(v_schedule) with ordinality as item(value, ordinality);

  delete from public.event_facts where event_id = v_event_id;
  insert into public.event_facts (
    organization_id, event_id, position, label, value, link_label, link_url
  )
  select v_org, v_event_id, (item.ordinality - 1)::smallint,
    btrim(item.value ->> 'label'), btrim(item.value ->> 'value'),
    nullif(btrim(item.value ->> 'linkLabel'), ''),
    nullif(btrim(item.value ->> 'linkUrl'), '')
  from jsonb_array_elements(v_facts) with ordinality as item(value, ordinality);

  if p_event_id is null then
    insert into private.audit_log (actor_user_id, organization_id, action, target_type, target_id)
    values ((select auth.uid()), v_org, 'school.event.created', 'event', v_event_id::text);
    return jsonb_build_object('resultCode', 'created', 'eventId', v_event_id);
  end if;

  if v_changed_at is not null then
    for v_recipient in
      select membership.user_id
      from public.event_rsvps response
      join public.organization_memberships membership
        on membership.id = response.organization_membership_id
      where response.event_id = v_event_id
        and response.status in ('going', 'waitlisted', 'offered')
    loop
      perform private.enqueue_outbox(
        'create_notification',
        jsonb_build_object(
          'type', 'event_changed', 'recipientUserId', v_recipient.user_id,
          'eventId', v_event_id, 'eventTitle', btrim(p_title)
        ),
        'event_changed:' || v_event_id::text || ':' || v_recipient.user_id::text || ':' ||
          v_change_id::text
      );
    end loop;
  end if;

  insert into private.audit_log (actor_user_id, organization_id, action, target_type, target_id)
  values ((select auth.uid()), v_org, 'school.event.updated', 'event', v_event_id::text);
  return jsonb_build_object('resultCode', 'updated', 'eventId', v_event_id);
exception
  when invalid_datetime_format or datetime_field_overflow then
    return jsonb_build_object('resultCode', 'invalid_input');
end;
$$;

create function api.save_admin_school_event_v2(
  p_membership_id uuid,
  p_event_id uuid default null,
  p_title text default null,
  p_summary text default null,
  p_description text default null,
  p_category text default null,
  p_format text default null,
  p_time_zone text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_location_name text default null,
  p_location_address text default null,
  p_maps_url text default null,
  p_join_url text default null,
  p_join_window_minutes integer default 60,
  p_host_name text default null,
  p_capacity integer default null,
  p_allow_waitlist boolean default false,
  p_change_note text default null,
  p_schedule jsonb default '[]'::jsonb,
  p_facts jsonb default '[]'::jsonb
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.save_admin_school_event_v2(
    p_membership_id, p_event_id, p_title, p_summary, p_description,
    p_category, p_format, p_time_zone, p_starts_at, p_ends_at,
    p_location_name, p_location_address, p_maps_url, p_join_url,
    p_join_window_minutes, p_host_name, p_capacity, p_allow_waitlist,
    p_change_note, p_schedule, p_facts
  );
$$;

revoke execute on function private.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
) from public, anon, authenticated;
revoke execute on function api.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
) from public, anon;
grant execute on function api.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin list projection, minus the campus key. Same signature; body otherwise
-- identical to 20260722010000_complete_admin_operations.sql.
-- ---------------------------------------------------------------------------

create or replace function private.get_admin_school_events(p_membership_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.school_admin_organization(p_membership_id);
  v_items jsonb;
begin
  if v_org is null then return jsonb_build_object('resultCode', 'not_available'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'status', e.status, 'title', e.title,
    'summary', e.summary, 'description', e.description,
    'category', e.category, 'format', e.format, 'timeZone', e.time_zone,
    'startsAt', e.starts_at, 'endsAt', e.ends_at,
    'location', e.location_name, 'locationAddress', e.location_address,
    'mapsUrl', e.maps_url, 'joinUrl', e.join_url,
    'joinWindowMinutes', e.join_window_minutes,
    'hostName', e.host_name, 'capacity', e.capacity,
    'allowWaitlist', e.allow_waitlist, 'changeNote', e.change_note,
    'schedule', coalesce((
      select jsonb_agg(jsonb_build_object(
        'startsAt', item.starts_at, 'label', item.label
      ) order by item.position, item.id)
      from public.event_schedule_items item where item.event_id = e.id
    ), '[]'::jsonb),
    'facts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', fact.label, 'value', fact.value,
        'linkLabel', fact.link_label, 'linkUrl', fact.link_url
      ) order by fact.position, fact.id)
      from public.event_facts fact where fact.event_id = e.id
    ), '[]'::jsonb),
    'goingCount', (
      select count(*)::integer from public.event_rsvps r
      where r.event_id = e.id and r.status = 'going'
    ), 'waitlistCount', (
      select count(*)::integer from public.event_rsvps r
      where r.event_id = e.id and r.status in ('waitlisted', 'offered')
    )
  ) order by e.starts_at desc, e.id desc), '[]'::jsonb)
  into v_items from public.events e where e.organization_id = v_org;
  return jsonb_build_object('resultCode', 'ok', 'items', v_items);
end;
$$;

-- ---------------------------------------------------------------------------
-- Member event projection, minus the campus key. Same signature; body
-- otherwise identical to 20260715190000_school_vertical_slice.sql (as amended
-- by 20260722010000).
-- ---------------------------------------------------------------------------

create or replace function private.school_event_json(
  p_membership_id uuid,
  p_event_id uuid,
  p_include_details boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer record;
  v_event public.events%rowtype;
  v_rsvp public.event_rsvps%rowtype;
  v_going_count integer;
  v_circle_count integer;
  v_join_url text;
  v_phase text;
begin
  select m.user_id, m.organization_id into v_viewer
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
    and m.user_id = (select auth.uid())
    and m.status = 'active';
  if not found then return null; end if;

  select * into v_event
  from public.events e
  where e.id = p_event_id
    and e.organization_id = v_viewer.organization_id
    and e.status in ('published', 'cancelled');
  if not found then return null; end if;

  select * into v_rsvp
  from public.event_rsvps r
  where r.event_id = v_event.id
    and r.organization_membership_id = p_membership_id;

  select count(*)::integer into v_going_count
  from public.event_rsvps r
  where r.event_id = v_event.id and r.status = 'going';

  select count(*)::integer into v_circle_count
  from public.event_rsvps r
  join public.organization_memberships attendee on attendee.id = r.organization_membership_id
  where r.event_id = v_event.id
    and r.status = 'going'
    and attendee.user_id <> v_viewer.user_id
    and private.is_connected(v_viewer.user_id, attendee.user_id)
    and not private.is_blocked(v_viewer.user_id, attendee.user_id);

  v_phase := case
    when v_event.status = 'cancelled' then 'cancelled'
    when coalesce(v_event.ends_at, v_event.starts_at) <= now() then 'past'
    when v_event.changed_at is not null then 'changed'
    else 'upcoming'
  end;

  if p_include_details
     and v_event.format in ('online', 'hybrid')
     and v_rsvp.status = 'going'
     and now() >= v_event.starts_at - make_interval(mins => v_event.join_window_minutes)
     and now() < coalesce(v_event.ends_at, v_event.starts_at + interval '12 hours') then
    v_join_url := v_event.join_url;
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'id', v_event.id,
    'slug', v_event.slug,
    'status', v_event.status,
    'phase', v_phase,
    'category', v_event.category,
    'title', v_event.title,
    'summary', v_event.summary,
    'description', case when p_include_details then v_event.description end,
    'format', v_event.format,
    'timeZone', v_event.time_zone,
    'startsAt', v_event.starts_at,
    'endsAt', v_event.ends_at,
    'locationName', v_event.location_name,
    'locationAddress', case when p_include_details then v_event.location_address end,
    'mapsUrl', case when p_include_details then v_event.maps_url end,
    'joinUrl', v_join_url,
    'hostName', coalesce(
      (select coalesce(p.preferred_name, p.display_name)
       from public.organization_memberships hm
       join public.profiles p on p.user_id = hm.user_id
       where hm.id = v_event.host_membership_id),
      v_event.host_name
    ),
    'hostUserId', case when p_include_details then (
      select hm.user_id from public.organization_memberships hm
      where hm.id = v_event.host_membership_id
    ) end,
    'capacity', v_event.capacity,
    'spotsLeft', case when v_event.capacity is null then null else
      greatest(0, v_event.capacity - (
        select count(*)::integer from public.event_rsvps r
        where r.event_id = v_event.id and r.status in ('going', 'offered')
      ))
    end,
    'allowWaitlist', v_event.allow_waitlist,
    'viewerRsvp', case when v_rsvp.event_id is null then 'none' else v_rsvp.status end,
    'offerExpiresAt', v_rsvp.offer_expires_at,
    'goingCount', v_going_count,
    'circleGoingCount', v_circle_count,
    'changedAt', v_event.changed_at,
    'changeNote', v_event.change_note,
    'cancellationNote', v_event.cancellation_note,
    'schedule', case when p_include_details then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', item.id, 'position', item.position,
        'startsAt', item.starts_at, 'label', item.label
      ) order by item.position, item.id)
      from public.event_schedule_items item where item.event_id = v_event.id
    ), '[]'::jsonb) end,
    'facts', case when p_include_details then coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', fact.id, 'position', fact.position, 'label', fact.label,
        'value', fact.value, 'linkLabel', fact.link_label, 'linkUrl', fact.link_url
      )) order by fact.position, fact.id)
      from public.event_facts fact where fact.event_id = v_event.id
    ), '[]'::jsonb) end
  ));
end;
$$;
