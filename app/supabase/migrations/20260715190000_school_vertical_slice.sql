-- BridgeCircle database v2 — School vertical slice.
-- Member School access is fixed-API only. A waitlisted member is offered a
-- held spot and must explicitly accept; no command auto-commits attendance.

-- ---------------------------------------------------------------------------
-- School content model
-- ---------------------------------------------------------------------------

alter table public.events
  add column slug text,
  add column category text not null default 'General',
  add column summary text,
  add column format text not null default 'in_person',
  add column time_zone text not null default 'America/Los_Angeles',
  add column campus text not null default 'palos_verdes',
  add column location_name text,
  add column location_address text,
  add column maps_url text,
  add column join_url text,
  add column host_membership_id uuid,
  add column host_name text,
  add column allow_waitlist boolean not null default true,
  add column join_window_minutes integer not null default 60,
  add column changed_at timestamptz,
  add column change_note text,
  add column cancellation_note text;

update public.events
set slug = id::text,
    summary = coalesce(nullif(btrim(description), ''), title),
    location_name = nullif(btrim(location), ''),
    host_name = 'Alumni Office';

alter table public.events
  alter column slug set not null,
  add constraint events_org_slug_key unique (organization_id, slug),
  add constraint events_host_fk
    foreign key (organization_id, host_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete set null,
  add constraint events_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add constraint events_category_check
    check (char_length(btrim(category)) between 1 and 80),
  add constraint events_summary_check
    check (summary is null or char_length(btrim(summary)) between 1 and 500),
  add constraint events_format_check
    check (format in ('in_person', 'online', 'hybrid')),
  add constraint events_time_zone_check
    check (time_zone ~ '^[A-Za-z_]+(?:/[A-Za-z0-9_+.-]+)+$'),
  add constraint events_campus_check
    check (campus in ('palos_verdes', 'songdo', 'other', 'online')),
  add constraint events_location_name_check
    check (location_name is null or char_length(btrim(location_name)) between 1 and 300),
  add constraint events_location_address_check
    check (location_address is null or char_length(btrim(location_address)) between 1 and 1000),
  add constraint events_maps_url_check
    check (maps_url is null or maps_url ~ '^https://'),
  add constraint events_join_url_check
    check (join_url is null or join_url ~ '^https://'),
  add constraint events_format_location_check check (
    (format = 'online' and join_url is not null)
    or (format = 'in_person' and location_name is not null)
    or (format = 'hybrid' and location_name is not null and join_url is not null)
  ),
  add constraint events_host_check check (
    host_membership_id is not null
    or (host_name is not null and char_length(btrim(host_name)) between 1 and 200)
  ),
  add constraint events_join_window_check
    check (join_window_minutes between 15 and 1440),
  add constraint events_change_check check (
    (changed_at is null and change_note is null)
    or (changed_at is not null and change_note is not null
      and char_length(btrim(change_note)) between 1 and 1000)
  ),
  add constraint events_cancellation_note_check
    check (cancellation_note is null or char_length(btrim(cancellation_note)) between 1 and 1000);

create index events_school_hub_idx
  on public.events (organization_id, starts_at, id)
  where status in ('published', 'cancelled');
create index events_host_membership_idx
  on public.events (host_membership_id)
  where host_membership_id is not null;
create index events_org_host_membership_idx
  on public.events (organization_id, host_membership_id)
  where host_membership_id is not null;

create table public.event_schedule_items (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_id uuid not null,
  position smallint not null,
  starts_at timestamptz,
  label text not null,
  constraint event_schedule_event_fk
    foreign key (organization_id, event_id)
    references public.events(organization_id, id)
    on delete cascade,
  constraint event_schedule_position_check check (position between 0 and 100),
  constraint event_schedule_label_check check (char_length(btrim(label)) between 1 and 500),
  constraint event_schedule_event_position_key unique (event_id, position)
);

create index event_schedule_event_idx
  on public.event_schedule_items (event_id, position, id);
create index event_schedule_org_event_idx
  on public.event_schedule_items (organization_id, event_id);

create table public.event_facts (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_id uuid not null,
  position smallint not null,
  label text not null,
  value text not null,
  link_label text,
  link_url text,
  constraint event_facts_event_fk
    foreign key (organization_id, event_id)
    references public.events(organization_id, id)
    on delete cascade,
  constraint event_facts_position_check check (position between 0 and 100),
  constraint event_facts_label_check check (char_length(btrim(label)) between 1 and 100),
  constraint event_facts_value_check check (char_length(btrim(value)) between 1 and 1000),
  constraint event_facts_link_pair_check check ((link_label is null) = (link_url is null)),
  constraint event_facts_link_label_check
    check (link_label is null or char_length(btrim(link_label)) between 1 and 100),
  constraint event_facts_link_url_check check (link_url is null or link_url ~ '^https://'),
  constraint event_facts_event_position_key unique (event_id, position)
);

create index event_facts_event_idx on public.event_facts (event_id, position, id);
create index event_facts_org_event_idx on public.event_facts (organization_id, event_id);

alter table public.event_rsvps drop constraint event_rsvps_status_check;
alter table public.event_rsvps
  add column offered_at timestamptz,
  add column offer_expires_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add constraint event_rsvps_status_check
    check (status in ('going', 'waitlisted', 'offered', 'not_going')),
  add constraint event_rsvps_offer_state_check check (
    (status = 'offered' and offered_at is not null and offer_expires_at > offered_at)
    or (status <> 'offered' and offered_at is null and offer_expires_at is null)
  );

create index event_rsvps_open_offer_idx
  on public.event_rsvps (offer_expires_at, event_id, organization_membership_id)
  where status = 'offered';
create index event_rsvps_membership_upcoming_idx
  on public.event_rsvps (organization_membership_id, status, event_id)
  where status in ('going', 'offered', 'waitlisted');

alter table public.announcements
  add column tag text not null default 'general',
  add column summary text,
  add constraint announcements_tag_check
    check (tag in ('mentorship', 'hiring', 'reunion', 'general')),
  add constraint announcements_summary_check
    check (summary is null or char_length(btrim(summary)) between 1 and 500);

create table public.announcement_reads (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  announcement_id uuid not null,
  organization_membership_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (announcement_id, organization_membership_id),
  constraint announcement_reads_announcement_fk
    foreign key (announcement_id)
    references public.announcements(id)
    on delete cascade,
  constraint announcement_reads_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade
);

create index announcement_reads_membership_idx
  on public.announcement_reads (organization_membership_id, read_at desc, announcement_id);
create index announcement_reads_org_membership_idx
  on public.announcement_reads (organization_id, organization_membership_id);

create table public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  slug text not null,
  issue_number integer not null,
  status text not null default 'draft',
  title text not null,
  summary text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_issues_org_id_key unique (organization_id, id),
  constraint newsletter_issues_org_slug_key unique (organization_id, slug),
  constraint newsletter_issues_org_number_key unique (organization_id, issue_number),
  constraint newsletter_issues_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint newsletter_issues_number_check check (issue_number > 0),
  constraint newsletter_issues_status_check check (status in ('draft', 'published', 'archived')),
  constraint newsletter_issues_title_check check (char_length(btrim(title)) between 1 and 300),
  constraint newsletter_issues_summary_check
    check (summary is null or char_length(btrim(summary)) between 1 and 1000),
  constraint newsletter_issues_publish_check check (status = 'draft' or published_at is not null)
);

