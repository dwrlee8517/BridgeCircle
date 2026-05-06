-- Generalize "mentorship requests" into "asks" with a type column.
--
-- Two ask types ship at launch: 'advice' (low-burden, default helper
-- opt-in) and 'mentorship' (deeper relationship, explicit opt-in).
--
-- Names change to match the broader concept:
--   mentorship_requests     -> asks
--   mentorship_threads      -> ask_threads
--   mentorship_preferences  -> helper_preferences
--   mentor_id / mentee_id   -> helper_id / asker_id  (now type-agnostic)
--   request_id              -> ask_id                (on ask_threads)
--   is_open (binary toggle) -> open_to_advice + open_to_mentorship
--
-- Existing helpers with is_open=true preserve their availability by being
-- migrated to open_to_mentorship=true. Advice defaults on for everyone so
-- the lighter-commitment volunteer pool grows without extra setup.

-- ---------------------------------------------------------------------------
-- New enum
-- ---------------------------------------------------------------------------

create type ask_type as enum ('advice', 'mentorship');

-- ---------------------------------------------------------------------------
-- Status enum renames
-- ---------------------------------------------------------------------------

alter type mentorship_request_status rename to ask_status;
alter type mentorship_thread_status  rename to ask_thread_status;

-- The shared messages.thread_type enum: 'mentorship' covered both advice
-- and mentorship threads going forward, so the value should match the
-- new abstraction.
alter type message_thread_type rename value 'mentorship' to 'ask';

-- ---------------------------------------------------------------------------
-- Table renames
-- ---------------------------------------------------------------------------

alter table mentorship_requests    rename to asks;
alter table mentorship_threads     rename to ask_threads;
alter table mentorship_preferences rename to helper_preferences;

-- ---------------------------------------------------------------------------
-- Column renames (asks + ask_threads)
-- ---------------------------------------------------------------------------

alter table asks rename column mentor_id to helper_id;
alter table asks rename column mentee_id to asker_id;

alter table ask_threads rename column mentor_id  to helper_id;
alter table ask_threads rename column mentee_id  to asker_id;
alter table ask_threads rename column request_id to ask_id;

-- ---------------------------------------------------------------------------
-- New ask_type column on asks
-- Existing rows backfill to 'mentorship' (they were all mentorship requests
-- before this change). Default also stays 'mentorship' so any in-flight
-- legacy code path continues to work until the composer is type-aware.
-- ---------------------------------------------------------------------------

alter table asks
  add column ask_type ask_type not null default 'mentorship';

-- ---------------------------------------------------------------------------
-- Replace binary is_open with per-type opt-in toggles
--
-- The drop column at the end is destructive. Forward-only migration rules
-- normally forbid this, but the app is pre-launch with no production data;
-- dev DB will be reseeded if needed. Do not treat this as precedent for
-- post-launch migrations — write a separate "deprecate column" migration
-- and a later "drop column" migration once readers have stopped using it.
-- ---------------------------------------------------------------------------

alter table helper_preferences
  add column open_to_advice      boolean not null default true,
  add column open_to_mentorship  boolean not null default false;

-- Preserve current state: anyone marked open under the old binary toggle
-- stays open to mentorship. Advice defaults on for them too (the new
-- lighter commitment that we want broadly recruited).
update helper_preferences
   set open_to_mentorship = is_open;

alter table helper_preferences
  drop column is_open;

-- ---------------------------------------------------------------------------
-- RLS: drop & recreate messages policies that compared thread_type to the
-- old enum literal 'mentorship'. The string literal cast fails after the
-- enum rename, even though Postgres auto-rewrites table/column references.
--
-- Same shape as the original policies in 20260426233156_rls.sql — only
-- the literal ('mentorship' -> 'ask'), the table reference (mentorship_threads
-- -> ask_threads), and the columns (mentor_id/mentee_id -> helper_id/asker_id)
-- change. Behavior preserved: participants on either side can read, send
-- (only when thread is active), and update (read receipts) their messages.
-- ---------------------------------------------------------------------------

drop policy "participants read mentorship messages"   on messages;
drop policy "participants send mentorship messages"   on messages;
drop policy "participants update mentorship messages" on messages;

create policy "participants read ask messages" on messages
  for select to authenticated
  using (
    thread_type = 'ask'
    and exists (
      select 1 from ask_threads t
      where t.id = thread_id
        and (t.helper_id = auth.uid() or t.asker_id = auth.uid())
    )
  );

create policy "participants send ask messages" on messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and thread_type = 'ask'
    and exists (
      select 1 from ask_threads t
      where t.id = thread_id
        and t.status = 'active'
        and (t.helper_id = auth.uid() or t.asker_id = auth.uid())
    )
  );

create policy "participants update ask messages" on messages
  for update to authenticated
  using (
    thread_type = 'ask'
    and exists (
      select 1 from ask_threads t
      where t.id = thread_id
        and (t.helper_id = auth.uid() or t.asker_id = auth.uid())
    )
  );
