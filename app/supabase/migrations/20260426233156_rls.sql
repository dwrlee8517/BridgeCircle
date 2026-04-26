-- Row-Level Security for all 20 Phase 1 tables.
-- See docs/data-model.md for table-by-table rationale.
-- Visibility model: org-scoped reads, owner-only writes, admin overrides for moderation.
-- Field-level redaction (e.g. contact links friends-only) lives in app code at launch
-- since friendships ship in week 3+.

-- =============================================================================
-- Helper functions
-- =============================================================================
-- All helpers use SECURITY DEFINER + explicit search_path so they bypass RLS
-- internally. Without that, calling these from policies on the same tables
-- (e.g. organization_memberships) would recurse infinitely.

create function public.is_active_member_of(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_memberships
    where user_id = auth.uid()
      and organization_id = org_id
      and status = 'active'
  );
$$;

create function public.is_admin_of(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_role_assignments
    where user_id = auth.uid()
      and organization_id = org_id
      and role in ('super_admin', 'admin')
  );
$$;

create function public.shares_org_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_memberships m1
    join organization_memberships m2 on m2.organization_id = m1.organization_id
    where m1.user_id = auth.uid()
      and m1.status = 'active'
      and m2.user_id = other_user_id
      and m2.status = 'active'
  );
$$;

-- =============================================================================
-- Enable RLS on every table
-- =============================================================================
-- Once enabled, all access from the authenticated and anon roles is denied
-- until at least one policy grants it. service_role bypasses RLS entirely.

alter table organizations              enable row level security;
alter table users                      enable row level security;
alter table organization_memberships   enable row level security;
alter table base_profiles              enable row level security;
alter table organization_profiles      enable row level security;
alter table invites                    enable row level security;
alter table mentorship_preferences     enable row level security;
alter table mentorship_requests        enable row level security;
alter table mentorship_threads         enable row level security;
alter table messages                   enable row level security;
alter table events                     enable row level security;
alter table event_rsvps                enable row level security;
alter table admin_role_assignments     enable row level security;
alter table audit_log                  enable row level security;
alter table friend_requests            enable row level security;
alter table friendships                enable row level security;
alter table direct_message_threads     enable row level security;
alter table announcements              enable row level security;
alter table notifications              enable row level security;
alter table profile_refresh_prompts    enable row level security;
alter table saved_searches             enable row level security;

-- =============================================================================
-- organizations
-- =============================================================================
-- Members read their own orgs (so the app can render org name/slug).
-- All writes go through service_role (org creation is a Phase 2+ admin flow).

create policy "members read their orgs" on organizations
  for select to authenticated
  using (is_active_member_of(id));

-- =============================================================================
-- users (shadow of auth.users)
-- =============================================================================
-- A user reads their own row plus any active org-mate. Profile data lives in
-- base_profiles; this table only carries auth shadow flags. No client writes —
-- the auth trigger handles inserts; updates (deleted_at, last_seen_at) go
-- through service_role.

create policy "users read self" on users
  for select to authenticated
  using (id = auth.uid());

create policy "users read org mates" on users
  for select to authenticated
  using (shares_org_with(id));

-- =============================================================================
-- organization_memberships
-- =============================================================================
-- A user always sees their own membership rows (including pending/rejected so
-- they can see their join status). Active members see other active members in
-- the same org. Admins see all memberships in orgs they administer (so the
-- approval queue works).

create policy "users read own memberships" on organization_memberships
  for select to authenticated
  using (user_id = auth.uid());

create policy "members read same-org memberships" on organization_memberships
  for select to authenticated
  using (status = 'active' and is_active_member_of(organization_id));

create policy "admins read all org memberships" on organization_memberships
  for select to authenticated
  using (is_admin_of(organization_id));

-- Inserts (invite acceptance) and approval-queue updates: service_role only.

-- =============================================================================
-- base_profiles
-- =============================================================================

create policy "users read own base_profile" on base_profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy "members read org-mate base_profiles" on base_profiles
  for select to authenticated
  using (shares_org_with(user_id));

create policy "users insert own base_profile" on base_profiles
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users update own base_profile" on base_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- organization_profiles
-- =============================================================================
-- Visible to anyone in the same org. Editable only by the user the membership
-- belongs to (chain through organization_memberships).

create policy "members read org_profiles" on organization_profiles
  for select to authenticated
  using (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and is_active_member_of(m.organization_id)
    )
  );

create policy "users insert own org_profile" on organization_profiles
  for insert to authenticated
  with check (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  );

create policy "users update own org_profile" on organization_profiles
  for update to authenticated
  using (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  );

