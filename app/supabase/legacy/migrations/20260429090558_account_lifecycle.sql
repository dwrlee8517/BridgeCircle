-- Day 14b: account lifecycle (self-deactivation + grace-period delete)
--
-- New membership status:
--   self_deactivated → user voluntarily paused; only the user (or any admin)
--                      can flip back to 'active'. Distinct from admin-initiated
--                      'revoked' so the UI can offer a self-reactivate path.
--
-- New columns on users (drives the grace-period delete flow):
--   delete_scheduled_for      → if set, account is in grace before tombstoning
--   delete_reason             → captured at delete request, surfaced in emails
--                               and the cancel-deletion page
--   delete_initiated_by_admin → true if admin triggered, false if self.
--                               Affects: who can cancel, whether auth is banned
--                               immediately, and which email template fires
--
-- Grace flow (same machinery for self-delete and admin-delete, different
-- grace lengths and access rules):
--
--   1. delete requested
--      → memberships set to 'revoked' (immediate hide from peer queries)
--      → users.delete_scheduled_for set (30d for self, 7d for admin)
--      → users.delete_reason captured
--      → users.delete_initiated_by_admin set
--      → if admin-initiated: auth user banned right away (lockout)
--        if self-initiated:  auth stays open so the user can sign in to cancel
--
--   2. cancel (any time before finalization)
--      → clear delete_scheduled_for, delete_reason, delete_initiated_by_admin
--      → restore memberships to 'active'
--      → unban auth user (if banned)
--      Self-initiated delete: cancellable by self OR any admin.
--      Admin-initiated delete: cancellable only by an admin.
--
--   3. finalize (manual: admin "Finalize now" button OR sweep script)
--      → tombstone base_profiles (name → "Former member", PII cleared)
--      → ban auth user permanently
--      → users.deleted_at set
--      → users.delete_scheduled_for cleared
--
-- A row past its grace window but not yet finalized stays hidden + locked
-- out (memberships are already revoked; admin-deleted users are already
-- banned). The DB just retains the profile data until manual finalization,
-- giving us a generous extra recovery window beyond the official grace.

alter type membership_status add value if not exists 'self_deactivated';

alter table users
  add column delete_scheduled_for      timestamptz,
  add column delete_reason             text,
  add column delete_initiated_by_admin boolean not null default false;

-- Sweep script ("find rows past grace") and admin queue ("show scheduled
-- deletions") both filter on this column. Partial index keeps it small —
-- only rows with an active schedule are indexed.
create index users_delete_scheduled_for_idx on users (delete_scheduled_for)
  where delete_scheduled_for is not null;

comment on column users.delete_scheduled_for is
  'When set, account is scheduled for tombstoning. Memberships are already revoked. Cleared on cancel or finalization.';
comment on column users.delete_reason is
  'Reason captured at delete request. Surfaced in emails (admin path) and the cancel-deletion page.';
comment on column users.delete_initiated_by_admin is
  'Whether the deletion was triggered by an admin (true) or by the user themselves (false). Affects who can cancel and whether auth is banned during grace.';
