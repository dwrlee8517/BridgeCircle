-- Smoke test for the Supabase + GitHub branching integration.
--
-- This migration is intentionally a no-op — it only writes a comment to
-- pg_catalog (which is what `comment on schema` does for an existing
-- schema). No tables, columns, indexes, policies, or data are touched.
--
-- The purpose is to verify end-to-end that:
--   1. Opening a PR with a new file under app/supabase/migrations/ triggers
--      the GitHub integration to create a preview branch
--   2. The preview branch successfully applies the migration
--   3. Merging the PR auto-deploys the migration to production
--
-- After confirming the flow works, the migration stays in history (forward-
-- only) but has zero schema impact. Future migrations append on top.

comment on schema public is 'BridgeCircle public schema. Branching smoke test verified 2026-04-29.';
