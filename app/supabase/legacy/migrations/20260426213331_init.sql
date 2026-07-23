-- BridgeCircle Phase 1 launch schema (the "0001_init" migration).
-- 20 tables: 13 wired to UI at launch, 7 schema-only for week 3+.
-- See docs/data-model.md for the rationale behind each design choice.
-- Day 1 scope: schema only. RLS, indexes beyond PK/FK, and seed data ship later.

-- =============================================================================
-- Extensions
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- Enums
-- =============================================================================

create type membership_status         as enum ('pending', 'active', 'rejected', 'revoked');
create type invite_status             as enum ('pending', 'accepted', 'expired', 'revoked');
create type mentorship_request_status as enum ('pending', 'accepted', 'declined', 'expired');
create type mentorship_thread_status  as enum ('active', 'archived');
create type event_rsvp_status         as enum ('going', 'not_going');
create type admin_role                as enum ('super_admin', 'admin', 'event_moderator', 'ambassador');
create type message_thread_type       as enum ('mentorship', 'direct');
create type friend_request_status     as enum ('pending', 'accepted', 'declined');

-- =============================================================================
-- Identity & organization membership
-- =============================================================================

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Shadow of auth.users. App-only flags live here so we don't fight the
-- Supabase-managed auth schema. One row per auth user, created by trigger.
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  deleted_at    timestamptz,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table organization_memberships (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  status           membership_status not null default 'pending',
  joined_at        timestamptz,
  approved_by      uuid references users(id) on delete set null,
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (user_id, organization_id)
);

-- Reusable identity card. One per user, shared across all org memberships.
create table base_profiles (
  user_id           uuid primary key references users(id) on delete cascade,
  name              text,
  headline          text,
  current_employer  text,
  current_title     text,
  city              text,
  university        text,
  major             text,
  linkedin_url      text,
  avatar_url        text,
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

-- Org-context overlay. One per organization_membership. The split makes
-- multi-org additive instead of destructive when org #2 onboards.
create table organization_profiles (
  organization_membership_id  uuid primary key references organization_memberships(id) on delete cascade,
  graduation_year             int,
  bio                         text,
  mentoring_topics            text[],
  open_to_mentor              boolean not null default false,
  updated_at                  timestamptz not null default now(),
  created_at                  timestamptz not null default now()
);

create table invites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  email            text not null,
  token            text not null unique,
  status           invite_status not null default 'pending',
  full_name        text,
  graduation_year  int,
  expires_at       timestamptz,
  sent_by          uuid references users(id) on delete set null,
  accepted_by      uuid references users(id) on delete set null,
  accepted_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (organization_id, email)
);

-- =============================================================================
-- Mentorship — the core launch loop
-- =============================================================================

-- Scoped per organization_membership so a user can be open-to-mentor at one
-- org and not at another.
create table mentorship_preferences (
  organization_membership_id  uuid primary key references organization_memberships(id) on delete cascade,
  is_open                     boolean not null default false,
  topics                      text[],
  screening_prompt            text,
  max_active_mentees          int not null default 5,
  max_pending_requests        int not null default 10,
  paused_at                   timestamptz,
  updated_at                  timestamptz not null default now(),
  created_at                  timestamptz not null default now()
);

create table mentorship_requests (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  mentor_id         uuid not null references users(id) on delete cascade,
  mentee_id         uuid not null references users(id) on delete cascade,
  status            mentorship_request_status not null default 'pending',
  reason            text,
  help_needed       text,
  background        text,
  screening_answer  text,
  responded_at      timestamptz,
  created_at        timestamptz not null default now(),
  check (mentor_id <> mentee_id)
);

-- Separated from requests on purpose: requests close once decided, threads
-- stay open until archived. Future re-request creates a new request + thread.
create table mentorship_threads (
  id               uuid primary key default gen_random_uuid(),
  request_id       uuid not null references mentorship_requests(id) on delete cascade,
  mentor_id        uuid not null references users(id) on delete cascade,
  mentee_id        uuid not null references users(id) on delete cascade,
  status           mentorship_thread_status not null default 'active',
  last_message_at  timestamptz,
  created_at       timestamptz not null default now()
);

-- Polymorphic by enum: thread_id points at mentorship_threads or
-- direct_message_threads depending on thread_type. One inbox query covers both.
create table messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null,
  thread_type  message_thread_type not null,
  sender_id    uuid not null references users(id) on delete cascade,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- =============================================================================
-- Events
-- =============================================================================

create table events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  created_by       uuid references users(id) on delete set null,
  title            text not null,
  description      text,
  location         text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table event_rsvps (
  event_id      uuid not null references events(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  status        event_rsvp_status not null,
  responded_at  timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- =============================================================================
-- Admin & audit
-- =============================================================================

-- Roles in this table represent elevation above member. Plain "member" lives
-- on organization_memberships, not here.
create table admin_role_assignments (
  user_id          uuid not null references users(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  role             admin_role not null,
  granted_by       uuid references users(id) on delete set null,
  granted_at       timestamptz not null default now(),
  primary key (user_id, organization_id, role)
);

-- Write-only at launch; no admin UI for it yet, but every admin action writes
-- a row from day one so we have history when we need it.
create table audit_log (
  id               uuid primary key default gen_random_uuid(),
  actor_id         uuid references users(id) on delete set null,
  organization_id  uuid references organizations(id) on delete set null,
  action           text not null,
  target_type      text,
  target_id        text,
  payload          jsonb,
  created_at       timestamptz not null default now()
);

-- =============================================================================
-- Schema-only (week 3+ wiring): friendship, DM, announcements, notifications,
-- profile-refresh prompts, saved searches. Created now so FKs resolve and
-- week 3 is a UI change rather than a migration.
-- =============================================================================

create table friend_requests (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references users(id) on delete cascade,
  receiver_id   uuid not null references users(id) on delete cascade,
  status        friend_request_status not null default 'pending',
  message       text,
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

-- One row per friendship with canonical user ordering: user_a_id < user_b_id.
-- Avoids "two rows per relationship"; "is X friends with Y" is one PK lookup.
create table friendships (
  id          uuid primary key default gen_random_uuid(),
  user_a_id   uuid not null references users(id) on delete cascade,
  user_b_id   uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (user_a_id < user_b_id),
  unique (user_a_id, user_b_id)
);

create table direct_message_threads (
  id          uuid primary key default gen_random_uuid(),
  user_a_id   uuid not null references users(id) on delete cascade,
  user_b_id   uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (user_a_id < user_b_id),
  unique (user_a_id, user_b_id)
);

create table announcements (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  created_by       uuid references users(id) on delete set null,
  title            text not null,
  body             text,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table notifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  organization_id  uuid references organizations(id) on delete set null,
  type             text not null,
  target_type      text,
  target_id        text,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

create table profile_refresh_prompts (
  id                          uuid primary key default gen_random_uuid(),
  organization_membership_id  uuid not null references organization_memberships(id) on delete cascade,
  due_at                      timestamptz not null,
  completed_at                timestamptz,
  created_at                  timestamptz not null default now()
);

create table saved_searches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  filters          jsonb not null,
  notify_cadence   text,
  created_at       timestamptz not null default now()
);

-- =============================================================================
-- Auth integration
-- =============================================================================
-- Auto-create the public.users shadow row whenever auth.users gets a new row.
-- security definer + explicit search_path so the trigger runs with elevated
-- privileges no matter who triggered the auth insert.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
