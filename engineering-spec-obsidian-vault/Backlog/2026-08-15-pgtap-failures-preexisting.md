# pgTAP suite has two pre-existing failures (not in CI, so they accumulated)

Found 2026-08-15 while verifying the eval-org seed (initiative
[[Initiatives/help-search-golden-baseline/plan|help-search-golden-baseline]]);
both are catalog-level and predate that change. `pnpm db:test` is not run in CI,
so nothing caught them.

1. **`001_schema_contract.test.sql` test 30** — "every public and private
   foreign key has a leading-column index" fails because
   `public.demo_access_windows (armed_by_user_id)` has no leading-column index.
   Introduced by `app/supabase/migrations/20260814183216_demo_access_windows.sql`
   (demo door, 2026-08-14). Fix: forward migration adding
   `create index on public.demo_access_windows (armed_by_user_id);`.

2. **`004_foundation_security.test.sql` test 6** — the reviewed `api.*`
   execution allowlist is stale: `admin_grant_role`, `admin_overview`,
   `admin_revoke_role`, `list_admin_members` now exist (admin migrations
   2026-07-23/24) but were never added to the test's `want` array. Fix: review
   the four grants, then update the allowlist in the test.

Either fix is small; they should land separately from the help-search
initiative. Until then, `pnpm db:test` reports exactly these two failures —
treat any THIRD failure as real.
