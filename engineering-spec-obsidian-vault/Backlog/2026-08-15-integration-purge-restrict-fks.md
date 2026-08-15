# Integration-harness purge silently fails on populated orgs (restrict FKs)

Found 2026-08-15 while building the e2e janitor (`app/scripts/sweep-e2e.ts`,
seed-pipeline reorganization). The integration harness's cleanup,
`app/tests/integration/harness/resetDb.ts` `purge()` (`:49-62`), deletes
organizations and auth users directly through PostgREST and **ignores every
error**. Three facts make that a silent no-op for any populated org:

1. Nearly every org-scoped table references `organizations` with
   `on delete restrict` (memberships, asks, events, invites, …), so a bare
   org delete on a populated org always errors.
2. Several blockers live in the `private` schema
   (`ask_events`, `ask_matches`, `membership_rejection_details`) — PostgREST
   cannot reach them at all, so no PostgREST-only cleanup can ever succeed
   for orgs whose tests exercised the real command layer.
3. `auth.admin.deleteUser` does not remove `public.users`; the
   `on_auth_user_deleted` trigger *pseudonymizes* it into a tombstone.

The same pattern (tracked-id deletes, errors ignored) is why 75 `foundation-*`
orgs leaked on hosted dev — that side is now fixed by `pnpm sweep:e2e`
(psql, dependency-ordered, error-propagating, `if: always()` in cd.yml).

**The fix for this note:** rework `purge()`/`sweepAllTestData()` onto the same
psql path (or an equivalent security-definer RPC), including the `it-`/`it+`
prefixes, and make errors fatal. Blocker to resolve first: the integration
env has no `SUPABASE_DB_URL` — it builds only a PostgREST admin client — so
either thread the DB URL through `test:int` / `test:int:dev` (Doppler configs
already hold it) or expose a guarded cleanup RPC. Until then, `it-` residue
on the dev-personal target quietly accumulates the same way `foundation-` did.

Simply making the current PostgREST errors fatal is NOT the fix — it would
fail every teardown of a populated org (see the corrected header comment in
`resetDb.ts`).