create index newsletter_issues_archive_idx
  on public.newsletter_issues (organization_id, published_at desc, id desc)
  where status in ('published', 'archived');

create table public.newsletter_sections (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  issue_id uuid not null,
  position smallint not null,
  heading text not null,
  body text not null,
  link_label text,
  link_url text,
  constraint newsletter_sections_issue_fk
    foreign key (organization_id, issue_id)
    references public.newsletter_issues(organization_id, id)
    on delete cascade,
  constraint newsletter_sections_position_check check (position between 0 and 100),
  constraint newsletter_sections_heading_check check (char_length(btrim(heading)) between 1 and 300),
  constraint newsletter_sections_body_check check (char_length(btrim(body)) between 1 and 20000),
  constraint newsletter_sections_link_pair_check check ((link_label is null) = (link_url is null)),
  constraint newsletter_sections_link_label_check
    check (link_label is null or char_length(btrim(link_label)) between 1 and 200),
  constraint newsletter_sections_link_url_check check (link_url is null or link_url ~ '^https://'),
  constraint newsletter_sections_issue_position_key unique (issue_id, position)
);

create index newsletter_sections_issue_idx
  on public.newsletter_sections (issue_id, position, id);
create index newsletter_sections_org_issue_idx
  on public.newsletter_sections (organization_id, issue_id);

-- School notification vocabulary.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'connection_requested', 'connection_accepted',
  'ask_received', 'ask_accepted', 'ask_declined', 'ask_reminder', 'ask_closed',
  'offer_received', 'offer_accepted', 'offer_declined', 'offer_closed',
  'circle_ask_match', 'circle_ask_closed', 'message_received',
  'announcement_published', 'event_changed', 'event_cancelled',
  'event_reminder', 'event_waitlist_spot_opened', 'profile_update_ready'
));
alter table public.notification_preferences drop constraint notification_preferences_type_check;
alter table public.notification_preferences add constraint notification_preferences_type_check check (
  notification_type in (
    'connection_requested', 'connection_accepted',
    'ask_received', 'ask_accepted', 'ask_declined', 'ask_reminder', 'ask_closed',
    'offer_received', 'offer_accepted', 'offer_declined', 'offer_closed',
    'circle_ask_match', 'circle_ask_closed', 'message_received',
    'announcement_published', 'event_changed', 'event_cancelled',
    'event_reminder', 'event_waitlist_spot_opened', 'profile_update_ready'
  )
);

-- ---------------------------------------------------------------------------
-- Projection helpers
-- ---------------------------------------------------------------------------

