# 0001 — Use Supabase end-to-end for Phase 1; no ORM

- **Status:** accepted
- **Date:** 2026-04-21
- **Decider:** Richard

## Context

We need Postgres + auth + storage + RLS + email-on-signup. Single-engineer build. Migrations need to be reviewable in PR.

## Decision

Use Supabase as the all-in-one BaaS:
- Auth (Google OAuth + email/password)
- Postgres + RLS for data + permissions
- Storage for avatars and resumes
- Realtime (available; not yet used)

No ORM. Database access goes through `@supabase/supabase-js` directly, typed via `pnpm db:types` (which regenerates `app/src/db/database.types.ts` from the live dev project schema).

Migrations are forward-only SQL files in `app/supabase/migrations/`, applied via `supabase db push` to dev and via the Supabase + GitHub branching integration to prod.

## Consequences

- **+** One vendor for auth, DB, storage. Zero glue code between them.
- **+** Generated types stay in sync with the schema automatically. No manual `Prisma generate` step.
- **+** RLS lives in SQL where it belongs, reviewable in the same migration as the table.
- **+** Free tier covers `bridgecircle-dev`; paid plan only on prod.
- **−** Vendor lock-in. Migrating off Supabase later means rewriting auth and the storage abstraction.
- **−** No ORM means no automatic relation traversal — joins are manual `.select('*, related(*)')` strings.
- **−** Type safety on `.select()` strings is partial; runtime shape can drift from inferred type.

## Alternatives considered

- **Postgres + Prisma + Clerk/Auth.js** — more engineering work, three integration surfaces.
- **Postgres + Drizzle + own auth** — even more work; no auth UI to lean on.
- **Firebase** — NoSQL is a poor fit for the relational alumni/mentorship data model.
