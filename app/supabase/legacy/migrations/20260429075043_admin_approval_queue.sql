-- Day 14: admin approval queue
--
-- Adds an org-level toggle for whether new invite acceptances land as
-- 'active' (current behavior) or 'pending' (admin must approve from the
-- queue before access is granted).
--
-- The membership_status enum already supports the full state machine:
--   pending  → admin reviews, approves, or rejects
--   active   → full org member
--   rejected → admin declined; no access
--   revoked  → previously active, deactivated by admin
--
-- No RLS changes here. Membership writes still go through service_role per
-- the comment in 20260426233156_rls.sql ("Inserts (invite acceptance) and
-- approval-queue updates: service_role only.") — the new admin lib functions
-- elevate via createAdminClient() the same way acceptInvite() does.

alter table organizations
  add column requires_admin_approval boolean not null default false;

comment on column organizations.requires_admin_approval is
  'When true, invite acceptance lands as status=pending and admins must approve from /admin/approvals. When false (default), invite acceptance is auto-approved to status=active.';
