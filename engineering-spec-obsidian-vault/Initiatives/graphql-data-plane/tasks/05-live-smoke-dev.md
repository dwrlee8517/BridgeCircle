---
id: graphql-data-plane/05-live-smoke-dev
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: ready
depends_on: [00]
pr:
---

# 05 — Live authenticated smoke against dev

## Cold start

Every slice so far is verified by tsc + schema tests + CI build — but **no
authenticated GraphQL request has ever been executed against a real database**.
The wiring is believed correct (the endpoint compiles through `next build`,
and CI's Playwright boots the app), yet resolver-level mistakes (wrong arg
mapping into an RPC, enum case slips) only surface on execution.

> **Correction (2026-08-17).** An earlier version of this note said a parity
> harness already existed, built by another session, and pointed at `parity/`
> at the repo root. That was a name collision, not a harness: `parity/` is the
> **web ↔ mobile surface** manifest (`pnpm check:parity`), a different axis
> entirely — its own README opens by warning against exactly this confusion.
> No GraphQL parity harness existed. One has since been built at
> `app/tests/integration/graphql/`, and it subsumes most of this task: it
> executes authenticated queries against a real database and diffs them
> against the repository layer. See `docs/architecture/graphql-parity.md`.
>
> What remains of *this* task is the **dev-target** run: the harness is proven
> against local Supabase only.

## Scope

**In:**
- Boot the local stack (`pnpm db:start`, seed via `pnpm seed:demo-org` or
  `seed:scene` — check `package.json` for the current seed scripts), run the
  dev server, sign a seeded user in via Supabase to get an access token, and
  execute a representative query + mutation per feature against
  `/api/graphql` with `Authorization: Bearer`.
- Fix anything that breaks; each fix is part of this PR.
- Record a runnable script or integration spec so this isn't a one-off —
  ideally as `app/tests/integration/graphql/*.int.test.ts` following the
  existing harness idioms.

**Out:**
- Full parity diffing (the other session's harness owns that); this is the
  smoke tier.

## Verification

```bash
cd app && pnpm db:start && pnpm test:int   # or the graphql-scoped variant added here
```

- `{ me { id } }` returns the seeded member; one command round-trips
  (e.g. saveNotificationPreference) and its read reflects the write.
- Unauthenticated request → `me: null`, commands → their NOT_AVAILABLE
  terminals.

## Done when

- [ ] An authenticated query and mutation verified against the local stack
- [ ] Repeatable spec/script committed
- [ ] PR opened, CI green, merged

## Handoff notes

*Filled in by the session that does this task.*
