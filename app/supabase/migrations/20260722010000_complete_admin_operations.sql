-- Complete the minimum admin operating surfaces approved by the UI/UX audit:
-- private report review, accountable membership rejection reasons, and the
-- full member-facing School event authoring contract.

-- ---------------------------------------------------------------------------
-- Moderation queue
-- ---------------------------------------------------------------------------

create or replace function private.moderation_admin_organization(p_membership_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select membership.organization_id
  from public.organization_memberships membership
  join public.admin_role_assignments role
    on role.organization_id = membership.organization_id
   and role.organization_membership_id = membership.id
  join public.users actor on actor.id = membership.user_id
  where membership.id = p_membership_id
    and membership.user_id = (select auth.uid())
    and membership.status = 'active'
    and actor.account_state = 'active'
    and role.role in ('super_admin', 'admin')
  order by case role.role when 'super_admin' then 0 else 1 end
  limit 1;
$$;

create or replace function private.list_admin_reports(
  p_membership_id uuid,
  p_status text default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid := private.moderation_admin_organization(p_membership_id);
  v_items jsonb;
begin
  if v_organization_id is null then
    return jsonb_build_object('resultCode', 'not_available');
  end if;
  if p_status is not null and p_status not in ('open', 'reviewing', 'actioned', 'dismissed') then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', report.id,
    'status', report.status,
    'reason', report.reason,
    'note', report.note,
    'targetType', report.target_type,
    'targetId', report.target_id,
    'reporterName', reporter.display_name,
    'reportedName', reported.display_name,
    'evidence', report.evidence_snapshot,
    'assignedToUserId', report.assigned_to_user_id,
    'resolvedAt', report.resolved_at,
    'createdAt', report.created_at,
    'updatedAt', report.updated_at,
    'latestAction', latest_action.item
  ) order by
    case report.status when 'open' then 0 when 'reviewing' then 1 else 2 end,
    report.created_at,
    report.id), '[]'::jsonb)
  into v_items
  from private.reports report
  left join public.profiles reporter on reporter.user_id = report.reporter_user_id
  left join public.profiles reported on reported.user_id = report.reported_user_id
  left join lateral (
    select jsonb_build_object(
      'type', action.action_type,
      'note', action.private_note,
      'createdAt', action.created_at
    ) as item
    from private.moderation_actions action
    where action.report_id = report.id
    order by action.created_at desc, action.id desc
    limit 1
  ) latest_action on true
  where report.organization_id = v_organization_id
    and (p_status is null or report.status = p_status)
    and report.id in (
      select candidate.id
      from private.reports candidate
      where candidate.organization_id = v_organization_id
        and (p_status is null or candidate.status = p_status)
      order by
        case candidate.status when 'open' then 0 when 'reviewing' then 1 else 2 end,
        candidate.created_at,
        candidate.id
      limit greatest(1, least(coalesce(p_limit, 100), 200))
    );

  return jsonb_build_object('resultCode', 'ok', 'items', v_items);
end;
$$;