create function private.school_event_json(
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

  if v_event.format in ('online', 'hybrid')
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
    'campus', v_event.campus,
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

create function private.get_school_home(p_membership_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org record;
  v_result jsonb;
begin
  select m.organization_id, o.name into v_org
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  join public.organizations o on o.id = m.organization_id
  where m.id = p_membership_id
    and m.user_id = (select auth.uid())
    and m.status = 'active';
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;

  select jsonb_build_object(
    'resultCode', 'ok',
    'organization', jsonb_build_object('id', v_org.organization_id, 'name', v_org.name),
    'events', coalesce((
      select jsonb_agg(private.school_event_json(p_membership_id, e.id, false)
        order by case when r.status in ('going', 'offered') then 0 else 1 end, e.starts_at, e.id)
      from public.events e
      left join public.event_rsvps r
        on r.event_id = e.id and r.organization_membership_id = p_membership_id
      where e.organization_id = v_org.organization_id
        and e.status = 'published'
        and coalesce(e.ends_at, e.starts_at) > now()
    ), '[]'::jsonb),
    'announcements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'tag', a.tag, 'title', a.title,
        'summary', coalesce(a.summary, left(a.body, 240)),
        'pinned', a.pinned, 'publishedAt', a.published_at,
        'unread', ar.announcement_id is null
      ) order by a.pinned desc, a.published_at desc, a.id desc)
      from (
        select * from public.announcements source
        where source.organization_id = v_org.organization_id
          and source.status = 'published'
        order by source.pinned desc, source.published_at desc, source.id desc
        limit 5
      ) a
      left join public.announcement_reads ar
        on ar.announcement_id = a.id and ar.organization_membership_id = p_membership_id
    ), '[]'::jsonb),
    'latestNewsletter', (
      select jsonb_build_object(
        'id', n.id, 'slug', n.slug, 'issueNumber', n.issue_number,
        'title', n.title, 'summary', n.summary, 'publishedAt', n.published_at
      )
      from public.newsletter_issues n
      where n.organization_id = v_org.organization_id
        and n.status in ('published', 'archived')
      order by n.published_at desc, n.id desc
      limit 1
    )
  ) into v_result;
  return v_result;
end;
$$;

create function private.get_school_event(p_membership_id uuid, p_event_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when projection is null
    then jsonb_build_object('resultCode', 'not_available')
    else jsonb_build_object('resultCode', 'ok', 'event', projection)
  end
  from (select private.school_event_json(p_membership_id, p_event_id, true) projection) value;
$$;

create function private.list_school_event_attendees(
  p_membership_id uuid,
  p_event_id uuid,
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer record;
  v_visible_count integer;
  v_hidden_count integer;
  v_items jsonb;
begin
  select m.user_id, m.organization_id into v_viewer
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id and m.user_id = (select auth.uid()) and m.status = 'active';
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;

  perform 1
  from public.events e
  where e.id = p_event_id and e.organization_id = v_viewer.organization_id
    and e.status in ('published', 'cancelled');
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;

  with eligible as (
    select m.id membership_id, m.user_id, r.responded_at,
      private.is_connected(v_viewer.user_id, m.user_id) in_circle,
      not private.is_blocked(v_viewer.user_id, m.user_id)
        and u.account_state = 'active' and m.status = 'active' and p.user_id is not null visible,
      p.display_name, p.preferred_name, p.avatar_path, op.graduation_year
    from public.event_rsvps r
    join public.organization_memberships m on m.id = r.organization_membership_id
    join public.users u on u.id = m.user_id
    left join public.profiles p on p.user_id = m.user_id
    left join public.organization_profiles op on op.organization_membership_id = m.id
    where r.event_id = p_event_id and r.status = 'going'
  ), counts as (
    select count(*) filter (where visible)::integer visible_count,
      count(*) filter (where not visible)::integer hidden_count
    from eligible
  ), items as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'membershipId', visible.membership_id,
      'userId', visible.user_id,
      'displayName', visible.display_name,
      'preferredName', visible.preferred_name,
      'avatarPath', visible.avatar_path,
      'graduationYear', visible.graduation_year,
      'inCircle', visible.in_circle
    ) order by visible.in_circle desc, visible.responded_at, visible.membership_id), '[]'::jsonb) value
    from (
      select * from eligible where visible
      order by in_circle desc, responded_at, membership_id
      limit greatest(1, least(coalesce(p_limit, 50), 100))
    ) visible
  )
  select counts.visible_count, counts.hidden_count, items.value
    into v_visible_count, v_hidden_count, v_items
  from counts cross join items;

  return jsonb_build_object(
    'resultCode', 'ok',
    'totalCount', v_visible_count + case when v_hidden_count >= 3 then v_hidden_count else 0 end,
    'hiddenCount', case when v_hidden_count >= 3 then v_hidden_count else 0 end,
    'items', v_items
  );
end;
$$;

create function private.list_school_announcements(
  p_membership_id uuid,
  p_tag text default 'all',
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_items jsonb;
begin
  if p_tag not in ('all', 'mentorship', 'hiring', 'reunion', 'general') then
    raise exception using errcode = '22023', message = 'invalid_announcement_tag';
  end if;
  select m.organization_id into v_org
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id and m.user_id = (select auth.uid()) and m.status = 'active';
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', rows.id, 'tag', rows.tag, 'title', rows.title,
    'summary', coalesce(rows.summary, left(rows.body, 240)),
    'pinned', rows.pinned, 'publishedAt', rows.published_at,
    'unread', rows.read_at is null
  ) order by rows.pinned desc, rows.published_at desc, rows.id desc), '[]'::jsonb)
  into v_items
  from (
    select a.*, ar.read_at
    from public.announcements a
    left join public.announcement_reads ar
      on ar.announcement_id = a.id and ar.organization_membership_id = p_membership_id
    where a.organization_id = v_org and a.status = 'published'
      and (p_tag = 'all' or a.tag = p_tag)
    order by a.pinned desc, a.published_at desc, a.id desc
    limit greatest(1, least(coalesce(p_limit, 50), 100))
  ) rows;
  return jsonb_build_object('resultCode', 'ok', 'items', v_items);
