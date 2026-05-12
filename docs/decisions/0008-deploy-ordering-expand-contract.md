# 0008 — Deploy ordering and the expand/contract migration discipline

- **Status:** accepted
- **Date:** 2026-05-12
- **Decider:** Richard

## Context

After the 2026-04-29 cutover ([ADR 0005](0005-hybrid-supabase-branching.md)), a PR merge to `main` triggers two independent webhooks:

- Supabase's GitHub integration applies the migration to the prod project. Typically <30s.
- Railway's GitHub integration starts `pnpm install` + `pnpm build` and swaps the container atomically. Typically 2–5 min.

In practice Supabase finishes first because Railway's build is the bottleneck. This creates a **deploy window** of 2–5 minutes during which the prod database is on the new schema while the prod app is still running the old code.

For additive migrations (add column / table / index, add NOT-NULL with a default, etc.) old code ignores the new schema and the window is harmless. For destructive migrations (drop column, rename column, tighten a constraint, add a foreign key) old code references things that no longer exist or violates new rules, and 100% of traffic hitting the affected code path errors until Railway finishes.

The CI build job catches "code in `main` doesn't match the new schema in `main`" before merge — but CI cannot protect against the **timing** between the new schema being live and the new code being live. CI verifies the *destination state*; it does not enforce the *transition*.

Earlier docs ([docs/architecture/environments.md](../architecture/environments.md) "Order of operations is handled for you") incorrectly described this as "lockstep." It's a race, not a lockstep — that language is being corrected as part of this ADR.

## Decision

Adopt the **expand/contract pattern** as the universal discipline for any schema change that is not purely additive. Keep the current Supabase auto-apply + Railway auto-deploy setup unchanged.

Every destructive change is split into two or three independently-safe PRs:

1. **Expand** — add the new shape alongside the old. Code writes to both, reads from old. Both old and new code work against the post-expand schema.
2. **Migrate code** — switch reads to the new shape. Still writing both. Both schemas are valid; merge order with Railway no longer matters.
3. **Contract** — drop the old shape. No live code references it, so the race window is harmless.

For purely additive migrations (the ~80% case), continue to ship as a single PR — the race window is already safe.

For true emergencies where expand/contract isn't practical (rare; usually pre-launch with zero users), put the site in maintenance mode before merge and re-enable after both Supabase and Railway have settled.

## Why not enforce ordering at the platform level

Two paths would give true atomic "migrate AND deploy succeed together or both fail" semantics:

- **Railway pre-deploy command** — disable Supabase's auto-apply, add `pnpm dlx supabase db push` as a Railway pre-deploy command using the prod service role key. Migration runs inside Railway's deploy sequence; failures fail the deploy and old container keeps serving.
- **Switch to a Heroku-style platform** with a native release-phase command (Fly.io, Render, Heroku).

Both rejected for now because:

- Expand/contract solves the problem regardless of platform and scales to blue-green / canary later.
- Pulling migration responsibility back into Railway re-introduces the manual workflow we cut over from on 2026-04-29 (`supabase link` + `db push`), expands the blast radius of the Railway env (needs the prod secret key), and loses PR-level migration validation via Supabase preview branches.
- Platform-level ordering doesn't help with the harder cases anyway — a destructive migration that's atomic with deploy still breaks any in-flight HTTP request that started against the old schema. Expand/contract is the only pattern that's safe under partial failure, concurrent requests, and future scale (multiple Railway replicas, canary deploys, etc.).

## Consequences

- **+** Deploy ordering becomes a non-event. Either step can finish first, fail, or retry without breaking prod.
- **+** Discipline is platform-independent. If we ever migrate off Supabase or Railway, the pattern still applies.
- **+** Enables future infra moves (canary deploys, blue-green, multi-region) without revisiting migration safety.
- **+** Aligns with how Stripe / GitHub / Shopify handle schema changes — the practice is well-documented and the failure modes are understood.
- **−** Destructive changes now require 2–3 PRs spread across deploys instead of 1. More overhead per change.
- **−** Requires discipline to recognize when a change is destructive. "Rename column" is the easy case; "tighten a CHECK constraint" or "add a foreign key on an existing table" are subtler.
- **−** The Railway pre-deploy escape hatch stays available but unused, which is one more "way to do it" agents and future engineers might reach for incorrectly.

## Alternatives considered

- **Railway pre-deploy command running `supabase db push`** — gives strict ordering but expands the Railway env's blast radius, requires reversing the 0005 cutover, and loses preview-branch validation. Considered and documented in [docs/architecture/environments.md](../architecture/environments.md) as an escape hatch for future use; not adopted today.
- **Switch to Heroku / Fly.io with native release-phase commands** — solves the ordering at the platform level, but the migration cost is high relative to the actual risk at pilot scale, and you still need expand/contract for any destructive change made under concurrent load. Defer until there's a real reason to leave Railway.
- **Blue-green prod environments** — two long-lived Railway services, deploy to inactive one, swap traffic. Heavy operationally; not justified at pilot scale.
- **Canary deploys** — Railway doesn't natively support percentage-based traffic split. Achievable with a load balancer (Cloudflare rules) but adds infrastructure for a problem we don't have yet.
- **Feature flags for code (decouple deploy from release)** — separate concern from schema ordering, but the natural companion to expand/contract. Not adopted today (no flag library yet); revisit post-launch as part of the post-launch backlog.
- **Maintenance mode for every destructive deploy** — works for pilot scale but doesn't scale to a real user base, and breaks the "deploy any time" workflow. Reserve for genuine emergencies.

## How to apply

Before authoring a migration, classify it:

- **Additive** (add column / table / index, add NOT-NULL with default, add nullable column, soft-defaulted FK, new function, new policy) → ship as a single PR.
- **Destructive** (drop column / table / index, rename, tighten CHECK / NOT-NULL, add FK to existing data, change column type) → ship as expand → migrate → contract, one PR each, with at least one full deploy cycle between expand and contract.

Worked example for renaming `users.full_name → users.display_name` lives in [docs/runbooks/migration-workflow.md](../runbooks/migration-workflow.md) under "Expand/contract for destructive changes."
