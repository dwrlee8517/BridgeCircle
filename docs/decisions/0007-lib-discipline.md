# 0007 — `/lib` discipline: business logic out of route handlers

- **Status:** accepted
- **Date:** 2026-04-22
- **Decider:** Richard

## Context

Next.js App Router makes it easy to put business logic directly in route handlers and server actions. That's fine for prototypes. It becomes painful when:

- The same operation needs to be called from a route handler AND a background job (Railway worker).
- Logic needs to be unit-tested without spinning up Next.js.
- A future native mobile client needs the same operation reachable from outside the Next.js process.

## Decision

Every business rule lives in `app/src/lib/<domain>/`. Route handlers and server actions only do four things:

1. Parse input (zod)
2. Check auth (`requireSession`)
3. Call a `/lib` function with **injected dependencies** (`{ db, notify, ... }`)
4. Map the result to a response

`/lib` functions:

- **Must not** import `next/*`, `@supabase/supabase-js` clients directly, or Resend.
- **Must** take their dependencies as arguments (so tests inject fakes).
- **Are** framework-agnostic — they could be called from a worker process, a CLI script, or a future RPC server.

Canonical example: `createMentorshipRequest` (see `docs/runbooks/day-0-setup.md` Step 6).

Domain folders today (others added as features land):
- `app/src/lib/mentorship/`
- `app/src/lib/profile/`
- `app/src/lib/search/`
- `app/src/lib/invite/`
- `app/src/lib/events/`
- `app/src/lib/admin/`
- `app/src/lib/notifications/`
- `app/src/lib/analytics/`

## Consequences

- **+** Background jobs (Railway worker) call the same code path as routes. No drift.
- **+** Vitest tests don't need a Next.js runtime — `/lib` functions take fakes for `{ db, notify }`.
- **+** A future native mobile client can hit the same `/lib` functions through a thin RPC wrapper.
- **+** Reading `app/src/app/api/.../route.ts` tells you the contract; reading `/lib` tells you the behavior. Clear separation.
- **−** Boilerplate per route (parse → auth → call → respond) is repetitive.
- **−** Two-file change for most features (route + lib).
- **−** New developers (or agents) sometimes regress and put logic in the route. Enforced by review and the `lib-discipline` sub-agent.

## Alternatives considered

- **Logic in route handlers** — cheap until the second caller appears. Then the rewrite is painful.
- **Service layer with DI container** (NestJS-style) — too heavyweight for a single-engineer project.
- **Trpc** — interesting but couples the client and server type-side; defer until there's demand.
