-- Day 18: admin analytics dashboard.
--
-- Six aggregated metric sources, scoped per organization. All accessed
-- server-side via the service_role client (admin path is already gated by
-- requireAdmin), so we don't add RLS — we revoke from anon/authenticated
-- and grant to service_role only. This keeps the queries cheap (no policy
-- evaluation) and keeps the surface deliberately admin-only.
--
-- Future work intentionally not in this migration:
--   - time-series buckets for sparklines (would require generate_series +
--     date_trunc rewrites; tracked as a follow-up)
--   - parameterized date ranges (would require turning views into functions
--     with from/to args; tracked as a follow-up)

-- =============================================================================
-- Helper function: distinct active members who signed in within a window.
-- security_definer because last_sign_in_at lives in auth.users which is
-- otherwise restricted. Returns a count only — no PII leaks out.
-- =============================================================================
create or replace function analytics_active_signed_in_count(
  _org    uuid,
  _within interval default '30 days'
) returns int
language sql
security definer
set search_path = public, auth
as $$
  select count(distinct om.user_id)::int
  from organization_memberships om
  join auth.users au on au.id = om.user_id
  where om.organization_id = _org
    and om.status = 'active'
    and au.last_sign_in_at is not null
    and au.last_sign_in_at > now() - _within
$$;

revoke all on function analytics_active_signed_in_count(uuid, interval) from public;
revoke all on function analytics_active_signed_in_count(uuid, interval) from anon;
revoke all on function analytics_active_signed_in_count(uuid, interval) from authenticated;
grant execute on function analytics_active_signed_in_count(uuid, interval) to service_role;

-- =============================================================================
-- View 1: invited → active conversion (last 30d).
-- Numerator: invites in last 30d whose accepted_by user is now an active
-- member of the same org. Denominator: all invites in last 30d.
-- =============================================================================
create or replace view analytics_invited_to_active as
  select
    i.organization_id,
    count(*)::int as invited_30d,
    count(*) filter (
      where i.status = 'accepted'
        and i.accepted_by is not null
        and exists (
          select 1
          from organization_memberships om
          where om.user_id = i.accepted_by
            and om.organization_id = i.organization_id
            and om.status = 'active'
        )
    )::int as became_active_30d
  from invites i
  where i.created_at > now() - interval '30 days'
  group by i.organization_id;

-- =============================================================================
-- View 2: mentorship request volume + 7-day response rate (last 30d).
-- Response rate denominator only counts requests at least 7d old (newer
-- requests haven't had time to be eligible).
-- =============================================================================
create or replace view analytics_mentorship_30d as
  select
    organization_id,
    count(*)::int as total_requests,
    count(*) filter (where created_at < now() - interval '7 days')::int
      as eligible_for_response_check,
    count(*) filter (
      where created_at < now() - interval '7 days'
        and responded_at is not null
        and responded_at - created_at <= interval '7 days'
    )::int as responded_within_7d
  from mentorship_requests
  where created_at > now() - interval '30 days'
  group by organization_id;

-- =============================================================================
-- View 3: profile freshness (% of active members whose base_profile was
-- updated in the last 6 months). Uses left join so members with no profile
-- row count as stale (they exist but have nothing).
-- =============================================================================
create or replace view analytics_profile_freshness as
  select
    om.organization_id,
    count(distinct om.user_id)::int as total_active,
    count(distinct om.user_id) filter (
      where bp.updated_at is not null
        and bp.updated_at > now() - interval '6 months'
    )::int as fresh_profiles
  from organization_memberships om
  left join base_profiles bp on bp.user_id = om.user_id
  where om.status = 'active'
  group by om.organization_id;

-- =============================================================================
-- View 4: upcoming-event RSVP activity. Counts going + waitlist across all
-- published, future events.
-- =============================================================================
create or replace view analytics_upcoming_rsvps as
  select
    e.organization_id,
    count(distinct e.id)::int as upcoming_events,
    count(r.*) filter (where r.status = 'going')::int as going_count,
    count(r.*) filter (where r.status = 'waitlisted')::int as waitlist_count
  from events e
  left join event_rsvps r on r.event_id = e.id
  where e.starts_at > now()
    and e.published_at is not null
  group by e.organization_id;

-- =============================================================================
-- View 5: total active membership count per org. Cheap and used as the
-- denominator for "mentorship request rate". Kept as its own view so the
-- lib only needs one query path.
-- =============================================================================
create or replace view analytics_active_membership_count as
  select
    organization_id,
    count(*)::int as active_members
  from organization_memberships
  where status = 'active'
  group by organization_id;

-- =============================================================================
-- Permissions: views default to inheriting underlying RLS; we additionally
-- restrict to service_role to make the admin-only intent explicit.
-- =============================================================================
revoke all on analytics_invited_to_active        from public, anon, authenticated;
revoke all on analytics_mentorship_30d           from public, anon, authenticated;
revoke all on analytics_profile_freshness        from public, anon, authenticated;
revoke all on analytics_upcoming_rsvps           from public, anon, authenticated;
revoke all on analytics_active_membership_count  from public, anon, authenticated;

grant select on analytics_invited_to_active        to service_role;
grant select on analytics_mentorship_30d           to service_role;
grant select on analytics_profile_freshness        to service_role;
grant select on analytics_upcoming_rsvps           to service_role;
grant select on analytics_active_membership_count  to service_role;
