-- BridgeCircle v2 clean-slate application schema.
--
-- ADR 0015 authorizes this one-time baseline replacement while the product is
-- pre-launch and contains no real member data. This migration deliberately
-- creates application-owned objects only. Supabase-managed auth, storage,
-- extensions, realtime, and migration-history schemas remain managed by
-- Supabase.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

create schema if not exists api;
create schema if not exists private;

revoke all on schema api from public, anon;
revoke all on schema private from public, anon, authenticated;
revoke create on schema public from public;

grant usage on schema public, api to authenticated, service_role;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Identity and organizations
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key,
  account_state text not null default 'active',
  onboarding_completed_at timestamptz,
  last_seen_at timestamptz,
  delete_scheduled_for timestamptz,
  delete_reason text,
  delete_initiated_by_admin boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint users_account_state_check
    check (account_state in ('active', 'deletion_scheduled', 'deleted')),
  constraint users_delete_reason_length_check
    check (delete_reason is null or char_length(delete_reason) between 1 and 2000),
  constraint users_account_lifecycle_check check (
    (account_state = 'active' and delete_scheduled_for is null and deleted_at is null)
    or
    (account_state = 'deletion_scheduled' and delete_scheduled_for is not null and deleted_at is null)
    or
    (account_state = 'deleted' and delete_scheduled_for is null and delete_reason is null and deleted_at is not null)
  )
);

create index users_delete_scheduled_for_idx
  on public.users (delete_scheduled_for)
  where account_state = 'deletion_scheduled';

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  requires_admin_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_check
    check (slug = lower(btrim(slug)) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint organizations_name_check
    check (char_length(btrim(name)) between 1 and 200)
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  status text not null default 'pending',
  joined_at timestamptz,
  approved_by_membership_id uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_status_check
    check (status in ('pending', 'active', 'rejected', 'revoked')),
  constraint organization_memberships_active_joined_check
    check (status <> 'active' or joined_at is not null),
  constraint organization_memberships_approval_pair_check
    check ((approved_by_membership_id is null) = (approved_at is null)),
  constraint organization_memberships_user_org_key unique (user_id, organization_id),
  constraint organization_memberships_org_id_key unique (organization_id, id),
  constraint organization_memberships_org_user_key unique (organization_id, user_id),
  constraint organization_memberships_approver_fk
    foreign key (organization_id, approved_by_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete restrict
);

create index organization_memberships_user_active_idx
  on public.organization_memberships (user_id, organization_id)
  where status = 'active';
create index organization_memberships_org_active_idx
  on public.organization_memberships (organization_id, user_id)
  where status = 'active';
create index organization_memberships_approver_idx
  on public.organization_memberships (approved_by_membership_id)
  where approved_by_membership_id is not null;

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email text not null,
  email_normalized text not null,
  token_hash bytea not null unique,
  status text not null default 'pending',
  full_name text,
  graduation_year smallint,
  sent_by_membership_id uuid,
  accepted_by_user_id uuid references public.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint invites_status_check
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  constraint invites_email_normalized_check
    check (email_normalized = lower(btrim(email_normalized)) and char_length(email_normalized) between 3 and 320),
  constraint invites_email_check
    check (char_length(btrim(email)) between 3 and 320),
  constraint invites_full_name_check
    check (full_name is null or char_length(btrim(full_name)) between 1 and 200),
  constraint invites_graduation_year_check
    check (graduation_year is null or graduation_year between 1900 and 2100),
  constraint invites_acceptance_check check (
    (status = 'accepted' and accepted_by_user_id is not null and accepted_at is not null)
    or
    (status <> 'accepted' and accepted_by_user_id is null and accepted_at is null)
  ),
  constraint invites_sender_fk
    foreign key (organization_id, sent_by_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete restrict
);

create unique index invites_pending_email_key
  on public.invites (organization_id, email_normalized)
  where status = 'pending';
create index invites_org_status_created_idx
  on public.invites (organization_id, status, created_at desc);
create index invites_pending_expiry_idx
  on public.invites (expires_at)
  where status = 'pending';
create index invites_sender_idx
  on public.invites (sent_by_membership_id)
  where sent_by_membership_id is not null;
create index invites_accepted_user_idx
  on public.invites (accepted_by_user_id)
  where accepted_by_user_id is not null;

create table public.admin_role_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  organization_membership_id uuid not null,
  role text not null,
  granted_by_membership_id uuid,
  granted_at timestamptz not null default now(),
  constraint admin_role_assignments_role_check
    check (role in ('super_admin', 'admin', 'event_moderator', 'ambassador')),
  constraint admin_role_assignments_membership_role_key
    unique (organization_membership_id, role),
  constraint admin_role_assignments_member_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint admin_role_assignments_granter_fk
    foreign key (organization_id, granted_by_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete restrict
);

create index admin_role_assignments_org_idx
  on public.admin_role_assignments (organization_id, role, organization_membership_id);
create index admin_role_assignments_granter_idx
  on public.admin_role_assignments (granted_by_membership_id)
  where granted_by_membership_id is not null;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text not null,
  preferred_name text,
  name_other text,
  headline text,
  current_employer text,
  current_title text,
  city text,
  university text,
  major text,
  linkedin_url text,
  avatar_path text,
  resume_path text,
  resume_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_check
    check (char_length(btrim(display_name)) between 1 and 200),
  constraint profiles_preferred_name_check
    check (preferred_name is null or char_length(btrim(preferred_name)) between 1 and 200),
  constraint profiles_name_other_check
    check (name_other is null or char_length(btrim(name_other)) between 1 and 200),
  constraint profiles_headline_check
    check (headline is null or char_length(headline) between 1 and 280),
  constraint profiles_linkedin_url_check
    check (linkedin_url is null or linkedin_url ~ '^https://([a-z0-9-]+[.])*linkedin[.]com/'),
  constraint profiles_resume_pair_check
    check ((resume_path is null and resume_uploaded_at is null) or (resume_path is not null and resume_uploaded_at is not null))
);

create table public.organization_profiles (
  organization_membership_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  graduation_year smallint,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_profiles_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint organization_profiles_graduation_year_check
    check (graduation_year is null or graduation_year between 1900 and 2100),
  constraint organization_profiles_bio_check
    check (bio is null or char_length(bio) between 1 and 4000)
);

create index organization_profiles_org_idx
  on public.organization_profiles (organization_id, organization_membership_id);

create table public.profile_experiences (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  employer text not null,
  title text not null,
  start_year smallint,
  start_month smallint,
  end_year smallint,
  end_month smallint,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_experiences_employer_check
    check (char_length(btrim(employer)) between 1 and 300),
  constraint profile_experiences_title_check
    check (char_length(btrim(title)) between 1 and 300),
  constraint profile_experiences_year_check check (
    (start_year is null or start_year between 1900 and 2100)
    and (end_year is null or end_year between 1900 and 2100)
  ),
  constraint profile_experiences_month_check check (
    (start_month is null or start_month between 1 and 12)
    and (end_month is null or end_month between 1 and 12)
    and (start_month is null or start_year is not null)
    and (end_month is null or end_year is not null)
  ),
  constraint profile_experiences_date_order_check check (
    start_year is null or end_year is null
    or (end_year * 12 + coalesce(end_month, 12)) >= (start_year * 12 + coalesce(start_month, 1))
  ),
  constraint profile_experiences_description_check
    check (description is null or char_length(description) between 1 and 4000),
  constraint profile_experiences_sort_order_check check (sort_order >= 0)
);

create index profile_experiences_user_sort_idx
  on public.profile_experiences (user_id, sort_order, id);

create table public.profile_education (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  school text not null,
  degree text,
  field text,
  start_year smallint,
  start_month smallint,
  end_year smallint,
  end_month smallint,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_education_school_check
    check (char_length(btrim(school)) between 1 and 300),
  constraint profile_education_degree_check
    check (degree is null or char_length(btrim(degree)) between 1 and 300),
  constraint profile_education_field_check
    check (field is null or char_length(btrim(field)) between 1 and 300),
  constraint profile_education_year_check check (
    (start_year is null or start_year between 1900 and 2100)
    and (end_year is null or end_year between 1900 and 2100)
  ),
  constraint profile_education_month_check check (
    (start_month is null or start_month between 1 and 12)
    and (end_month is null or end_month between 1 and 12)
    and (start_month is null or start_year is not null)
    and (end_month is null or end_year is not null)
  ),
  constraint profile_education_date_order_check check (
    start_year is null or end_year is null
    or (end_year * 12 + coalesce(end_month, 12)) >= (start_year * 12 + coalesce(start_month, 1))
  ),
  constraint profile_education_description_check
    check (description is null or char_length(description) between 1 and 4000),
  constraint profile_education_sort_order_check check (sort_order >= 0)
);

create index profile_education_user_sort_idx
  on public.profile_education (user_id, sort_order, id);

create table public.profile_skills (
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  sort_order integer not null default 0,
  primary key (user_id, normalized_name),
  constraint profile_skills_name_check
    check (char_length(btrim(name)) between 1 and 100),
  constraint profile_skills_normalized_check
    check (normalized_name = lower(btrim(name))),
  constraint profile_skills_sort_order_check check (sort_order >= 0),
  constraint profile_skills_user_sort_key unique (user_id, sort_order)
);

create table public.profile_field_visibility (
  organization_membership_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  field_key text not null,
  audience text not null,
  updated_at timestamptz not null default now(),
  primary key (organization_membership_id, field_key),
  constraint profile_field_visibility_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint profile_field_visibility_field_check
    check (field_key in ('contact_links', 'career_history', 'education_history', 'bio', 'skills')),
  constraint profile_field_visibility_audience_check
    check (audience in ('organization', 'connections', 'self'))
);

create index profile_field_visibility_org_idx
  on public.profile_field_visibility (organization_id, organization_membership_id);

-- ---------------------------------------------------------------------------
-- Help
-- ---------------------------------------------------------------------------

create table public.helper_preferences (
  organization_membership_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  open_to_help boolean not null default true,
  max_pending_requests smallint not null default 10,
  consecutive_timeouts smallint not null default 0,
  paused_at timestamptz,
  pause_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint helper_preferences_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint helper_preferences_max_pending_check
    check (max_pending_requests between 1 and 100),
  constraint helper_preferences_timeout_check
    check (consecutive_timeouts between 0 and 3),
  constraint helper_preferences_pause_reason_check
    check (pause_reason is null or pause_reason in ('manual', 'unresponsive', 'admin')),
  constraint helper_preferences_pause_pair_check
    check ((paused_at is null) = (pause_reason is null)),
  constraint helper_preferences_paused_closed_check
    check (paused_at is null or open_to_help = false)
);

create index helper_preferences_org_open_idx
  on public.helper_preferences (organization_id, organization_membership_id)
  where open_to_help = true and paused_at is null;

create table public.helper_topics (
  organization_membership_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  normalized_name text not null,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  primary key (organization_membership_id, normalized_name),
  constraint helper_topics_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint helper_topics_name_check
    check (char_length(btrim(name)) between 1 and 100),
  constraint helper_topics_normalized_check
    check (normalized_name = lower(btrim(name))),
  constraint helper_topics_sort_check check (sort_order between 0 and 4),
  constraint helper_topics_member_sort_key unique (organization_membership_id, sort_order)
);

create index helper_topics_org_idx
  on public.helper_topics (organization_id, organization_membership_id, sort_order);

create table public.asks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  asker_membership_id uuid not null,
  kind text not null,
  status text not null,
  recipient_membership_id uuid,
  question text not null,
  request_message text,
  reach text,
  anonymous_until_accepted boolean not null default false,
  decline_reason_code text,
  decline_note text,
  closure_reason text,
  outcome_note text,
  reopened_from_ask_id uuid references public.asks(id) on delete restrict,
  client_request_id uuid not null,
  reminder_sent_at timestamptz,
  accepted_at timestamptz,
  responded_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asks_asker_membership_fk
    foreign key (organization_id, asker_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete restrict,
  constraint asks_recipient_membership_fk
    foreign key (organization_id, recipient_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete restrict,
  constraint asks_kind_status_shape_check check (
    (
      kind = 'direct'
      and status in ('waiting', 'accepted', 'declined', 'retracted', 'resolved', 'closed')
      and recipient_membership_id is not null
      and reach is null
      and anonymous_until_accepted = false
      and request_message is not null
    )
    or
    (
      kind = 'circle'
      and status in ('open', 'accepted', 'retracted', 'resolved', 'closed')
      and recipient_membership_id is null
      and reach in ('matched', 'organization')
      and request_message is null
    )
  ),
  constraint asks_parties_differ_check
    check (recipient_membership_id is null or asker_membership_id <> recipient_membership_id),
  constraint asks_question_check
    check (char_length(btrim(question)) between 1 and 2000),
  constraint asks_request_message_check
    check (request_message is null or char_length(btrim(request_message)) between 1 and 4000),
  constraint asks_decline_reason_check
    check (decline_reason_code is null or decline_reason_code in ('unavailable', 'outside_expertise', 'other')),
  constraint asks_decline_note_check
    check (decline_note is null or char_length(btrim(decline_note)) between 1 and 2000),
  constraint asks_closure_reason_check
    check (closure_reason is null or closure_reason in ('silence_timeout', 'admin', 'account_deleted', 'blocked')),
  constraint asks_outcome_note_check
    check (outcome_note is null or (status = 'resolved' and char_length(btrim(outcome_note)) between 1 and 2000)),
  constraint asks_declined_lifecycle_check check (
    (status = 'declined' and kind = 'direct' and decline_note is not null and responded_at is not null and ended_at is not null)
    or
    (status <> 'declined' and decline_reason_code is null and decline_note is null)
  ),
  constraint asks_accepted_lifecycle_check
    check (status <> 'accepted' or (accepted_at is not null and responded_at is not null and ended_at is null)),
  constraint asks_resolved_lifecycle_check
    check (status <> 'resolved' or (accepted_at is not null and responded_at is not null and ended_at is not null)),
  constraint asks_terminal_lifecycle_check
    check (status not in ('retracted', 'closed') or ended_at is not null),
  constraint asks_closed_reason_check
    check ((status = 'closed' and closure_reason is not null) or (status <> 'closed' and closure_reason is null)),
  constraint asks_initial_lifecycle_check check (
    status not in ('waiting', 'open')
    or (accepted_at is null and responded_at is null and ended_at is null)
  ),
  constraint asks_expiry_check check (expires_at > created_at),
  constraint asks_client_request_key unique (asker_membership_id, client_request_id)
);

create index asks_asker_created_idx
  on public.asks (asker_membership_id, created_at desc, id desc);
create index asks_org_asker_fk_idx
  on public.asks (organization_id, asker_membership_id);
create index asks_recipient_status_created_idx
  on public.asks (recipient_membership_id, status, created_at desc, id desc)
  where kind = 'direct';
create index asks_circle_reach_created_idx
  on public.asks (organization_id, reach, created_at desc, id desc)
  where kind = 'circle' and status = 'open';
create index asks_expiry_active_idx
  on public.asks (expires_at, id)
  where status in ('waiting', 'open');
create index asks_asker_active_idx
  on public.asks (asker_membership_id, created_at desc)
  where status in ('waiting', 'open', 'accepted');
create index asks_reopened_from_idx
  on public.asks (reopened_from_ask_id)
  where reopened_from_ask_id is not null;

create table public.ask_offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  ask_id uuid not null references public.asks(id) on delete cascade,
  helper_membership_id uuid not null,
  status text not null default 'pending',
  offer_note text not null,
  decline_reason_code text,
  decline_note text,
  closure_reason text,
  client_request_id uuid not null,
  responded_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ask_offers_helper_membership_fk
    foreign key (organization_id, helper_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete restrict,
  constraint ask_offers_status_check
    check (status in ('pending', 'accepted', 'declined', 'closed')),
  constraint ask_offers_note_check
    check (char_length(btrim(offer_note)) between 1 and 4000),
  constraint ask_offers_decline_reason_check
    check (decline_reason_code is null or decline_reason_code in ('went_another_direction', 'not_right_fit', 'other')),
  constraint ask_offers_decline_note_check
    check (decline_note is null or char_length(btrim(decline_note)) between 1 and 2000),
  constraint ask_offers_closure_reason_check
    check (closure_reason is null or closure_reason in ('accepted_elsewhere', 'ask_retracted', 'ask_closed', 'blocked', 'admin')),
  constraint ask_offers_lifecycle_check check (
    (status = 'pending' and responded_at is null and closed_at is null and decline_reason_code is null and decline_note is null and closure_reason is null)
    or
    (status = 'accepted' and responded_at is not null and closed_at is null and decline_reason_code is null and decline_note is null and closure_reason is null)
    or
    (status = 'declined' and responded_at is not null and closed_at is not null and decline_note is not null and closure_reason is null)
    or
    (status = 'closed' and closed_at is not null and closure_reason is not null and decline_reason_code is null and decline_note is null)
  ),
  constraint ask_offers_ask_helper_key unique (ask_id, helper_membership_id),
  constraint ask_offers_helper_request_key unique (helper_membership_id, client_request_id)
);

create unique index ask_offers_one_accepted_idx
  on public.ask_offers (ask_id)
  where status = 'accepted';
create index ask_offers_ask_status_created_idx
  on public.ask_offers (ask_id, status, created_at, id);
create index ask_offers_helper_status_created_idx
  on public.ask_offers (helper_membership_id, status, created_at desc, id desc);
create index ask_offers_org_idx
  on public.ask_offers (organization_id, ask_id);

-- ---------------------------------------------------------------------------
-- Connections, blocks, and conversations
-- ---------------------------------------------------------------------------

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.users(id) on delete restrict,
  recipient_user_id uuid not null references public.users(id) on delete restrict,
  origin_organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'pending',
  intro_message text,
  client_request_id uuid not null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connection_requests_parties_differ_check
    check (requester_user_id <> recipient_user_id),
  constraint connection_requests_status_check
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  constraint connection_requests_message_check
    check (intro_message is null or char_length(btrim(intro_message)) between 1 and 2000),
  constraint connection_requests_response_check
    check ((status = 'pending' and responded_at is null) or (status <> 'pending' and responded_at is not null)),
  constraint connection_requests_requester_request_key
    unique (requester_user_id, client_request_id)
);

create unique index connection_requests_pending_pair_key
  on public.connection_requests (
    least(requester_user_id, recipient_user_id),
    greatest(requester_user_id, recipient_user_id)
  )
  where status = 'pending';
create index connection_requests_recipient_status_idx
  on public.connection_requests (recipient_user_id, status, created_at desc);
create index connection_requests_requester_status_idx
  on public.connection_requests (requester_user_id, status, created_at desc);
create index connection_requests_origin_org_idx
  on public.connection_requests (origin_organization_id)
  where origin_organization_id is not null;

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.users(id) on delete restrict,
  user_b_id uuid not null references public.users(id) on delete restrict,
  origin_organization_id uuid references public.organizations(id) on delete set null,
  connection_request_id uuid unique references public.connection_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint connections_canonical_pair_check check (user_a_id < user_b_id),
  constraint connections_pair_key unique (user_a_id, user_b_id)
);

create index connections_user_b_idx on public.connections (user_b_id, user_a_id);
create index connections_origin_org_idx
  on public.connections (origin_organization_id)
  where origin_organization_id is not null;

create table public.member_blocks (
  blocker_user_id uuid not null references public.users(id) on delete restrict,
  blocked_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint member_blocks_parties_differ_check check (blocker_user_id <> blocked_user_id)
);

create index member_blocks_blocked_idx
  on public.member_blocks (blocked_user_id, blocker_user_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  user_a_id uuid not null references public.users(id) on delete restrict,
  user_b_id uuid not null references public.users(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  ask_id uuid references public.asks(id) on delete restrict,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  constraint conversations_kind_check check (kind in ('direct', 'ask')),
  constraint conversations_canonical_pair_check check (user_a_id < user_b_id),
  constraint conversations_kind_shape_check check (
    (kind = 'direct' and organization_id is null and ask_id is null)
    or
    (kind = 'ask' and organization_id is not null and ask_id is not null)
  )
);

create unique index conversations_ask_key
  on public.conversations (ask_id)
  where ask_id is not null;
create unique index conversations_direct_pair_key
  on public.conversations (user_a_id, user_b_id)
  where kind = 'direct';
create index conversations_user_a_last_idx
  on public.conversations (user_a_id, last_message_at desc nulls last, id);
create index conversations_user_b_last_idx
  on public.conversations (user_b_id, last_message_at desc nulls last, id);
create index conversations_org_idx
  on public.conversations (organization_id)
  where organization_id is not null;

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid references public.users(id) on delete restrict,
  kind text not null default 'user',
  body text not null,
  client_nonce uuid,
  system_event_type text,
  system_event_key text,
  system_actor_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint messages_kind_check check (kind in ('user', 'system')),
  constraint messages_body_check check (char_length(btrim(body)) between 1 and 10000),
  constraint messages_kind_shape_check check (
    (
      kind = 'user'
      and sender_user_id is not null
      and client_nonce is not null
      and system_event_type is null
      and system_event_key is null
      and system_actor_user_id is null
    )
    or
    (
      kind = 'system'
      and sender_user_id is null
      and client_nonce is null
      and system_event_type is not null
      and system_event_key is not null
    )
  ),
  constraint messages_system_event_type_check check (
    system_event_type is null
    or system_event_type in ('connection_accepted', 'ask_accepted', 'ask_resolved')
  ),
  constraint messages_conversation_id_key unique (conversation_id, id)
);

create unique index messages_client_nonce_key
  on public.messages (conversation_id, sender_user_id, client_nonce)
  where client_nonce is not null;
create unique index messages_system_event_key_key
  on public.messages (conversation_id, system_event_key)
  where system_event_key is not null;
create index messages_sender_idx
  on public.messages (sender_user_id, created_at desc)
  where sender_user_id is not null;
create index messages_system_actor_idx
  on public.messages (system_actor_user_id)
  where system_actor_user_id is not null;

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_message_id bigint,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id),
  constraint conversation_reads_message_fk
    foreign key (conversation_id, last_read_message_id)
    references public.messages(conversation_id, id)
    on delete set null (last_read_message_id)
);

create index conversation_reads_user_idx
  on public.conversation_reads (user_id, last_read_at desc);

create table private.conversation_typing_limits (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  is_typing boolean not null,
  last_sent_at timestamptz not null,
  primary key (conversation_id, user_id)
);

create index conversation_typing_limits_user_idx
  on private.conversation_typing_limits (user_id, conversation_id);

-- ---------------------------------------------------------------------------
-- School
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by_membership_id uuid,
  status text not null default 'draft',
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  published_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_org_id_key unique (organization_id, id),
  constraint events_creator_fk
    foreign key (organization_id, created_by_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete set null,
  constraint events_status_check check (status in ('draft', 'published', 'cancelled')),
  constraint events_title_check check (char_length(btrim(title)) between 1 and 300),
  constraint events_description_check
    check (description is null or char_length(description) between 1 and 20000),
  constraint events_location_check
    check (location is null or char_length(location) between 1 and 1000),
  constraint events_time_check check (ends_at is null or ends_at > starts_at),
  constraint events_capacity_check check (capacity is null or capacity > 0),
  constraint events_publish_lifecycle_check
    check (status <> 'published' or published_at is not null),
  constraint events_cancel_lifecycle_check
    check ((status = 'cancelled' and cancelled_at is not null) or (status <> 'cancelled' and cancelled_at is null))
);

create index events_org_status_starts_idx
  on public.events (organization_id, status, starts_at, id);
create index events_creator_idx
  on public.events (created_by_membership_id)
  where created_by_membership_id is not null;

create table public.event_rsvps (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_id uuid not null,
  organization_membership_id uuid not null,
  status text not null,
  responded_at timestamptz not null default now(),
  primary key (event_id, organization_membership_id),
  constraint event_rsvps_event_fk
    foreign key (organization_id, event_id)
    references public.events(organization_id, id)
    on delete cascade,
  constraint event_rsvps_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint event_rsvps_status_check check (status in ('going', 'not_going', 'waitlisted'))
);

create index event_rsvps_event_status_idx
  on public.event_rsvps (event_id, status, responded_at, organization_membership_id);
create index event_rsvps_membership_idx
  on public.event_rsvps (organization_membership_id, responded_at desc);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  author_membership_id uuid,
  status text not null default 'draft',
  title text not null,
  body text not null,
  pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_author_fk
    foreign key (organization_id, author_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete set null,
  constraint announcements_status_check check (status in ('draft', 'published', 'archived')),
  constraint announcements_title_check check (char_length(btrim(title)) between 1 and 300),
  constraint announcements_body_check check (char_length(btrim(body)) between 1 and 50000),
  constraint announcements_publish_lifecycle_check
    check (status <> 'published' or published_at is not null)
);

create index announcements_org_feed_idx
  on public.announcements (organization_id, status, pinned desc, published_at desc, id desc);
create index announcements_author_idx
  on public.announcements (author_membership_id)
  where author_membership_id is not null;

-- ---------------------------------------------------------------------------
-- Notifications, safety, reliability, and internals
-- ---------------------------------------------------------------------------

create table public.notifications (
  id bigint generated always as identity primary key,
  recipient_user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  type text not null,
  target_type text,
  target_id text,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in (
    'connection_requested', 'connection_accepted',
    'ask_received', 'ask_accepted', 'ask_declined', 'ask_reminder', 'ask_closed',
    'offer_received', 'offer_accepted', 'offer_declined', 'offer_closed',
    'circle_ask_match', 'circle_ask_closed', 'message_received',
    'announcement_published', 'event_cancelled', 'profile_update_ready'
  )),
  constraint notifications_target_type_check
    check (target_type is null or target_type in (
      'ask', 'offer', 'conversation', 'connection_request', 'profile', 'event', 'announcement', 'profile_proposal'
    )),
  constraint notifications_target_pair_check
    check ((target_type is null) = (target_id is null)),
  constraint notifications_dedupe_key_check
    check (char_length(btrim(dedupe_key)) between 1 and 500),
  constraint notifications_payload_object_check
    check (jsonb_typeof(payload) = 'object')
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc, id desc);
create index notifications_recipient_unread_idx
  on public.notifications (recipient_user_id, created_at desc, id desc)
  where read_at is null;
create index notifications_actor_idx
  on public.notifications (actor_user_id)
  where actor_user_id is not null;
create index notifications_org_idx
  on public.notifications (organization_id, created_at desc)
  where organization_id is not null;

create table public.notification_preferences (
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type text not null,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, notification_type),
  constraint notification_preferences_type_check check (notification_type in (
    'connection_requested', 'connection_accepted',
    'ask_received', 'ask_accepted', 'ask_declined', 'ask_reminder', 'ask_closed',
    'offer_received', 'offer_accepted', 'offer_declined', 'offer_closed',
    'circle_ask_match', 'circle_ask_closed', 'message_received',
    'announcement_published', 'event_cancelled', 'profile_update_ready'
  ))
);