end;
$$;

create function private.get_school_announcement(p_membership_id uuid, p_announcement_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_item jsonb;
begin
  select m.organization_id into v_org
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id and m.user_id = (select auth.uid()) and m.status = 'active';
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;
  select jsonb_build_object(
    'id', a.id, 'tag', a.tag, 'title', a.title, 'body', a.body,
    'pinned', a.pinned, 'publishedAt', a.published_at,
    'authorName', coalesce(p.preferred_name, p.display_name)
  ) into v_item
  from public.announcements a
  left join public.organization_memberships author on author.id = a.author_membership_id
  left join public.profiles p on p.user_id = author.user_id
  where a.id = p_announcement_id and a.organization_id = v_org and a.status = 'published';
  return case when v_item is null then jsonb_build_object('resultCode', 'not_available')
    else jsonb_build_object('resultCode', 'ok', 'announcement', v_item) end;
end;
$$;

create function private.mark_school_announcement_read(
  p_membership_id uuid,
  p_announcement_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select m.organization_id into v_org
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id and m.user_id = (select auth.uid()) and m.status = 'active';
  if not found then return 'not_available'; end if;
  if not exists (
    select 1 from public.announcements a
    where a.id = p_announcement_id and a.organization_id = v_org and a.status = 'published'
  ) then return 'not_available'; end if;
  insert into public.announcement_reads (
    organization_id, announcement_id, organization_membership_id, read_at
  ) values (v_org, p_announcement_id, p_membership_id, now())
  on conflict (announcement_id, organization_membership_id) do update
    set read_at = least(public.announcement_reads.read_at, excluded.read_at);
  return 'read';
end;
$$;

create function private.list_newsletter_issues(p_membership_id uuid, p_limit integer default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_items jsonb;
begin
  select m.organization_id into v_org
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id and m.user_id = (select auth.uid()) and m.status = 'active';
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', rows.id, 'slug', rows.slug, 'issueNumber', rows.issue_number,
    'title', rows.title, 'summary', rows.summary, 'publishedAt', rows.published_at
  ) order by rows.published_at desc, rows.id desc), '[]'::jsonb)
  into v_items
  from (
    select * from public.newsletter_issues n
    where n.organization_id = v_org and n.status in ('published', 'archived')
    order by n.published_at desc, n.id desc
    limit greatest(1, least(coalesce(p_limit, 50), 100))
  ) rows;
  return jsonb_build_object('resultCode', 'ok', 'items', v_items);
end;
$$;

create function private.get_newsletter_issue(p_membership_id uuid, p_issue_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_issue jsonb;
begin
  select m.organization_id into v_org
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id and m.user_id = (select auth.uid()) and m.status = 'active';
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;
  select jsonb_build_object(
    'id', n.id, 'slug', n.slug, 'issueNumber', n.issue_number,
    'title', n.title, 'summary', n.summary, 'publishedAt', n.published_at,
    'sections', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', s.id, 'position', s.position, 'heading', s.heading,
        'body', s.body, 'linkLabel', s.link_label, 'linkUrl', s.link_url
      )) order by s.position, s.id)
      from public.newsletter_sections s where s.issue_id = n.id
    ), '[]'::jsonb)
  ) into v_issue
  from public.newsletter_issues n
  where n.organization_id = v_org and n.slug = p_issue_slug
    and n.status in ('published', 'archived');
  return case when v_issue is null then jsonb_build_object('resultCode', 'not_available')
    else jsonb_build_object('resultCode', 'ok', 'issue', v_issue) end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Transactional RSVP / held-offer lifecycle
-- ---------------------------------------------------------------------------

create function private.offer_next_school_waiter(p_event_id uuid, p_now timestamptz)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_waiter record;
  v_taken integer;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.capacity is null or not v_event.allow_waitlist
     or v_event.status <> 'published' or v_event.starts_at <= p_now then return null; end if;
  select count(*)::integer into v_taken from public.event_rsvps
  where event_id = p_event_id and status in ('going', 'offered');
  if v_taken >= v_event.capacity then return null; end if;

  select r.organization_membership_id, m.user_id into v_waiter
  from public.event_rsvps r
  join public.organization_memberships m on m.id = r.organization_membership_id
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where r.event_id = p_event_id and r.status = 'waitlisted' and m.status = 'active'
  order by r.responded_at, r.organization_membership_id
  for update of r skip locked
  limit 1;
  if not found then return null; end if;

  update public.event_rsvps
  set status = 'offered', offered_at = p_now,
      offer_expires_at = least(p_now + interval '1 day', v_event.starts_at),
      updated_at = p_now
  where event_id = p_event_id and organization_membership_id = v_waiter.organization_membership_id;

  perform private.enqueue_outbox(
    'create_notification',
    jsonb_build_object(
      'type', 'event_waitlist_spot_opened',
      'recipientUserId', v_waiter.user_id,
      'eventId', p_event_id,
      'eventTitle', v_event.title
    ),
    'event_waitlist_spot:' || p_event_id::text || ':' ||
      v_waiter.organization_membership_id::text || ':' ||
      extract(epoch from p_now)::bigint::text
  );
  return v_waiter.organization_membership_id;