create or replace function private.decide_admin_report(
  p_membership_id uuid,
  p_report_id uuid,
  p_decision text,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_organization_id uuid := private.moderation_admin_organization(p_membership_id);
  v_report private.reports%rowtype;
  v_status text;
  v_action text;
begin
  if v_organization_id is null then return 'not_available'; end if;
  if p_decision is null
     or p_decision not in ('start_review', 'dismiss', 'mark_actioned') then
    return 'invalid_input';
  end if;
  if p_note is not null and char_length(btrim(p_note)) not between 1 and 10000 then
    return 'invalid_input';
  end if;

  select * into v_report
  from private.reports report
  where report.id = p_report_id and report.organization_id = v_organization_id
  for update;
  if not found then return 'not_available'; end if;

  if (p_decision = 'start_review' and v_report.status <> 'open')
     or (p_decision = 'dismiss' and v_report.status not in ('open', 'reviewing'))
     or (p_decision = 'mark_actioned' and v_report.status <> 'reviewing') then
    return 'stale';
  end if;
  if p_decision in ('dismiss', 'mark_actioned')
     and char_length(btrim(coalesce(p_note, ''))) not between 1 and 10000 then
    return 'invalid_input';
  end if;

  v_status := case p_decision
    when 'start_review' then 'reviewing'
    when 'dismiss' then 'dismissed'
    when 'mark_actioned' then 'actioned'
  end;
  v_action := case p_decision
    when 'start_review' then 'report.review_started'
    when 'dismiss' then 'report.dismissed'
    when 'mark_actioned' then 'report.actioned'
  end;

  update private.reports
  set status = v_status,
      assigned_to_user_id = v_actor_user_id,
      resolved_at = case when v_status in ('actioned', 'dismissed') then now() else null end,
      updated_at = now()
  where id = p_report_id;

  insert into private.moderation_actions (
    report_id, actor_admin_user_id, action_type, private_note
  ) values (
    p_report_id, v_actor_user_id, v_action, nullif(btrim(p_note), '')
  );

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id,
    payload
  ) values (
    v_actor_user_id, v_organization_id, v_action, 'report', p_report_id::text,
    jsonb_build_object('status', v_status)
  );

  return v_status;
end;
$$;