-- =============================================================================
-- invites
-- =============================================================================
-- Only org admins manage invites. Invite acceptance (status: pending → accepted)
-- happens via service_role on the signup callback because the new user has no
-- JWT for any org yet.

create policy "admins read invites" on invites
  for select to authenticated
  using (is_admin_of(organization_id));

create policy "admins create invites" on invites
  for insert to authenticated
  with check (is_admin_of(organization_id));

create policy "admins update invites" on invites
  for update to authenticated
  using (is_admin_of(organization_id))
  with check (is_admin_of(organization_id));

-- =============================================================================
-- mentorship_preferences
-- =============================================================================
-- Anyone in the same org reads (so search ranking can see open mentors).
-- Owner-only writes.

create policy "members read org mentorship_preferences" on mentorship_preferences
  for select to authenticated
  using (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and is_active_member_of(m.organization_id)
    )
  );

create policy "users insert own mentorship_preferences" on mentorship_preferences
  for insert to authenticated
  with check (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  );

create policy "users update own mentorship_preferences" on mentorship_preferences
  for update to authenticated
  using (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  );

-- =============================================================================
-- mentorship_requests
-- =============================================================================
-- Visible to mentor + mentee. Mentee creates (cannot impersonate). Mentor
-- responds (status flip — only mentor changes it).

create policy "parties read mentorship_requests" on mentorship_requests
  for select to authenticated
  using (mentor_id = auth.uid() or mentee_id = auth.uid());

create policy "mentees create mentorship_requests" on mentorship_requests
  for insert to authenticated
  with check (
    mentee_id = auth.uid()
    and is_active_member_of(organization_id)
  );

create policy "mentors respond to mentorship_requests" on mentorship_requests
  for update to authenticated
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

-- =============================================================================
-- mentorship_threads
-- =============================================================================
-- Visible to mentor + mentee. Inserts via service_role (server-side after a
-- request is accepted). Either party can update (e.g. archive, mark
-- last_message_at).

create policy "parties read mentorship_threads" on mentorship_threads
  for select to authenticated
  using (mentor_id = auth.uid() or mentee_id = auth.uid());

create policy "parties update mentorship_threads" on mentorship_threads
  for update to authenticated
  using (mentor_id = auth.uid() or mentee_id = auth.uid())
  with check (mentor_id = auth.uid() or mentee_id = auth.uid());

-- =============================================================================
-- messages
-- =============================================================================
-- Polymorphic by thread_type. Each policy resolves the thread via the
-- corresponding table to confirm participation.
--
-- TODO post-launch: Postgres RLS doesn't restrict per-column. The "update"
-- policies allow recipients to flip read_at, but technically allow editing
-- body too. App code must only set read_at on update. For stricter control
-- post-launch, drop the update grant and route read-receipt updates through
-- service_role.

create policy "participants read mentorship messages" on messages
  for select to authenticated
  using (
    thread_type = 'mentorship'
    and exists (
      select 1 from mentorship_threads t
      where t.id = thread_id
        and (t.mentor_id = auth.uid() or t.mentee_id = auth.uid())
    )
  );

create policy "participants read direct messages" on messages
  for select to authenticated
  using (
    thread_type = 'direct'
    and exists (
      select 1 from direct_message_threads t
      where t.id = thread_id
        and (t.user_a_id = auth.uid() or t.user_b_id = auth.uid())
    )
  );

create policy "participants send mentorship messages" on messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and thread_type = 'mentorship'
    and exists (
      select 1 from mentorship_threads t
      where t.id = thread_id
        and t.status = 'active'
        and (t.mentor_id = auth.uid() or t.mentee_id = auth.uid())
    )
  );

create policy "participants send direct messages" on messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and thread_type = 'direct'
    and exists (
      select 1 from direct_message_threads t
      where t.id = thread_id
        and (t.user_a_id = auth.uid() or t.user_b_id = auth.uid())
    )
  );

create policy "participants update mentorship messages" on messages
  for update to authenticated
  using (
    thread_type = 'mentorship'
    and exists (
      select 1 from mentorship_threads t
      where t.id = thread_id
        and (t.mentor_id = auth.uid() or t.mentee_id = auth.uid())
    )
  );

create policy "participants update direct messages" on messages
  for update to authenticated
  using (
    thread_type = 'direct'
    and exists (
      select 1 from direct_message_threads t
      where t.id = thread_id
        and (t.user_a_id = auth.uid() or t.user_b_id = auth.uid())
    )
  );

-- =============================================================================
-- events
-- =============================================================================
-- Members see published events in their org. Admins see drafts too. Only
-- admins write.