end;
$$;

create function private.respond_school_event(
  p_membership_id uuid,
  p_event_id uuid,
  p_intent text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_current public.event_rsvps%rowtype;
  v_taken integer;
  v_final text;
  v_now timestamptz := now();
  v_released boolean := false;
begin
  if p_intent not in ('going', 'not_going', 'join_waitlist', 'accept_offer', 'pass_offer') then
    raise exception using errcode = '22023', message = 'invalid_event_response_intent';
  end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status <> 'published' or v_event.starts_at <= v_now then return 'not_open'; end if;
  perform 1
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id and m.user_id = (select auth.uid())
    and m.status = 'active' and m.organization_id = v_event.organization_id;
  if not found then return 'not_available'; end if;

  select * into v_current from public.event_rsvps
  where event_id = p_event_id and organization_membership_id = p_membership_id
  for update;

  if p_intent = 'accept_offer' then
    if v_current.status <> 'offered' then return 'not_offered'; end if;
    if v_current.offer_expires_at <= v_now then
      update public.event_rsvps set status = 'not_going', offered_at = null,
        offer_expires_at = null, responded_at = v_now, updated_at = v_now
      where event_id = p_event_id and organization_membership_id = p_membership_id;
      perform private.offer_next_school_waiter(p_event_id, v_now);
      return 'offer_expired';
    end if;
    update public.event_rsvps set status = 'going', offered_at = null,
      offer_expires_at = null, responded_at = v_now, updated_at = v_now
    where event_id = p_event_id and organization_membership_id = p_membership_id;
    return 'going';
  end if;

  if p_intent = 'pass_offer' then
    if v_current.status <> 'offered' then return 'not_offered'; end if;
    update public.event_rsvps set status = 'not_going', offered_at = null,
      offer_expires_at = null, responded_at = v_now, updated_at = v_now
    where event_id = p_event_id and organization_membership_id = p_membership_id;
    perform private.offer_next_school_waiter(p_event_id, v_now);
    return 'not_going';
  end if;

  if p_intent = 'not_going' then
    v_released := v_current.status in ('going', 'offered');
    insert into public.event_rsvps (
      organization_id, event_id, organization_membership_id, status,
      responded_at, offered_at, offer_expires_at, updated_at
    ) values (
      v_event.organization_id, p_event_id, p_membership_id, 'not_going',
      v_now, null, null, v_now
    ) on conflict (event_id, organization_membership_id) do update
      set status = 'not_going', responded_at = excluded.responded_at,
          offered_at = null, offer_expires_at = null, updated_at = excluded.updated_at;
    if v_released then perform private.offer_next_school_waiter(p_event_id, v_now); end if;
    return 'not_going';
  end if;

  select count(*)::integer into v_taken from public.event_rsvps r
  where r.event_id = p_event_id and r.status in ('going', 'offered')
    and r.organization_membership_id <> p_membership_id;
  if v_event.capacity is null or v_taken < v_event.capacity then
    v_final := 'going';
  elsif v_event.allow_waitlist then
    v_final := 'waitlisted';
  else
    return 'full';
  end if;
  if p_intent = 'join_waitlist' and v_event.capacity is not null and v_taken >= v_event.capacity then
    v_final := 'waitlisted';
  end if;
  insert into public.event_rsvps (
    organization_id, event_id, organization_membership_id, status,
    responded_at, offered_at, offer_expires_at, updated_at
  ) values (
    v_event.organization_id, p_event_id, p_membership_id, v_final,
    v_now, null, null, v_now
  ) on conflict (event_id, organization_membership_id) do update
    set status = excluded.status, responded_at = excluded.responded_at,
        offered_at = null, offer_expires_at = null, updated_at = excluded.updated_at;
  return v_final;
end;
$$;

create function private.run_school_maintenance(p_now timestamptz default now(), p_limit integer default 100)
returns table(expired_offers integer, opened_offers integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer record;
  v_expired integer := 0;
  v_opened integer := 0;
begin
  for v_offer in
    select r.event_id, r.organization_membership_id
    from public.event_rsvps r
    where r.status = 'offered' and r.offer_expires_at <= p_now
    order by r.offer_expires_at, r.event_id, r.organization_membership_id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 1000))
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
  return query select v_expired, v_opened;
end;
$$;

-- ---------------------------------------------------------------------------
-- Minimal fixed admin seam for the existing School administration surfaces
-- ---------------------------------------------------------------------------