create table private.ask_matches (
  ask_id uuid not null references public.asks(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  helper_membership_id uuid not null,
  rank integer not null,
  score double precision not null,
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,
  model text not null,
  model_version text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (ask_id, helper_membership_id),
  constraint ask_matches_helper_fk
    foreign key (organization_id, helper_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint ask_matches_rank_check check (rank > 0),
  constraint ask_matches_score_check check (score between 0 and 1),
  constraint ask_matches_reason_check check (char_length(btrim(reason)) between 1 and 1000),
  constraint ask_matches_evidence_object_check check (jsonb_typeof(evidence) = 'object'),
  constraint ask_matches_ask_rank_key unique (ask_id, rank)
);

create index ask_matches_helper_idx
  on private.ask_matches (helper_membership_id, created_at desc);
create index ask_matches_org_idx
  on private.ask_matches (organization_id, ask_id);

create table private.ask_events (
  id bigint generated always as identity primary key,
  ask_id uuid not null references public.asks(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ask_events_type_check check (event_type in (
    'created', 'reminded', 'accepted', 'declined', 'retracted', 'closed', 'resolved',
    'offer_created', 'offer_declined', 'offer_closed'
  )),
  constraint ask_events_payload_object_check check (jsonb_typeof(payload) = 'object')
);

create index ask_events_ask_created_idx
  on private.ask_events (ask_id, created_at, id);
create index ask_events_org_created_idx
  on private.ask_events (organization_id, created_at desc);

create table private.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.users(id) on delete set null,
  reported_user_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  reason text not null,
  note text,
  target_type text not null,
  target_id text not null,
  ask_id uuid references public.asks(id) on delete set null,
  offer_id uuid references public.ask_offers(id) on delete set null,
  message_id bigint references public.messages(id) on delete set null,
  profile_user_id uuid references public.users(id) on delete set null,
  evidence_snapshot jsonb not null,
  status text not null default 'open',
  assigned_to_user_id uuid references public.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_reason_check
    check (reason in ('harassment', 'spam', 'inappropriate', 'impersonation', 'other')),
  constraint reports_note_check
    check (note is null or char_length(btrim(note)) between 1 and 4000),
  constraint reports_target_type_check
    check (target_type in ('ask', 'offer', 'message', 'profile')),
  constraint reports_target_id_check check (char_length(btrim(target_id)) between 1 and 200),
  constraint reports_evidence_object_check check (jsonb_typeof(evidence_snapshot) = 'object'),
  constraint reports_status_check check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  constraint reports_resolution_check
    check ((status in ('actioned', 'dismissed') and resolved_at is not null) or (status in ('open', 'reviewing') and resolved_at is null))
);

create index reports_status_created_idx
  on private.reports (status, created_at, id);
create index reports_reported_user_idx
  on private.reports (reported_user_id, created_at desc)
  where reported_user_id is not null;
create index reports_org_idx
  on private.reports (organization_id, created_at desc)
  where organization_id is not null;

create table private.moderation_actions (
  id bigint generated always as identity primary key,
  report_id uuid not null references private.reports(id) on delete cascade,
  actor_admin_user_id uuid references public.users(id) on delete set null,
  action_type text not null,
  private_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint moderation_actions_type_check
    check (action_type ~ '^[a-z][a-z0-9_]*([.][a-z][a-z0-9_]*)+$'),
  constraint moderation_actions_note_check
    check (private_note is null or char_length(private_note) between 1 and 10000),
  constraint moderation_actions_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index moderation_actions_report_created_idx
  on private.moderation_actions (report_id, created_at, id);

create table private.outbox_jobs (
  id bigint generated always as identity primary key,
  job_type text not null,
  payload jsonb not null,
  dedupe_key text not null unique,
  status text not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 8,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  provider_result_id text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outbox_jobs_type_check check (job_type in (
    'send_email', 'create_notification', 'run_ask_matching', 'index_profile',
    'process_account_deletion', 'delete_storage_objects'
  )),
  constraint outbox_jobs_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint outbox_jobs_dedupe_key_check check (char_length(btrim(dedupe_key)) between 1 and 500),
  constraint outbox_jobs_status_check check (status in ('pending', 'processing', 'completed', 'failed')),
  constraint outbox_jobs_attempts_check check (attempts >= 0 and max_attempts > 0 and attempts <= max_attempts),
  constraint outbox_jobs_provider_result_check check (
    provider_result_id is null
    or (job_type = 'send_email' and char_length(btrim(provider_result_id)) between 1 and 500)
  ),
  constraint outbox_jobs_state_check check (
    (status = 'pending' and locked_at is null and locked_by is null and completed_at is null)
    or (status = 'processing' and locked_at is not null and locked_by is not null and completed_at is null)
    or (status = 'completed' and completed_at is not null)
    or (status = 'failed' and completed_at is null)
  )
);

create index outbox_jobs_pending_idx
  on private.outbox_jobs (available_at, id)
  where status = 'pending';
create index outbox_jobs_processing_idx
  on private.outbox_jobs (locked_at, id)
  where status = 'processing';

create table private.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_log_action_check
    check (action ~ '^[a-z][a-z0-9_]*([.][a-z][a-z0-9_]*)+$'),
  constraint audit_log_target_pair_check check ((target_type is null) = (target_id is null)),
  constraint audit_log_payload_object_check check (jsonb_typeof(payload) = 'object')
);

create index audit_log_org_created_idx
  on private.audit_log (organization_id, created_at desc, id desc);
create index audit_log_target_created_idx
  on private.audit_log (target_type, target_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Search and enrichment internals
-- ---------------------------------------------------------------------------

create table private.profile_embedding_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  organization_membership_id uuid not null,
  chunk_kind text not null,
  source_section text not null,
  visibility_tier text not null,
  content text not null,
  content_version text not null,
  search_vector tsvector generated always as (
    to_tsvector('english'::regconfig, content)
  ) stored,
  content_hash text not null,
  fingerprint text not null,
  synthetic_prompt_version text,
  embedding_model text not null,
  embedding_dim integer not null default 1024,
  embedding extensions.vector(1024) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_embedding_chunks_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint profile_embedding_chunks_user_org_fk
    foreign key (organization_id, user_id)
    references public.organization_memberships(organization_id, user_id)
    on delete cascade,
  constraint profile_embedding_chunks_kind_check check (chunk_kind in ('raw', 'synthetic')),
  constraint profile_embedding_chunks_source_check check (source_section in (
    'directory', 'career_history', 'education_history', 'bio', 'skills', 'helper_topics',
    'career_path_summary', 'help_topics_summary'
  )),
  constraint profile_embedding_chunks_visibility_check
    check (visibility_tier in ('organization', 'connections')),
  constraint profile_embedding_chunks_content_check check (char_length(btrim(content)) > 0),
  constraint profile_embedding_chunks_content_version_check
    check (char_length(btrim(content_version)) between 1 and 100),
  constraint profile_embedding_chunks_hash_check
    check (content_hash ~ '^[0-9a-f]{64}$' and fingerprint ~ '^[0-9a-f]{64}$'),
  constraint profile_embedding_chunks_dimension_check check (embedding_dim = 1024),
  constraint profile_embedding_chunks_content_key unique (
    organization_membership_id, source_section, visibility_tier,
    content_hash, embedding_model, embedding_dim
  ),
  constraint profile_embedding_chunks_fingerprint_key unique (
    organization_membership_id, fingerprint
  )
);

create index profile_embedding_chunks_org_user_idx
  on private.profile_embedding_chunks (organization_id, user_id);
create index profile_embedding_chunks_visibility_idx
  on private.profile_embedding_chunks (organization_id, visibility_tier);
create index profile_embedding_chunks_hash_idx
  on private.profile_embedding_chunks (content_hash);
create index profile_embedding_chunks_search_idx
  on private.profile_embedding_chunks using gin (search_vector);

create table private.help_ai_usage_windows (
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, action, window_started_at),
  constraint help_ai_usage_action_check
    check (action in ('ask_draft', 'match_explanation', 'decline_note')),
  constraint help_ai_usage_window_check
    check (window_started_at = date_trunc('hour', window_started_at)),
  constraint help_ai_usage_count_check check (request_count > 0)
);

create table private.profile_embedding_status (
  organization_membership_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'dirty',
  dirty_reason text,
  dirty_since timestamptz,
  attempt_count integer not null default 0,
  last_indexed_at timestamptz,
  last_success_at timestamptz,
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_embedding_status_membership_fk
    foreign key (organization_id, organization_membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint profile_embedding_status_user_org_fk
    foreign key (organization_id, user_id)
    references public.organization_memberships(organization_id, user_id)
    on delete cascade,
  constraint profile_embedding_status_status_check
    check (status in ('dirty', 'indexing', 'ready', 'failed')),
  constraint profile_embedding_status_attempt_check check (attempt_count >= 0),
  constraint profile_embedding_status_lock_pair_check check ((locked_at is null) = (locked_by is null))
);

create index profile_embedding_status_queue_idx
  on private.profile_embedding_status (status, dirty_since, organization_membership_id)
  where status in ('dirty', 'failed');
create index profile_embedding_status_user_idx
  on private.profile_embedding_status (user_id);
create index profile_embedding_status_lock_idx
  on private.profile_embedding_status (locked_at)
  where locked_at is not null;

create table private.profile_enrichment_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  linkedin_url text,
  linkedin_username text,
  primary_provider_name text,
  primary_provider_id text,
  refresh_policy text not null default 'review_before_update',
  refresh_interval text not null default 'monthly',
  consented_at timestamptz,
  last_checked_at timestamptz,
  last_enriched_at timestamptz,
  last_profile_fingerprint text,
  consecutive_sweep_misses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_enrichment_settings_provider_check
    check (primary_provider_name is null or primary_provider_name in ('linkdapi', 'brightdata', 'pdl')),
  constraint profile_enrichment_settings_refresh_policy_check
    check (refresh_policy in ('manual_only', 'review_before_update', 'auto_apply_and_notify')),
  constraint profile_enrichment_settings_refresh_interval_check
    check (refresh_interval in ('monthly', 'quarterly')),
  constraint profile_enrichment_settings_misses_check check (consecutive_sweep_misses >= 0)
);

create index profile_enrichment_settings_sweep_idx
  on private.profile_enrichment_settings (refresh_policy, last_checked_at, user_id)
  where linkedin_url is not null;

create table private.profile_enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  purpose text not null,
  status text not null,
  cost_units integer,
  fingerprint text,
  error text,
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profile_enrichment_runs_provider_check
    check (provider in ('linkdapi', 'brightdata', 'pdl')),
  constraint profile_enrichment_runs_purpose_check check (purpose in (
    'onboarding_import', 'manual_refresh', 'scheduled_sweep',
    'sweep_miss_fallback', 'fallback_verification'
  )),
  constraint profile_enrichment_runs_status_check check (status in (
    'succeeded', 'no_match', 'failed', 'skipped_cap', 'skipped_unchanged'
  )),
  constraint profile_enrichment_runs_cost_check check (cost_units is null or cost_units >= 0)
);

create index profile_enrichment_runs_user_idx
  on private.profile_enrichment_runs (user_id, created_at desc);
create index profile_enrichment_runs_provider_idx
  on private.profile_enrichment_runs (provider, created_at desc);

create table private.profile_change_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null,
  status text not null default 'pending',
  current_snapshot jsonb not null,
  proposed_snapshot jsonb not null,
  diff jsonb,
  source_run_id uuid references private.profile_enrichment_runs(id) on delete set null,
  confidence numeric(4,3),
  review_token_hash bytea not null unique,
  expires_at timestamptz not null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profile_change_proposals_source_check
    check (source in ('linkdapi', 'brightdata', 'pdl', 'resume', 'manual')),
  constraint profile_change_proposals_status_check check (status in (
    'pending', 'accepted', 'edited', 'declined', 'auto_applied', 'superseded', 'expired'
  )),
  constraint profile_change_proposals_snapshot_check
    check (jsonb_typeof(current_snapshot) = 'object' and jsonb_typeof(proposed_snapshot) = 'object'),
  constraint profile_change_proposals_diff_check
    check (diff is null or jsonb_typeof(diff) = 'object'),
  constraint profile_change_proposals_confidence_check
    check (confidence is null or confidence between 0 and 1),
  constraint profile_change_proposals_review_check
    check ((status = 'pending' and reviewed_at is null) or status <> 'pending')
);

create index profile_change_proposals_user_pending_idx
  on private.profile_change_proposals (user_id, created_at desc)
  where status = 'pending';
create index profile_change_proposals_source_run_idx
  on private.profile_change_proposals (source_run_id)
  where source_run_id is not null;

create table private.profile_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_job_id text,
  status text not null default 'pending',
  member_count integer not null,
  targets jsonb not null default '[]'::jsonb,
  attempts integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_enrichment_jobs_provider_check
    check (provider in ('linkdapi', 'brightdata', 'pdl')),
  constraint profile_enrichment_jobs_status_check
    check (status in ('pending', 'ready', 'downloaded', 'failed')),
  constraint profile_enrichment_jobs_count_check check (member_count >= 0 and attempts >= 0),
  constraint profile_enrichment_jobs_targets_check check (jsonb_typeof(targets) = 'array'),
  constraint profile_enrichment_jobs_completion_check
    check ((status = 'downloaded' and completed_at is not null) or status <> 'downloaded')
);

create index profile_enrichment_jobs_pending_idx
  on private.profile_enrichment_jobs (status, started_at, id)
  where status in ('pending', 'ready');

-- Exact leading-column indexes for every foreign key. Postgres does not add
-- these automatically; composite tenant FKs need the same leading order to
-- keep joins and parent deletes from scanning child tables.
create index admin_role_assignments_member_fk_idx
  on public.admin_role_assignments (organization_id, organization_membership_id);
create index admin_role_assignments_granter_fk_idx
  on public.admin_role_assignments (organization_id, granted_by_membership_id)
  where granted_by_membership_id is not null;
create index announcements_author_fk_idx
  on public.announcements (organization_id, author_membership_id)
  where author_membership_id is not null;
create index ask_events_actor_fk_idx
  on private.ask_events (actor_user_id)
  where actor_user_id is not null;
create index ask_matches_helper_fk_idx
  on private.ask_matches (organization_id, helper_membership_id);
create index ask_offers_helper_fk_idx
  on public.ask_offers (organization_id, helper_membership_id);
create index asks_recipient_fk_idx
  on public.asks (organization_id, recipient_membership_id)
  where recipient_membership_id is not null;
create index audit_log_actor_fk_idx
  on private.audit_log (actor_user_id)
  where actor_user_id is not null;
create index conversation_reads_message_fk_idx
  on public.conversation_reads (conversation_id, last_read_message_id)
  where last_read_message_id is not null;
create index event_rsvps_event_fk_idx
  on public.event_rsvps (organization_id, event_id);
create index event_rsvps_membership_fk_idx
  on public.event_rsvps (organization_id, organization_membership_id);
create index events_creator_fk_idx
  on public.events (organization_id, created_by_membership_id)
  where created_by_membership_id is not null;
create index helper_preferences_membership_fk_idx
  on public.helper_preferences (organization_id, organization_membership_id);
create index invites_sender_fk_idx
  on public.invites (organization_id, sent_by_membership_id)
  where sent_by_membership_id is not null;
create index moderation_actions_actor_fk_idx
  on private.moderation_actions (actor_admin_user_id)
  where actor_admin_user_id is not null;
create index organization_memberships_approver_fk_idx
  on public.organization_memberships (organization_id, approved_by_membership_id)
  where approved_by_membership_id is not null;
create index profile_embedding_chunks_membership_fk_idx
  on private.profile_embedding_chunks (organization_id, organization_membership_id);
create index profile_embedding_chunks_user_fk_idx
  on private.profile_embedding_chunks (user_id);
create index profile_embedding_status_membership_fk_idx
  on private.profile_embedding_status (organization_id, organization_membership_id);
create index profile_embedding_status_user_org_fk_idx
  on private.profile_embedding_status (organization_id, user_id);
create index profile_change_proposals_user_fk_idx
  on private.profile_change_proposals (user_id);
create index reports_ask_fk_idx
  on private.reports (ask_id)
  where ask_id is not null;
create index reports_assignee_fk_idx
  on private.reports (assigned_to_user_id)
  where assigned_to_user_id is not null;
create index reports_message_fk_idx
  on private.reports (message_id)
  where message_id is not null;
create index reports_offer_fk_idx
  on private.reports (offer_id)
  where offer_id is not null;
create index reports_profile_user_fk_idx
  on private.reports (profile_user_id)
  where profile_user_id is not null;
create index reports_reporter_fk_idx
  on private.reports (reporter_user_id)
  where reporter_user_id is not null;

-- ---------------------------------------------------------------------------
-- Shared trigger and authorization functions
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.is_active_member_of(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.users u on u.id = m.user_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and u.account_state = 'active'
  );
$$;

create function private.owns_membership(
  p_membership_id uuid,
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
    from public.organization_memberships m
    join public.users u on u.id = m.user_id
    where m.id = p_membership_id
      and m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and u.account_state = 'active'
  );
$$;

create function private.is_admin_of(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.admin_role_assignments a
      on a.organization_id = m.organization_id
     and a.organization_membership_id = m.id
    join public.users u on u.id = m.user_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and u.account_state = 'active'
      and a.role in ('super_admin', 'admin', 'event_moderator')
  );
$$;

create function private.is_connected(p_user_a_id uuid, p_user_b_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_user_a_id is null or p_user_b_id is null or p_user_a_id = p_user_b_id then false
    else exists (
      select 1
      from public.connections c
      where c.user_a_id = least(p_user_a_id, p_user_b_id)
        and c.user_b_id = greatest(p_user_a_id, p_user_b_id)
    )
  end;
$$;

create function private.is_blocked(p_user_a_id uuid, p_user_b_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_user_a_id is null or p_user_b_id is null or p_user_a_id = p_user_b_id then false
    else exists (
      select 1
      from public.member_blocks b
      where (b.blocker_user_id = p_user_a_id and b.blocked_user_id = p_user_b_id)
         or (b.blocker_user_id = p_user_b_id and b.blocked_user_id = p_user_a_id)
    )
  end;
$$;

create function private.lock_user_pair(p_user_a_id uuid, p_user_b_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locked_count integer;
begin
  if p_user_a_id is null or p_user_b_id is null or p_user_a_id = p_user_b_id then
    raise exception using errcode = '22023', message = 'invalid_user_pair';
  end if;

  perform u.id
  from public.users u
  where u.id in (p_user_a_id, p_user_b_id)
  order by u.id
  for update;

  get diagnostics v_locked_count = row_count;
  if v_locked_count <> 2 then
    raise exception using errcode = 'P0002', message = 'user_pair_not_found';
  end if;
end;
$$;

create function private.can_view_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.users u on u.id = (select auth.uid())
    where c.id = p_conversation_id
      and (select auth.uid()) in (c.user_a_id, c.user_b_id)
      and u.account_state = 'active'
      and not private.is_blocked(c.user_a_id, c.user_b_id)
  );
$$;

create function private.can_send_to_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.users viewer on viewer.id = (select auth.uid())
    join public.users counterpart
      on counterpart.id = case
        when c.user_a_id = (select auth.uid()) then c.user_b_id
        else c.user_a_id
      end
    left join public.asks a on a.id = c.ask_id
    where c.id = p_conversation_id
      and (select auth.uid()) in (c.user_a_id, c.user_b_id)
      and viewer.account_state = 'active'
      and counterpart.account_state = 'active'
      and not private.is_blocked(c.user_a_id, c.user_b_id)
      and (
        (c.kind = 'direct' and private.is_connected(c.user_a_id, c.user_b_id))
        or (c.kind = 'ask' and a.status in ('accepted', 'resolved'))
      )
  );
$$;

create function private.can_access_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_view_conversation(p_conversation_id);
$$;

create function private.can_access_conversation_topic(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
begin
  if p_topic is null or p_topic !~* '^conversation:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  begin
    v_conversation_id := substring(p_topic from 14)::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;

  return private.can_view_conversation(v_conversation_id);
end;
$$;

create function private.can_access_user_topic(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if p_topic is null or p_topic !~* '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  begin
    v_user_id := substring(p_topic from 6)::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;

  return v_user_id = (select auth.uid())
    and exists (
      select 1
      from public.users u
      where u.id = v_user_id
        and u.account_state = 'active'
    );
end;
$$;

create function private.broadcast_conversation_event(
  p_conversation_id uuid,
  p_event text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_conversation_id is null
     or p_event not in (
       'message.created',
       'read.advanced',
       'typing.changed'
     ) then
    raise exception using errcode = '22023', message = 'invalid_conversation_event';
  end if;

  perform realtime.send(
    coalesce(p_payload, '{}'::jsonb),
    p_event,
    'conversation:' || p_conversation_id::text,
    true
  );
end;
$$;

create function private.broadcast_user_control_event(
  p_user_id uuid,
  p_event text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
     or p_event not in (
       'conversation.permissions_changed',
       'conversation.revoked',
       'help.changed'
     ) then
    raise exception using errcode = '22023', message = 'invalid_user_control_event';
  end if;

  if p_event = 'help.changed'
     and (
       jsonb_typeof(p_payload) <> 'object'
       or not (p_payload ? 'id')
       or not (p_payload ? 'askId')
       or (p_payload - array['id', 'askId', 'offerId']::text[]) <> '{}'::jsonb
     ) then
    raise exception using errcode = '22023', message = 'invalid_help_change_payload';
  end if;

  perform realtime.send(
    coalesce(p_payload, '{}'::jsonb),
    p_event,
    'user:' || p_user_id::text,
    true
  );
end;
$$;

create function private.broadcast_help_change(
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
    'id', gen_random_uuid(),
    'askId', p_ask_id,
    'offerId', p_offer_id
  ));
begin
  if p_ask_id is null then
    raise exception using errcode = '22023', message = 'help_change_ask_required';
  end if;

  if p_only_user_id is not null then
    perform private.broadcast_user_control_event(
      p_only_user_id,
      'help.changed',
      v_payload
    );
    return;
  end if;

  for v_user_id in
    select distinct affected.user_id
    from (
      select asker.user_id
      from public.asks a
      join public.organization_memberships asker on asker.id = a.asker_membership_id
      where a.id = p_ask_id

      union all

      select recipient.user_id
      from public.asks a
      join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
      where a.id = p_ask_id

      union all

      select helper.user_id
      from public.ask_offers ao
      join public.organization_memberships helper on helper.id = ao.helper_membership_id
      where ao.ask_id = p_ask_id
        and (p_offer_id is null or ao.id = p_offer_id)
    ) affected
    where affected.user_id is not null
    order by affected.user_id
  loop
    perform private.broadcast_user_control_event(
      v_user_id,
      'help.changed',
      v_payload
    );
  end loop;
end;
$$;

create function private.broadcast_pair_conversation_event(
  p_user_one_id uuid,
  p_user_two_id uuid,
  p_event text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
begin
  for v_conversation_id in
    select c.id
    from public.conversations c
    where c.user_a_id = least(p_user_one_id, p_user_two_id)
      and c.user_b_id = greatest(p_user_one_id, p_user_two_id)
    order by c.id
  loop
    perform private.broadcast_user_control_event(
      p_user_one_id,
      p_event,
      jsonb_build_object('conversationId', v_conversation_id)
    );
    perform private.broadcast_user_control_event(
      p_user_two_id,
      p_event,
      jsonb_build_object('conversationId', v_conversation_id)
    );
  end loop;
end;
$$;

create function private.can_view_ask(p_ask_id uuid)
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
  if v_user_id is null then
    return false;
  end if;

  select asker.user_id, a.organization_id,
         a.recipient_membership_id, a.kind, a.reach
    into v_asker_user_id, v_organization_id,
         v_recipient_membership_id, v_kind, v_reach
  from public.asks a
  join public.organization_memberships asker on asker.id = a.asker_membership_id
  where a.id = p_ask_id;

  if not found or private.is_blocked(v_user_id, v_asker_user_id) then
    return false;
  end if;

  if v_user_id = v_asker_user_id then
    return true;
  end if;

  if v_kind = 'direct' then
    return exists (
      select 1
      from public.organization_memberships recipient
      where recipient.id = v_recipient_membership_id
        and recipient.user_id = v_user_id
        and recipient.status = 'active'
    );
  end if;

  if not private.is_active_member_of(v_organization_id) then
    return false;
  end if;

  if v_reach = 'organization' then
    return true;
  end if;

  return exists (
    select 1
    from private.ask_matches am
    join public.organization_memberships helper on helper.id = am.helper_membership_id
    where am.ask_id = p_ask_id
      and helper.user_id = v_user_id
      and helper.status = 'active'
  ) or exists (
    select 1
    from public.ask_offers ao
    join public.organization_memberships helper on helper.id = ao.helper_membership_id
    where ao.ask_id = p_ask_id
      and helper.user_id = v_user_id
      and ao.status = 'accepted'
  );
end;
$$;

create function private.enqueue_outbox(
  p_job_type text,
  p_payload jsonb,
  p_dedupe_key text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.outbox_jobs (job_type, payload, dedupe_key)
  values (p_job_type, p_payload, p_dedupe_key)
  on conflict (dedupe_key) do nothing;
$$;

create function private.get_my_member_context(
  p_preferred_membership_id uuid default null
)
returns table (
  account_state text,
  onboarding_completed_at timestamptz,
  delete_scheduled_for timestamptz,
  delete_initiated_by_admin boolean,
  deleted_at timestamptz,
  selected_membership_id uuid,
  requires_circle_choice boolean,
  unread_notification_count bigint,
  memberships jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_selected_membership_id uuid;
  v_active_count bigint;
  v_pending_count bigint;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if not exists (select 1 from public.users u where u.id = v_user_id) then
    raise exception using errcode = '42501', message = 'account_not_found';
  end if;

  select m.id
    into v_selected_membership_id
  from public.organization_memberships m
  where m.id = p_preferred_membership_id
    and m.user_id = v_user_id
    and m.status in ('active', 'pending');

  select
    count(*) filter (where m.status = 'active'),
    count(*) filter (where m.status = 'pending')
    into v_active_count, v_pending_count
  from public.organization_memberships m
  where m.user_id = v_user_id;

  if v_selected_membership_id is null and v_active_count = 1 then
    select m.id
      into v_selected_membership_id
    from public.organization_memberships m
    where m.user_id = v_user_id and m.status = 'active';
  elsif v_selected_membership_id is null
    and v_active_count = 0
    and v_pending_count = 1 then
    select m.id
      into v_selected_membership_id
    from public.organization_memberships m
    where m.user_id = v_user_id and m.status = 'pending';
  end if;

  return query
  select
    u.account_state,
    u.onboarding_completed_at,
    u.delete_scheduled_for,
    u.delete_initiated_by_admin,
    u.deleted_at,
    v_selected_membership_id,
    v_selected_membership_id is null
      and (v_active_count > 1 or (v_active_count = 0 and v_pending_count > 1)),
    (
      select count(*)
      from public.notifications n
      where n.recipient_user_id = v_user_id and n.read_at is null
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'membershipId', m.id,
            'status', m.status,
            'joinedAt', m.joined_at,
            'organization', jsonb_build_object(
              'id', o.id,
              'slug', o.slug,
              'name', o.name,
              'requiresAdminApproval', o.requires_admin_approval
            ),
            'profile', jsonb_build_object(
              'displayName', p.display_name,
              'preferredName', p.preferred_name,
              'avatarPath', p.avatar_path,
              'graduationYear', op.graduation_year,
              'bio', op.bio
            ),
            'roles', coalesce(
              (
                select jsonb_agg(a.role order by a.role)
                from public.admin_role_assignments a
                where a.organization_membership_id = m.id
              ),
              '[]'::jsonb
            )
          )
          order by o.name, m.id
        )
        from public.organization_memberships m
        join public.organizations o on o.id = m.organization_id
        left join public.profiles p on p.user_id = m.user_id
        left join public.organization_profiles op
          on op.organization_membership_id = m.id
        where m.user_id = v_user_id
      ),
      '[]'::jsonb
    )
  from public.users u
  where u.id = v_user_id;
end;
$$;

create function private.verify_invite(p_token text)
returns table (
  result_code text,
  invite_id uuid,
  organization_id uuid,
  email text,
  full_name text,
  graduation_year smallint,
  organization_name text,
  organization_slug text,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_invite record;
  v_result_code text;
begin
  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 512 then
    return query select
      'not_found'::text, null::uuid, null::uuid, null::text, null::text,
      null::smallint, null::text, null::text, null::timestamptz;
    return;
  end if;

  select
    i.id, i.organization_id, i.email, i.full_name, i.graduation_year,
    i.status, i.expires_at, o.name as organization_name,
    o.slug as organization_slug
    into v_invite
  from public.invites i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = extensions.digest(p_token, 'sha256');

  if not found then
    return query select
      'not_found'::text, null::uuid, null::uuid, null::text, null::text,
      null::smallint, null::text, null::text, null::timestamptz;
    return;
  end if;

  v_result_code := case
    when v_invite.status = 'accepted' then 'accepted'
    when v_invite.status = 'revoked' then 'revoked'
    when v_invite.status = 'expired' or v_invite.expires_at <= now() then 'expired'
    when v_invite.status = 'pending' then 'valid'
    else 'not_found'
  end;

  return query select
    v_result_code,
    case when v_result_code = 'valid' then v_invite.id else null end,
    case when v_result_code = 'valid' then v_invite.organization_id else null end,
    case when v_result_code = 'valid' then v_invite.email else null end,
    case when v_result_code = 'valid' then v_invite.full_name else null end,
    case when v_result_code = 'valid' then v_invite.graduation_year else null end,
    case when v_result_code = 'valid' then v_invite.organization_name else null end,
    case when v_result_code = 'valid' then v_invite.organization_slug else null end,
    case when v_result_code = 'valid' then v_invite.expires_at else null end;
end;
$$;

create function private.accept_invite(p_token text)
returns table (
  result_code text,
  membership_id uuid,
  membership_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_invite record;
  v_auth record;
  v_membership record;
  v_display_name text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 512 then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  select
    i.id, i.organization_id, i.email_normalized, i.full_name,
    i.graduation_year, i.status, i.accepted_by_user_id, i.expires_at,
    o.requires_admin_approval
    into v_invite
  from public.invites i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = extensions.digest(p_token, 'sha256')
  for update of i;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  if v_invite.status = 'accepted' then
    if v_invite.accepted_by_user_id <> v_user_id then
      return query select 'accepted_by_other'::text, null::uuid, null::text;
      return;
    end if;

    select m.id, m.status
      into v_membership
    from public.organization_memberships m
    where m.user_id = v_user_id
      and m.organization_id = v_invite.organization_id;

    if not found then
      return query select 'inconsistent_state'::text, null::uuid, null::text;
      return;
    end if;

    return query select 'accepted'::text, v_membership.id, v_membership.status;
    return;
  end if;

  if v_invite.status = 'revoked' then
    return query select 'revoked'::text, null::uuid, null::text;
    return;
  end if;

  if v_invite.status = 'expired' or v_invite.expires_at <= now() then
    if v_invite.status = 'pending' then
      update public.invites set status = 'expired' where id = v_invite.id;
    end if;
    return query select 'expired'::text, null::uuid, null::text;
    return;
  end if;

  select au.email, au.raw_user_meta_data
    into v_auth
  from auth.users au
  where au.id = v_user_id;

  if not found or v_auth.email is null
    or not exists (select 1 from public.users u where u.id = v_user_id) then
    return query select 'account_not_found'::text, null::uuid, null::text;
    return;
  end if;

  if lower(btrim(v_auth.email)) <> v_invite.email_normalized then
    return query select 'email_mismatch'::text, null::uuid, null::text;
    return;
  end if;

  select m.id, m.status
    into v_membership
  from public.organization_memberships m
  where m.user_id = v_user_id
    and m.organization_id = v_invite.organization_id
  for update;

  if found and v_membership.status not in ('active', 'pending') then
    return query select 'membership_unavailable'::text, null::uuid, null::text;
    return;
  end if;

  if not found then
    insert into public.organization_memberships (
      user_id, organization_id, status, joined_at
    ) values (
      v_user_id,
      v_invite.organization_id,
      case when v_invite.requires_admin_approval then 'pending' else 'active' end,
      case when v_invite.requires_admin_approval then null else now() end
    )
    returning id, status into v_membership;
  end if;

  v_display_name := nullif(
    btrim(coalesce(
      v_invite.full_name,
      v_auth.raw_user_meta_data ->> 'full_name',
      v_auth.raw_user_meta_data ->> 'name',
      ''
    )),
    ''
  );

  if v_display_name is not null then
    insert into public.profiles (user_id, display_name)
    values (v_user_id, v_display_name)
    on conflict (user_id) do nothing;
  end if;

  insert into public.organization_profiles (
    organization_membership_id, organization_id, graduation_year
  ) values (
    v_membership.id, v_invite.organization_id, v_invite.graduation_year
  )
  on conflict (organization_membership_id) do nothing;

  update public.invites
  set status = 'accepted', accepted_by_user_id = v_user_id, accepted_at = now()
  where id = v_invite.id;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_user_id,
    v_invite.organization_id,
    case when v_membership.status = 'active'
      then 'membership.joined' else 'membership.pending' end,
    'invite',
    v_invite.id::text,
    jsonb_build_object(
      'membershipId', v_membership.id,
      'membershipStatus', v_membership.status
    )
  );

  return query select 'accepted'::text, v_membership.id, v_membership.status;
end;
$$;

create function private.decide_membership(
  p_membership_id uuid,
  p_decision text
)
returns table (
  result_code text,
  membership_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_membership_id uuid;
  v_membership record;
  v_new_status text;
begin
  if v_actor_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_decision not in ('approve', 'reject') then
    return query select 'invalid_decision'::text, null::text;
    return;
  end if;

  select m.id, m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  where m.id = p_membership_id
  for update;

  if not found then
    return query select 'not_found'::text, null::text;
    return;
  end if;

  select actor.id
    into v_actor_membership_id
  from public.organization_memberships actor
  join public.admin_role_assignments role
    on role.organization_id = actor.organization_id
   and role.organization_membership_id = actor.id
  join public.users actor_user on actor_user.id = actor.user_id
  where actor.user_id = v_actor_user_id
    and actor.organization_id = v_membership.organization_id
    and actor.status = 'active'
    and actor_user.account_state = 'active'
    and role.role in ('super_admin', 'admin')
  order by case role.role when 'super_admin' then 0 else 1 end, actor.id
  limit 1;

  if v_actor_membership_id is null then
    return query select 'not_authorized'::text, v_membership.status;
    return;
  end if;

  v_new_status := case when p_decision = 'approve' then 'active' else 'rejected' end;

  if v_membership.status = v_new_status then
    return query select
      case when v_new_status = 'active' then 'approved' else 'rejected' end,
      v_membership.status;
    return;
  end if;

  if v_membership.status <> 'pending' then
    return query select 'not_pending'::text, v_membership.status;
    return;
  end if;

  update public.organization_memberships
  set status = v_new_status,
      joined_at = case when v_new_status = 'active' then now() else null end,
      approved_by_membership_id = v_actor_membership_id,
      approved_at = now()
  where id = v_membership.id;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id
  ) values (
    v_actor_user_id,
    v_membership.organization_id,
    case when v_new_status = 'active'
      then 'membership.approved' else 'membership.rejected' end,
    'membership',
    v_membership.id::text
  );

  perform private.enqueue_outbox(
    'send_email',
    jsonb_build_object(
      'userId', v_membership.user_id,
      'organizationId', v_membership.organization_id,
      'membershipId', v_membership.id,
      'template', case when v_new_status = 'active'
        then 'membership_approved' else 'membership_rejected' end
    ),
    'membership_decision:' || v_membership.id::text || ':' || v_new_status
  );

  return query select
    case when v_new_status = 'active' then 'approved' else 'rejected' end,
    v_new_status;
end;
$$;

create function private.get_my_profile(p_membership_id uuid)
returns table (
  result_code text,
  profile jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_profile jsonb;
begin
  if v_user_id is null then
    return query select 'not_found'::text, null::jsonb;
    return;
  end if;

  select jsonb_build_object(
    'membership', jsonb_build_object(
      'id', m.id,
      'status', m.status,
      'organization', jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug
      )
    ),
    'identity', jsonb_build_object(
      'displayName', p.display_name,
      'preferredName', p.preferred_name,
      'nameOther', p.name_other,
      'graduationYear', op.graduation_year,
      'avatarPath', p.avatar_path
    ),
    'current', jsonb_build_object(
      'headline', p.headline,
      'employer', p.current_employer,
      'title', p.current_title,
      'city', p.city,
      'university', p.university,
      'major', p.major,
      'linkedinUrl', p.linkedin_url
    ),
    'education', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'school', e.school,
          'degree', e.degree,
          'field', e.field,
          'startYear', e.start_year,
          'startMonth', e.start_month,
          'endYear', e.end_year,
          'endMonth', e.end_month,
          'description', e.description
        ) order by e.sort_order, e.id
      )
      from public.profile_education e
      where e.user_id = v_user_id
    ), '[]'::jsonb),
    'experiences', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'employer', e.employer,
          'title', e.title,
          'startYear', e.start_year,
          'startMonth', e.start_month,
          'endYear', e.end_year,
          'endMonth', e.end_month,
          'description', e.description
        ) order by e.sort_order, e.id
      )
      from public.profile_experiences e
      where e.user_id = v_user_id
    ), '[]'::jsonb),
    'skills', coalesce((
      select jsonb_agg(
        jsonb_build_object('name', s.name)
        order by s.sort_order, s.normalized_name
      )
      from public.profile_skills s
      where s.user_id = v_user_id
    ), '[]'::jsonb),
    'visibility', coalesce((
      select jsonb_object_agg(v.field_key, v.audience order by v.field_key)
      from public.profile_field_visibility v
      where v.organization_membership_id = m.id
    ), '{}'::jsonb),
    'preferences', jsonb_build_object(
      'bio', op.bio,
      'openToHelp', coalesce((
        select hp.open_to_help
        from public.helper_preferences hp
        where hp.organization_membership_id = m.id
      ), true),
      'helperTopics', coalesce((
        select jsonb_agg(
          jsonb_build_object('name', ht.name)
          order by ht.sort_order, ht.normalized_name
        )
        from public.helper_topics ht
        where ht.organization_membership_id = m.id
      ), '[]'::jsonb),
      'freshness', jsonb_build_object(
        'linkedinUrl', pes.linkedin_url,
        'refreshPolicy', coalesce(pes.refresh_policy, 'review_before_update'),
        'refreshInterval', coalesce(pes.refresh_interval, 'monthly'),
        'consentedAt', pes.consented_at
      )
    )
  )
  into v_profile
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  left join public.profiles p on p.user_id = m.user_id
  left join public.organization_profiles op
    on op.organization_membership_id = m.id
  left join private.profile_enrichment_settings pes on pes.user_id = m.user_id
  where m.id = p_membership_id
    and m.user_id = v_user_id
    and m.status in ('active', 'pending');

  if v_profile is null then
    return query select 'not_found'::text, null::jsonb;
    return;
  end if;

  return query select 'ok'::text, v_profile;