create policy "members read published events" on events
  for select to authenticated
  using (
    is_active_member_of(organization_id)
    and published_at is not null
  );

create policy "admins read all events" on events
  for select to authenticated
  using (is_admin_of(organization_id));

create policy "admins create events" on events
  for insert to authenticated
  with check (is_admin_of(organization_id));

create policy "admins update events" on events
  for update to authenticated
  using (is_admin_of(organization_id))
  with check (is_admin_of(organization_id));

create policy "admins delete events" on events
  for delete to authenticated
  using (is_admin_of(organization_id));

-- =============================================================================
-- event_rsvps
-- =============================================================================
-- Anyone in the org reads RSVPs (so we can show "5 going"). Own RSVPs only
-- for writes.

create policy "members read event_rsvps" on event_rsvps
  for select to authenticated
  using (
    exists (
      select 1 from events e
      where e.id = event_id
        and is_active_member_of(e.organization_id)
    )
  );

create policy "users insert own rsvp" on event_rsvps
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users update own rsvp" on event_rsvps
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete own rsvp" on event_rsvps
  for delete to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- admin_role_assignments
-- =============================================================================
-- Users read their own roles. Org admins read all roles in their org. Writes
-- (granting / revoking roles) are sensitive — service_role only at launch.

create policy "users read own admin roles" on admin_role_assignments
  for select to authenticated
  using (user_id = auth.uid());

create policy "admins read admin_role_assignments" on admin_role_assignments
  for select to authenticated
  using (is_admin_of(organization_id));

-- =============================================================================
-- audit_log
-- =============================================================================
-- Append-only. Org admins read org-scoped rows. Unscoped rows
-- (organization_id is null) are service_role only — no UI surface for them yet.
-- Any authenticated user can write a row, but only with their own actor_id.

create policy "admins read org audit_log" on audit_log
  for select to authenticated
  using (organization_id is not null and is_admin_of(organization_id));

create policy "users insert own audit_log" on audit_log
  for insert to authenticated
  with check (actor_id = auth.uid());

-- =============================================================================
-- friend_requests (week 3+ wiring, RLS in place now to avoid leaks)
-- =============================================================================

create policy "parties read friend_requests" on friend_requests
  for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "users send friend_requests" on friend_requests
  for insert to authenticated
  with check (sender_id = auth.uid());

create policy "receiver updates friend_requests" on friend_requests
  for update to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- =============================================================================
-- friendships
-- =============================================================================
-- Read-only for parties. Inserts go through service_role on friend_request
-- acceptance (canonical-order ordering is easier to enforce server-side).

create policy "parties read friendships" on friendships
  for select to authenticated
  using (user_a_id = auth.uid() or user_b_id = auth.uid());

-- =============================================================================
-- direct_message_threads
-- =============================================================================

create policy "parties read direct_message_threads" on direct_message_threads
  for select to authenticated
  using (user_a_id = auth.uid() or user_b_id = auth.uid());

-- Inserts via service_role (created lazily on first DM, after friendship verified).

-- =============================================================================
-- announcements
-- =============================================================================

create policy "members read published announcements" on announcements
  for select to authenticated
  using (is_active_member_of(organization_id) and published_at is not null);

create policy "admins read all announcements" on announcements
  for select to authenticated
  using (is_admin_of(organization_id));

create policy "admins write announcements" on announcements
  for insert to authenticated
  with check (is_admin_of(organization_id));

create policy "admins update announcements" on announcements
  for update to authenticated
  using (is_admin_of(organization_id))
  with check (is_admin_of(organization_id));

create policy "admins delete announcements" on announcements
  for delete to authenticated
  using (is_admin_of(organization_id));

-- =============================================================================
-- notifications
-- =============================================================================
-- Per-user read + read-receipt updates. Inserts come from background workers
-- via service_role.

create policy "users read own notifications" on notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy "users update own notifications" on notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- profile_refresh_prompts
-- =============================================================================

create policy "users read own profile_refresh_prompts" on profile_refresh_prompts
  for select to authenticated
  using (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  );

create policy "users update own profile_refresh_prompts" on profile_refresh_prompts
  for update to authenticated
  using (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from organization_memberships m
      where m.id = organization_membership_id
        and m.user_id = auth.uid()
    )
  );

-- =============================================================================
-- saved_searches
-- =============================================================================

create policy "users read own saved_searches" on saved_searches
  for select to authenticated
  using (user_id = auth.uid());

create policy "users insert own saved_searches" on saved_searches
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "users update own saved_searches" on saved_searches
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete own saved_searches" on saved_searches
  for delete to authenticated
  using (user_id = auth.uid());