create function private.school_admin_organization(p_membership_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.organization_memberships m
  where m.id = p_membership_id
    and private.owns_membership(m.id, m.organization_id)
    and private.is_admin_of(m.organization_id);
$$;

create function private.get_admin_school_events(p_membership_id uuid)
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
    'description', e.description, 'location', e.location_name,
    'startsAt', e.starts_at, 'endsAt', e.ends_at,
    'capacity', e.capacity, 'goingCount', (
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

create function private.save_admin_school_event(
  p_membership_id uuid,
  p_event_id uuid,
  p_title text,
  p_description text,
  p_location text,
  p_starts_at timestamptz,
  p_capacity integer
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
  v_recipient record;
begin
  if v_org is null then return jsonb_build_object('resultCode', 'not_available'); end if;
  if char_length(btrim(p_title)) not between 1 and 300
     or p_location is null or char_length(btrim(p_location)) not between 1 and 300
     or p_starts_at is null or p_capacity is not null and p_capacity <= 0 then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;

  if p_event_id is null then
    if p_starts_at <= now() then return jsonb_build_object('resultCode', 'past_start'); end if;
    v_event_id := gen_random_uuid();
    insert into public.events (
      id, organization_id, created_by_membership_id, status, slug, category,
      title, summary, description, format, time_zone, campus, location,
      location_name, host_name, starts_at, ends_at, capacity, published_at
    ) values (
      v_event_id, v_org, p_membership_id, 'published', v_event_id::text, 'General',
      btrim(p_title), coalesce(nullif(btrim(p_description), ''), btrim(p_title)),
      nullif(btrim(p_description), ''), 'in_person', 'America/Los_Angeles',
      'palos_verdes', btrim(p_location), btrim(p_location), 'the Alumni Office',
      p_starts_at, p_starts_at + interval '2 hours', p_capacity, now()
    );
    insert into private.audit_log (actor_user_id, organization_id, action, target_type, target_id)
    values ((select auth.uid()), v_org, 'school.event.created', 'event', v_event_id::text);
    return jsonb_build_object('resultCode', 'created', 'eventId', v_event_id);
  end if;

  select * into v_existing from public.events
  where id = p_event_id and organization_id = v_org for update;
  if not found then return jsonb_build_object('resultCode', 'not_available'); end if;
  if p_starts_at <= now() and p_starts_at <> v_existing.starts_at then
    return jsonb_build_object('resultCode', 'past_start');
  end if;
  if v_existing.status = 'cancelled' then
    return jsonb_build_object('resultCode', 'cancelled');
  end if;
  if (v_existing.title, v_existing.starts_at, v_existing.location_name, v_existing.capacity)
     is distinct from (btrim(p_title), p_starts_at, btrim(p_location), p_capacity) then
    v_changed_at := now();
  end if;
  update public.events set
    title = btrim(p_title),
    summary = coalesce(nullif(btrim(p_description), ''), btrim(p_title)),
    description = nullif(btrim(p_description), ''),
    location = btrim(p_location),
    location_name = btrim(p_location),
    starts_at = p_starts_at,
    ends_at = case when ends_at is null then p_starts_at + interval '2 hours'
      else p_starts_at + (ends_at - starts_at) end,
    capacity = p_capacity,
    changed_at = coalesce(v_changed_at, changed_at),
    change_note = case when v_changed_at is null then change_note
      else 'The event details changed. Please review the current time and place.' end,
    updated_at = now()
  where id = p_event_id;

  if v_changed_at is not null then
    for v_recipient in
      select m.user_id
      from public.event_rsvps r
      join public.organization_memberships m on m.id = r.organization_membership_id
      where r.event_id = p_event_id and r.status in ('going', 'waitlisted', 'offered')
    loop
      perform private.enqueue_outbox(
        'create_notification',
        jsonb_build_object(
          'type', 'event_changed', 'recipientUserId', v_recipient.user_id,
          'eventId', p_event_id, 'eventTitle', btrim(p_title)
        ),
        'event_changed:' || p_event_id::text || ':' || v_recipient.user_id::text || ':' ||
          extract(epoch from v_changed_at)::bigint::text
      );
    end loop;
  end if;
  insert into private.audit_log (actor_user_id, organization_id, action, target_type, target_id)
  values ((select auth.uid()), v_org, 'school.event.updated', 'event', p_event_id::text);
  return jsonb_build_object('resultCode', 'updated', 'eventId', p_event_id);
end;
$$;

create function private.cancel_admin_school_event(
  p_membership_id uuid,
  p_event_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.school_admin_organization(p_membership_id);
  v_event public.events%rowtype;
  v_now timestamptz := now();
  v_recipient record;
begin
  if v_org is null then return 'not_available'; end if;
  select * into v_event from public.events
  where id = p_event_id and organization_id = v_org for update;
  if not found then return 'not_available'; end if;
  if v_event.status = 'cancelled' then return 'already_cancelled'; end if;
  update public.events set status = 'cancelled', cancelled_at = v_now,
    cancellation_note = coalesce(nullif(btrim(p_reason), ''), 'This event was cancelled.'),
    updated_at = v_now where id = p_event_id;
  for v_recipient in
    select m.user_id
    from public.event_rsvps r
    join public.organization_memberships m on m.id = r.organization_membership_id
    where r.event_id = p_event_id and r.status in ('going', 'waitlisted', 'offered')
  loop
    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'event_cancelled', 'recipientUserId', v_recipient.user_id,
        'eventId', p_event_id, 'eventTitle', v_event.title
      ),
      'event_cancelled:' || p_event_id::text || ':' || v_recipient.user_id::text
    );
  end loop;
  insert into private.audit_log (actor_user_id, organization_id, action, target_type, target_id, payload)
  values ((select auth.uid()), v_org, 'school.event.cancelled', 'event', p_event_id::text,
    jsonb_build_object('reason', p_reason));
  return 'cancelled';
end;
$$;

create function private.delete_admin_school_event(p_membership_id uuid, p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.school_admin_organization(p_membership_id);
  v_title text;
begin
  if v_org is null then return 'not_available'; end if;
  select title into v_title from public.events
  where id = p_event_id and organization_id = v_org for update;
  if not found then return 'not_available'; end if;
  if exists (select 1 from public.event_rsvps where event_id = p_event_id) then
    return 'has_responses';
  end if;
  delete from public.events where id = p_event_id;
  insert into private.audit_log (actor_user_id, organization_id, action, target_type, target_id, payload)
  values ((select auth.uid()), v_org, 'school.event.deleted', 'event', p_event_id::text,
    jsonb_build_object('title', v_title));
  return 'deleted';
end;
$$;

create function private.get_admin_school_announcements(p_membership_id uuid)
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
    'id', a.id, 'tag', a.tag, 'title', a.title, 'body', a.body,
    'pinned', a.pinned, 'publishedAt', a.published_at
  ) order by a.published_at desc nulls last, a.id desc), '[]'::jsonb)
  into v_items from public.announcements a where a.organization_id = v_org;
  return jsonb_build_object('resultCode', 'ok', 'items', v_items);