end;
$$;

create function private.save_profile_identity(
  p_membership_id uuid,
  p_display_name text,
  p_preferred_name text,
  p_name_other text,
  p_graduation_year smallint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership record;
  v_display_name text := nullif(btrim(p_display_name), '');
  v_preferred_name text := nullif(btrim(p_preferred_name), '');
  v_name_other text := nullif(btrim(p_name_other), '');
begin
  select m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
  for update of m;

  if not found or v_membership.user_id is distinct from v_user_id then
    return 'not_owned';
  end if;
  if v_membership.status not in ('active', 'pending') then
    return 'membership_unavailable';
  end if;
  if v_display_name is null or char_length(v_display_name) > 200
    or char_length(coalesce(v_preferred_name, '')) > 200
    or char_length(coalesce(v_name_other, '')) > 200
    or (p_graduation_year is not null and p_graduation_year not between 1900 and 2100)
  then
    return 'invalid_identity';
  end if;

  insert into public.profiles (
    user_id, display_name, preferred_name, name_other
  ) values (
    v_user_id, v_display_name, v_preferred_name, v_name_other
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        preferred_name = excluded.preferred_name,
        name_other = excluded.name_other;

  insert into public.organization_profiles (
    organization_membership_id, organization_id, graduation_year
  ) values (
    p_membership_id, v_membership.organization_id, p_graduation_year
  )
  on conflict (organization_membership_id) do update
    set graduation_year = excluded.graduation_year;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_user_id,
    v_membership.organization_id,
    'profile.identity_saved',
    'profile',
    v_user_id::text,
    jsonb_build_object(
      'membershipId', p_membership_id,
      'graduationYearProvided', p_graduation_year is not null
    )
  );

  return 'saved';
end;
$$;

create function private.save_profile_education(
  p_membership_id uuid,
  p_university text,
  p_major text,
  p_education jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership record;
  v_university text := nullif(btrim(p_university), '');
  v_major text := nullif(btrim(p_major), '');
  v_education jsonb := coalesce(p_education, '[]'::jsonb);
begin
  select m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
  for update of m;

  if not found or v_membership.user_id is distinct from v_user_id then
    return 'not_owned';
  end if;
  if v_membership.status not in ('active', 'pending') then
    return 'membership_unavailable';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = v_user_id) then
    return 'profile_required';
  end if;
  if jsonb_typeof(v_education) <> 'array'
    or jsonb_array_length(v_education) > 20
    or char_length(coalesce(v_university, '')) > 300
    or char_length(coalesce(v_major, '')) > 300
  then
    return 'invalid_education';
  end if;

  begin
    update public.profiles
    set university = v_university, major = v_major
    where user_id = v_user_id;

    delete from public.profile_education where user_id = v_user_id;

    insert into public.profile_education (
      user_id, school, degree, field,
      start_year, start_month, end_year, end_month,
      description, sort_order
    )
    select
      v_user_id,
      btrim(entry.value ->> 'school'),
      nullif(btrim(entry.value ->> 'degree'), ''),
      nullif(btrim(entry.value ->> 'field'), ''),
      (entry.value ->> 'startYear')::smallint,
      (entry.value ->> 'startMonth')::smallint,
      (entry.value ->> 'endYear')::smallint,
      (entry.value ->> 'endMonth')::smallint,
      nullif(btrim(entry.value ->> 'description'), ''),
      (entry.ordinality - 1)::integer
    from jsonb_array_elements(v_education)
      with ordinality as entry(value, ordinality);
  exception
    when check_violation or not_null_violation or invalid_text_representation
      or numeric_value_out_of_range or string_data_right_truncation
    then
      return 'invalid_education';
  end;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_user_id,
    v_membership.organization_id,
    'profile.education_saved',
    'profile',
    v_user_id::text,
    jsonb_build_object(
      'membershipId', p_membership_id,
      'educationCount', jsonb_array_length(v_education)
    )
  );

  return 'saved';
end;
$$;

create function private.save_profile_current(
  p_membership_id uuid,
  p_current_employer text,
  p_current_title text,
  p_city text,
  p_headline text,
  p_linkedin_url text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership record;
  v_employer text := nullif(btrim(p_current_employer), '');
  v_title text := nullif(btrim(p_current_title), '');
  v_city text := nullif(btrim(p_city), '');
  v_headline text := nullif(btrim(p_headline), '');
  v_linkedin_url text := nullif(btrim(p_linkedin_url), '');
begin
  select m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
  for update of m;

  if not found or v_membership.user_id is distinct from v_user_id then
    return 'not_owned';
  end if;
  if v_membership.status not in ('active', 'pending') then
    return 'membership_unavailable';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = v_user_id) then
    return 'profile_required';
  end if;
  if char_length(coalesce(v_employer, '')) > 300
    or char_length(coalesce(v_title, '')) > 300
    or char_length(coalesce(v_city, '')) > 200
    or char_length(coalesce(v_headline, '')) > 280
    or (v_linkedin_url is not null
      and v_linkedin_url !~ '^https://([a-z0-9-]+[.])*linkedin[.]com/')
  then
    return 'invalid_current';
  end if;

  update public.profiles
  set current_employer = v_employer,
      current_title = v_title,
      city = v_city,
      headline = v_headline,
      linkedin_url = v_linkedin_url
  where user_id = v_user_id;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_user_id,
    v_membership.organization_id,
    'profile.current_saved',
    'profile',
    v_user_id::text,
    jsonb_build_object(
      'membershipId', p_membership_id,
      'linkedinProvided', v_linkedin_url is not null
    )
  );

  return 'saved';
end;
$$;

create function private.save_profile_history(
  p_membership_id uuid,
  p_experiences jsonb,
  p_skills text[]
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership record;
  v_experiences jsonb := coalesce(p_experiences, '[]'::jsonb);
  v_skills text[] := coalesce(p_skills, '{}'::text[]);
begin
  select m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
  for update of m;

  if not found or v_membership.user_id is distinct from v_user_id then
    return 'not_owned';
  end if;
  if v_membership.status not in ('active', 'pending') then
    return 'membership_unavailable';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = v_user_id) then
    return 'profile_required';
  end if;
  if jsonb_typeof(v_experiences) <> 'array'
    or jsonb_array_length(v_experiences) > 50
    or cardinality(v_skills) > 50
    or exists (
      select 1 from unnest(v_skills) skill
      where char_length(btrim(skill)) not between 1 and 100
    )
    or exists (
      select 1
      from unnest(v_skills) skill
      group by lower(btrim(skill))
      having count(*) > 1
    )
  then
    return 'invalid_history';
  end if;

  begin
    delete from public.profile_experiences where user_id = v_user_id;
    delete from public.profile_skills where user_id = v_user_id;

    insert into public.profile_experiences (
      user_id, employer, title,
      start_year, start_month, end_year, end_month,
      description, sort_order
    )
    select
      v_user_id,
      btrim(entry.value ->> 'employer'),
      btrim(entry.value ->> 'title'),
      (entry.value ->> 'startYear')::smallint,
      (entry.value ->> 'startMonth')::smallint,
      (entry.value ->> 'endYear')::smallint,
      (entry.value ->> 'endMonth')::smallint,
      nullif(btrim(entry.value ->> 'description'), ''),
      (entry.ordinality - 1)::integer
    from jsonb_array_elements(v_experiences)
      with ordinality as entry(value, ordinality);

    insert into public.profile_skills (
      user_id, name, normalized_name, sort_order
    )
    select
      v_user_id,
      btrim(skill),
      lower(btrim(skill)),
      (ordinality - 1)::integer
    from unnest(v_skills) with ordinality as item(skill, ordinality);
  exception
    when check_violation or not_null_violation or invalid_text_representation
      or numeric_value_out_of_range or unique_violation
      or string_data_right_truncation
    then
      return 'invalid_history';
  end;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_user_id,
    v_membership.organization_id,
    'profile.history_saved',
    'profile',
    v_user_id::text,
    jsonb_build_object(
      'membershipId', p_membership_id,
      'experienceCount', jsonb_array_length(v_experiences),
      'skillCount', cardinality(v_skills)
    )
  );

  return 'saved';
end;
$$;

create function private.save_profile_preferences(
  p_membership_id uuid,
  p_bio text,
  p_open_to_help boolean,
  p_topics text[],
  p_linkedin_url text,
  p_refresh_policy text,
  p_refresh_interval text,
  p_freshness_consent boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership record;
  v_bio text := nullif(btrim(p_bio), '');
  v_topics text[] := coalesce(p_topics, '{}'::text[]);
  v_linkedin_url text := nullif(btrim(p_linkedin_url), '');
begin
  select m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
  for update of m;

  if not found or v_membership.user_id is distinct from v_user_id then
    return 'not_owned';
  end if;
  if v_membership.status not in ('active', 'pending') then
    return 'membership_unavailable';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = v_user_id) then
    return 'profile_required';
  end if;
  if p_open_to_help is null or p_freshness_consent is null
    or char_length(coalesce(v_bio, '')) > 4000
    or cardinality(v_topics) > 5
    or exists (
      select 1 from unnest(v_topics) topic
      where char_length(btrim(topic)) not between 1 and 100
    )
    or exists (
      select 1
      from unnest(v_topics) topic
      group by lower(btrim(topic))
      having count(*) > 1
    )
    or (v_linkedin_url is not null
      and v_linkedin_url !~ '^https://([a-z0-9-]+[.])*linkedin[.]com/')
    or p_refresh_policy not in ('manual_only', 'review_before_update', 'auto_apply_and_notify')
    or p_refresh_interval not in ('monthly', 'quarterly')
    or (p_freshness_consent and v_linkedin_url is null)
  then
    return 'invalid_preferences';
  end if;

  insert into public.organization_profiles (
    organization_membership_id, organization_id, bio
  ) values (
    p_membership_id, v_membership.organization_id, v_bio
  )
  on conflict (organization_membership_id) do update
    set bio = excluded.bio;

  insert into public.helper_preferences (
    organization_membership_id, organization_id,
    open_to_help, paused_at, pause_reason
  ) values (
    p_membership_id,
    v_membership.organization_id,
    p_open_to_help,
    case when p_open_to_help then null else now() end,
    case when p_open_to_help then null else 'manual' end
  )
  on conflict (organization_membership_id) do update
    set open_to_help = excluded.open_to_help,
        paused_at = case
          when excluded.open_to_help then null
          else coalesce(public.helper_preferences.paused_at, now())
        end,
        pause_reason = case
          when excluded.open_to_help then null else 'manual'
        end;

  delete from public.helper_topics
  where organization_membership_id = p_membership_id;
  insert into public.helper_topics (
    organization_membership_id, organization_id,
    name, normalized_name, sort_order
  )
  select
    p_membership_id,
    v_membership.organization_id,
    btrim(topic),
    lower(btrim(topic)),
    (ordinality - 1)::smallint
  from unnest(v_topics) with ordinality as item(topic, ordinality);

  update public.profiles
  set linkedin_url = v_linkedin_url
  where user_id = v_user_id;

  insert into private.profile_enrichment_settings (
    user_id, linkedin_url, refresh_policy, refresh_interval, consented_at
  ) values (
    v_user_id,
    v_linkedin_url,
    p_refresh_policy,
    p_refresh_interval,
    case when p_freshness_consent then now() else null end
  )
  on conflict (user_id) do update
    set linkedin_url = excluded.linkedin_url,
        refresh_policy = excluded.refresh_policy,
        refresh_interval = excluded.refresh_interval,
        consented_at = case
          when p_freshness_consent
            then coalesce(private.profile_enrichment_settings.consented_at, now())
          else null
        end;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_user_id,
    v_membership.organization_id,
    'profile.preferences_saved',
    'profile',
    v_user_id::text,
    jsonb_build_object(
      'membershipId', p_membership_id,
      'openToHelp', p_open_to_help,
      'topicCount', cardinality(v_topics),
      'freshnessConsent', p_freshness_consent
    )
  );

  return 'saved';
end;
$$;

create function private.set_my_avatar_path(
  p_membership_id uuid,
  p_avatar_path text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership record;
  v_avatar_path text := nullif(btrim(p_avatar_path), '');
begin
  select m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
  for update of m;

  if not found or v_membership.user_id is distinct from v_user_id then
    return 'not_owned';
  end if;
  if v_membership.status not in ('active', 'pending') then
    return 'membership_unavailable';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = v_user_id) then
    return 'profile_required';
  end if;
  if v_avatar_path is not null and (
    char_length(v_avatar_path) > 500
    or not starts_with(v_avatar_path, v_user_id::text || '/')
    or position('..' in v_avatar_path) > 0
    or v_avatar_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9][A-Za-z0-9._/-]*$'
  ) then
    return 'invalid_avatar_path';
  end if;

  update public.profiles
  set avatar_path = v_avatar_path
  where user_id = v_user_id;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_user_id,
    v_membership.organization_id,
    'profile.avatar_saved',
    'profile',
    v_user_id::text,
    jsonb_build_object(
      'membershipId', p_membership_id,
      'avatarCleared', v_avatar_path is null
    )
  );

  return 'saved';
end;
$$;

create function private.complete_onboarding(p_membership_id uuid)
returns table (
  result_code text,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership record;
  v_account record;
begin
  select m.user_id, m.organization_id, m.status
    into v_membership
  from public.organization_memberships m
  where m.id = p_membership_id
  for update;

  if not found or v_membership.user_id is distinct from v_user_id then
    return query select 'not_owned'::text, null::timestamptz;
    return;
  end if;
  if v_membership.status not in ('active', 'pending') then
    return query select 'membership_unavailable'::text, null::timestamptz;
    return;
  end if;

  select
    u.account_state,
    u.onboarding_completed_at,
    p.display_name,
    op.graduation_year
    into v_account
  from public.users u
  left join public.profiles p on p.user_id = u.id
  left join public.organization_profiles op
    on op.organization_membership_id = p_membership_id
  where u.id = v_user_id
  for update of u;

  if not found or v_account.account_state <> 'active' then
    return query select 'account_unavailable'::text, null::timestamptz;
    return;
  end if;
  if v_account.display_name is null or v_account.graduation_year is null then
    return query select 'incomplete_profile'::text, null::timestamptz;
    return;
  end if;
  if v_account.onboarding_completed_at is not null then
    return query select 'completed'::text, v_account.onboarding_completed_at;
    return;
  end if;

  update public.users
  set onboarding_completed_at = now()
  where id = v_user_id
  returning onboarding_completed_at into v_account.onboarding_completed_at;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id,
    payload
  ) values (
    v_user_id,
    v_membership.organization_id,
    'profile.onboarding_completed',
    'profile',
    v_user_id::text,
    jsonb_build_object('membershipId', p_membership_id)
  );

  perform private.enqueue_outbox(
    'index_profile',
    jsonb_build_object(
      'userId', v_user_id,
      'organizationId', v_membership.organization_id,
      'membershipId', p_membership_id
    ),
    'profile_index:' || p_membership_id::text
  );

  return query select 'completed'::text, v_account.onboarding_completed_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Integrity triggers that require relational lookups
-- ---------------------------------------------------------------------------

create function private.validate_ask_parties()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_asker_user_id uuid;
  v_recipient_user_id uuid;
begin
  select m.user_id
    into v_asker_user_id
  from public.organization_memberships m
  join public.users u on u.id = m.user_id
  where m.id = new.asker_membership_id
    and m.organization_id = new.organization_id
    and m.status = 'active'
    and u.account_state = 'active';

  if v_asker_user_id is null then
    raise exception using errcode = '23514', message = 'asker_membership_inactive';
  end if;

  if new.kind = 'direct' then
    select m.user_id
      into v_recipient_user_id
    from public.organization_memberships m
    join public.users u on u.id = m.user_id
    where m.id = new.recipient_membership_id
      and m.organization_id = new.organization_id
      and m.status = 'active'
      and u.account_state = 'active';

    if v_recipient_user_id is null then
      raise exception using errcode = '23514', message = 'recipient_membership_inactive';
    end if;
    if v_recipient_user_id = v_asker_user_id then
      raise exception using errcode = '23514', message = 'ask_parties_must_differ';
    end if;
  end if;

  return new;
end;
$$;

create trigger asks_validate_parties
  before insert or update of organization_id, asker_membership_id, recipient_membership_id, kind
  on public.asks
  for each row execute function private.validate_ask_parties();

create function private.enforce_ask_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(
    new.organization_id, new.asker_membership_id, new.kind,
    new.recipient_membership_id, new.question, new.request_message,
    new.reach, new.anonymous_until_accepted, new.created_at
  ) is distinct from row(
    old.organization_id, old.asker_membership_id, old.kind,
    old.recipient_membership_id, old.question, old.request_message,
    old.reach, old.anonymous_until_accepted, old.created_at
  ) then
    raise exception using errcode = '23514', message = 'published_ask_is_immutable';
  end if;

  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'waiting' and new.status in ('accepted', 'declined', 'retracted', 'closed'))
    or (old.status = 'open' and new.status in ('accepted', 'retracted', 'closed'))
    or (old.status = 'accepted' and new.status in ('resolved', 'closed'))
  ) then
    raise exception using errcode = '23514', message = 'invalid_ask_transition';
  end if;

  return new;
end;
$$;

create trigger asks_enforce_transition
  before update on public.asks
  for each row execute function private.enforce_ask_transition();

create function private.validate_reopened_ask()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_asker uuid;
begin
  if new.reopened_from_ask_id is null then
    return null;
  end if;

  select a.organization_id, a.asker_membership_id
    into v_org, v_asker
  from public.asks a
  where a.id = new.reopened_from_ask_id;

  if v_org is distinct from new.organization_id or v_asker is distinct from new.asker_membership_id then
    raise exception using errcode = '23514', message = 'reopened_ask_owner_mismatch';
  end if;
  return null;
end;
$$;

create constraint trigger asks_validate_reopened
  after insert or update of reopened_from_ask_id, organization_id, asker_membership_id
  on public.asks
  deferrable initially deferred
  for each row execute function private.validate_reopened_ask();

create function private.validate_ask_offer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind text;
  v_ask_status text;
  v_organization_id uuid;
  v_asker_user_id uuid;
  v_helper_user_id uuid;
begin
  select a.kind, a.status, a.organization_id, asker.user_id
    into v_kind, v_ask_status, v_organization_id, v_asker_user_id
  from public.asks a
  join public.organization_memberships asker on asker.id = a.asker_membership_id
  where a.id = new.ask_id;

  if v_kind is distinct from 'circle' or v_organization_id is distinct from new.organization_id then
    raise exception using errcode = '23514', message = 'offer_requires_same_org_circle_ask';
  end if;

  select helper.user_id
    into v_helper_user_id
  from public.organization_memberships helper
  join public.users u on u.id = helper.user_id
  where helper.id = new.helper_membership_id
    and helper.organization_id = new.organization_id
    and helper.status = 'active'
    and u.account_state = 'active';

  if v_helper_user_id is null or v_helper_user_id = v_asker_user_id then
    raise exception using errcode = '23514', message = 'invalid_offer_helper';
  end if;

  if tg_op = 'INSERT' and v_ask_status <> 'open' then
    raise exception using errcode = '23514', message = 'offer_requires_open_ask';
  end if;

  return new;
end;
$$;

create trigger ask_offers_validate
  before insert or update of organization_id, ask_id, helper_membership_id
  on public.ask_offers
  for each row execute function private.validate_ask_offer();

create function private.enforce_offer_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(new.organization_id, new.ask_id, new.helper_membership_id, new.offer_note, new.created_at)
     is distinct from
     row(old.organization_id, old.ask_id, old.helper_membership_id, old.offer_note, old.created_at) then
    raise exception using errcode = '23514', message = 'published_offer_is_immutable';
  end if;

  if new.status = old.status then
    return new;
  end if;

  if not (
    old.status = 'pending' and new.status in ('accepted', 'declined', 'closed')
    or old.status = 'accepted' and new.status = 'closed'
  ) then
    raise exception using errcode = '23514', message = 'invalid_offer_transition';
  end if;

  return new;
end;
$$;

create trigger ask_offers_enforce_transition
  before update on public.ask_offers
  for each row execute function private.enforce_offer_transition();

create function private.validate_conversation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_asker_user_id uuid;
  v_counterpart_user_id uuid;
  v_organization_id uuid;
  v_status text;
begin
  if new.kind = 'direct' then
    return new;
  end if;

  select asker.user_id, a.organization_id, a.status,
         case
           when a.kind = 'direct' then recipient.user_id
           else accepted_helper.user_id
         end
    into v_asker_user_id, v_organization_id, v_status, v_counterpart_user_id
  from public.asks a
  join public.organization_memberships asker on asker.id = a.asker_membership_id
  left join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
  left join public.ask_offers accepted_offer
    on accepted_offer.ask_id = a.id and accepted_offer.status = 'accepted'
  left join public.organization_memberships accepted_helper
    on accepted_helper.id = accepted_offer.helper_membership_id
  where a.id = new.ask_id;

  if v_status not in ('accepted', 'resolved')
     or v_organization_id is distinct from new.organization_id
     or v_counterpart_user_id is null
     or new.user_a_id <> least(v_asker_user_id, v_counterpart_user_id)
     or new.user_b_id <> greatest(v_asker_user_id, v_counterpart_user_id) then
    raise exception using errcode = '23514', message = 'ask_conversation_participants_invalid';
  end if;

  return new;
end;
$$;

create trigger conversations_validate
  before insert or update of kind, user_a_id, user_b_id, organization_id, ask_id
  on public.conversations
  for each row execute function private.validate_conversation();

create function private.validate_message_sender()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_user_a_id uuid;
  v_user_b_id uuid;
  v_kind text;
  v_ask_status text;
  v_sender_state text;
  v_counterpart_state text;
begin
  if new.kind = 'system' then
    return new;
  end if;

  select c.user_a_id, c.user_b_id, c.kind, a.status
    into v_user_a_id, v_user_b_id, v_kind, v_ask_status
  from public.conversations c
  left join public.asks a on a.id = c.ask_id
  where c.id = new.conversation_id;

  if new.sender_user_id not in (v_user_a_id, v_user_b_id) then
    raise exception using errcode = '23514', message = 'message_sender_not_participant';
  end if;

  if private.is_blocked(v_user_a_id, v_user_b_id) then
    raise exception using errcode = '42501', message = 'message_blocked';
  end if;

  select sender.account_state, counterpart.account_state
    into v_sender_state, v_counterpart_state
  from public.users sender
  join public.users counterpart
    on counterpart.id = case
      when new.sender_user_id = v_user_a_id then v_user_b_id
      else v_user_a_id
    end
  where sender.id = new.sender_user_id;

  if v_sender_state <> 'active' or v_counterpart_state <> 'active' then
    raise exception using errcode = '42501', message = 'message_account_unavailable';
  end if;

  if v_kind = 'direct' and not private.is_connected(v_user_a_id, v_user_b_id) then
    raise exception using errcode = '42501', message = 'message_connection_required';
  elsif v_kind = 'ask' and v_ask_status not in ('accepted', 'resolved') then
    raise exception using errcode = '42501', message = 'message_ask_unavailable';
  end if;

  return new;
