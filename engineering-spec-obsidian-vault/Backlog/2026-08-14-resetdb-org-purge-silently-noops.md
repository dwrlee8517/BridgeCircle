---
type: bug
area: ci
severity: medium
found_during: writing the demo-door integration test
date: 2026-08-14
---

# resetDb's org purge silently no-ops for any org with content

## What I saw

`app/tests/integration/harness/resetDb.ts:11-13` and `:56`

The cascade-map comment claims "Deleting an org cascades to its memberships,
org profiles, … and the rest of the org-scoped tree." It does not: every
org-scoped FK in v2 is `on delete restrict` (verified against pg_constraint —
memberships, invites, asks, events, announcements, helper_preferences, and ~15
more), and `organization_memberships.user_id → public.users` is also restrict,
so the auth-user delete in step 2 can strand `public.users` mirrors too. The
purge ignores the delete's `error` return, so an `it-` org with any content
survives `teardownScope`/`sweepAllTestData` without a word.

## Why it might matter

On the local stack `db reset` hides it. On the opt-in dev target
(`test:int:dev`), the sweep is the only cleanup — `it-` orgs with memberships
or invites accumulate forever, and the "safety net" in the harness header is
partly fiction. Any future test that asserts on org counts or reuses a slug
will trip over the residue, as the demo-door suite did.

## Not doing it now because

Found while fixing the demo-door coverage ratchet; a correct deep-delete (or a
`private.purge_test_org(uuid)` helper migration) is its own change with its
own review.

## Possible fix

Either check and surface the delete errors (turning silent residue into a
loud failure), or add a service-role-only SQL function that deletes an org's
tree in dependency order and have purge call it. The demo-door suite's
reuse-over-teardown pattern is another template when fixtures can be durable.