end;
$$;

create function private.publish_admin_school_announcement(
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
declare
  v_org uuid := private.school_admin_organization(p_membership_id);
  v_id uuid := gen_random_uuid();
  v_recipient record;
begin
  if v_org is null then return jsonb_build_object('resultCode', 'not_available'); end if;
  if char_length(btrim(p_title)) not between 1 and 300
     or char_length(btrim(p_body)) not between 1 and 50000
     or p_tag not in ('mentorship', 'hiring', 'reunion', 'general') then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;
  insert into public.announcements (
    id, organization_id, author_membership_id, status, tag, title,
    summary, body, pinned, published_at
  ) values (
    v_id, v_org, p_membership_id, 'published', p_tag, btrim(p_title),
    left(btrim(p_body), 500), btrim(p_body), coalesce(p_pinned, false), now()
  );
  for v_recipient in
    select m.user_id from public.organization_memberships m
    join public.users u on u.id = m.user_id and u.account_state = 'active'
    where m.organization_id = v_org and m.status = 'active'
      and m.id <> p_membership_id
  loop
    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'announcement_published', 'recipientUserId', v_recipient.user_id,
        'announcementId', v_id, 'announcementTitle', btrim(p_title)
      ),
      'announcement_published:' || v_id::text || ':' || v_recipient.user_id::text
    );
  end loop;
  insert into private.audit_log (actor_user_id, organization_id, action, target_type, target_id)
  values ((select auth.uid()), v_org, 'school.announcement.published', 'announcement', v_id::text);
  return jsonb_build_object('resultCode', 'published', 'announcementId', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Public API wrappers and privilege boundary
-- ---------------------------------------------------------------------------

create function api.get_school_home(p_membership_id uuid)
returns jsonb language sql security definer set search_path = ''
as $$ select private.get_school_home(p_membership_id); $$;
create function api.get_school_event(p_membership_id uuid, p_event_id uuid)
returns jsonb language sql security definer set search_path = ''
as $$ select private.get_school_event(p_membership_id, p_event_id); $$;
create function api.list_school_event_attendees(p_membership_id uuid, p_event_id uuid, p_limit integer default 50)
returns jsonb language sql security definer set search_path = ''
as $$ select private.list_school_event_attendees(p_membership_id, p_event_id, p_limit); $$;
create function api.respond_school_event(p_membership_id uuid, p_event_id uuid, p_intent text)
returns text language sql security definer set search_path = ''
as $$ select private.respond_school_event(p_membership_id, p_event_id, p_intent); $$;
create function api.list_school_announcements(p_membership_id uuid, p_tag text default 'all', p_limit integer default 50)
returns jsonb language sql security definer set search_path = ''
as $$ select private.list_school_announcements(p_membership_id, p_tag, p_limit); $$;
create function api.get_school_announcement(p_membership_id uuid, p_announcement_id uuid)
returns jsonb language sql security definer set search_path = ''
as $$ select private.get_school_announcement(p_membership_id, p_announcement_id); $$;
create function api.mark_school_announcement_read(p_membership_id uuid, p_announcement_id uuid)
returns text language sql security definer set search_path = ''
as $$ select private.mark_school_announcement_read(p_membership_id, p_announcement_id); $$;
create function api.list_newsletter_issues(p_membership_id uuid, p_limit integer default 50)
returns jsonb language sql security definer set search_path = ''
as $$ select private.list_newsletter_issues(p_membership_id, p_limit); $$;
create function api.get_newsletter_issue(p_membership_id uuid, p_issue_slug text)
returns jsonb language sql security definer set search_path = ''
as $$ select private.get_newsletter_issue(p_membership_id, p_issue_slug); $$;
create function api.run_school_maintenance(p_now timestamptz default now(), p_limit integer default 100)
returns table(expired_offers integer, opened_offers integer)
language sql security definer set search_path = ''
as $$ select * from private.run_school_maintenance(p_now, p_limit); $$;
create function api.get_admin_school_events(p_membership_id uuid)
returns jsonb language sql security definer set search_path = ''
as $$ select private.get_admin_school_events(p_membership_id); $$;
create function api.save_admin_school_event(
  p_membership_id uuid, p_event_id uuid default null, p_title text default null,
  p_description text default null, p_location text default null,
  p_starts_at timestamptz default null, p_capacity integer default null
)
returns jsonb language sql security definer set search_path = ''
as $$ select private.save_admin_school_event(
  p_membership_id, p_event_id, p_title, p_description, p_location, p_starts_at, p_capacity
); $$;
create function api.cancel_admin_school_event(
  p_membership_id uuid, p_event_id uuid, p_reason text default null
)
returns text language sql security definer set search_path = ''
as $$ select private.cancel_admin_school_event(p_membership_id, p_event_id, p_reason); $$;
create function api.delete_admin_school_event(p_membership_id uuid, p_event_id uuid)
returns text language sql security definer set search_path = ''
as $$ select private.delete_admin_school_event(p_membership_id, p_event_id); $$;
create function api.get_admin_school_announcements(p_membership_id uuid)
returns jsonb language sql security definer set search_path = ''
as $$ select private.get_admin_school_announcements(p_membership_id); $$;
create function api.publish_admin_school_announcement(
  p_membership_id uuid, p_title text, p_body text, p_tag text, p_pinned boolean default false
)
returns jsonb language sql security definer set search_path = ''
as $$ select private.publish_admin_school_announcement(
  p_membership_id, p_title, p_body, p_tag, p_pinned
); $$;

alter table public.event_schedule_items enable row level security;
alter table public.event_facts enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.newsletter_issues enable row level security;
alter table public.newsletter_sections enable row level security;

revoke select on public.events, public.event_rsvps, public.announcements from authenticated;
revoke all on public.event_schedule_items, public.event_facts, public.announcement_reads,
  public.newsletter_issues, public.newsletter_sections from public, anon, authenticated;

drop function api.set_event_rsvp(uuid, uuid, text);
drop function private.set_event_rsvp(uuid, uuid, text);

revoke execute on function
  api.get_school_home(uuid),
  api.get_school_event(uuid, uuid),
  api.list_school_event_attendees(uuid, uuid, integer),
  api.respond_school_event(uuid, uuid, text),
  api.list_school_announcements(uuid, text, integer),
  api.get_school_announcement(uuid, uuid),
  api.mark_school_announcement_read(uuid, uuid),
  api.list_newsletter_issues(uuid, integer),
  api.get_newsletter_issue(uuid, text),
  api.run_school_maintenance(timestamptz, integer),
  api.get_admin_school_events(uuid),
  api.save_admin_school_event(uuid, uuid, text, text, text, timestamptz, integer),
  api.cancel_admin_school_event(uuid, uuid, text),
  api.delete_admin_school_event(uuid, uuid),
  api.get_admin_school_announcements(uuid),
  api.publish_admin_school_announcement(uuid, text, text, text, boolean)
from public, anon, authenticated;

revoke execute on function
  private.school_event_json(uuid, uuid, boolean),
  private.get_school_home(uuid),
  private.get_school_event(uuid, uuid),
  private.list_school_event_attendees(uuid, uuid, integer),
  private.list_school_announcements(uuid, text, integer),
  private.get_school_announcement(uuid, uuid),
  private.mark_school_announcement_read(uuid, uuid),
  private.list_newsletter_issues(uuid, integer),
  private.get_newsletter_issue(uuid, text),
  private.offer_next_school_waiter(uuid, timestamptz),
  private.respond_school_event(uuid, uuid, text),
  private.run_school_maintenance(timestamptz, integer),
  private.school_admin_organization(uuid),
  private.get_admin_school_events(uuid),
  private.save_admin_school_event(uuid, uuid, text, text, text, timestamptz, integer),
  private.cancel_admin_school_event(uuid, uuid, text),
  private.delete_admin_school_event(uuid, uuid),
  private.get_admin_school_announcements(uuid),
  private.publish_admin_school_announcement(uuid, text, text, text, boolean)
from public, anon, authenticated;

grant execute on function api.get_school_home(uuid) to authenticated;
grant execute on function api.get_school_event(uuid, uuid) to authenticated;
grant execute on function api.list_school_event_attendees(uuid, uuid, integer) to authenticated;
grant execute on function api.respond_school_event(uuid, uuid, text) to authenticated;
grant execute on function api.list_school_announcements(uuid, text, integer) to authenticated;
grant execute on function api.get_school_announcement(uuid, uuid) to authenticated;
grant execute on function api.mark_school_announcement_read(uuid, uuid) to authenticated;
grant execute on function api.list_newsletter_issues(uuid, integer) to authenticated;
grant execute on function api.get_newsletter_issue(uuid, text) to authenticated;
grant execute on function api.get_admin_school_events(uuid) to authenticated;
grant execute on function api.save_admin_school_event(uuid, uuid, text, text, text, timestamptz, integer) to authenticated;
grant execute on function api.cancel_admin_school_event(uuid, uuid, text) to authenticated;
grant execute on function api.delete_admin_school_event(uuid, uuid) to authenticated;
grant execute on function api.get_admin_school_announcements(uuid) to authenticated;
grant execute on function api.publish_admin_school_announcement(uuid, text, text, text, boolean) to authenticated;
grant execute on function api.run_school_maintenance(timestamptz, integer) to service_role;

grant all privileges on public.event_schedule_items, public.event_facts,
  public.announcement_reads, public.newsletter_issues, public.newsletter_sections to service_role;
grant usage, select on all sequences in schema public to service_role;