end;
$$;

create trigger messages_validate_sender
  before insert on public.messages
  for each row execute function private.validate_message_sender();

create function private.update_conversation_last_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = greatest(coalesce(last_message_at, new.created_at), new.created_at)
  where id = new.conversation_id;
  return null;
end;
$$;

create trigger messages_update_conversation
  after insert on public.messages
  for each row execute function private.update_conversation_last_message();

create function private.broadcast_message_created()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.broadcast_conversation_event(
    new.conversation_id,
    'message.created',
    jsonb_build_object(
      'conversationId', new.conversation_id,
      'messageId', new.id::text
    )
  );
  return null;
end;
$$;

create trigger messages_broadcast_created
  after insert on public.messages
  for each row execute function private.broadcast_message_created();

create function private.broadcast_conversation_read_advanced()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.last_read_message_id is null then
    return null;
  end if;

  if tg_op = 'UPDATE'
     and old.last_read_message_id is not null
     and new.last_read_message_id <= old.last_read_message_id then
    return null;
  end if;

  perform private.broadcast_conversation_event(
    new.conversation_id,
    'read.advanced',
    jsonb_build_object(
      'conversationId', new.conversation_id,
      'readerUserId', new.user_id,
      'messageId', new.last_read_message_id::text
    )
  );
  return null;
end;
$$;

create trigger conversation_reads_broadcast_advanced
  after insert or update of last_read_message_id on public.conversation_reads
  for each row execute function private.broadcast_conversation_read_advanced();

create function private.validate_report_target()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  if tg_op = 'UPDATE' then
    if row(new.target_type, new.target_id, new.evidence_snapshot)
       is distinct from row(old.target_type, old.target_id, old.evidence_snapshot) then
      raise exception using errcode = '23514', message = 'report_evidence_is_immutable';
    end if;

    if old.ask_id is not null and new.ask_id is null
       or old.offer_id is not null and new.offer_id is null
       or old.message_id is not null and new.message_id is null
       or old.profile_user_id is not null and new.profile_user_id is null then
      return new;
    end if;
  end if;

  v_count := num_nonnulls(new.ask_id, new.offer_id, new.message_id, new.profile_user_id);
  if v_count <> 1 then
    raise exception using errcode = '23514', message = 'report_requires_one_typed_target';
  end if;

  if not (
    (new.target_type = 'ask' and new.ask_id is not null and new.target_id = new.ask_id::text)
    or (new.target_type = 'offer' and new.offer_id is not null and new.target_id = new.offer_id::text)
    or (new.target_type = 'message' and new.message_id is not null and new.target_id = new.message_id::text)
    or (new.target_type = 'profile' and new.profile_user_id is not null and new.target_id = new.profile_user_id::text)
  ) then
    raise exception using errcode = '23514', message = 'report_target_mismatch';
  end if;

  return new;
end;
$$;

create trigger reports_validate_target
  before insert or update on private.reports
  for each row execute function private.validate_report_target();

create function private.validate_ask_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask_id uuid;
  v_kind text;
  v_status text;
  v_asker_membership_id uuid;
  v_recipient_membership_id uuid;
  v_accepted_offer_count integer;
  v_offer_count integer;
  v_conversation_count integer;
begin
  if tg_table_name = 'asks' then
    v_ask_id := coalesce(new.id, old.id);
  elsif tg_table_name = 'ask_offers' then
    v_ask_id := coalesce(new.ask_id, old.ask_id);
  else
    v_ask_id := coalesce(new.ask_id, old.ask_id);
  end if;

  select a.kind, a.status, a.asker_membership_id, a.recipient_membership_id
    into v_kind, v_status, v_asker_membership_id, v_recipient_membership_id
  from public.asks a
  where a.id = v_ask_id;

  if not found then
    return null;
  end if;

  select count(*), count(*) filter (where ao.status = 'accepted')
    into v_offer_count, v_accepted_offer_count
  from public.ask_offers ao
  where ao.ask_id = v_ask_id;

  if v_kind = 'direct' and v_offer_count <> 0 then
    raise exception using errcode = '23514', message = 'direct_ask_cannot_have_offers';
  end if;

  if v_kind = 'circle' then
    if v_status in ('accepted', 'resolved') and v_accepted_offer_count <> 1 then
      raise exception using errcode = '23514', message = 'accepted_circle_ask_requires_one_offer';
    elsif v_status not in ('accepted', 'resolved') and v_accepted_offer_count <> 0 then
      raise exception using errcode = '23514', message = 'inactive_circle_ask_cannot_have_accepted_offer';
    end if;
  end if;

  select count(*)
    into v_conversation_count
  from public.conversations c
  where c.ask_id = v_ask_id;

  if v_status in ('accepted', 'resolved') and v_conversation_count <> 1 then
    raise exception using errcode = '23514', message = 'accepted_ask_requires_one_conversation';
  elsif v_status in ('waiting', 'open', 'declined', 'retracted') and v_conversation_count <> 0 then
    raise exception using errcode = '23514', message = 'inactive_ask_cannot_have_conversation';
  elsif v_conversation_count > 1 then
    raise exception using errcode = '23514', message = 'ask_has_multiple_conversations';
  end if;

  return null;
end;
$$;

create constraint trigger asks_consistency_deferred
  after insert or update or delete on public.asks
  deferrable initially deferred
  for each row execute function private.validate_ask_consistency();

create constraint trigger ask_offers_consistency_deferred
  after insert or update or delete on public.ask_offers
  deferrable initially deferred
  for each row execute function private.validate_ask_consistency();

create constraint trigger conversations_consistency_deferred
  after insert or update or delete on public.conversations
  deferrable initially deferred
  for each row execute function private.validate_ask_consistency();

-- Keep timestamps consistent without trusting callers.
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function private.set_updated_at();
create trigger organization_memberships_set_updated_at before update on public.organization_memberships
  for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger organization_profiles_set_updated_at before update on public.organization_profiles
  for each row execute function private.set_updated_at();
create trigger profile_experiences_set_updated_at before update on public.profile_experiences
  for each row execute function private.set_updated_at();
create trigger profile_education_set_updated_at before update on public.profile_education
  for each row execute function private.set_updated_at();
create trigger helper_preferences_set_updated_at before update on public.helper_preferences
  for each row execute function private.set_updated_at();
create trigger asks_set_updated_at before update on public.asks
  for each row execute function private.set_updated_at();
create trigger ask_offers_set_updated_at before update on public.ask_offers
  for each row execute function private.set_updated_at();
create trigger connection_requests_set_updated_at before update on public.connection_requests
  for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function private.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements
  for each row execute function private.set_updated_at();
create trigger reports_set_updated_at before update on private.reports
  for each row execute function private.set_updated_at();
create trigger outbox_jobs_set_updated_at before update on private.outbox_jobs
  for each row execute function private.set_updated_at();
create trigger profile_embedding_chunks_set_updated_at before update on private.profile_embedding_chunks
  for each row execute function private.set_updated_at();
create trigger profile_embedding_status_set_updated_at before update on private.profile_embedding_status
  for each row execute function private.set_updated_at();
create trigger profile_enrichment_settings_set_updated_at before update on private.profile_enrichment_settings
  for each row execute function private.set_updated_at();
create trigger profile_enrichment_jobs_set_updated_at before update on private.profile_enrichment_jobs
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Transactional domain commands
-- ---------------------------------------------------------------------------

create function private.insert_system_message(
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

  if v_message_id is null then
    select m.id into v_message_id
    from public.messages m
    where m.conversation_id = p_conversation_id
      and m.system_event_key = p_event_key;
  end if;

  return v_message_id;
end;
$$;

create function private.lock_help_capacity(
  p_asker_membership_id uuid,
  p_helper_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_asker_key bigint;
  v_helper_key bigint;
begin
  if p_asker_membership_id is null then
    raise exception using errcode = '22023', message = 'asker_membership_required';
  end if;

  v_asker_key := pg_catalog.hashtextextended(
    'help:asker:' || p_asker_membership_id::text,
    0
  );
  v_helper_key := case
    when p_helper_membership_id is null then null
    else pg_catalog.hashtextextended(
      'help:helper:' || p_helper_membership_id::text,
      0
    )
  end;

  if v_helper_key is null then
    perform pg_advisory_xact_lock(v_asker_key);
  else
    perform pg_advisory_xact_lock(least(v_asker_key, v_helper_key));
    perform pg_advisory_xact_lock(greatest(v_asker_key, v_helper_key));
  end if;
end;
$$;

create function private.create_ask(
  p_kind text,
  p_asker_membership_id uuid,
  p_recipient_membership_id uuid,
  p_question text,
  p_request_message text,
  p_reach text,
  p_anonymous_until_accepted boolean,
  p_client_request_id uuid
)
returns table (
  result_code text,
  ask_id uuid,
  active_count integer,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_asker_user_id uuid;
  v_recipient_user_id uuid;
  v_existing public.asks%rowtype;
  v_ask_id uuid;
  v_active_count integer;
  v_max_pending smallint;
  v_pending_for_helper integer;
  v_question text := btrim(coalesce(p_question, ''));
  v_request_message text := nullif(btrim(coalesce(p_request_message, '')), '');
  v_reach text := nullif(btrim(coalesce(p_reach, '')), '');
begin
  if p_kind not in ('direct', 'circle')
     or p_asker_membership_id is null
     or p_client_request_id is null
     or char_length(v_question) not between 1 and 2000
     or (
       p_kind = 'direct'
       and (
         p_recipient_membership_id is null
         or v_request_message is null
         or char_length(v_request_message) > 4000
       )
     )
     or (
       p_kind = 'circle'
       and (p_recipient_membership_id is not null or v_reach not in ('matched', 'organization'))
     ) then
    return query select 'invalid_input'::text, null::uuid, 0, false;
    return;
  end if;

  select m.organization_id, m.user_id
    into v_organization_id, v_asker_user_id
  from public.organization_memberships m
  join public.users u on u.id = m.user_id
  where m.id = p_asker_membership_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
    and u.account_state = 'active';

  if v_organization_id is null then
    return query select 'not_available'::text, null::uuid, 0, false;
    return;
  end if;

  if p_kind = 'direct' then
    select recipient.user_id
      into v_recipient_user_id
    from public.organization_memberships recipient
    join public.users u on u.id = recipient.user_id and u.account_state = 'active'
    where recipient.id = p_recipient_membership_id
      and recipient.organization_id = v_organization_id
      and recipient.status = 'active';

    if v_recipient_user_id is null or v_recipient_user_id = v_asker_user_id then
      return query select 'not_available'::text, null::uuid, 0, false;
      return;
    end if;

    perform private.lock_user_pair(v_asker_user_id, v_recipient_user_id);
  end if;

  perform private.lock_help_capacity(
    p_asker_membership_id,
    case when p_kind = 'direct' then p_recipient_membership_id else null end
  );

  if p_kind = 'direct' then
    select hp.max_pending_requests
      into v_max_pending
    from public.organization_memberships recipient
    join public.users u on u.id = recipient.user_id and u.account_state = 'active'
    join public.helper_preferences hp
      on hp.organization_membership_id = recipient.id
     and hp.organization_id = recipient.organization_id
     and hp.open_to_help = true
     and hp.paused_at is null
    where recipient.id = p_recipient_membership_id
      and recipient.organization_id = v_organization_id
      and recipient.status = 'active'
    for update of hp;

    if v_max_pending is null
       or private.is_blocked(v_asker_user_id, v_recipient_user_id) then
      return query select 'not_available'::text, null::uuid, 0, false;
      return;
    end if;
  end if;

  select * into v_existing
  from public.asks a
  where a.asker_membership_id = p_asker_membership_id
    and a.client_request_id = p_client_request_id;

  select count(*) into v_active_count
  from public.asks a
  where a.asker_membership_id = p_asker_membership_id
    and a.status in ('waiting', 'open', 'accepted');

  if found and v_existing.id is not null then
    if v_existing.kind = p_kind
       and v_existing.recipient_membership_id is not distinct from
         (case when p_kind = 'direct' then p_recipient_membership_id else null end)
       and v_existing.question = v_question
       and v_existing.request_message is not distinct from
         (case when p_kind = 'direct' then v_request_message else null end)
       and v_existing.reach is not distinct from
         (case when p_kind = 'circle' then v_reach else null end)
       and v_existing.anonymous_until_accepted =
         (case when p_kind = 'circle' then coalesce(p_anonymous_until_accepted, false) else false end) then
      return query select 'existing'::text, v_existing.id, v_active_count, false;
    else
      return query select 'idempotency_conflict'::text, v_existing.id, v_active_count, false;
    end if;
    return;
  end if;

  if v_active_count >= 5 then
    return query select 'active_limit_reached'::text, null::uuid, v_active_count, false;
    return;
  end if;

  if p_kind = 'direct' then
    select count(*) into v_pending_for_helper
    from public.asks a
    where a.kind = 'direct'
      and a.recipient_membership_id = p_recipient_membership_id
      and a.status = 'waiting';
    if v_pending_for_helper >= v_max_pending then
      return query select 'helper_limit_reached'::text, null::uuid, v_active_count, false;
      return;
    end if;
  end if;

  insert into public.asks (
    organization_id, asker_membership_id, kind, status,
    recipient_membership_id, question, request_message, reach,
    anonymous_until_accepted, client_request_id
  ) values (
    v_organization_id, p_asker_membership_id, p_kind,
    case when p_kind = 'direct' then 'waiting' else 'open' end,
    case when p_kind = 'direct' then p_recipient_membership_id else null end,
    v_question,
    case when p_kind = 'direct' then v_request_message else null end,
    case when p_kind = 'circle' then v_reach else null end,
    case when p_kind = 'circle' then coalesce(p_anonymous_until_accepted, false) else false end,
    p_client_request_id
  ) returning id into v_ask_id;

  insert into private.ask_events (
    ask_id, organization_id, actor_user_id, event_type, payload
  ) values (
    v_ask_id, v_organization_id, v_asker_user_id, 'created',
    jsonb_build_object('kind', p_kind)
  );

  if p_kind = 'direct' then
    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'ask_received',
        'recipientUserId', v_recipient_user_id,
        'actorUserId', v_asker_user_id,
        'askId', v_ask_id
      ),
      'ask_received:' || v_ask_id::text
    );
  else
    perform private.enqueue_outbox(
      'run_ask_matching',
      jsonb_build_object('askId', v_ask_id),
      'run_ask_matching:' || v_ask_id::text
    );
  end if;

  perform private.broadcast_help_change(v_ask_id);
  return query select 'created'::text, v_ask_id, v_active_count + 1, true;
end;
$$;

create function private.respond_to_direct_ask(
  p_ask_id uuid,
  p_decision text,
  p_opening_message text,
  p_decline_reason_code text,
  p_decline_note text,
  p_client_nonce uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask public.asks%rowtype;
  v_asker_user_id uuid;
  v_recipient_user_id uuid;
  v_conversation_id uuid;
begin
  select * into v_ask
  from public.asks a
  where a.id = p_ask_id;

  if not found or v_ask.kind <> 'direct' then
    raise exception using errcode = '22023', message = 'direct_ask_not_found';
  end if;

  select asker.user_id, recipient.user_id
    into v_asker_user_id, v_recipient_user_id
  from public.organization_memberships asker
  join public.organization_memberships recipient on recipient.id = v_ask.recipient_membership_id
  where asker.id = v_ask.asker_membership_id;

  if v_recipient_user_id is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'direct_ask_not_recipient';
  end if;

  perform private.lock_user_pair(v_asker_user_id, v_recipient_user_id);

  select * into v_ask
  from public.asks a
  where a.id = p_ask_id
  for update;

  if not found or v_ask.kind <> 'direct'
     or v_recipient_user_id is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'direct_ask_not_recipient';
  end if;
  if private.is_blocked(v_asker_user_id, v_recipient_user_id) then
    raise exception using errcode = '42501', message = 'ask_blocked';
  end if;

  if v_ask.status = 'accepted' and p_decision = 'accept' then
    select c.id into v_conversation_id from public.conversations c where c.ask_id = p_ask_id;
    return v_conversation_id;
  elsif v_ask.status = 'declined' and p_decision = 'decline' then
    return null;
  elsif v_ask.status <> 'waiting' then
    raise exception using errcode = 'P0001', message = 'ask_already_decided';
  end if;

  if p_decision = 'accept' then
    if p_client_nonce is null or char_length(btrim(coalesce(p_opening_message, ''))) = 0 then
      raise exception using errcode = '22023', message = 'opening_message_required';
    end if;

    update public.asks
    set status = 'accepted', accepted_at = now(), responded_at = now()
    where id = p_ask_id;

    insert into public.conversations (
      kind, user_a_id, user_b_id, organization_id, ask_id
    ) values (
      'ask', least(v_asker_user_id, v_recipient_user_id),
      greatest(v_asker_user_id, v_recipient_user_id),
      v_ask.organization_id, p_ask_id
    )
    on conflict (ask_id) where ask_id is not null
    do nothing
    returning id into v_conversation_id;

    if v_conversation_id is null then
      select c.id into v_conversation_id
      from public.conversations c
      where c.ask_id = p_ask_id;
    end if;

    perform private.insert_system_message(
      v_conversation_id,
      'ask_accepted',
      'ask_accepted:' || p_ask_id::text,
      'Ask accepted.',
      v_recipient_user_id
    );

    insert into public.messages (
      conversation_id, sender_user_id, kind, body, client_nonce
    ) values (
      v_conversation_id, v_recipient_user_id, 'user', p_opening_message, p_client_nonce
    )
    on conflict (conversation_id, sender_user_id, client_nonce)
      where client_nonce is not null
    do nothing;

    update public.helper_preferences
    set consecutive_timeouts = 0
    where organization_membership_id = v_ask.recipient_membership_id;

    insert into private.ask_events (
      ask_id, organization_id, actor_user_id, event_type
    ) values (p_ask_id, v_ask.organization_id, v_recipient_user_id, 'accepted');

    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'ask_accepted', 'recipientUserId', v_asker_user_id,
        'actorUserId', v_recipient_user_id, 'askId', p_ask_id,
        'conversationId', v_conversation_id
      ),
      'ask_accepted:' || p_ask_id::text
    );
    perform private.broadcast_help_change(p_ask_id);
    return v_conversation_id;
  elsif p_decision = 'decline' then
    if p_decline_reason_code not in ('unavailable', 'outside_expertise', 'other')
       or char_length(btrim(coalesce(p_decline_note, ''))) = 0 then
      raise exception using errcode = '22023', message = 'decline_note_required';
    end if;

    update public.asks
    set status = 'declined', decline_reason_code = p_decline_reason_code,
        decline_note = p_decline_note, responded_at = now(), ended_at = now()
    where id = p_ask_id;

    update public.helper_preferences
    set consecutive_timeouts = 0
    where organization_membership_id = v_ask.recipient_membership_id;

    insert into private.ask_events (
      ask_id, organization_id, actor_user_id, event_type,
      payload
    ) values (
      p_ask_id, v_ask.organization_id, v_recipient_user_id, 'declined',
      jsonb_build_object('reasonCode', p_decline_reason_code)
    );

    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'ask_declined', 'recipientUserId', v_asker_user_id,
        'actorUserId', v_recipient_user_id, 'askId', p_ask_id
      ),
      'ask_declined:' || p_ask_id::text
    );
    perform private.broadcast_help_change(p_ask_id);
    return null;
  end if;

  raise exception using errcode = '22023', message = 'invalid_direct_ask_decision';
end;
$$;

create function private.retract_ask(p_ask_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask public.asks%rowtype;
  v_actor uuid := (select auth.uid());
begin
  select * into v_ask from public.asks where id = p_ask_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'ask_not_found';
  end if;
  if not private.owns_membership(v_ask.asker_membership_id, v_ask.organization_id) then
    raise exception using errcode = '42501', message = 'ask_not_owned';
  end if;
  if v_ask.status not in ('waiting', 'open') then
    raise exception using errcode = 'P0001', message = 'ask_cannot_be_retracted';
  end if;

  update public.ask_offers
  set status = 'closed', closure_reason = 'ask_retracted', closed_at = now()
  where ask_id = p_ask_id and status = 'pending';

  update public.asks set status = 'retracted', ended_at = now() where id = p_ask_id;
  insert into private.ask_events (ask_id, organization_id, actor_user_id, event_type)
  values (p_ask_id, v_ask.organization_id, v_actor, 'retracted');
  perform private.broadcast_help_change(p_ask_id);
end;
$$;

create function private.resolve_ask(p_ask_id uuid, p_outcome_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask public.asks%rowtype;
  v_actor uuid := (select auth.uid());
  v_conversation_id uuid;
begin
  select * into v_ask from public.asks where id = p_ask_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'ask_not_found';
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.ask_id = p_ask_id
    and v_actor in (c.user_a_id, c.user_b_id);
  if v_conversation_id is null then
    raise exception using errcode = '42501', message = 'ask_not_owned';
  end if;
  if v_ask.status = 'resolved' then
    return;
  end if;
  if v_ask.status <> 'accepted' then
    raise exception using errcode = 'P0001', message = 'ask_not_accepted';
  end if;

  update public.asks
  set status = 'resolved', outcome_note = nullif(btrim(p_outcome_note), ''), ended_at = now()
  where id = p_ask_id;
  perform private.insert_system_message(
    v_conversation_id,
    'ask_resolved',
    'ask_resolved:' || p_ask_id::text,
    'Ask resolved.',
    v_actor
  );
  insert into private.ask_events (ask_id, organization_id, actor_user_id, event_type)
  values (p_ask_id, v_ask.organization_id, v_actor, 'resolved');
  perform private.broadcast_help_change(p_ask_id);
end;
$$;

create function private.offer_to_help(
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
     or v_ask.reach <> 'matched' then
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

create function private.decide_offer(
  p_offer_id uuid,
  p_decision text,
  p_opening_message text,
  p_decline_reason_code text,
  p_decline_note text,
  p_client_nonce uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.ask_offers%rowtype;
  v_ask public.asks%rowtype;
  v_asker_user_id uuid;
  v_helper_user_id uuid;
  v_conversation_id uuid;
begin
  select * into v_offer from public.ask_offers where id = p_offer_id;
  if not found then
    raise exception using errcode = '22023', message = 'offer_not_found';
  end if;
  select * into v_ask from public.asks where id = v_offer.ask_id;

  if not private.owns_membership(v_ask.asker_membership_id, v_ask.organization_id) then
    raise exception using errcode = '42501', message = 'offer_decision_not_owned';
  end if;

  select asker.user_id, helper.user_id
    into v_asker_user_id, v_helper_user_id
  from public.organization_memberships asker
  join public.organization_memberships helper on helper.id = v_offer.helper_membership_id
  where asker.id = v_ask.asker_membership_id;

  perform private.lock_user_pair(v_asker_user_id, v_helper_user_id);

  select * into v_ask
  from public.asks
  where id = v_offer.ask_id
  for update;

  perform 1
  from public.ask_offers ao
  where ao.ask_id = v_ask.id
  order by ao.id
  for update;

  select * into v_offer
  from public.ask_offers
  where id = p_offer_id;

  if not found or v_offer.ask_id <> v_ask.id
     or not private.owns_membership(v_ask.asker_membership_id, v_ask.organization_id) then
    raise exception using errcode = '42501', message = 'offer_decision_not_owned';
  end if;

  if private.is_blocked(v_asker_user_id, v_helper_user_id) then
    raise exception using errcode = '42501', message = 'offer_blocked';
  end if;

  if v_offer.status = 'accepted' and p_decision = 'accept' then
    select c.id into v_conversation_id from public.conversations c where c.ask_id = v_ask.id;
    return v_conversation_id;
  elsif v_offer.status = 'declined' and p_decision = 'decline' then
    return null;
  elsif v_offer.status <> 'pending' or v_ask.status <> 'open' then
    raise exception using errcode = 'P0001', message = 'offer_already_decided';
  end if;

  if p_decision = 'accept' then
    if p_client_nonce is null or char_length(btrim(coalesce(p_opening_message, ''))) = 0 then
      raise exception using errcode = '22023', message = 'opening_message_required';
    end if;

    update public.ask_offers
    set status = 'accepted', responded_at = now()
    where id = p_offer_id;

    update public.ask_offers
    set status = 'closed', closure_reason = 'accepted_elsewhere', closed_at = now()
    where ask_id = v_ask.id and id <> p_offer_id and status = 'pending';

    update public.asks
    set status = 'accepted', accepted_at = now(), responded_at = now()
    where id = v_ask.id;

    insert into public.conversations (
      kind, user_a_id, user_b_id, organization_id, ask_id
    ) values (
      'ask', least(v_asker_user_id, v_helper_user_id),
      greatest(v_asker_user_id, v_helper_user_id),
      v_ask.organization_id, v_ask.id
    )
    on conflict (ask_id) where ask_id is not null
    do nothing
    returning id into v_conversation_id;

    if v_conversation_id is null then
      select c.id into v_conversation_id
      from public.conversations c
      where c.ask_id = v_ask.id;
    end if;

    perform private.insert_system_message(
      v_conversation_id,
      'ask_accepted',
      'ask_accepted:' || v_ask.id::text,
      'Ask accepted.',
      v_asker_user_id
    );

    insert into public.messages (
      conversation_id, sender_user_id, kind, body, client_nonce
    ) values (
      v_conversation_id, v_asker_user_id, 'user', p_opening_message, p_client_nonce
    )
    on conflict (conversation_id, sender_user_id, client_nonce)
      where client_nonce is not null
    do nothing;

    insert into private.ask_events (
      ask_id, organization_id, actor_user_id, event_type,
      payload
    ) values (
      v_ask.id, v_ask.organization_id, v_asker_user_id, 'accepted',
      jsonb_build_object('offerId', p_offer_id)
    );

    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'offer_accepted', 'recipientUserId', v_helper_user_id,
        'actorUserId', v_asker_user_id, 'askId', v_ask.id,
        'offerId', p_offer_id, 'conversationId', v_conversation_id
      ),
      'offer_accepted:' || p_offer_id::text
    );
    perform private.broadcast_help_change(v_ask.id, p_offer_id);
    return v_conversation_id;
  elsif p_decision = 'decline' then
    if p_decline_reason_code not in ('went_another_direction', 'not_right_fit', 'other')
       or char_length(btrim(coalesce(p_decline_note, ''))) = 0 then
      raise exception using errcode = '22023', message = 'offer_decline_note_required';
    end if;

    update public.ask_offers
    set status = 'declined', decline_reason_code = p_decline_reason_code,
        decline_note = p_decline_note, responded_at = now(), closed_at = now()
    where id = p_offer_id;

    insert into private.ask_events (
      ask_id, organization_id, actor_user_id, event_type,
      payload
    ) values (
      v_ask.id, v_ask.organization_id, v_asker_user_id, 'offer_declined',
      jsonb_build_object('offerId', p_offer_id, 'reasonCode', p_decline_reason_code)
    );

    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'offer_declined', 'recipientUserId', v_helper_user_id,
        'actorUserId', v_asker_user_id, 'askId', v_ask.id,
        'offerId', p_offer_id
      ),
      'offer_declined:' || p_offer_id::text
    );
    perform private.broadcast_help_change(v_ask.id, p_offer_id);
    return null;
  end if;

  raise exception using errcode = '22023', message = 'invalid_offer_decision';
end;
$$;