create or replace function api.list_admin_reports(
  p_membership_id uuid,
  p_status text default null,
  p_limit integer default 100
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$ select private.list_admin_reports(p_membership_id, p_status, p_limit); $$;

create or replace function api.decide_admin_report(
  p_membership_id uuid,
  p_report_id uuid,
  p_decision text,
  p_note text default null
)
returns text
language sql
security definer
set search_path = ''
as $$ select private.decide_admin_report(p_membership_id, p_report_id, p_decision, p_note); $$;

revoke execute on function private.list_admin_reports(uuid, text, integer) from public, anon, authenticated;
revoke execute on function private.decide_admin_report(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function private.moderation_admin_organization(uuid) from public, anon, authenticated;
revoke execute on function api.list_admin_reports(uuid, text, integer) from public, anon;
revoke execute on function api.decide_admin_report(uuid, uuid, text, text) from public, anon;
grant execute on function api.list_admin_reports(uuid, text, integer) to authenticated;
grant execute on function api.decide_admin_report(uuid, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Membership rejection reason
-- ---------------------------------------------------------------------------

create table private.membership_rejection_details (
  membership_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  reason_code text not null,
  private_note text,
  decided_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint membership_rejection_details_membership_fk
    foreign key (organization_id, membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint membership_rejection_details_reason_check
    check (reason_code in ('could_not_verify', 'not_eligible', 'duplicate_request', 'other')),
  constraint membership_rejection_details_note_check
    check (private_note is null or char_length(btrim(private_note)) between 1 and 4000)
);

create index if not exists membership_rejection_details_org_membership_idx
  on private.membership_rejection_details (organization_id, membership_id);
create index if not exists membership_rejection_details_decider_idx
  on private.membership_rejection_details (decided_by_user_id)
  where decided_by_user_id is not null;

alter table private.membership_rejection_details enable row level security;
alter table private.membership_rejection_details force row level security;
revoke all on private.membership_rejection_details from public, anon, authenticated;
grant all on private.membership_rejection_details to service_role;

alter function private.decide_membership(uuid, text)
  rename to decide_membership_pre_admin_operations;
revoke execute on function private.decide_membership_pre_admin_operations(uuid, text)
  from public, anon, authenticated, service_role;

create or replace function private.decide_membership_with_reason(
  p_membership_id uuid,
  p_decision text,
  p_reason_code text default null,
  p_private_note text default null
)
returns table (result_code text, membership_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result record;
  v_membership record;
  v_recorded_membership_id uuid;
begin
  if p_decision is null
     or p_decision not in ('approve', 'reject')
     or (p_decision = 'reject' and coalesce(p_reason_code, '') not in (
        'could_not_verify', 'not_eligible', 'duplicate_request', 'other'
      ))
     or (p_decision = 'approve' and (p_reason_code is not null or p_private_note is not null))
     or (p_private_note is not null
       and char_length(btrim(p_private_note)) not between 1 and 4000) then
    return query select 'invalid_reason'::text, null::text;
    return;
  end if;

  select * into v_result
  from private.decide_membership_pre_admin_operations(p_membership_id, p_decision);

  if v_result.result_code in ('not_found', 'not_authorized') then
    return query select 'not_available'::text, null::text;
    return;
  end if;

  if v_result.result_code = 'rejected' then
    select membership.organization_id, membership.id into v_membership
    from public.organization_memberships membership
    where membership.id = p_membership_id;

    insert into private.membership_rejection_details (
      membership_id, organization_id, reason_code, private_note, decided_by_user_id
    ) values (
      v_membership.id, v_membership.organization_id, p_reason_code,
      nullif(btrim(p_private_note), ''), (select auth.uid())
    )
    on conflict (membership_id) do nothing
    returning membership_id into v_recorded_membership_id;

    if v_recorded_membership_id is not null then
      insert into private.audit_log (
        actor_user_id, organization_id, action, target_type, target_id, payload
      ) values (
        (select auth.uid()), v_membership.organization_id,
        'membership.rejection_reason_recorded', 'membership', p_membership_id::text,
        jsonb_build_object('reasonCode', p_reason_code)
      );
    end if;
  end if;

  return query select v_result.result_code::text, v_result.membership_status::text;
end;
$$;

-- Keep the baseline private compatibility boundary safe for the deploy window
-- and existing RLS callers. A legacy rejection still creates a durable reason.
create or replace function private.decide_membership(
  p_membership_id uuid,
  p_decision text
)
returns table (result_code text, membership_status text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_decision is null or p_decision not in ('approve', 'reject') then
    return query select 'invalid_decision'::text, null::text;
    return;
  end if;
  if p_decision = 'reject' then
    return query select * from private.decide_membership_with_reason(
      p_membership_id,
      p_decision,
      'other',
      'Rejected through the legacy compatibility command.'
    );
    return;
  end if;
  return query
  select
    case when decision.result_code in ('not_found', 'not_authorized')
      then 'not_available' else decision.result_code end,
    case when decision.result_code in ('not_found', 'not_authorized')
      then null else decision.membership_status end
  from private.decide_membership_pre_admin_operations(
    p_membership_id, p_decision
  ) decision;
end;
$$;

create or replace function api.decide_membership_with_reason(
  p_membership_id uuid,
  p_decision text,
  p_reason_code text default null,
  p_private_note text default null
)
returns table (result_code text, membership_status text)
language sql
security definer
set search_path = ''
as $$
  select * from private.decide_membership_with_reason(
    p_membership_id, p_decision, p_reason_code, p_private_note
  );
$$;

-- Preserve the old API signature during deploys; the private compatibility
-- boundary now makes both direct and wrapped legacy calls accountable.
create or replace function api.decide_membership(
  p_membership_id uuid,
  p_decision text
)
returns table (result_code text, membership_status text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query select * from private.decide_membership(p_membership_id, p_decision);
end;
$$;

revoke execute on function private.decide_membership_with_reason(uuid, text, text, text)
  from public, anon, authenticated;
revoke execute on function private.decide_membership(uuid, text) from public, anon;
revoke execute on function api.decide_membership(uuid, text) from public, anon;
revoke execute on function api.decide_membership_with_reason(uuid, text, text, text)
  from public, anon;
grant execute on function api.decide_membership(uuid, text) to authenticated;
grant execute on function api.decide_membership_with_reason(uuid, text, text, text)
  to authenticated;
grant execute on function private.decide_membership(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Complete School event authoring
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
    'campus', e.campus, 'startsAt', e.starts_at, 'endsAt', e.ends_at,
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

create or replace function private.save_admin_school_event_v2(
  p_membership_id uuid,
  p_event_id uuid,
  p_title text,
  p_summary text,
  p_description text,
  p_category text,
  p_format text,
  p_time_zone text,
  p_campus text,
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
     or p_campus is null or p_campus not in ('palos_verdes', 'songdo', 'other', 'online')
     or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_time_zone)
     or p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at
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
      title, summary, description, format, time_zone, campus, location,
      location_name, location_address, maps_url, join_url, join_window_minutes,
      host_name, starts_at, ends_at, capacity, allow_waitlist, published_at
    ) values (
      v_event_id, v_org, p_membership_id, 'published', v_event_id::text,
      btrim(p_category), btrim(p_title), btrim(p_summary),
      nullif(btrim(p_description), ''), p_format, p_time_zone, p_campus,
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
        v_existing.campus, v_existing.starts_at, v_existing.ends_at,
        v_existing.location_name, v_existing.location_address, v_existing.maps_url,
        v_existing.join_url, v_existing.join_window_minutes, v_existing.host_name,
        v_existing.capacity, v_existing.allow_waitlist)
       is distinct from
       (btrim(p_title), btrim(p_summary), nullif(btrim(p_description), ''),
        btrim(p_category), p_format, p_time_zone, p_campus, p_starts_at, p_ends_at,
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
      format = p_format, time_zone = p_time_zone, campus = p_campus,
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

create or replace function api.save_admin_school_event_v2(
  p_membership_id uuid,
  p_event_id uuid default null,
  p_title text default null,
  p_summary text default null,
  p_description text default null,
  p_category text default null,
  p_format text default null,
  p_time_zone text default null,
  p_campus text default null,
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
    p_category, p_format, p_time_zone, p_campus, p_starts_at, p_ends_at,
    p_location_name, p_location_address, p_maps_url, p_join_url,
    p_join_window_minutes, p_host_name, p_capacity, p_allow_waitlist,
    p_change_note, p_schedule, p_facts
  );
$$;

revoke execute on function private.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
) from public, anon, authenticated;
revoke execute on function api.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
) from public, anon;
grant execute on function api.save_admin_school_event_v2(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz,
  timestamptz, text, text, text, text, integer, text, integer, boolean,
  text, jsonb, jsonb
) to authenticated;

-- The School hub is a list projection. Even an attendee inside the join
-- window receives the online link only from the event-detail projection.
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

-- Keep full-admin membership visibility separate from the event-moderator
-- capability used by School authoring. Event moderators may manage events but
-- may not inspect pending or rejected membership rows.
create or replace function private.is_full_admin_of(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.admin_role_assignments role
      on role.organization_id = membership.organization_id
     and role.organization_membership_id = membership.id
    join public.users actor on actor.id = membership.user_id
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and actor.account_state = 'active'
      and role.role in ('super_admin', 'admin')
  );
$$;

revoke execute on function private.is_full_admin_of(uuid) from public, anon;
grant execute on function private.is_full_admin_of(uuid) to authenticated;

drop policy if exists memberships_select_same_org on public.organization_memberships;
create policy memberships_select_same_org on public.organization_memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      status = 'active'
      and (select private.is_active_member_of(organization_id))
    )
    or (select private.is_full_admin_of(organization_id))
  );

-- Account-export objects use the authenticated member's user id as the first
-- path segment. The lifecycle predicate also requires the exact object to be
-- the caller's current ready, unexpired export so Storage cannot bypass the
-- fixed download RPC's availability contract.
create or replace function private.can_download_account_export(
  p_bucket text,
  p_path text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.account_export_requests request
    join public.users account on account.id = request.user_id
    where request.user_id = (select auth.uid())
      and account.account_state = 'active'
      and request.status = 'ready'
      and request.expires_at > now()
      and request.storage_bucket = p_bucket
      and request.storage_path = p_path
  );
$$;

revoke execute on function private.can_download_account_export(text, text)
  from public, anon;
grant execute on function private.can_download_account_export(text, text)
  to authenticated;

drop policy if exists account_exports_owner_select on storage.objects;
create policy account_exports_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'account-exports'
    and (select private.can_download_account_export(bucket_id, name))
  );