create function private.send_connection_request(
  p_recipient_user_id uuid,
  p_origin_organization_id uuid,
  p_intro_message text,
  p_client_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requester_user_id uuid := (select auth.uid());
  v_organization_id uuid := p_origin_organization_id;
  v_request_id uuid;
begin
  if v_requester_user_id is null or p_recipient_user_id = v_requester_user_id then
    raise exception using errcode = '22023', message = 'invalid_connection_recipient';
  end if;
  if private.is_blocked(v_requester_user_id, p_recipient_user_id) then
    raise exception using errcode = '42501', message = 'connection_blocked';
  end if;
  if private.is_connected(v_requester_user_id, p_recipient_user_id) then
    raise exception using errcode = 'P0001', message = 'already_connected';
  end if;

  if v_organization_id is null then
    select mine.organization_id into v_organization_id
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
     and theirs.user_id = p_recipient_user_id
     and theirs.status = 'active'
    where mine.user_id = v_requester_user_id and mine.status = 'active'
    order by mine.created_at
    limit 1;
  elsif not (
    private.is_active_member_of(v_organization_id)
    and exists (
      select 1 from public.organization_memberships m
      where m.organization_id = v_organization_id
        and m.user_id = p_recipient_user_id and m.status = 'active'
    )
  ) then
    raise exception using errcode = '42501', message = 'connection_requires_shared_organization';
  end if;

  if v_organization_id is null then
    raise exception using errcode = '42501', message = 'connection_requires_shared_organization';
  end if;

  select id into v_request_id
  from public.connection_requests
  where requester_user_id = v_requester_user_id
    and client_request_id = p_client_request_id;
  if v_request_id is not null then
    return v_request_id;
  end if;

  insert into public.connection_requests (
    requester_user_id, recipient_user_id, origin_organization_id,
    intro_message, client_request_id
  ) values (
    v_requester_user_id, p_recipient_user_id, v_organization_id,
    nullif(btrim(p_intro_message), ''), p_client_request_id
  ) returning id into v_request_id;

  perform private.enqueue_outbox(
    'create_notification',
    jsonb_build_object(
      'type', 'connection_requested', 'recipientUserId', p_recipient_user_id,
      'actorUserId', v_requester_user_id, 'connectionRequestId', v_request_id
    ),
    'connection_requested:' || v_request_id::text
  );
  return v_request_id;
end;
$$;

create function private.respond_to_connection_request(
  p_request_id uuid,
  p_decision text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.connection_requests%rowtype;
  v_connection_id uuid;
  v_conversation_id uuid;
begin
  select * into v_request
  from public.connection_requests
  where id = p_request_id;

  if not found or v_request.recipient_user_id is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'connection_request_not_recipient';
  end if;

  perform private.lock_user_pair(
    v_request.requester_user_id,
    v_request.recipient_user_id
  );

  select * into v_request
  from public.connection_requests
  where id = p_request_id
  for update;

  if not found or v_request.recipient_user_id is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'connection_request_not_recipient';
  end if;
  if private.is_blocked(v_request.requester_user_id, v_request.recipient_user_id) then
    raise exception using errcode = '42501', message = 'connection_blocked';
  end if;

  if v_request.status = 'accepted' and p_decision = 'accept' then
    select id into v_connection_id
    from public.connections
    where connection_request_id = p_request_id;
    select c.id into v_conversation_id
    from public.conversations c
    where c.kind = 'direct'
      and c.user_a_id = least(v_request.requester_user_id, v_request.recipient_user_id)
      and c.user_b_id = greatest(v_request.requester_user_id, v_request.recipient_user_id);
    perform private.insert_system_message(
      v_conversation_id,
      'connection_accepted',
      'connection_accepted:' || p_request_id::text,
      'Connection accepted.',
      v_request.recipient_user_id
    );
    return v_connection_id;
  elsif v_request.status = 'declined' and p_decision = 'decline' then
    return null;
  elsif v_request.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'connection_request_already_decided';
  end if;

  if p_decision = 'accept' then
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
      set connection_request_id = coalesce(public.connections.connection_request_id, excluded.connection_request_id)
    returning id into v_connection_id;

    insert into public.conversations (kind, user_a_id, user_b_id)
    values (
      'direct',
      least(v_request.requester_user_id, v_request.recipient_user_id),
      greatest(v_request.requester_user_id, v_request.recipient_user_id)
    )
    on conflict (user_a_id, user_b_id) where kind = 'direct'
    do nothing
    returning id into v_conversation_id;

    if v_conversation_id is null then
      select c.id into v_conversation_id
      from public.conversations c
      where c.kind = 'direct'
        and c.user_a_id = least(v_request.requester_user_id, v_request.recipient_user_id)
        and c.user_b_id = greatest(v_request.requester_user_id, v_request.recipient_user_id);
    end if;

    perform private.insert_system_message(
      v_conversation_id,
      'connection_accepted',
      'connection_accepted:' || p_request_id::text,
      'Connection accepted.',
      v_request.recipient_user_id
    );

    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'connection_accepted', 'recipientUserId', v_request.requester_user_id,
        'actorUserId', v_request.recipient_user_id,
        'connectionRequestId', p_request_id,
        'conversationId', v_conversation_id
      ),
      'connection_accepted:' || p_request_id::text
    );
    return v_connection_id;
  elsif p_decision = 'decline' then
    update public.connection_requests
    set status = 'declined', responded_at = now()
    where id = p_request_id;
    return null;
  end if;

  raise exception using errcode = '22023', message = 'invalid_connection_decision';
end;
$$;

create function private.disconnect(p_other_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_deleted_count integer;
begin
  if v_user_id is null or v_user_id = p_other_user_id or not exists (
    select 1 from public.users u where u.id = p_other_user_id
  ) then
    raise exception using errcode = '22023', message = 'invalid_disconnect_target';
  end if;

  perform private.lock_user_pair(v_user_id, p_other_user_id);

  delete from public.connections c
  where c.user_a_id = least((select auth.uid()), p_other_user_id)
    and c.user_b_id = greatest((select auth.uid()), p_other_user_id);

  get diagnostics v_deleted_count = row_count;
  if v_deleted_count > 0 then
    perform private.broadcast_pair_conversation_event(
      v_user_id, p_other_user_id, 'conversation.permissions_changed'
    );
  end if;
end;
$$;

create function private.block_member(p_blocked_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_blocker_user_id uuid := (select auth.uid());
  v_inserted_count integer;
  v_ask_id uuid;
begin
  if v_blocker_user_id is null or v_blocker_user_id = p_blocked_user_id then
    raise exception using errcode = '22023', message = 'invalid_block_target';
  end if;
  if not exists (select 1 from public.users u where u.id = p_blocked_user_id) then
    raise exception using errcode = '22023', message = 'invalid_block_target';
  end if;

  perform private.lock_user_pair(v_blocker_user_id, p_blocked_user_id);

  for v_ask_id in
    select distinct affected.ask_id
    from (
      select a.id as ask_id
      from public.asks a
      join public.organization_memberships asker on asker.id = a.asker_membership_id
      join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
      where a.status in ('waiting', 'accepted')
        and (
          (asker.user_id = v_blocker_user_id and recipient.user_id = p_blocked_user_id)
          or (asker.user_id = p_blocked_user_id and recipient.user_id = v_blocker_user_id)
        )

      union

      select a.id
      from public.asks a
      join public.organization_memberships asker on asker.id = a.asker_membership_id
      join public.ask_offers ao on ao.ask_id = a.id and ao.status in ('pending', 'accepted')
      join public.organization_memberships helper on helper.id = ao.helper_membership_id
      where asker.user_id in (v_blocker_user_id, p_blocked_user_id)
        and helper.user_id in (v_blocker_user_id, p_blocked_user_id)
    ) affected
    order by affected.ask_id
  loop
    perform private.broadcast_help_change(v_ask_id);
  end loop;

  insert into public.member_blocks (blocker_user_id, blocked_user_id)
  values (v_blocker_user_id, p_blocked_user_id)
  on conflict do nothing;

  get diagnostics v_inserted_count = row_count;

  update public.connection_requests
  set status = 'cancelled', responded_at = now()
  where status = 'pending'
    and (
      requester_user_id in (v_blocker_user_id, p_blocked_user_id)
      and recipient_user_id in (v_blocker_user_id, p_blocked_user_id)
    );

  delete from public.connections
  where user_a_id = least(v_blocker_user_id, p_blocked_user_id)
    and user_b_id = greatest(v_blocker_user_id, p_blocked_user_id);

  update public.ask_offers ao
  set status = 'closed', closure_reason = 'blocked', closed_at = now()
  from public.asks a,
       public.organization_memberships asker,
       public.organization_memberships helper
  where ao.ask_id = a.id
    and asker.id = a.asker_membership_id
    and helper.id = ao.helper_membership_id
    and ao.status in ('pending', 'accepted')
    and asker.user_id in (v_blocker_user_id, p_blocked_user_id)
    and helper.user_id in (v_blocker_user_id, p_blocked_user_id);

  update public.asks a
  set status = 'closed', closure_reason = 'blocked', ended_at = now()
  where a.status in ('waiting', 'accepted')
    and (
      exists (
        select 1
        from public.organization_memberships asker
        join public.organization_memberships recipient
          on recipient.id = a.recipient_membership_id
        where asker.id = a.asker_membership_id
          and (
            (asker.user_id = v_blocker_user_id and recipient.user_id = p_blocked_user_id)
            or (asker.user_id = p_blocked_user_id and recipient.user_id = v_blocker_user_id)
          )
      )
      or exists (
        select 1
        from public.ask_offers ao
        join public.organization_memberships asker on asker.id = a.asker_membership_id
        join public.organization_memberships helper on helper.id = ao.helper_membership_id
        where ao.ask_id = a.id
          and asker.user_id in (v_blocker_user_id, p_blocked_user_id)
          and helper.user_id in (v_blocker_user_id, p_blocked_user_id)
      )
    );

  insert into private.audit_log (
    actor_user_id, action, target_type, target_id
  ) values (
    v_blocker_user_id, 'safety.member_blocked', 'user', p_blocked_user_id::text
  );

  if v_inserted_count > 0 then
    perform private.broadcast_pair_conversation_event(
      v_blocker_user_id, p_blocked_user_id, 'conversation.revoked'
    );
  end if;
end;
$$;

create function private.unblock_member(p_blocked_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_blocker_user_id uuid := (select auth.uid());
  v_deleted_count integer;
begin
  if v_blocker_user_id is null or v_blocker_user_id = p_blocked_user_id
     or not exists (select 1 from public.users u where u.id = p_blocked_user_id) then
    raise exception using errcode = '22023', message = 'invalid_unblock_target';
  end if;

  perform private.lock_user_pair(v_blocker_user_id, p_blocked_user_id);

  delete from public.member_blocks
  where blocker_user_id = v_blocker_user_id
    and blocked_user_id = p_blocked_user_id;

  get diagnostics v_deleted_count = row_count;

  insert into private.audit_log (
    actor_user_id, action, target_type, target_id
  ) values (
    v_blocker_user_id, 'safety.member_unblocked', 'user', p_blocked_user_id::text
  );

  if v_deleted_count > 0 then
    perform private.broadcast_pair_conversation_event(
      v_blocker_user_id, p_blocked_user_id, 'conversation.permissions_changed'
    );
  end if;
end;
$$;

create function private.get_or_create_direct_conversation(p_other_user_id uuid)
returns table(result_code text, conversation_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_conversation_id uuid;
begin
  if v_user_id is null or v_user_id = p_other_user_id or not exists (
    select 1
    from public.users mine
    join public.users other on other.id = p_other_user_id
    where mine.id = v_user_id
      and mine.account_state = 'active'
      and other.account_state = 'active'
  ) then
    return query select 'not_available'::text, null::uuid;
    return;
  end if;

  perform private.lock_user_pair(v_user_id, p_other_user_id);

  if private.is_blocked(v_user_id, p_other_user_id) then
    return query select 'not_available'::text, null::uuid;
    return;
  end if;
  if not private.is_connected(v_user_id, p_other_user_id) then
    return query select 'connection_required'::text, null::uuid;
    return;
  end if;

  insert into public.conversations (kind, user_a_id, user_b_id)
  values ('direct', least(v_user_id, p_other_user_id), greatest(v_user_id, p_other_user_id))
  on conflict (user_a_id, user_b_id) where kind = 'direct'
  do nothing
  returning public.conversations.id into v_conversation_id;

  if v_conversation_id is null then
    select c.id into v_conversation_id
    from public.conversations c
    where c.kind = 'direct'
      and c.user_a_id = least(v_user_id, p_other_user_id)
      and c.user_b_id = greatest(v_user_id, p_other_user_id);
  end if;

  return query select 'ready'::text, v_conversation_id;
end;
$$;

create function private.send_message(
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
  v_kind text;
  v_ask_id uuid;
  v_ask_status text;
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

  select c.user_a_id, c.user_b_id
    into v_user_a_id, v_user_b_id
  from public.conversations c
  where c.id = p_conversation_id;
  if not found or v_user_id not in (v_user_a_id, v_user_b_id) then
    return query select 'not_available'::text, null::bigint, null::timestamptz;
    return;
  end if;

  perform private.lock_user_pair(v_user_a_id, v_user_b_id);

  select c.user_a_id, c.user_b_id, c.kind, c.ask_id,
         sender.account_state, recipient.account_state,
         case when c.user_a_id = v_user_id then c.user_b_id else c.user_a_id end
    into v_user_a_id, v_user_b_id, v_kind, v_ask_id,
         v_sender_state, v_recipient_state, v_recipient_user_id
  from public.conversations c
  join public.users sender on sender.id = v_user_id
  join public.users recipient
    on recipient.id = case
      when c.user_a_id = v_user_id then c.user_b_id
      else c.user_a_id
    end
  where c.id = p_conversation_id
    and v_user_id in (c.user_a_id, c.user_b_id)
  for update of c;

  if not found
     or v_sender_state <> 'active'
     or v_recipient_state <> 'active'
     or private.is_blocked(v_user_a_id, v_user_b_id) then
    return query select 'not_available'::text, null::bigint, null::timestamptz;
    return;
  end if;

  if v_kind = 'direct' and not private.is_connected(v_user_a_id, v_user_b_id) then
    return query select 'connection_required'::text, null::bigint, null::timestamptz;
    return;
  elsif v_kind = 'ask' then
    select a.status into v_ask_status from public.asks a where a.id = v_ask_id;
    if v_ask_status not in ('accepted', 'resolved') then
      return query select 'not_available'::text, null::bigint, null::timestamptz;
      return;
    end if;
  end if;

  insert into public.messages (
    conversation_id, sender_user_id, kind, body, client_nonce
  ) values (
    p_conversation_id, v_user_id, 'user', p_body, p_client_nonce
  )
  on conflict (conversation_id, sender_user_id, client_nonce)
    where client_nonce is not null
  do nothing
  returning id, public.messages.created_at into v_message_id, v_created_at;

  if v_message_id is null then
    select m.id, m.created_at into v_message_id, v_created_at
    from public.messages m
    where m.conversation_id = p_conversation_id
      and m.sender_user_id = v_user_id
      and m.client_nonce = p_client_nonce;
    return query select 'duplicate'::text, v_message_id, v_created_at;
    return;
  end if;

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
  latest_message_id bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.kind,
    c.organization_id,
    c.ask_id,
    c.created_at,
    c.last_message_at,
    counterpart.id,
    case
      when counterpart.account_state = 'active'
        then coalesce(nullif(p.preferred_name, ''), p.display_name, 'Member')
      else 'Deleted member'
    end,
    case when counterpart.account_state = 'active' then p.avatar_path else null end,
    case when counterpart.account_state = 'active' then class_year.graduation_year else null end,
    private.can_send_to_conversation(c.id),
    viewer_read.last_read_message_id,
    viewer_read.last_read_at,
    counterpart_read.last_read_message_id,
    counterpart_read.last_read_at,
    latest.id
  from public.conversations c
  join public.users counterpart
    on counterpart.id = case
      when c.user_a_id = (select auth.uid()) then c.user_b_id
      else c.user_a_id
    end
  left join public.profiles p on p.user_id = counterpart.id
  left join public.conversation_reads viewer_read
    on viewer_read.conversation_id = c.id
   and viewer_read.user_id = (select auth.uid())
  left join public.conversation_reads counterpart_read
    on counterpart_read.conversation_id = c.id
   and counterpart_read.user_id = counterpart.id
  left join lateral (
    select op.graduation_year
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
     and theirs.user_id = counterpart.id
     and theirs.status = 'active'
    left join public.organization_profiles op
      on op.organization_id = theirs.organization_id
     and op.organization_membership_id = theirs.id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
    order by
      case when mine.organization_id = c.organization_id then 0 else 1 end,
      mine.organization_id
    limit 1
  ) class_year on true
  left join lateral (
    select m.id
    from public.messages m
    where m.conversation_id = c.id
    order by m.id desc
    limit 1
  ) latest on true
  where c.id = p_conversation_id
    and private.can_view_conversation(c.id);
$$;

create function private.list_conversation_messages_before(
  p_conversation_id uuid,
  p_before_id bigint default null,
  p_limit integer default 50
)
returns table(
  id bigint,
  conversation_id uuid,
  sender_user_id uuid,
  kind text,
  body text,
  system_event_type text,
  system_actor_user_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.conversation_id, m.sender_user_id, m.kind, m.body,
    m.system_event_type, m.system_actor_user_id, m.created_at
  from public.messages m
  where m.conversation_id = p_conversation_id
    and private.can_view_conversation(p_conversation_id)
    and (p_before_id is null or m.id < p_before_id)
  order by m.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

create function private.list_conversation_messages_after(
  p_conversation_id uuid,
  p_after_id bigint default null,
  p_limit integer default 100
)
returns table(
  id bigint,
  conversation_id uuid,
  sender_user_id uuid,
  kind text,
  body text,
  system_event_type text,
  system_actor_user_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.conversation_id, m.sender_user_id, m.kind, m.body,
    m.system_event_type, m.system_actor_user_id, m.created_at
  from public.messages m
  where m.conversation_id = p_conversation_id
    and private.can_view_conversation(p_conversation_id)
    and (p_after_id is null or m.id > p_after_id)
  order by m.id asc
  limit greatest(1, least(coalesce(p_limit, 100), 100));
$$;

create function private.mark_conversation_read(
  p_conversation_id uuid,
  p_message_id bigint
)
returns table(result_code text, last_read_message_id bigint, last_read_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_a_id uuid;
  v_user_b_id uuid;
  v_last_read_message_id bigint;
  v_last_read_at timestamptz;
begin
  select c.user_a_id, c.user_b_id
    into v_user_a_id, v_user_b_id
  from public.conversations c
  where c.id = p_conversation_id;
  if not found or v_user_id not in (v_user_a_id, v_user_b_id) then
    return query select 'not_available'::text, null::bigint, null::timestamptz;
    return;
  end if;

  perform private.lock_user_pair(v_user_a_id, v_user_b_id);

  if not private.can_view_conversation(p_conversation_id) then
    return query select 'not_available'::text, null::bigint, null::timestamptz;
    return;
  end if;
  if p_message_id is null or not exists (
    select 1 from public.messages m
    where m.conversation_id = p_conversation_id and m.id = p_message_id
  ) then
    return query select 'invalid_cursor'::text, null::bigint, null::timestamptz;
    return;
  end if;

  insert into public.conversation_reads (
    conversation_id, user_id, last_read_message_id, last_read_at
  ) values (
    p_conversation_id, v_user_id, p_message_id, now()
  )
  on conflict (conversation_id, user_id) do update
    set last_read_message_id = excluded.last_read_message_id,
        last_read_at = excluded.last_read_at
    where public.conversation_reads.last_read_message_id is null
       or public.conversation_reads.last_read_message_id < excluded.last_read_message_id
  returning public.conversation_reads.last_read_message_id,
            public.conversation_reads.last_read_at
    into v_last_read_message_id, v_last_read_at;

  if found then
    return query select 'advanced'::text, v_last_read_message_id, v_last_read_at;
    return;
  end if;

  select cr.last_read_message_id, cr.last_read_at
    into v_last_read_message_id, v_last_read_at
  from public.conversation_reads cr
  where cr.conversation_id = p_conversation_id
    and cr.user_id = v_user_id;
  return query select 'unchanged'::text, v_last_read_message_id, v_last_read_at;
end;
$$;

create function private.publish_conversation_typing(
  p_conversation_id uuid,
  p_is_typing boolean
)
returns table(result_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_a_id uuid;
  v_user_b_id uuid;
  v_sent_at timestamptz;
  v_expires_at timestamptz;
begin
  if v_user_id is null or p_is_typing is null then
    return query select 'not_available'::text, null::timestamptz;
    return;
  end if;

  select c.user_a_id, c.user_b_id
    into v_user_a_id, v_user_b_id
  from public.conversations c
  where c.id = p_conversation_id
    and v_user_id in (c.user_a_id, c.user_b_id);

  if not found then
    return query select 'not_available'::text, null::timestamptz;
    return;
  end if;

  perform private.lock_user_pair(v_user_a_id, v_user_b_id);

  if not private.can_send_to_conversation(p_conversation_id) then
    return query select 'not_available'::text, null::timestamptz;
    return;
  end if;

  v_sent_at := clock_timestamp();
  insert into private.conversation_typing_limits (
    conversation_id, user_id, is_typing, last_sent_at
  ) values (
    p_conversation_id, v_user_id, p_is_typing, v_sent_at
  )
  on conflict (conversation_id, user_id) do update
    set is_typing = excluded.is_typing,
        last_sent_at = excluded.last_sent_at
    where private.conversation_typing_limits.last_sent_at
          <= excluded.last_sent_at - interval '1 second'
  returning private.conversation_typing_limits.last_sent_at + interval '3 seconds'
    into v_expires_at;

  if not found then
    select ctl.last_sent_at + interval '3 seconds'
      into v_expires_at
    from private.conversation_typing_limits ctl
    where ctl.conversation_id = p_conversation_id
      and ctl.user_id = v_user_id;
    return query select 'throttled'::text, v_expires_at;
    return;
  end if;

  perform private.broadcast_conversation_event(
    p_conversation_id,
    'typing.changed',
    jsonb_build_object(
      'conversationId', p_conversation_id,
      'actorUserId', v_user_id,
      'isTyping', p_is_typing,
      'expiresAt', v_expires_at
    )
  );

  return query select 'published'::text, v_expires_at;
end;
$$;

create function private.mark_notifications_read(p_notification_ids bigint[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.notifications
  set read_at = coalesce(read_at, now())
  where recipient_user_id = (select auth.uid())
    and id = any(coalesce(p_notification_ids, '{}'::bigint[]));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function private.submit_report(
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
  v_reporter_user_id uuid := (select auth.uid());
  v_reported_user_id uuid;
  v_organization_id uuid;
  v_ask_id uuid;
  v_offer_id uuid;
  v_message_id bigint;
  v_profile_user_id uuid;
  v_evidence jsonb;
  v_report_id uuid;
begin
  if v_reporter_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_target_type = 'ask' then
    v_ask_id := p_target_id::uuid;
    select asker.user_id, a.organization_id,
           jsonb_build_object('kind', a.kind, 'status', a.status, 'question', a.question)
      into v_reported_user_id, v_organization_id, v_evidence
    from public.asks a
    join public.organization_memberships asker on asker.id = a.asker_membership_id
    where a.id = v_ask_id and private.can_view_ask(a.id);
  elsif p_target_type = 'offer' then
    v_offer_id := p_target_id::uuid;
    select helper.user_id, ao.organization_id,
           jsonb_build_object('status', ao.status, 'offerNote', ao.offer_note)
      into v_reported_user_id, v_organization_id, v_evidence
    from public.ask_offers ao
    join public.organization_memberships helper on helper.id = ao.helper_membership_id
    join public.asks a on a.id = ao.ask_id
    where ao.id = v_offer_id and private.can_view_ask(a.id);
  elsif p_target_type = 'message' then
    v_message_id := p_target_id::bigint;
    select m.sender_user_id, c.organization_id,
           jsonb_build_object('kind', m.kind, 'body', m.body, 'createdAt', m.created_at)
      into v_reported_user_id, v_organization_id, v_evidence
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = v_message_id and private.can_access_conversation(c.id);
  elsif p_target_type = 'profile' then
    v_profile_user_id := p_target_id::uuid;
    select p.user_id,
           (select m.organization_id
            from public.organization_memberships m
            where m.user_id = p.user_id and m.status = 'active'
              and private.is_active_member_of(m.organization_id)
            limit 1),
           jsonb_build_object('displayName', p.display_name, 'headline', p.headline)
      into v_reported_user_id, v_organization_id, v_evidence
    from public.profiles p
    where p.user_id = v_profile_user_id;
  else
    raise exception using errcode = '22023', message = 'invalid_report_target_type';
  end if;

  if v_evidence is null or v_reported_user_id = v_reporter_user_id then
    raise exception using errcode = '42501', message = 'report_target_not_accessible';
  end if;

  insert into private.reports (
    reporter_user_id, reported_user_id, organization_id, reason, note,
    target_type, target_id, ask_id, offer_id, message_id, profile_user_id,
    evidence_snapshot
  ) values (
    v_reporter_user_id, v_reported_user_id, v_organization_id, p_reason,
    nullif(btrim(p_note), ''), p_target_type, p_target_id,
    v_ask_id, v_offer_id, v_message_id, v_profile_user_id, v_evidence
  ) returning id into v_report_id;

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id,
    payload
  ) values (
    v_reporter_user_id, v_organization_id, 'safety.report_submitted',
    'report', v_report_id::text, jsonb_build_object('reportedTargetType', p_target_type)
  );
  return v_report_id;
end;
$$;

create function private.search_help_candidates(
  p_organization_id uuid,
  p_viewer_user_id uuid,
  p_question text,
  p_query_embedding extensions.vector(1024) default null,
  p_limit integer default 20
)
returns table (
  helper_membership_id uuid,
  helper_user_id uuid,
  display_name text,
  headline text,
  avatar_path text,
  graduation_year smallint,
  topics text[],
  lexical_score double precision,
  semantic_score double precision,
  match_reason text,
  evidence_chunk_ids uuid[]
)
language sql
stable
security definer
set search_path = ''
as $$
  with query_input as (
    select websearch_to_tsquery(
      'english'::regconfig,
      nullif(btrim(coalesce(p_question, '')), '')
    ) as lexical_query
  ),
  eligible as (
    select
      helper.id as membership_id,
      helper.user_id,
      p.display_name,
      p.headline,
      p.avatar_path,
      op.graduation_year,
      coalesce((
        select array_agg(ht.name order by ht.sort_order)
        from public.helper_topics ht
        where ht.organization_membership_id = helper.id
      ), '{}'::text[]) as topics
    from public.organization_memberships helper
    join public.users helper_user
      on helper_user.id = helper.user_id and helper_user.account_state = 'active'
    join public.helper_preferences hp
      on hp.organization_membership_id = helper.id
     and hp.organization_id = helper.organization_id
     and hp.open_to_help = true
     and hp.paused_at is null
    join public.profiles p on p.user_id = helper.user_id
    left join public.organization_profiles op
      on op.organization_membership_id = helper.id
    where helper.organization_id = p_organization_id
      and helper.status = 'active'
      and helper.user_id <> p_viewer_user_id
      and not private.is_blocked(p_viewer_user_id, helper.user_id)
      and (
        select count(*)
        from public.asks pending
        where pending.recipient_membership_id = helper.id
          and pending.kind = 'direct'
          and pending.status = 'waiting'
      ) < hp.max_pending_requests
  ),
  scored as (
    select
      e.*,
      greatest(
        coalesce(max(ts_rank_cd(c.search_vector, q.lexical_query)), 0),
        coalesce(ts_rank_cd(
          to_tsvector('english'::regconfig, array_to_string(e.topics, ' ')),
          q.lexical_query
        ), 0)
      )::double precision as lexical_score,
      case
        when p_query_embedding is null then 0::double precision
        else coalesce(max(
          1 - (c.embedding OPERATOR(extensions.<=>) p_query_embedding)
        ), 0)::double precision
      end as semantic_score,
      coalesce(
        array_agg(c.id order by c.id) filter (where c.chunk_kind = 'raw'),
        '{}'::uuid[]
      ) as evidence_chunk_ids
    from eligible e
    cross join query_input q
    left join private.profile_embedding_chunks c
      on c.organization_membership_id = e.membership_id
     and (
       c.visibility_tier = 'organization'
       or (
         c.visibility_tier = 'connections'
         and private.is_connected(p_viewer_user_id, e.user_id)
       )
     )
    where q.lexical_query is not null
    group by
      e.membership_id, e.user_id, e.display_name, e.headline, e.avatar_path,
      e.graduation_year, e.topics, q.lexical_query
  )
  select
    s.membership_id,
    s.user_id,
    s.display_name,
    s.headline,
    s.avatar_path,
    s.graduation_year,
    s.topics,
    s.lexical_score,
    s.semantic_score,
    case
      when cardinality(s.topics) > 0 then 'Speaks to ' || s.topics[1]
      else coalesce(s.headline, 'Relevant experience')
    end,
    s.evidence_chunk_ids
  from scored s
  where p_query_embedding is null
     or s.lexical_score > 0
     or s.semantic_score > 0
  order by
    (s.lexical_score * 0.45 + s.semantic_score * 0.55) desc,
    s.membership_id
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

create function private.match_profile_embedding_chunks(
  p_organization_id uuid,
  p_query_embedding extensions.vector(1024),
  p_viewer_id uuid,
  p_limit integer default 80
)
returns table (
  chunk_id uuid,
  user_id uuid,
  organization_membership_id uuid,
  chunk_kind text,
  source_section text,
  visibility_tier text,
  content text,
  similarity double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.user_id,
    c.organization_membership_id,
    c.chunk_kind,
    c.source_section,
    c.visibility_tier,
    c.content,
    1 - (c.embedding OPERATOR(extensions.<=>) p_query_embedding) as similarity
  from private.profile_embedding_chunks c
  join public.organization_memberships m
    on m.id = c.organization_membership_id and m.status = 'active'
  where c.organization_id = p_organization_id
    and c.user_id <> p_viewer_id
    and not private.is_blocked(p_viewer_id, c.user_id)
    and (
      c.visibility_tier = 'organization'
      or (c.visibility_tier = 'connections' and private.is_connected(p_viewer_id, c.user_id))
    )
  order by c.embedding OPERATOR(extensions.<=>) p_query_embedding
  limit greatest(1, least(coalesce(p_limit, 80), 200));
$$;

create function private.pseudonymize_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.users u where u.id = p_user_id) then
    return;
  end if;
  if exists (
    select 1
    from public.users u
    where u.id = p_user_id and u.account_state = 'deleted'
  ) then
    return;
  end if;

  -- Close accepted circle offers before closing their Ask so the deferred
  -- accepted-offer invariant remains true at commit.
  update public.ask_offers ao
  set status = 'closed', closure_reason = 'ask_closed', closed_at = now()
  from public.asks a,
       public.organization_memberships asker,
       public.organization_memberships helper
  where ao.ask_id = a.id
    and asker.id = a.asker_membership_id
    and helper.id = ao.helper_membership_id
    and ao.status = 'accepted'
    and (asker.user_id = p_user_id or helper.user_id = p_user_id);

  update public.asks a
  set status = 'closed', closure_reason = 'account_deleted', ended_at = now()
  where a.status = 'accepted'
    and (
      exists (
        select 1
        from public.organization_memberships asker
        where asker.id = a.asker_membership_id and asker.user_id = p_user_id
      )
      or exists (
        select 1
        from public.organization_memberships recipient
        where recipient.id = a.recipient_membership_id and recipient.user_id = p_user_id
      )
      or exists (
        select 1
        from public.ask_offers ao
        join public.organization_memberships helper on helper.id = ao.helper_membership_id
        where ao.ask_id = a.id and helper.user_id = p_user_id
      )
    );

  update public.asks a
  set status = 'closed', closure_reason = 'account_deleted', ended_at = now()
  from public.organization_memberships recipient
  where a.kind = 'direct'
    and a.status = 'waiting'
    and recipient.id = a.recipient_membership_id
    and recipient.user_id = p_user_id;

  delete from public.ask_offers ao
  using public.organization_memberships helper
  where helper.id = ao.helper_membership_id
    and helper.user_id = p_user_id
    and not exists (select 1 from public.conversations c where c.ask_id = ao.ask_id);

  delete from public.asks a
  using public.organization_memberships asker
  where asker.id = a.asker_membership_id
    and asker.user_id = p_user_id
    and not exists (select 1 from public.conversations c where c.ask_id = a.id);

  update public.organization_memberships
  set status = 'revoked', updated_at = now()
  where user_id = p_user_id and status <> 'revoked';

  delete from public.profiles where user_id = p_user_id;
  delete from public.profile_experiences where user_id = p_user_id;
  delete from public.profile_education where user_id = p_user_id;
  delete from public.profile_skills where user_id = p_user_id;
  delete from public.organization_profiles op
  using public.organization_memberships m
  where m.id = op.organization_membership_id and m.user_id = p_user_id;
  delete from public.profile_field_visibility v
  using public.organization_memberships m
  where m.id = v.organization_membership_id and m.user_id = p_user_id;
  delete from public.helper_topics t
  using public.organization_memberships m
  where m.id = t.organization_membership_id and m.user_id = p_user_id;
  delete from public.helper_preferences hp
  using public.organization_memberships m
  where m.id = hp.organization_membership_id and m.user_id = p_user_id;
  delete from public.notification_preferences where user_id = p_user_id;
  delete from public.notifications where recipient_user_id = p_user_id;
  delete from public.conversation_reads where user_id = p_user_id;
  delete from public.connection_requests
    where requester_user_id = p_user_id or recipient_user_id = p_user_id;
  delete from public.connections where user_a_id = p_user_id or user_b_id = p_user_id;
  delete from public.member_blocks where blocker_user_id = p_user_id or blocked_user_id = p_user_id;
  delete from private.profile_embedding_chunks where user_id = p_user_id;
  delete from private.profile_embedding_status where user_id = p_user_id;
  delete from private.profile_change_proposals where user_id = p_user_id;
  delete from private.profile_enrichment_runs where user_id = p_user_id;
  delete from private.profile_enrichment_settings where user_id = p_user_id;

  perform private.enqueue_outbox(
    'delete_storage_objects',
    jsonb_build_object(
      'userId', p_user_id,
      'buckets', jsonb_build_array('avatars', 'resumes'),
      'pathPrefix', p_user_id::text || '/'
    ),
    'delete_storage_objects:' || p_user_id::text
  );

  update public.users
  set account_state = 'deleted', onboarding_completed_at = null,
      last_seen_at = null, delete_scheduled_for = null, delete_reason = null,
      deleted_at = coalesce(deleted_at, now())
  where id = p_user_id;

  insert into private.audit_log (
    actor_user_id, action, target_type, target_id
  ) values (
    null, 'account.pseudonymized', 'user', p_user_id::text
  );
end;
$$;

create function private.handle_deleted_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.pseudonymize_user(old.id);
  return old;
end;
$$;

create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function private.handle_deleted_auth_user();

-- Safe query projections keep anonymous Ask identity and private matching
-- evidence out of the exposed schema.
create function private.get_ask_detail(p_ask_id uuid)
returns table (
  ask_id uuid,
  organization_id uuid,
  kind text,
  status text,
  question text,
  request_message text,
  reach text,
  anonymous_until_accepted boolean,
  asker_user_id uuid,
  recipient_user_id uuid,
  decline_reason_code text,
  decline_note text,
  closure_reason text,
  outcome_note text,
  accepted_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_view_ask(p_ask_id) then
    return;
  end if;

  return query
  select
    a.id,
    a.organization_id,
    a.kind,
    a.status,
    a.question,
    a.request_message,
    a.reach,
    a.anonymous_until_accepted,
    case
      when not a.anonymous_until_accepted
        or a.accepted_at is not null
        or asker.user_id = (select auth.uid())
      then asker.user_id
      else null
    end,
    recipient.user_id,
    case when asker.user_id = (select auth.uid()) then a.decline_reason_code else null end,
    case when asker.user_id = (select auth.uid()) then a.decline_note else null end,
    a.closure_reason,
    a.outcome_note,
    a.accepted_at,
    a.ended_at,
    a.expires_at,
    a.created_at
  from public.asks a
  join public.organization_memberships asker on asker.id = a.asker_membership_id
  left join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
  where a.id = p_ask_id;
end;
$$;

create function private.list_help_matches(p_ask_id uuid)
returns table (
  helper_membership_id uuid,
  helper_user_id uuid,
  display_name text,
  headline text,
  rank integer,
  score double precision,
  reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    am.helper_membership_id,
    helper.user_id,
    p.display_name,
    p.headline,
    am.rank,
    am.score,
    am.reason
  from public.asks a
  join private.ask_matches am on am.ask_id = a.id
  join public.organization_memberships helper on helper.id = am.helper_membership_id
  join public.profiles p on p.user_id = helper.user_id
  where a.id = p_ask_id
    and private.owns_membership(a.asker_membership_id, a.organization_id)
    and helper.status = 'active'
    and not private.is_blocked((select auth.uid()), helper.user_id)
  order by am.rank, am.helper_membership_id;
$$;

create function private.list_give_help(
  p_membership_id uuid,
  p_arm text,
  p_query text default null,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 50
)
returns table (
  ask_id uuid,
  organization_id uuid,
  kind text,
  status text,
  question text,
  reach text,
  anonymous_until_accepted boolean,
  asker_user_id uuid,
  asker_display_name text,
  asker_avatar_path text,
  asker_graduation_year smallint,
  match_reason text,
  my_offer_status text,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id,
    a.organization_id,
    a.kind,
    a.status,
    a.question,
    a.reach,
    a.anonymous_until_accepted,
    case when a.anonymous_until_accepted then null else asker.user_id end,
    case when a.anonymous_until_accepted then null else asker_profile.display_name end,
    case when a.anonymous_until_accepted then null else asker_profile.avatar_path end,
    asker_org_profile.graduation_year,
    am.reason,
    own_offer.status,
    a.created_at,
    a.expires_at
  from public.asks a
  join public.organization_memberships viewer
    on viewer.id = p_membership_id
   and viewer.organization_id = a.organization_id
   and viewer.user_id = (select auth.uid())
   and viewer.status = 'active'
  join public.organization_memberships asker on asker.id = a.asker_membership_id
  join public.profiles asker_profile on asker_profile.user_id = asker.user_id
  left join public.organization_profiles asker_org_profile
    on asker_org_profile.organization_membership_id = asker.id
  left join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
  left join private.ask_matches am
    on am.ask_id = a.id
   and am.helper_membership_id = viewer.id
  left join public.ask_offers own_offer
    on own_offer.ask_id = a.id
   and own_offer.helper_membership_id = viewer.id
  where p_arm in ('direct', 'suggested', 'search')
    and (
      (p_before_created_at is null and p_before_id is null)
      or (
        p_before_created_at is not null and p_before_id is not null
        and (a.created_at, a.id) < (p_before_created_at, p_before_id)
      )
    )
    and (
      (
        p_arm = 'direct'
        and a.kind = 'direct'
        and a.status = 'waiting'
        and recipient.id = viewer.id
      )
      or (
        p_arm = 'suggested'
        and a.kind = 'circle'
        and a.status = 'open'
        and am.ask_id is not null
        and private.can_view_ask(a.id)
      )
      or (
        p_arm = 'search'
        and a.kind = 'circle'
        and a.status = 'open'
        and private.can_view_ask(a.id)
        and (
          nullif(btrim(coalesce(p_query, '')), '') is null
          or to_tsvector('english'::regconfig, a.question)
            @@ websearch_to_tsquery('english'::regconfig, p_query)
        )
      )
    )
    and not private.is_blocked((select auth.uid()), asker.user_id)
  order by a.created_at desc, a.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

create function private.save_helper_topics(
  p_membership_id uuid,
  p_topics text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
begin
  select m.organization_id into v_organization_id
  from public.organization_memberships m
  where m.id = p_membership_id;
  if v_organization_id is null or not private.owns_membership(p_membership_id, v_organization_id) then
    raise exception using errcode = '42501', message = 'helper_membership_not_owned';
  end if;
  if coalesce(cardinality(p_topics), 0) > 5 then
    raise exception using errcode = '22023', message = 'too_many_helper_topics';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_topics, '{}'::text[])) t
    group by lower(btrim(t))
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'duplicate_helper_topic';
  end if;

  delete from public.helper_topics where organization_membership_id = p_membership_id;
  insert into public.helper_topics (
    organization_membership_id, organization_id, name, normalized_name, sort_order
  )
  select p_membership_id, v_organization_id, btrim(topic), lower(btrim(topic)), (ordinality - 1)::smallint
  from unnest(coalesce(p_topics, '{}'::text[])) with ordinality as item(topic, ordinality);
end;
$$;

create function private.set_event_rsvp(
  p_event_id uuid,
  p_membership_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_final_status text := p_status;
  v_going_count integer;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status <> 'published' or v_event.starts_at <= now() then
    raise exception using errcode = '22023', message = 'event_not_open_for_rsvp';
  end if;
  if not private.owns_membership(p_membership_id, v_event.organization_id) then
    raise exception using errcode = '42501', message = 'rsvp_membership_not_owned';
  end if;
  if p_status not in ('going', 'not_going') then
    raise exception using errcode = '22023', message = 'invalid_rsvp_status';
  end if;

  if p_status = 'going' and v_event.capacity is not null then
    select count(*) into v_going_count
    from public.event_rsvps r
    where r.event_id = p_event_id and r.status = 'going'
      and r.organization_membership_id <> p_membership_id;
    if v_going_count >= v_event.capacity then
      v_final_status := 'waitlisted';
    end if;
  end if;

  insert into public.event_rsvps (
    organization_id, event_id, organization_membership_id, status, responded_at
  ) values (
    v_event.organization_id, p_event_id, p_membership_id, v_final_status, now()
  )
  on conflict (event_id, organization_membership_id) do update
    set status = excluded.status, responded_at = excluded.responded_at;

  if v_final_status = 'not_going' and v_event.capacity is not null then
    update public.event_rsvps
    set status = 'going', responded_at = now()
    where (event_id, organization_membership_id) = (
      select r.event_id, r.organization_membership_id
      from public.event_rsvps r
      where r.event_id = p_event_id and r.status = 'waitlisted'
      order by r.responded_at, r.organization_membership_id
      for update skip locked
      limit 1
    );
  end if;

  return v_final_status;
end;
$$;

create function private.close_expired_asks(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with expired as (
    select a.id
    from public.asks a
    where a.status in ('waiting', 'open') and a.expires_at <= now()
    order by a.expires_at, a.id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 1000))
  ), closed_offers as (
    update public.ask_offers ao
    set status = 'closed', closure_reason = 'ask_closed', closed_at = now()
    where ao.ask_id in (select id from expired) and ao.status = 'pending'
    returning ao.ask_id
  )
  update public.asks a
  set status = 'closed', closure_reason = 'silence_timeout', ended_at = now()
  where a.id in (select id from expired);

  get diagnostics v_count = row_count;

  update public.helper_preferences hp
  set consecutive_timeouts = least(3, hp.consecutive_timeouts + 1),
      open_to_help = case when hp.consecutive_timeouts + 1 >= 3 then false else hp.open_to_help end,
      paused_at = case when hp.consecutive_timeouts + 1 >= 3 then coalesce(hp.paused_at, now()) else hp.paused_at end,
      pause_reason = case when hp.consecutive_timeouts + 1 >= 3 then 'unresponsive' else hp.pause_reason end
  from public.asks a
  where a.recipient_membership_id = hp.organization_membership_id
    and a.status = 'closed'
    and a.closure_reason = 'silence_timeout'
    and a.ended_at >= transaction_timestamp();

  return v_count;
end;
$$;

create function private.claim_outbox_jobs(
  p_worker_id text,
  p_limit integer default 20,
  p_allowed_types text[] default null
)
returns setof private.outbox_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(btrim(coalesce(p_worker_id, ''))) not between 1 and 200 then
    raise exception using errcode = '22023', message = 'invalid_worker_id';
  end if;
  if p_allowed_types is null
     or cardinality(p_allowed_types) = 0
     or exists (
       select 1 from unnest(p_allowed_types) allowed(job_type)
       where allowed.job_type not in (
         'send_email', 'create_notification', 'run_ask_matching', 'index_profile',
         'process_account_deletion', 'delete_storage_objects'
       )
     ) then
    raise exception using errcode = '22023', message = 'invalid_allowed_job_types';
  end if;

  update private.outbox_jobs j
  set status = 'failed',
      last_error = coalesce(j.last_error, 'lock_timeout')
  where j.status = 'processing'
    and j.locked_at <= now() - interval '15 minutes'
    and j.attempts >= j.max_attempts;

  update private.outbox_jobs j
  set status = 'pending',
      locked_at = null,
      locked_by = null,
      last_error = coalesce(j.last_error, 'lock_timeout'),
      available_at = least(j.available_at, now())
  where j.status = 'processing'
    and j.locked_at <= now() - interval '15 minutes'
    and j.attempts < j.max_attempts;

  return query
  with claimable as (
    select j.id
    from private.outbox_jobs j
    where j.status = 'pending'
      and j.available_at <= now()
      and j.job_type = any(p_allowed_types)
    order by j.available_at, j.id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  )
  update private.outbox_jobs j
  set status = 'processing', locked_at = now(), locked_by = p_worker_id,
      attempts = attempts + 1
  where j.id in (select id from claimable)
  returning j.*;
end;
$$;

create function private.complete_outbox_job(
  p_job_id bigint,
  p_worker_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.outbox_jobs%rowtype;
begin
  select * into v_job
  from private.outbox_jobs j
  where j.id = p_job_id
  for update;

  if not found then
    return 'not_found';
  end if;
  if v_job.locked_by is distinct from p_worker_id then
    return 'lock_not_owned';
  end if;
  if v_job.status = 'completed' then
    return 'completed';
  end if;
  if v_job.status <> 'processing' then
    return 'not_processing';
  end if;

  update private.outbox_jobs
  set status = 'completed', completed_at = now(), last_error = null
  where id = p_job_id;

  return 'completed';
end;
$$;

create function private.retry_outbox_job(
  p_job_id bigint,
  p_worker_id text,
  p_error text,
  p_available_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.outbox_jobs%rowtype;
  v_error text := left(nullif(btrim(p_error), ''), 10000);
begin
  select * into v_job
  from private.outbox_jobs j
  where j.id = p_job_id
  for update;

  if not found then
    return 'not_found';
  end if;
  if v_job.locked_by is distinct from p_worker_id then
    return 'lock_not_owned';
  end if;
  if v_job.status = 'failed' then
    return 'failed';
  end if;
  if v_job.status <> 'processing' then
    return 'not_processing';
  end if;

  if v_job.attempts >= v_job.max_attempts then
    update private.outbox_jobs
    set status = 'failed', last_error = coalesce(v_error, 'max_attempts_reached')
    where id = p_job_id;
    return 'failed';
  end if;

  update private.outbox_jobs
  set status = 'pending',
      available_at = greatest(coalesce(p_available_at, now()), now()),
      locked_at = null,
      locked_by = null,
      last_error = v_error
  where id = p_job_id;

  return 'pending';
end;
$$;

create function private.record_outbox_provider_result(
  p_job_id bigint,
  p_worker_id text,
  p_provider_result_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.outbox_jobs%rowtype;
  v_provider_result_id text := nullif(btrim(p_provider_result_id), '');
begin
  select * into v_job
  from private.outbox_jobs j
  where j.id = p_job_id
  for update;

  if not found then return 'not_found'; end if;
  if v_job.locked_by is distinct from p_worker_id then return 'lock_not_owned'; end if;
  if v_job.job_type <> 'send_email' or v_job.status <> 'processing' then
    return 'not_available';
  end if;
  if v_provider_result_id is null or char_length(v_provider_result_id) > 500 then
    return 'invalid_input';
  end if;
  if v_job.provider_result_id is not null then
    if v_job.provider_result_id = v_provider_result_id then return 'recorded'; end if;
    return 'provider_conflict';
  end if;

  update private.outbox_jobs
  set provider_result_id = v_provider_result_id
  where id = p_job_id;
  return 'recorded';
end;
$$;

create function private.fail_outbox_job(
  p_job_id bigint,
  p_worker_id text,
  p_error text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.outbox_jobs%rowtype;
  v_error text := left(nullif(btrim(p_error), ''), 10000);
begin
  select * into v_job
  from private.outbox_jobs j
  where j.id = p_job_id
  for update;

  if not found then
    return 'not_found';
  end if;
  if v_job.locked_by is distinct from p_worker_id then
    return 'lock_not_owned';
  end if;
  if v_job.status = 'failed' then
    return 'failed';
  end if;
  if v_job.status <> 'processing' then
    return 'not_processing';
  end if;

  update private.outbox_jobs
  set status = 'failed', last_error = coalesce(v_error, 'terminal_failure')
  where id = p_job_id;

  return 'failed';
end;
$$;

create function private.apply_ask_matches(
  p_ask_id uuid,
  p_pipeline_version text,
  p_model_version text,
  p_matches jsonb
)
returns table (
  result_code text,
  applied_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask public.asks%rowtype;
  v_asker_user_id uuid;
  v_expected_count integer;
  v_valid_count integer;
  v_inserted_count integer;
  v_match record;
begin
  if p_ask_id is null
     or char_length(btrim(coalesce(p_pipeline_version, ''))) not between 1 and 100
     or char_length(btrim(coalesce(p_model_version, ''))) not between 1 and 100
     or jsonb_typeof(p_matches) <> 'array'
     or jsonb_array_length(p_matches) > 50 then
    return query select 'invalid_input'::text, 0;
    return;
  end if;

  select * into v_ask
  from public.asks a
  where a.id = p_ask_id
  for update;
  if not found or v_ask.kind <> 'circle' or v_ask.status <> 'open' then
    return query select 'not_available'::text, 0;
    return;
  end if;

  select asker.user_id into v_asker_user_id
  from public.organization_memberships asker
  where asker.id = v_ask.asker_membership_id;
  v_expected_count := jsonb_array_length(p_matches);

  with input as (
    select *
    from jsonb_to_recordset(p_matches) as item(
      "helperMembershipId" uuid,
      rank integer,
      score double precision,
      reason text,
      evidence jsonb
    )
  )
  select count(*)::integer into v_valid_count
  from input
  join public.organization_memberships helper
    on helper.id = input."helperMembershipId"
   and helper.organization_id = v_ask.organization_id
   and helper.status = 'active'
  join public.users helper_user
    on helper_user.id = helper.user_id and helper_user.account_state = 'active'
  join public.helper_preferences hp
    on hp.organization_membership_id = helper.id
   and hp.organization_id = helper.organization_id
   and hp.open_to_help = true
   and hp.paused_at is null
  where helper.user_id <> v_asker_user_id
    and not private.is_blocked(v_asker_user_id, helper.user_id)
    and (
      select count(*)
      from public.asks pending
      where pending.recipient_membership_id = helper.id
        and pending.kind = 'direct'
        and pending.status = 'waiting'
    ) < hp.max_pending_requests
    and input.rank > 0
    and input.score between 0 and 1
    and char_length(btrim(coalesce(input.reason, ''))) between 1 and 1000
    and coalesce(jsonb_typeof(input.evidence), 'object') = 'object';

  if v_valid_count <> v_expected_count
     or (
       select count(distinct item.rank) <> v_expected_count
         or count(distinct item."helperMembershipId") <> v_expected_count
       from jsonb_to_recordset(p_matches) as item(
         "helperMembershipId" uuid,
         rank integer
       )
     ) then
    return query select 'invalid_input'::text, 0;
    return;
  end if;

  delete from private.ask_matches am where am.ask_id = p_ask_id;
  insert into private.ask_matches (
    ask_id, organization_id, helper_membership_id, rank, score, reason,
    evidence, model, model_version
  )
  select
    p_ask_id,
    v_ask.organization_id,
    item."helperMembershipId",
    item.rank,
    item.score,
    btrim(item.reason),
    coalesce(item.evidence, '{}'::jsonb),
    btrim(p_pipeline_version),
    btrim(p_model_version)
  from jsonb_to_recordset(p_matches) as item(
    "helperMembershipId" uuid,
    rank integer,
    score double precision,
    reason text,
    evidence jsonb
  );
  get diagnostics v_inserted_count = row_count;

  for v_match in
    select am.helper_membership_id, helper.user_id as helper_user_id
    from private.ask_matches am
    join public.organization_memberships helper on helper.id = am.helper_membership_id
    where am.ask_id = p_ask_id
    order by am.rank
  loop
    perform private.enqueue_outbox(
      'create_notification',
      jsonb_strip_nulls(jsonb_build_object(
        'type', 'circle_ask_match',
        'recipientUserId', v_match.helper_user_id,
        'actorUserId', case
          when v_ask.anonymous_until_accepted then null
          else v_asker_user_id
        end,
        'askId', p_ask_id
      )),
      'circle_ask_match:' || p_ask_id::text || ':' || v_match.helper_membership_id::text
    );
    perform private.broadcast_help_change(
      p_ask_id,
      null,
      v_match.helper_user_id
    );
  end loop;

  perform private.broadcast_help_change(p_ask_id, null, v_asker_user_id);

  return query select 'applied'::text, v_inserted_count;
end;
$$;

create function private.run_help_maintenance(
  p_now timestamptz,
  p_limit integer default 100
)
returns table (
  reminders_sent integer,
  asks_closed integer,
  offers_closed integer,
  helpers_paused integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask public.asks%rowtype;
  v_offer public.ask_offers%rowtype;
  v_asker_user_id uuid;
  v_recipient_user_id uuid;
  v_helper_user_id uuid;
  v_previous_timeouts smallint;
  v_reminders integer := 0;
  v_closed integer := 0;
  v_offers integer := 0;
  v_paused integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 1000));
begin
  if p_now is null then
    raise exception using errcode = '22023', message = 'maintenance_time_required';
  end if;

  for v_ask in
    select a.*
    from public.asks a
    where a.kind = 'direct'
      and a.status = 'waiting'
      and a.reminder_sent_at is null
      and a.created_at + interval '5 days' <= p_now
      and a.expires_at > p_now
    order by a.created_at, a.id
    for update skip locked
    limit v_limit
  loop
    update public.asks
    set reminder_sent_at = p_now
    where id = v_ask.id;
    insert into private.ask_events (
      ask_id, organization_id, event_type, created_at
    ) values (
      v_ask.id, v_ask.organization_id, 'reminded', p_now
    );
    select asker.user_id, recipient.user_id
      into v_asker_user_id, v_recipient_user_id
    from public.organization_memberships asker
    join public.organization_memberships recipient
      on recipient.id = v_ask.recipient_membership_id
    where asker.id = v_ask.asker_membership_id;
    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', 'ask_reminder',
        'recipientUserId', v_recipient_user_id,
        'actorUserId', v_asker_user_id,
        'askId', v_ask.id
      ),
      'ask_reminder:' || v_ask.id::text
    );
    perform private.broadcast_help_change(v_ask.id);
    v_reminders := v_reminders + 1;
  end loop;

  for v_ask in
    select a.*
    from public.asks a
    where a.status in ('waiting', 'open')
      and a.expires_at <= p_now
    order by a.expires_at, a.id
    for update skip locked
    limit v_limit
  loop
    select asker.user_id into v_asker_user_id
    from public.organization_memberships asker
    where asker.id = v_ask.asker_membership_id;

    for v_offer in
      select ao.*
      from public.ask_offers ao
      where ao.ask_id = v_ask.id and ao.status = 'pending'
      order by ao.id
      for update
    loop
      update public.ask_offers
      set status = 'closed', closure_reason = 'ask_closed', closed_at = p_now
      where id = v_offer.id;
      select helper.user_id into v_helper_user_id
      from public.organization_memberships helper
      where helper.id = v_offer.helper_membership_id;
      insert into private.ask_events (
        ask_id, organization_id, event_type, payload, created_at
      ) values (
        v_ask.id,
        v_ask.organization_id,
        'offer_closed',
        jsonb_build_object('offerId', v_offer.id),
        p_now
      );
      perform private.enqueue_outbox(
        'create_notification',
        jsonb_build_object(
          'type', 'offer_closed',
          'recipientUserId', v_helper_user_id,
          'actorUserId', v_asker_user_id,
          'askId', v_ask.id,
          'offerId', v_offer.id
        ),
        'offer_closed:' || v_offer.id::text
      );
      v_offers := v_offers + 1;
    end loop;

    update public.asks
    set status = 'closed', closure_reason = 'silence_timeout', ended_at = p_now
    where id = v_ask.id;
    insert into private.ask_events (
      ask_id, organization_id, event_type, created_at
    ) values (
      v_ask.id, v_ask.organization_id, 'closed', p_now
    );
    perform private.enqueue_outbox(
      'create_notification',
      jsonb_build_object(
        'type', case
          when v_ask.kind = 'circle' then 'circle_ask_closed'
          else 'ask_closed'
        end,
        'recipientUserId', v_asker_user_id,
        'askId', v_ask.id
      ),
      'ask_closed:' || v_ask.id::text
    );
    perform private.broadcast_help_change(v_ask.id);

    if v_ask.kind = 'direct' then
      select hp.consecutive_timeouts into v_previous_timeouts
      from public.helper_preferences hp
      where hp.organization_membership_id = v_ask.recipient_membership_id
      for update;
      update public.helper_preferences hp
      set consecutive_timeouts = least(3, hp.consecutive_timeouts + 1),
          open_to_help = case
            when hp.consecutive_timeouts + 1 >= 3 then false
            else hp.open_to_help
          end,
          paused_at = case
            when hp.consecutive_timeouts + 1 >= 3 then coalesce(hp.paused_at, p_now)
            else hp.paused_at
          end,
          pause_reason = case
            when hp.consecutive_timeouts + 1 >= 3 then 'unresponsive'
            else hp.pause_reason
          end
      where hp.organization_membership_id = v_ask.recipient_membership_id;
      if v_previous_timeouts = 2 then
        v_paused := v_paused + 1;
      end if;
    end if;
    v_closed := v_closed + 1;
  end loop;

  return query select v_reminders, v_closed, v_offers, v_paused;
end;
$$;

create function private.materialize_notification_job(
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
    select c.organization_id into v_organization_id
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
        'conversationId', v_job.payload -> 'conversationId'
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
    'circle_ask_match', 'circle_ask_closed', 'message_received'
  ) then
    v_email_payload := jsonb_strip_nulls(jsonb_build_object(
      'notificationType', v_type,
      'recipientUserId', v_recipient_user_id,
      'actorUserId', v_actor_user_id,
      'askId', v_job.payload -> 'askId',
      'offerId', v_job.payload -> 'offerId',
      'conversationId', v_job.payload -> 'conversationId'
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

create function private.get_outbox_email_context(
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
      else null
    end,
    coalesce(
      j.payload ->> 'conversationId',
      j.payload ->> 'askId',
      j.payload ->> 'offerId'
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

create function private.get_ask_matching_context(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  ask_id uuid,
  asker_membership_id uuid,
  question text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.asker_membership_id, a.question
  from private.outbox_jobs j
  join public.asks a on a.id::text = j.payload ->> 'askId'
  where j.id = p_job_id
    and j.job_type = 'run_ask_matching'
    and j.status = 'processing'
    and j.locked_by = p_worker_id
    and a.kind = 'circle'
    and a.status = 'open'
    and a.reach = 'matched';
$$;

create function private.get_profile_index_source(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  organization_id uuid,
  user_id uuid,
  membership_id uuid,
  facts jsonb,
  existing_chunks jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with claimed as (
    select m.organization_id, m.user_id, m.id as membership_id
    from private.outbox_jobs j
    join public.organization_memberships m
      on m.id::text = j.payload ->> 'membershipId'
     and m.organization_id::text = j.payload ->> 'organizationId'
     and m.user_id::text = j.payload ->> 'userId'
     and m.status = 'active'
    join public.users u on u.id = m.user_id and u.account_state = 'active'
    where j.id = p_job_id
      and j.job_type = 'index_profile'
      and j.status = 'processing'
      and j.locked_by = p_worker_id
  )
  select
    claimed.organization_id,
    claimed.user_id,
    claimed.membership_id,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', fact.id,
          'sourceSection', fact.source_section,
          'visibility', fact.visibility,
          'content', left(fact.content, 8000)
        ) order by fact.sort_order
      )
      from (
        select
          'directory'::text as id,
          'directory'::text as source_section,
          'organization'::text as visibility,
          nullif(concat_ws('. ',
            nullif(p.headline, ''),
            nullif(concat_ws(' at ', p.current_title, p.current_employer), ''),
            case when p.city is not null then 'Based in ' || p.city end,
            case when p.university is not null then 'Studied at ' || p.university end,
            case when p.major is not null then 'Studied ' || p.major end,
            case when op.graduation_year is not null then 'Class of ' || op.graduation_year::text end
          ), '') as content,
          1 as sort_order
        union all
        select
          'career_history', 'career_history',
          coalesce((
            select v.audience from public.profile_field_visibility v
            where v.organization_membership_id = claimed.membership_id
              and v.field_key = 'career_history'
          ), 'organization'),
          (select string_agg(
            concat_ws(' - ', e.title || ' at ' || e.employer, e.description),
            '. ' order by e.sort_order, e.id
          ) from public.profile_experiences e where e.user_id = claimed.user_id),
          2
        union all
        select
          'education_history', 'education_history',
          coalesce((
            select v.audience from public.profile_field_visibility v
            where v.organization_membership_id = claimed.membership_id
              and v.field_key = 'education_history'
          ), 'organization'),
          (select string_agg(
            concat_ws(' - ', e.school, e.degree, e.field, e.description),
            '. ' order by e.sort_order, e.id
          ) from public.profile_education e where e.user_id = claimed.user_id),
          3
        union all
        select
          'bio', 'bio',
          coalesce((
            select v.audience from public.profile_field_visibility v
            where v.organization_membership_id = claimed.membership_id
              and v.field_key = 'bio'
          ), 'organization'),
          op.bio,
          4
        union all
        select
          'skills', 'skills',
          coalesce((
            select v.audience from public.profile_field_visibility v
            where v.organization_membership_id = claimed.membership_id
              and v.field_key = 'skills'
          ), 'organization'),
          (select string_agg(s.name, ', ' order by s.sort_order, s.normalized_name)
           from public.profile_skills s where s.user_id = claimed.user_id),
          5
        union all
        select
          'helper_topics', 'helper_topics', 'organization',
          (select string_agg(t.name, ', ' order by t.sort_order, t.normalized_name)
           from public.helper_topics t
           where t.organization_membership_id = claimed.membership_id),
          6
      ) fact
      where nullif(btrim(fact.content), '') is not null
        and fact.visibility in ('organization', 'connections')
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object('id', c.id, 'fingerprint', c.fingerprint)
        order by c.id
      )
      from private.profile_embedding_chunks c
      where c.organization_membership_id = claimed.membership_id
    ), '[]'::jsonb)
  from claimed
  join public.profiles p on p.user_id = claimed.user_id
  left join public.organization_profiles op
    on op.organization_membership_id = claimed.membership_id;
$$;

create function private.sync_profile_index(
  p_job_id bigint,
  p_worker_id text,
  p_desired_fingerprints text[],
  p_new_chunks jsonb
)
returns table (
  result_code text,
  chunk_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_user_id uuid;
  v_membership_id uuid;
  v_chunk_count integer;
begin
  select m.organization_id, m.user_id, m.id
    into v_organization_id, v_user_id, v_membership_id
  from private.outbox_jobs j
  join public.organization_memberships m
    on m.id::text = j.payload ->> 'membershipId'
   and m.organization_id::text = j.payload ->> 'organizationId'
   and m.user_id::text = j.payload ->> 'userId'
   and m.status = 'active'
  where j.id = p_job_id
    and j.job_type = 'index_profile'
    and j.status = 'processing'
    and j.locked_by = p_worker_id
  for update of j, m;

  if not found then
    return query select 'not_available'::text, 0;
    return;
  end if;
  if p_desired_fingerprints is null
     or cardinality(p_desired_fingerprints) > 20
     or (select count(distinct value) from unnest(p_desired_fingerprints) value)
        <> cardinality(p_desired_fingerprints)
     or exists (
       select 1 from unnest(p_desired_fingerprints) value
       where value !~ '^[0-9a-f]{64}$'
     )
     or p_new_chunks is null
     or jsonb_typeof(p_new_chunks) <> 'array' then
    return query select 'invalid_input'::text, 0;
    return;
  end if;
  if jsonb_array_length(p_new_chunks) > 20
    or exists (
       select 1
       from jsonb_array_elements(p_new_chunks) element
       where jsonb_typeof(element) <> 'object'
     )
    or exists (
       select 1
       from jsonb_array_elements(p_new_chunks) element
       cross join lateral jsonb_object_keys(
         case when jsonb_typeof(element) = 'object' then element else '{}'::jsonb end
       ) key
       where key not in (
           'chunkKind', 'sourceSection', 'visibility', 'content', 'contentVersion',
           'contentHash', 'fingerprint', 'syntheticPromptVersion', 'embeddingModel',
           'embeddingDimensions', 'embedding'
         )
     ) then
    return query select 'invalid_input'::text, 0;
    return;
  end if;

  begin
    insert into private.profile_embedding_chunks (
      organization_id, user_id, organization_membership_id,
      chunk_kind, source_section, visibility_tier, content, content_version,
      content_hash, fingerprint, synthetic_prompt_version,
      embedding_model, embedding_dim, embedding
    )
    select
      v_organization_id,
      v_user_id,
      v_membership_id,
      item."chunkKind",
      item."sourceSection",
      item.visibility,
      btrim(item.content),
      item."contentVersion",
      item."contentHash",
      item.fingerprint,
      item."syntheticPromptVersion",
      item."embeddingModel",
      item."embeddingDimensions",
      item.embedding::extensions.vector(1024)
    from jsonb_to_recordset(p_new_chunks) as item(
      "chunkKind" text,
      "sourceSection" text,
      visibility text,
      content text,
      "contentVersion" text,
      "contentHash" text,
      fingerprint text,
      "syntheticPromptVersion" text,
      "embeddingModel" text,
      "embeddingDimensions" integer,
      embedding text
    )
    where item.fingerprint = any(p_desired_fingerprints)
    on conflict (organization_membership_id, fingerprint) do update
      set content = excluded.content,
          embedding = excluded.embedding,
          updated_at = now();
  exception when data_exception or integrity_constraint_violation then
    return query select 'invalid_input'::text, 0;
    return;
  end;

  delete from private.profile_embedding_chunks c
  where c.organization_membership_id = v_membership_id
    and not (c.fingerprint = any(p_desired_fingerprints));

  select count(*)::integer into v_chunk_count
  from private.profile_embedding_chunks c
  where c.organization_membership_id = v_membership_id;
  if v_chunk_count <> cardinality(p_desired_fingerprints) then
    raise exception using errcode = '23514', message = 'profile_index_incomplete';
  end if;

  insert into private.profile_embedding_status (
    organization_membership_id, organization_id, user_id, status,
    dirty_reason, dirty_since, attempt_count, last_indexed_at, last_success_at,
    locked_at, locked_by, last_error
  ) values (
    v_membership_id, v_organization_id, v_user_id, 'ready',
    null, null, 0, now(), now(), null, null, null
  )
  on conflict (organization_membership_id) do update
    set status = 'ready',
        dirty_reason = null,
        dirty_since = null,
        attempt_count = 0,
        last_indexed_at = now(),
        last_success_at = now(),
        locked_at = null,
        locked_by = null,
        last_error = null;

  return query select 'synced'::text, v_chunk_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Exposed API wrappers. Implementations remain in the unexposed private
-- schema; mutating wrappers are reviewed security-definer functions with an
-- empty search path and fixed result signatures.
-- ---------------------------------------------------------------------------

create function api.create_direct_ask(
  p_asker_membership_id uuid,
  p_recipient_membership_id uuid,
  p_question text,
  p_request_message text,
  p_client_request_id uuid
)
returns table (
  result_code text,
  ask_id uuid,
  active_count integer,
  created boolean
)
language sql
security definer
set search_path = ''
as $$
  select * from private.create_ask(
    'direct', p_asker_membership_id, p_recipient_membership_id,
    p_question, p_request_message, null, false, p_client_request_id
  );
$$;

create function api.create_circle_ask(
  p_asker_membership_id uuid,
  p_question text,
  p_reach text,
  p_anonymous_until_accepted boolean,
  p_client_request_id uuid
)
returns table (
  result_code text,
  ask_id uuid,
  active_count integer,
  created boolean
)
language sql
security definer
set search_path = ''
as $$
  select * from private.create_ask(
    'circle', p_asker_membership_id, null, p_question, null,
    p_reach, p_anonymous_until_accepted, p_client_request_id
  );
$$;

create function api.respond_to_direct_ask(
  p_ask_id uuid,
  p_decision text,
  p_opening_message text default null,
  p_decline_reason_code text default null,
  p_decline_note text default null,
  p_client_nonce uuid default null
)
returns table (
  result_code text,
  ask_id uuid,
  conversation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_message text;
begin
  if p_decision not in ('accept', 'decline') then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  v_conversation_id := private.respond_to_direct_ask(
    p_ask_id, p_decision, p_opening_message, p_decline_reason_code,
    p_decline_note, p_client_nonce
  );
  return query select
    case when p_decision = 'accept' then 'accepted' else 'declined' end,
    p_ask_id,
    v_conversation_id;
exception when others then
  v_message := sqlerrm;
  if v_message in ('direct_ask_not_found', 'direct_ask_not_recipient', 'ask_blocked') then
    return query select 'not_available'::text, null::uuid, null::uuid;
  elsif v_message = 'ask_already_decided' then
    return query select 'already_decided'::text, p_ask_id, null::uuid;
  elsif v_message in (
    'opening_message_required', 'decline_note_required', 'invalid_direct_ask_decision'
  ) then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
  else
    raise;
  end if;
end;
$$;

create function api.retract_ask(p_ask_id uuid)
returns table (
  result_code text,
  ask_id uuid,
  conversation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message text;
begin
  perform private.retract_ask(p_ask_id);
  return query select 'retracted'::text, p_ask_id, null::uuid;
exception when others then
  v_message := sqlerrm;
  if v_message in ('ask_not_found', 'ask_not_owned') then
    return query select 'not_available'::text, null::uuid, null::uuid;
  elsif v_message = 'ask_cannot_be_retracted' then
    return query select 'already_decided'::text, p_ask_id, null::uuid;
  else
    raise;
  end if;
end;
$$;

create function api.resolve_ask(p_ask_id uuid, p_outcome_note text default null)
returns table (
  result_code text,
  ask_id uuid,
  conversation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_message text;
begin
  if char_length(btrim(coalesce(p_outcome_note, ''))) > 2000 then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  perform private.resolve_ask(p_ask_id, p_outcome_note);
  select c.id into v_conversation_id
  from public.conversations c
  where c.ask_id = p_ask_id;
  return query select 'resolved'::text, p_ask_id, v_conversation_id;
exception when others then
  v_message := sqlerrm;
  if v_message in ('ask_not_found', 'ask_not_owned') then
    return query select 'not_available'::text, null::uuid, null::uuid;
  elsif v_message = 'ask_not_accepted' then
    return query select 'already_decided'::text, p_ask_id, null::uuid;
  else
    raise;
  end if;
end;
$$;

create function api.offer_to_help(
  p_ask_id uuid,
  p_helper_membership_id uuid,
  p_offer_note text,
  p_client_request_id uuid
)
returns table (
  result_code text,
  ask_id uuid,
  offer_id uuid,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer_id uuid;
  v_created boolean;
  v_message text;
begin
  select r.offer_id, r.created
    into v_offer_id, v_created
  from private.offer_to_help(
    p_ask_id, p_helper_membership_id, p_offer_note, p_client_request_id
  ) r;
  return query select
    case when v_created then 'created' else 'existing' end,
    p_ask_id,
    v_offer_id,
    v_created;
exception when others then
  v_message := sqlerrm;
  if v_message in (
    'circle_ask_not_open', 'helper_membership_not_owned', 'ask_not_visible', 'offer_not_allowed'
  ) then
    return query select 'not_available'::text, null::uuid, null::uuid, false;
  elsif v_message = 'idempotency_conflict' then
    return query select 'idempotency_conflict'::text, p_ask_id, null::uuid, false;
  elsif v_message = 'invalid_offer_input' then
    return query select 'invalid_input'::text, null::uuid, null::uuid, false;
  else
    raise;
  end if;
end;
$$;

create function api.decide_offer(
  p_offer_id uuid,
  p_decision text,
  p_opening_message text default null,
  p_decline_reason_code text default null,
  p_decline_note text default null,
  p_client_nonce uuid default null
)
returns table (
  result_code text,
  ask_id uuid,
  offer_id uuid,
  conversation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ask_id uuid;
  v_conversation_id uuid;
  v_message text;
begin
  if p_decision not in ('accept', 'decline') then
    return query select 'invalid_input'::text, null::uuid, null::uuid, null::uuid;
    return;
  end if;

  v_conversation_id := private.decide_offer(
    p_offer_id, p_decision, p_opening_message, p_decline_reason_code,
    p_decline_note, p_client_nonce
  );
  select ao.ask_id into v_ask_id
  from public.ask_offers ao
  where ao.id = p_offer_id;
  return query select
    case when p_decision = 'accept' then 'accepted' else 'declined' end,
    v_ask_id,
    p_offer_id,
    v_conversation_id;
exception when others then
  v_message := sqlerrm;
  if v_message in ('offer_not_found', 'offer_decision_not_owned', 'offer_blocked') then
    return query select 'not_available'::text, null::uuid, null::uuid, null::uuid;
  elsif v_message = 'offer_already_decided' then
    select ao.ask_id into v_ask_id
    from public.ask_offers ao
    where ao.id = p_offer_id;
    return query select 'already_decided'::text, v_ask_id, p_offer_id, null::uuid;
  elsif v_message in (
    'opening_message_required', 'offer_decline_note_required', 'invalid_offer_decision'
  ) then
    return query select 'invalid_input'::text, null::uuid, null::uuid, null::uuid;
  else
    raise;
  end if;
end;
$$;

create function api.get_ask_detail(p_ask_id uuid)
returns table (
  ask_id uuid, organization_id uuid, kind text, status text, question text,
  request_message text, reach text, anonymous_until_accepted boolean,
  asker_user_id uuid, recipient_user_id uuid, decline_reason_code text,
  decline_note text, closure_reason text, outcome_note text,
  accepted_at timestamptz, ended_at timestamptz,
  expires_at timestamptz, created_at timestamptz
)
language sql stable set search_path = ''
as $$ select * from private.get_ask_detail(p_ask_id); $$;

create function api.get_help_home(p_membership_id uuid)
returns table (
  membership_id uuid,
  organization_id uuid,
  active_ask_count integer,
  active_ask_limit integer,
  open_to_help boolean,
  paused_at timestamptz,
  pause_reason text,
  helper_topics text[],
  recent_asks jsonb,
  direct_requests jsonb,
  suggested_asks jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    viewer.id,
    viewer.organization_id,
    (
      select count(*)::integer
      from public.asks mine
      where mine.asker_membership_id = viewer.id
        and mine.status in ('waiting', 'open', 'accepted')
    ),
    5,
    coalesce(hp.open_to_help, true),
    hp.paused_at,
    hp.pause_reason,
    coalesce((
      select array_agg(ht.name order by ht.sort_order)
      from public.helper_topics ht
      where ht.organization_membership_id = viewer.id
    ), '{}'::text[]),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'askId', recent.id,
          'kind', recent.kind,
          'status', recent.status,
          'question', recent.question,
          'createdAt', recent.created_at,
          'expiresAt', recent.expires_at
        ) order by recent.created_at desc, recent.id desc
      )
      from (
        select a.id, a.kind, a.status, a.question, a.created_at, a.expires_at
        from public.asks a
        where a.asker_membership_id = viewer.id
        order by a.created_at desc, a.id desc
        limit 6
      ) recent
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'askId', direct.id,
          'question', direct.question,
          'requestMessage', direct.request_message,
          'createdAt', direct.created_at,
          'expiresAt', direct.expires_at,
          'asker', jsonb_build_object(
            'userId', direct.asker_user_id,
            'displayName', direct.display_name,
            'headline', direct.headline,
            'avatarPath', direct.avatar_path,
            'graduationYear', direct.graduation_year
          )
        ) order by direct.created_at desc, direct.id desc
      )
      from (
        select
          a.id, a.question, a.request_message, a.created_at, a.expires_at,
          asker.user_id as asker_user_id,
          p.display_name, p.headline, p.avatar_path, op.graduation_year
        from public.asks a
        join public.organization_memberships asker on asker.id = a.asker_membership_id
        join public.profiles p on p.user_id = asker.user_id
        left join public.organization_profiles op
          on op.organization_membership_id = asker.id
        where a.kind = 'direct'
          and a.status = 'waiting'
          and a.recipient_membership_id = viewer.id
          and not private.is_blocked(viewer.user_id, asker.user_id)
        order by a.created_at desc, a.id desc
        limit 6
      ) direct
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'askId', suggested.id,
          'question', suggested.question,
          'anonymousUntilAccepted', suggested.anonymous_until_accepted,
          'matchReason', suggested.reason,
          'createdAt', suggested.created_at,
          'expiresAt', suggested.expires_at,
          'asker', case
            when suggested.anonymous_until_accepted then jsonb_build_object(
              'displayName', 'A member',
              'graduationYear', suggested.graduation_year
            )
            else jsonb_build_object(
              'userId', suggested.asker_user_id,
              'displayName', suggested.display_name,
              'avatarPath', suggested.avatar_path,
              'graduationYear', suggested.graduation_year
            )
          end
        ) order by suggested.rank, suggested.id
      )
      from (
        select
          a.id, a.question, a.anonymous_until_accepted, a.created_at, a.expires_at,
          asker.user_id as asker_user_id,
          p.display_name, p.avatar_path, op.graduation_year,
          am.rank, am.reason
        from private.ask_matches am
        join public.asks a on a.id = am.ask_id and a.status = 'open'
        join public.organization_memberships asker on asker.id = a.asker_membership_id
        join public.profiles p on p.user_id = asker.user_id
        left join public.organization_profiles op
          on op.organization_membership_id = asker.id
        where am.helper_membership_id = viewer.id
          and private.can_view_ask(a.id)
          and not private.is_blocked(viewer.user_id, asker.user_id)
        order by am.rank, a.id
        limit 6
      ) suggested
    ), '[]'::jsonb)
  from public.organization_memberships viewer
  join public.users viewer_user
    on viewer_user.id = viewer.user_id and viewer_user.account_state = 'active'
  left join public.helper_preferences hp
    on hp.organization_membership_id = viewer.id
   and hp.organization_id = viewer.organization_id
  where viewer.id = p_membership_id
    and viewer.user_id = (select auth.uid())
    and viewer.status = 'active';
$$;

create function api.search_help_candidates(
  p_membership_id uuid,
  p_question text,
  p_query_embedding extensions.vector(1024) default null,
  p_limit integer default 20
)
returns table (
  helper_membership_id uuid,
  helper_user_id uuid,
  display_name text,
  headline text,
  avatar_path text,
  graduation_year smallint,
  topics text[],
  lexical_score double precision,
  semantic_score double precision,
  match_reason text,
  evidence_chunk_ids uuid[]
)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select m.id, m.organization_id, m.user_id
    from public.organization_memberships m
    join public.users u on u.id = m.user_id and u.account_state = 'active'
    where m.id = p_membership_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
  select candidate.*
  from viewer
  cross join lateral private.search_help_candidates(
    viewer.organization_id,
    viewer.user_id,
    p_question,
    p_query_embedding,
    p_limit
  ) candidate;
$$;

create function api.get_help_ask_detail(p_ask_id uuid)
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
  select
    a.id,
    a.organization_id,
    a.kind,
    a.status,
    a.question,
    case
      when (select auth.uid()) in (asker.user_id, recipient.user_id)
      then a.request_message
      else null
    end,
    a.reach,
    a.anonymous_until_accepted,
    case
      when not a.anonymous_until_accepted
        or asker.user_id = (select auth.uid())
        or a.status in ('accepted', 'resolved')
      then jsonb_build_object(
        'userId', asker.user_id,
        'displayName', asker_profile.display_name,
        'headline', asker_profile.headline,
        'avatarPath', asker_profile.avatar_path,
        'graduationYear', asker_org_profile.graduation_year
      )
      else jsonb_build_object(
        'displayName', 'A member',
        'graduationYear', asker_org_profile.graduation_year
      )
    end,
    case when recipient.user_id is null then null else jsonb_build_object(
      'userId', recipient.user_id,
      'displayName', recipient_profile.display_name,
      'headline', recipient_profile.headline,
      'avatarPath', recipient_profile.avatar_path,
      'graduationYear', recipient_org_profile.graduation_year
    ) end,
    case
      when (select auth.uid()) in (asker.user_id, recipient.user_id)
      then a.decline_reason_code else null
    end,
    case
      when (select auth.uid()) in (asker.user_id, recipient.user_id)
      then a.decline_note else null
    end,
    a.closure_reason,
    a.outcome_note,
    conversation.id,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'offerId', ao.id,
          'status', ao.status,
          'offerNote', ao.offer_note,
          'declineReasonCode', ao.decline_reason_code,
          'declineNote', ao.decline_note,
          'closureReason', ao.closure_reason,
          'createdAt', ao.created_at,
          'helper', jsonb_build_object(
            'userId', helper.user_id,
            'displayName', helper_profile.display_name,
            'headline', helper_profile.headline,
            'avatarPath', helper_profile.avatar_path,
            'graduationYear', helper_org_profile.graduation_year
          )
        ) order by ao.created_at, ao.id
      )
      from public.ask_offers ao
      join public.organization_memberships helper on helper.id = ao.helper_membership_id
      join public.profiles helper_profile on helper_profile.user_id = helper.user_id
      left join public.organization_profiles helper_org_profile
        on helper_org_profile.organization_membership_id = helper.id
      where ao.ask_id = a.id
        and (asker.user_id = (select auth.uid()) or helper.user_id = (select auth.uid()))
    ), '[]'::jsonb),
    case
      when asker.user_id = (select auth.uid())
        or recipient.user_id = (select auth.uid())
        or exists (
          select 1
          from public.ask_offers own_offer
          join public.organization_memberships own_helper
            on own_helper.id = own_offer.helper_membership_id
          where own_offer.ask_id = a.id
            and own_helper.user_id = (select auth.uid())
        )
      then coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'eventId', event.id,
            'type', event.event_type,
            'createdAt', event.created_at
          ) order by event.created_at, event.id
        )
        from private.ask_events event
        where event.ask_id = a.id
      ), '[]'::jsonb)
      else '[]'::jsonb
    end,
    a.accepted_at,
    a.ended_at,
    a.expires_at,
    a.created_at
  from public.asks a
  join public.organization_memberships asker on asker.id = a.asker_membership_id
  join public.profiles asker_profile on asker_profile.user_id = asker.user_id
  left join public.organization_profiles asker_org_profile
    on asker_org_profile.organization_membership_id = asker.id
  left join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
  left join public.profiles recipient_profile on recipient_profile.user_id = recipient.user_id
  left join public.organization_profiles recipient_org_profile
    on recipient_org_profile.organization_membership_id = recipient.id
  left join public.conversations conversation on conversation.ask_id = a.id
  where a.id = p_ask_id
    and private.can_view_ask(a.id);
$$;

create function api.list_my_asks(
  p_membership_id uuid,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
)
returns table (
  ask_id uuid,
  organization_id uuid,
  kind text,
  status text,
  question text,
  recipient_preview jsonb,
  offer_count integer,
  conversation_id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  ended_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id,
    a.organization_id,
    a.kind,
    a.status,
    a.question,
    case when recipient.user_id is null then null else jsonb_build_object(
      'userId', recipient.user_id,
      'displayName', recipient_profile.display_name,
      'headline', recipient_profile.headline,
      'avatarPath', recipient_profile.avatar_path
    ) end,
    (
      select count(*)::integer
      from public.ask_offers ao
      where ao.ask_id = a.id
    ),
    conversation.id,
    a.created_at,
    a.expires_at,
    a.ended_at
  from public.asks a
  join public.organization_memberships asker
    on asker.id = a.asker_membership_id
   and asker.id = p_membership_id
   and asker.user_id = (select auth.uid())
   and asker.status = 'active'
  left join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
  left join public.profiles recipient_profile on recipient_profile.user_id = recipient.user_id
  left join public.conversations conversation on conversation.ask_id = a.id
  where (
    (p_before_created_at is null and p_before_id is null)
    or (
      p_before_created_at is not null and p_before_id is not null
      and (a.created_at, a.id) < (p_before_created_at, p_before_id)
    )
  )
  order by a.created_at desc, a.id desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

create function api.get_my_member_context(
  p_preferred_membership_id uuid default null
)
returns table (
  account_state text,
  onboarding_completed_at timestamptz,
  delete_scheduled_for timestamptz,
  delete_initiated_by_admin boolean,
  deleted_at timestamptz,
  selected_membership_id uuid,
  requires_circle_choice boolean,
  unread_notification_count bigint,
  memberships jsonb
)
language sql stable set search_path = ''
as $$
  select * from private.get_my_member_context(p_preferred_membership_id);
$$;

create function api.verify_invite(p_token text)
returns table (
  result_code text,
  invite_id uuid,
  organization_id uuid,
  email text,
  full_name text,
  graduation_year smallint,
  organization_name text,
  organization_slug text,
  expires_at timestamptz
)
language sql stable set search_path = ''
as $$ select * from private.verify_invite(p_token); $$;

create function api.accept_invite(p_token text)
returns table (
  result_code text,
  membership_id uuid,
  membership_status text
)
language sql set search_path = ''
as $$ select * from private.accept_invite(p_token); $$;

create function api.decide_membership(p_membership_id uuid, p_decision text)
returns table (
  result_code text,
  membership_status text
)
language sql set search_path = ''
as $$ select * from private.decide_membership(p_membership_id, p_decision); $$;

create function api.get_my_profile(p_membership_id uuid)
returns table (
  result_code text,
  profile jsonb
)
language sql stable set search_path = ''
as $$ select * from private.get_my_profile(p_membership_id); $$;

create function api.save_profile_identity(
  p_membership_id uuid,
  p_display_name text,
  p_preferred_name text,
  p_name_other text,
  p_graduation_year smallint
)
returns text language sql set search_path = ''
as $$
  select private.save_profile_identity(
    p_membership_id, p_display_name, p_preferred_name,
    p_name_other, p_graduation_year
  );
$$;

create function api.save_profile_education(
  p_membership_id uuid,
  p_university text,
  p_major text,
  p_education jsonb
)
returns text language sql set search_path = ''
as $$
  select private.save_profile_education(
    p_membership_id, p_university, p_major, p_education
  );
$$;

create function api.save_profile_current(
  p_membership_id uuid,
  p_current_employer text,
  p_current_title text,
  p_city text,
  p_headline text,
  p_linkedin_url text
)
returns text language sql set search_path = ''
as $$
  select private.save_profile_current(
    p_membership_id, p_current_employer, p_current_title,
    p_city, p_headline, p_linkedin_url
  );
$$;

create function api.save_profile_history(
  p_membership_id uuid,
  p_experiences jsonb,
  p_skills text[]
)
returns text language sql set search_path = ''
as $$
  select private.save_profile_history(
    p_membership_id, p_experiences, p_skills
  );
$$;

create function api.save_profile_preferences(
  p_membership_id uuid,
  p_bio text,
  p_open_to_help boolean,
  p_topics text[],
  p_linkedin_url text,
  p_refresh_policy text,
  p_refresh_interval text,
  p_freshness_consent boolean
)
returns text language sql set search_path = ''
as $$
  select private.save_profile_preferences(
    p_membership_id, p_bio, p_open_to_help, p_topics,
    p_linkedin_url, p_refresh_policy, p_refresh_interval,
    p_freshness_consent
  );
$$;

create function api.set_my_avatar_path(
  p_membership_id uuid,
  p_avatar_path text
)
returns text language sql set search_path = ''
as $$ select private.set_my_avatar_path(p_membership_id, p_avatar_path); $$;

create function api.complete_onboarding(p_membership_id uuid)
returns table (
  result_code text,
  completed_at timestamptz
)
language sql set search_path = ''
as $$ select * from private.complete_onboarding(p_membership_id); $$;

create function api.list_help_matches(p_ask_id uuid)
returns table (
  helper_membership_id uuid, helper_user_id uuid, display_name text,
  headline text, rank integer, score double precision, reason text
)
language sql stable set search_path = ''
as $$ select * from private.list_help_matches(p_ask_id); $$;

create function api.list_give_help(
  p_membership_id uuid,
  p_arm text,
  p_query text default null,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 50
)
returns table (
  ask_id uuid, organization_id uuid, kind text, status text, question text,
  reach text, anonymous_until_accepted boolean, asker_user_id uuid,
  asker_display_name text, asker_avatar_path text, asker_graduation_year smallint,
  match_reason text, my_offer_status text, created_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from private.list_give_help(
    p_membership_id, p_arm, p_query, p_before_created_at, p_before_id, p_limit
  );
$$;

create function api.get_helper_preferences(p_membership_id uuid)
returns table (
  membership_id uuid,
  organization_id uuid,
  open_to_help boolean,
  max_pending_requests smallint,
  consecutive_timeouts smallint,
  paused_at timestamptz,
  pause_reason text,
  topics text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id,
    m.organization_id,
    coalesce(hp.open_to_help, true),
    coalesce(hp.max_pending_requests, 10::smallint),
    coalesce(hp.consecutive_timeouts, 0::smallint),
    hp.paused_at,
    hp.pause_reason,
    coalesce(
      array_agg(ht.name order by ht.sort_order)
        filter (where ht.name is not null),
      '{}'::text[]
    )
  from public.organization_memberships m
  left join public.helper_preferences hp
    on hp.organization_membership_id = m.id
   and hp.organization_id = m.organization_id
  left join public.helper_topics ht
    on ht.organization_membership_id = m.id
   and ht.organization_id = m.organization_id
  where m.id = p_membership_id
    and m.status = 'active'
    and m.user_id = (select auth.uid())
  group by m.id, m.organization_id, hp.organization_membership_id;
$$;

create function api.save_helper_preferences(
  p_membership_id uuid,
  p_open_to_help boolean,
  p_topics text[]
)
returns table (
  result_code text,
  open_to_help boolean,
  paused_at timestamptz,
  pause_reason text,
  topics text[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_topics text[];
  v_current public.helper_preferences%rowtype;
  v_final public.helper_preferences%rowtype;
begin
  if p_open_to_help is null then
    return query select 'invalid_input'::text, false, null::timestamptz, null::text, '{}'::text[];
    return;
  end if;

  select coalesce(array_agg(d.topic order by d.first_ordinal), '{}'::text[])
    into v_topics
  from (
    select distinct on (lower(btrim(item.topic)))
      btrim(item.topic) as topic,
      item.ordinality as first_ordinal
    from unnest(coalesce(p_topics, '{}'::text[])) with ordinality as item(topic, ordinality)
    where btrim(item.topic) <> ''
      and char_length(btrim(item.topic)) <= 100
    order by lower(btrim(item.topic)), item.ordinality
  ) d;

  if cardinality(v_topics) > 5
     or exists (
       select 1
       from unnest(coalesce(p_topics, '{}'::text[])) item(topic)
       where btrim(item.topic) <> '' and char_length(btrim(item.topic)) > 100
     ) then
    return query select 'invalid_input'::text, false, null::timestamptz, null::text, '{}'::text[];
    return;
  end if;

  select m.organization_id into v_organization_id
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  where m.id = p_membership_id
    and m.user_id = (select auth.uid())
    and m.status = 'active';
  if v_organization_id is null then
    return query select 'not_available'::text, false, null::timestamptz, null::text, '{}'::text[];
    return;
  end if;

  perform private.lock_help_capacity(p_membership_id, p_membership_id);
  select * into v_current
  from public.helper_preferences hp
  where hp.organization_membership_id = p_membership_id
  for update;

  if v_current.pause_reason = 'admin' then
    return query select
      'not_available'::text,
      v_current.open_to_help,
      v_current.paused_at,
      v_current.pause_reason,
      v_topics;
    return;
  end if;

  insert into public.helper_preferences (
    organization_membership_id, organization_id, open_to_help,
    consecutive_timeouts, paused_at, pause_reason
  ) values (
    p_membership_id,
    v_organization_id,
    p_open_to_help,
    case when p_open_to_help then 0 else coalesce(v_current.consecutive_timeouts, 0) end,
    case when p_open_to_help then null else coalesce(v_current.paused_at, now()) end,
    case when p_open_to_help then null else 'manual' end
  )
  on conflict (organization_membership_id) do update
    set open_to_help = excluded.open_to_help,
        consecutive_timeouts = excluded.consecutive_timeouts,
        paused_at = excluded.paused_at,
        pause_reason = excluded.pause_reason
  returning * into v_final;

  delete from public.helper_topics ht
  where ht.organization_membership_id = p_membership_id;
  insert into public.helper_topics (
    organization_membership_id, organization_id, name, normalized_name, sort_order
  )
  select
    p_membership_id,
    v_organization_id,
    item.topic,
    lower(item.topic),
    (item.ordinality - 1)::smallint
  from unnest(v_topics) with ordinality as item(topic, ordinality);

  return query select
    'saved'::text,
    v_final.open_to_help,
    v_final.paused_at,
    v_final.pause_reason,
    v_topics;
end;
$$;

create function api.consume_help_ai_budget(p_action text)
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

create function api.send_connection_request(
  p_recipient_user_id uuid,
  p_origin_organization_id uuid,
  p_intro_message text,
  p_client_request_id uuid
)
returns uuid language sql set search_path = ''
as $$
  select private.send_connection_request(
    p_recipient_user_id, p_origin_organization_id, p_intro_message, p_client_request_id
  );
$$;

create function api.respond_to_connection_request(p_request_id uuid, p_decision text)
returns uuid language sql set search_path = ''
as $$ select private.respond_to_connection_request(p_request_id, p_decision); $$;

create function api.disconnect(p_other_user_id uuid)
returns void language sql set search_path = ''
as $$ select private.disconnect(p_other_user_id); $$;

create function api.block_member(p_blocked_user_id uuid)
returns void language sql set search_path = ''
as $$ select private.block_member(p_blocked_user_id); $$;

create function api.unblock_member(p_blocked_user_id uuid)
returns void language sql set search_path = ''
as $$ select private.unblock_member(p_blocked_user_id); $$;

create function api.get_or_create_direct_conversation(p_other_user_id uuid)
returns table(result_code text, conversation_id uuid)
language sql set search_path = ''
as $$ select * from private.get_or_create_direct_conversation(p_other_user_id); $$;

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
  latest_message_id bigint
)
language sql set search_path = ''
as $$ select * from private.get_conversation_detail(p_conversation_id); $$;

create function api.list_conversation_messages_before(
  p_conversation_id uuid,
  p_before_id bigint default null,
  p_limit integer default 50
)
returns table(
  id bigint, conversation_id uuid, sender_user_id uuid, kind text, body text,
  system_event_type text, system_actor_user_id uuid, created_at timestamptz
)
language sql set search_path = ''
as $$
  select * from private.list_conversation_messages_before(
    p_conversation_id, p_before_id, p_limit
  );
$$;

create function api.list_conversation_messages_after(
  p_conversation_id uuid,
  p_after_id bigint default null,
  p_limit integer default 100
)
returns table(
  id bigint, conversation_id uuid, sender_user_id uuid, kind text, body text,
  system_event_type text, system_actor_user_id uuid, created_at timestamptz
)
language sql set search_path = ''
as $$
  select * from private.list_conversation_messages_after(
    p_conversation_id, p_after_id, p_limit
  );
$$;

create function api.send_message(
  p_conversation_id uuid,
  p_body text,
  p_client_nonce uuid
)
returns table(result_code text, message_id bigint, created_at timestamptz)
language sql set search_path = ''
as $$ select * from private.send_message(p_conversation_id, p_body, p_client_nonce); $$;

create function api.mark_conversation_read(p_conversation_id uuid, p_message_id bigint)
returns table(result_code text, last_read_message_id bigint, last_read_at timestamptz)
language sql set search_path = ''
as $$ select * from private.mark_conversation_read(p_conversation_id, p_message_id); $$;

create function api.publish_conversation_typing(
  p_conversation_id uuid,
  p_is_typing boolean
)
returns table(result_code text, expires_at timestamptz)
language sql set search_path = ''
as $$
  select * from private.publish_conversation_typing(p_conversation_id, p_is_typing);
$$;

create function api.mark_notifications_read(p_notification_ids bigint[])
returns integer language sql set search_path = ''
as $$ select private.mark_notifications_read(p_notification_ids); $$;

create function api.submit_report(
  p_target_type text,
  p_target_id text,
  p_reason text,
  p_note text default null
)
returns uuid language sql set search_path = ''
as $$ select private.submit_report(p_target_type, p_target_id, p_reason, p_note); $$;

create function api.set_event_rsvp(p_event_id uuid, p_membership_id uuid, p_status text)
returns text language sql set search_path = ''
as $$ select private.set_event_rsvp(p_event_id, p_membership_id, p_status); $$;

create function api.claim_outbox_jobs(
  p_worker_id text,
  p_limit integer default 20,
  p_allowed_types text[] default array[
    'create_notification', 'send_email', 'run_ask_matching', 'index_profile'
  ]::text[]
)
returns table (
  id bigint,
  job_type text,
  payload jsonb,
  attempts integer,
  max_attempts integer,
  available_at timestamptz,
  locked_at timestamptz,
  locked_by text
)
language sql set search_path = ''
as $$
  select
    j.id, j.job_type, j.payload, j.attempts, j.max_attempts,
    j.available_at, j.locked_at, j.locked_by
  from private.claim_outbox_jobs(p_worker_id, p_limit, p_allowed_types) j;
$$;

create function api.get_ask_matching_context(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  ask_id uuid,
  asker_membership_id uuid,
  question text
)
language sql
stable
security definer
set search_path = ''
as $$ select * from private.get_ask_matching_context(p_job_id, p_worker_id); $$;

create function api.search_ask_matching_candidates(
  p_job_id bigint,
  p_worker_id text,
  p_query_embedding extensions.vector(1024) default null,
  p_limit integer default 40
)
returns table (
  helper_membership_id uuid,
  helper_user_id uuid,
  display_name text,
  headline text,
  avatar_path text,
  graduation_year smallint,
  topics text[],
  lexical_score double precision,
  semantic_score double precision,
  match_reason text,
  evidence_chunk_ids uuid[]
)
language sql
stable
security definer
set search_path = ''
as $$
  with context as (
    select c.*, m.organization_id, m.user_id as asker_user_id
    from private.get_ask_matching_context(p_job_id, p_worker_id) c
    join public.organization_memberships m on m.id = c.asker_membership_id
  )
  select candidate.*
  from context
  cross join lateral private.search_help_candidates(
    context.organization_id,
    context.asker_user_id,
    context.question,
    p_query_embedding,
    p_limit
  ) candidate;
$$;

create function api.get_profile_index_source(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  organization_id uuid,
  user_id uuid,
  membership_id uuid,
  facts jsonb,
  existing_chunks jsonb
)
language sql
stable
security definer
set search_path = ''
as $$ select * from private.get_profile_index_source(p_job_id, p_worker_id); $$;

create function api.sync_profile_index(
  p_job_id bigint,
  p_worker_id text,
  p_desired_fingerprints text[],
  p_new_chunks jsonb
)
returns table (
  result_code text,
  chunk_count integer
)
language sql
security definer
set search_path = ''
as $$
  select * from private.sync_profile_index(
    p_job_id, p_worker_id, p_desired_fingerprints, p_new_chunks
  );
$$;

create function api.apply_ask_matches(
  p_ask_id uuid,
  p_pipeline_version text,
  p_model_version text,
  p_matches jsonb
)
returns table (
  result_code text,
  applied_count integer
)
language sql
security definer
set search_path = ''
as $$
  select * from private.apply_ask_matches(
    p_ask_id, p_pipeline_version, p_model_version, p_matches
  );
$$;

create function api.run_help_maintenance(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns table (
  reminders_sent integer,
  asks_closed integer,
  offers_closed integer,
  helpers_paused integer
)
language sql
security definer
set search_path = ''
as $$ select * from private.run_help_maintenance(p_now, p_limit); $$;

create function api.materialize_notification_job(
  p_job_id bigint,
  p_worker_id text
)
returns table (
  result_code text,
  notification_id bigint,
  email_job_id bigint
)
language sql
security definer
set search_path = ''
as $$ select * from private.materialize_notification_job(p_job_id, p_worker_id); $$;

create function api.get_outbox_email_context(
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
as $$ select * from private.get_outbox_email_context(p_job_id, p_worker_id); $$;

create function api.record_outbox_provider_result(
  p_job_id bigint,
  p_worker_id text,
  p_provider_result_id text
)
returns text language sql set search_path = ''
as $$
  select private.record_outbox_provider_result(
    p_job_id, p_worker_id, p_provider_result_id
  );
$$;

create function api.complete_outbox_job(
  p_job_id bigint,
  p_worker_id text
)
returns text language sql set search_path = ''
as $$ select private.complete_outbox_job(p_job_id, p_worker_id); $$;

create function api.retry_outbox_job(
  p_job_id bigint,
  p_worker_id text,
  p_error text,
  p_available_at timestamptz
)
returns text language sql set search_path = ''
as $$
  select private.retry_outbox_job(
    p_job_id, p_worker_id, p_error, p_available_at
  );
$$;

create function api.fail_outbox_job(
  p_job_id bigint,
  p_worker_id text,
  p_error text
)
returns text language sql set search_path = ''
as $$ select private.fail_outbox_job(p_job_id, p_worker_id, p_error); $$;

-- ---------------------------------------------------------------------------
-- Analytics remain private and service-role only.
-- ---------------------------------------------------------------------------

create view private.analytics_invited_to_active
with (security_invoker = true)
as
select
  i.organization_id,
  count(*)::integer as invited_30d,
  count(*) filter (
    where i.status = 'accepted'
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = i.organization_id
          and m.user_id = i.accepted_by_user_id
          and m.status = 'active'
      )
  )::integer as became_active_30d
from public.invites i
where i.created_at > now() - interval '30 days'
group by i.organization_id;

create view private.analytics_help_30d
with (security_invoker = true)
as
select
  a.organization_id,
  count(*)::integer as total_asks,
  count(*) filter (where a.kind = 'direct')::integer as direct_asks,
  count(*) filter (where a.kind = 'circle')::integer as circle_asks,
  count(*) filter (where a.status in ('accepted', 'resolved'))::integer as accepted_or_resolved,
  count(*) filter (
    where a.created_at < now() - interval '7 days'
      and a.responded_at is not null
      and a.responded_at - a.created_at <= interval '7 days'
  )::integer as responded_within_7d
from public.asks a
where a.created_at > now() - interval '30 days'
group by a.organization_id;

create view private.analytics_profile_freshness
with (security_invoker = true)
as
select
  m.organization_id,
  count(*)::integer as total_active,
  count(*) filter (
    where p.updated_at > now() - interval '6 months'
  )::integer as fresh_profiles
from public.organization_memberships m
left join public.profiles p on p.user_id = m.user_id
where m.status = 'active'
group by m.organization_id;

create view private.analytics_upcoming_rsvps
with (security_invoker = true)
as
select
  e.organization_id,
  count(distinct e.id)::integer as upcoming_events,
  count(r.*) filter (where r.status = 'going')::integer as going_count,
  count(r.*) filter (where r.status = 'waitlisted')::integer as waitlist_count
from public.events e
left join public.event_rsvps r on r.event_id = e.id
where e.starts_at > now() and e.status = 'published'
group by e.organization_id;

create view private.analytics_active_membership_count
with (security_invoker = true)
as
select organization_id, count(*)::integer as active_members
from public.organization_memberships
where status = 'active'
group by organization_id;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.invites enable row level security;
alter table public.admin_role_assignments enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_profiles enable row level security;
alter table public.profile_experiences enable row level security;
alter table public.profile_education enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_field_visibility enable row level security;
alter table public.helper_preferences enable row level security;
alter table public.helper_topics enable row level security;
alter table public.asks enable row level security;
alter table public.ask_offers enable row level security;
alter table public.connection_requests enable row level security;
alter table public.connections enable row level security;
alter table public.member_blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

alter table private.ask_matches enable row level security;
alter table private.ask_events enable row level security;
alter table private.conversation_typing_limits enable row level security;
alter table private.reports enable row level security;
alter table private.moderation_actions enable row level security;
alter table private.outbox_jobs enable row level security;
alter table private.audit_log enable row level security;
alter table private.profile_embedding_chunks enable row level security;
alter table private.help_ai_usage_windows enable row level security;
alter table private.profile_embedding_status enable row level security;
alter table private.profile_enrichment_settings enable row level security;
alter table private.profile_enrichment_runs enable row level security;
alter table private.profile_change_proposals enable row level security;
alter table private.profile_enrichment_jobs enable row level security;

create policy users_select_self on public.users
  for select to authenticated
  using (id = (select auth.uid()));

create policy organizations_select_member on public.organizations
  for select to authenticated
  using ((select private.is_active_member_of(id)));

create policy memberships_select_same_org on public.organization_memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      status = 'active'
      and (select private.is_active_member_of(organization_id))
    )
    or (select private.is_admin_of(organization_id))
  );

create policy invites_select_admin on public.invites
  for select to authenticated
  using ((select private.is_admin_of(organization_id)));

create policy admin_roles_select_self_or_admin on public.admin_role_assignments
  for select to authenticated
  using (
    (select private.is_admin_of(organization_id))
    or exists (
      select 1
      from public.organization_memberships m
      where m.id = organization_membership_id and m.user_id = (select auth.uid())
    )
  );

create policy profiles_select_orgmate on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      not private.is_blocked((select auth.uid()), user_id)
      and exists (
        select 1
        from public.organization_memberships mine
        join public.organization_memberships theirs
          on theirs.organization_id = mine.organization_id
         and theirs.user_id = profiles.user_id
         and theirs.status = 'active'
        where mine.user_id = (select auth.uid()) and mine.status = 'active'
      )
    )
  );

create policy organization_profiles_select_orgmate on public.organization_profiles
  for select to authenticated
  using (
    (select private.is_active_member_of(organization_id))
    and not private.is_blocked(
      (select auth.uid()),
      (select m.user_id from public.organization_memberships m where m.id = organization_membership_id)
    )
  );

create policy profile_experiences_select_visible on public.profile_experiences
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      not private.is_blocked((select auth.uid()), user_id)
      and exists (
        select 1
        from public.organization_memberships mine
        join public.organization_memberships theirs
          on theirs.organization_id = mine.organization_id
         and theirs.user_id = profile_experiences.user_id
         and theirs.status = 'active'
        where mine.user_id = (select auth.uid()) and mine.status = 'active'
      )
    )
  );

create policy profile_education_select_visible on public.profile_education
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      not private.is_blocked((select auth.uid()), user_id)
      and exists (
        select 1
        from public.organization_memberships mine
        join public.organization_memberships theirs
          on theirs.organization_id = mine.organization_id
         and theirs.user_id = profile_education.user_id
         and theirs.status = 'active'
        where mine.user_id = (select auth.uid()) and mine.status = 'active'
      )
    )
  );

create policy profile_skills_select_visible on public.profile_skills
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      not private.is_blocked((select auth.uid()), user_id)
      and exists (
        select 1
        from public.organization_memberships mine
        join public.organization_memberships theirs
          on theirs.organization_id = mine.organization_id
         and theirs.user_id = profile_skills.user_id
         and theirs.status = 'active'
        where mine.user_id = (select auth.uid()) and mine.status = 'active'
      )
    )
  );

create policy profile_visibility_select_owner on public.profile_field_visibility
  for select to authenticated
  using ((select private.owns_membership(organization_membership_id, organization_id)));

create policy helper_preferences_select_orgmate on public.helper_preferences
  for select to authenticated
  using (
    (select private.is_active_member_of(organization_id))
    and not private.is_blocked(
      (select auth.uid()),
      (
        select m.user_id
        from public.organization_memberships m
        where m.id = organization_membership_id
      )
    )
  );

create policy helper_topics_select_orgmate on public.helper_topics
  for select to authenticated
  using (
    (select private.is_active_member_of(organization_id))
    and not private.is_blocked(
      (select auth.uid()),
      (
        select m.user_id
        from public.organization_memberships m
        where m.id = organization_membership_id
      )
    )
  );

-- Asks and offers intentionally have no client policies. All member access
-- uses anonymity-safe API projections and transactional commands.

create policy connection_requests_select_participant on public.connection_requests
  for select to authenticated
  using (
    (select auth.uid()) in (requester_user_id, recipient_user_id)
    and not private.is_blocked(requester_user_id, recipient_user_id)
  );

create policy connections_select_participant on public.connections
  for select to authenticated
  using ((select auth.uid()) in (user_a_id, user_b_id));

create policy member_blocks_select_owner on public.member_blocks
  for select to authenticated
  using (blocker_user_id = (select auth.uid()));

create policy conversations_select_participant on public.conversations
  for select to authenticated
  using ((select private.can_view_conversation(id)));

create policy messages_select_participant on public.messages
  for select to authenticated
  using ((select private.can_view_conversation(conversation_id)));

create policy conversation_reads_select_owner on public.conversation_reads
  for select to authenticated
  using (user_id = (select auth.uid()) and (select private.can_view_conversation(conversation_id)));

create policy events_select_member on public.events
  for select to authenticated
  using (
    (status = 'published' and (select private.is_active_member_of(organization_id)))
    or (select private.is_admin_of(organization_id))
  );

create policy event_rsvps_select_member on public.event_rsvps
  for select to authenticated
  using ((select private.is_active_member_of(organization_id)));

create policy announcements_select_member on public.announcements
  for select to authenticated
  using (
    (status = 'published' and (select private.is_active_member_of(organization_id)))
    or (select private.is_admin_of(organization_id))
  );

create policy notifications_select_owner on public.notifications
  for select to authenticated
  using (recipient_user_id = (select auth.uid()));

create policy notification_preferences_select_owner on public.notification_preferences
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Explicit grants
-- ---------------------------------------------------------------------------

revoke all privileges on all tables in schema public, api, private
  from public, anon, authenticated;
revoke all privileges on all sequences in schema public, api, private
  from public, anon, authenticated;
revoke all privileges on all functions in schema public, api, private
  from public, anon, authenticated;

grant all privileges on all tables in schema public, api, private to service_role;
grant all privileges on all sequences in schema public, api, private to service_role;
grant execute on all functions in schema public, api, private to service_role;

grant select on public.users,
  public.organizations,
  public.organization_memberships,
  public.admin_role_assignments,
  public.connection_requests,
  public.connections,
  public.member_blocks,
  public.events,
  public.event_rsvps,
  public.announcements,
  public.notifications,
  public.notification_preferences
to authenticated;

-- These relations have RLS policies for defense in depth but no raw table
-- grant because column-level privacy requires an API projection.
-- profiles, profile details, helper settings, invites, asks, and offers.

grant execute on function api.accept_invite(text) to authenticated;
grant execute on function api.create_direct_ask(uuid, uuid, text, text, uuid) to authenticated;
grant execute on function api.create_circle_ask(uuid, text, text, boolean, uuid) to authenticated;
grant execute on function api.decide_membership(uuid, text) to authenticated;
grant execute on function api.get_my_profile(uuid) to authenticated;
grant execute on function api.save_profile_identity(uuid, text, text, text, smallint) to authenticated;
grant execute on function api.save_profile_education(uuid, text, text, jsonb) to authenticated;
grant execute on function api.save_profile_current(uuid, text, text, text, text, text) to authenticated;
grant execute on function api.save_profile_history(uuid, jsonb, text[]) to authenticated;
grant execute on function api.save_profile_preferences(uuid, text, boolean, text[], text, text, text, boolean) to authenticated;
grant execute on function api.set_my_avatar_path(uuid, text) to authenticated;
grant execute on function api.complete_onboarding(uuid) to authenticated;
grant execute on function api.respond_to_direct_ask(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function api.retract_ask(uuid) to authenticated;
grant execute on function api.resolve_ask(uuid, text) to authenticated;
grant execute on function api.offer_to_help(uuid, uuid, text, uuid) to authenticated;
grant execute on function api.decide_offer(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function api.get_ask_detail(uuid) to authenticated;
grant execute on function api.get_help_home(uuid) to authenticated;
grant execute on function api.search_help_candidates(uuid, text, extensions.vector, integer) to authenticated;
grant execute on function api.get_help_ask_detail(uuid) to authenticated;
grant execute on function api.list_my_asks(uuid, timestamptz, uuid, integer) to authenticated;
grant execute on function api.get_my_member_context(uuid) to authenticated;
grant execute on function api.list_help_matches(uuid) to authenticated;
grant execute on function api.list_give_help(uuid, text, text, timestamptz, uuid, integer) to authenticated;
grant execute on function api.get_helper_preferences(uuid) to authenticated;
grant execute on function api.save_helper_preferences(uuid, boolean, text[]) to authenticated;
grant execute on function api.consume_help_ai_budget(text) to authenticated;
grant execute on function api.send_connection_request(uuid, uuid, text, uuid) to authenticated;
grant execute on function api.respond_to_connection_request(uuid, text) to authenticated;
grant execute on function api.disconnect(uuid) to authenticated;
grant execute on function api.block_member(uuid) to authenticated;
grant execute on function api.unblock_member(uuid) to authenticated;
grant execute on function api.get_or_create_direct_conversation(uuid) to authenticated;
grant execute on function api.get_conversation_detail(uuid) to authenticated;
grant execute on function api.list_conversation_messages_before(uuid, bigint, integer) to authenticated;
grant execute on function api.list_conversation_messages_after(uuid, bigint, integer) to authenticated;
grant execute on function api.send_message(uuid, text, uuid) to authenticated;
grant execute on function api.mark_conversation_read(uuid, bigint) to authenticated;
grant execute on function api.publish_conversation_typing(uuid, boolean) to authenticated;
grant execute on function api.mark_notifications_read(bigint[]) to authenticated;
grant execute on function api.submit_report(text, text, text, text) to authenticated;
grant execute on function api.set_event_rsvp(uuid, uuid, text) to authenticated;
grant execute on function api.verify_invite(text) to service_role;
grant execute on function api.claim_outbox_jobs(text, integer, text[]) to service_role;
grant execute on function api.get_ask_matching_context(bigint, text) to service_role;
grant execute on function api.search_ask_matching_candidates(bigint, text, extensions.vector, integer) to service_role;
grant execute on function api.get_profile_index_source(bigint, text) to service_role;
grant execute on function api.sync_profile_index(bigint, text, text[], jsonb) to service_role;
grant execute on function api.apply_ask_matches(uuid, text, text, jsonb) to service_role;
grant execute on function api.run_help_maintenance(timestamptz, integer) to service_role;
grant execute on function api.materialize_notification_job(bigint, text) to service_role;
grant execute on function api.get_outbox_email_context(bigint, text) to service_role;
grant execute on function api.record_outbox_provider_result(bigint, text, text) to service_role;
grant execute on function api.complete_outbox_job(bigint, text) to service_role;
grant execute on function api.retry_outbox_job(bigint, text, text, timestamptz) to service_role;
grant execute on function api.fail_outbox_job(bigint, text, text) to service_role;

grant execute on function private.is_active_member_of(uuid) to authenticated;
grant execute on function private.owns_membership(uuid, uuid) to authenticated;
grant execute on function private.is_admin_of(uuid) to authenticated;
grant execute on function private.is_connected(uuid, uuid) to authenticated;
grant execute on function private.is_blocked(uuid, uuid) to authenticated;
grant execute on function private.can_view_conversation(uuid) to authenticated;
grant execute on function private.can_access_conversation_topic(text) to authenticated;
grant execute on function private.can_access_user_topic(text) to authenticated;
grant execute on function private.can_view_ask(uuid) to authenticated;
grant execute on function private.accept_invite(text) to authenticated;
grant execute on function private.decide_membership(uuid, text) to authenticated;
grant execute on function private.get_my_profile(uuid) to authenticated;
grant execute on function private.save_profile_identity(uuid, text, text, text, smallint) to authenticated;
grant execute on function private.save_profile_education(uuid, text, text, jsonb) to authenticated;
grant execute on function private.save_profile_current(uuid, text, text, text, text, text) to authenticated;
grant execute on function private.save_profile_history(uuid, jsonb, text[]) to authenticated;
grant execute on function private.save_profile_preferences(uuid, text, boolean, text[], text, text, text, boolean) to authenticated;
grant execute on function private.set_my_avatar_path(uuid, text) to authenticated;
grant execute on function private.complete_onboarding(uuid) to authenticated;
grant execute on function private.get_ask_detail(uuid) to authenticated;
grant execute on function private.get_my_member_context(uuid) to authenticated;
grant execute on function private.list_help_matches(uuid) to authenticated;
grant execute on function private.send_connection_request(uuid, uuid, text, uuid) to authenticated;
grant execute on function private.respond_to_connection_request(uuid, text) to authenticated;
grant execute on function private.disconnect(uuid) to authenticated;
grant execute on function private.block_member(uuid) to authenticated;
grant execute on function private.unblock_member(uuid) to authenticated;
grant execute on function private.get_or_create_direct_conversation(uuid) to authenticated;
grant execute on function private.get_conversation_detail(uuid) to authenticated;
grant execute on function private.list_conversation_messages_before(uuid, bigint, integer) to authenticated;
grant execute on function private.list_conversation_messages_after(uuid, bigint, integer) to authenticated;
grant execute on function private.send_message(uuid, text, uuid) to authenticated;
grant execute on function private.mark_conversation_read(uuid, bigint) to authenticated;
grant execute on function private.publish_conversation_typing(uuid, boolean) to authenticated;
grant execute on function private.mark_notifications_read(bigint[]) to authenticated;
grant execute on function private.submit_report(text, text, text, text) to authenticated;
grant execute on function private.set_event_rsvp(uuid, uuid, text) to authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema api
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema api
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage and Realtime
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('resumes', 'resumes', false, 10485760, array['application/pdf'])
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_public_read on storage.objects
  for select to public
  using (bucket_id = 'avatars');

create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy resumes_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy resumes_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy resumes_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy resumes_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter table public.notifications replica identity full;

-- Supabase Realtime owns this relation. BridgeCircle adds only the supported
-- receive policy; clients never receive an INSERT policy for private topics.
create policy conversation_topics_receive on realtime.messages
  for select to authenticated
  using (
    extension = 'broadcast'
    and (
      private.can_access_conversation_topic((select realtime.topic()))
      or private.can_access_user_topic((select realtime.topic()))
    )
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime drop table public.messages';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      execute 'alter publication supabase_realtime add table public.notifications';
    end if;
  end if;
end;
$$;

comment on schema public is 'BridgeCircle RLS-protected application relations.';
comment on schema api is 'BridgeCircle exposed, fixed-signature query and command wrappers.';
comment on schema private is 'BridgeCircle unexposed authorization, matching, moderation, jobs, audit, and enrichment internals.';
