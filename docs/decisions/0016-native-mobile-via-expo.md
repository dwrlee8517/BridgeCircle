# 0016 — Native mobile via Expo, starting as a boots-only shell

- **Status:** accepted
- **Date:** 2026-08-08
- **Decider:** Richard

## Context

[ADR 0002](0002-web-first-defer-native.md) made Phase 1 web-first and named Expo
explicitly as something we would not do until repeat-engagement signals appeared. That
gate has not been met — we have not measured 30%+ of active members returning ≥2x/week,
and the friction logs it described don't exist yet.

This ADR is not claiming the gate was met. It records a deliberate decision to start the
native target early anyway, so the choice is legible later rather than looking like drift.

The cost asymmetry is what changed the call. [ADR 0007](0007-lib-discipline.md) already
forces business logic into `app/src/lib/` as framework-agnostic, dependency-injected
functions — the stated reason being "this is what keeps mobile feasible later." The
expensive part of a native client (untangling logic from the web framework) is therefore
already paid. What remains is scaffolding, a build pipeline, and app-store mechanics,
and those are cheaper to stand up while the repo is small than after it has grown a
second year of web-shaped assumptions.

## Decision

Native mobile is in scope, built with **Expo (SDK 57) + Expo Router**, living at
`mobile/` in this repo.

The first landing is a **boots-only shell**: one screen, no Supabase, no auth, no API
calls, no design-system port. It is verified in CI by `tsc --noEmit` and `expo export`.

`mobile/` installs independently and is **not** a pnpm workspace member. There is no root
`pnpm-workspace.yaml`, because pnpm resolves its workspace root by walking up: one at the
repo root would make installs inside `app/` switch to a root lockfile, breaking both the
app-scoped CI jobs (`working-directory: app`, `cache-dependency-path: app/pnpm-lock.yaml`)
and Railway, whose service root directory is `app/`. Proper workspace wiring is coupled to
the `apps/web` + `apps/mobile` + `packages/` restructure, tracked in the
[post-launch backlog](../../product-spec-obsidian-vault/Prototype/phase-1/post-launch-backlog.md).

Feature work on mobile stays gated. This ADR authorizes the shell and the pipeline, not
parity. Each subsequent slice — auth, then a real screen — is its own decision.

## Consequences

- **+** The native target is real in CI from day one; it can't silently rot.
- **+** ADR 0007's `/lib` discipline now has a concrete consumer, so violations of it
  become visible instead of theoretical.
- **+** App-store identifiers, icons, and build config get sorted out under no time pressure.
- **−** A second dependency tree and a second lockfile to keep patched, for an app that
  currently renders one screen. This is real carrying cost with no user-facing return yet.
- **−** Two `node_modules` layouts: `app/` uses pnpm's default symlinked layout, `mobile/`
  needs `node-linker=hoisted` for Metro and React Native autolinking.
- **−** No shared code path exists yet, so the first feature slice will be tempted to
  duplicate logic. It should extract into a shared package instead.
- **−** This Mac has no full Xcode install, so there is no local iOS simulator. The
  practical loops are Expo web, Expo Go on a device, and CI. Anything requiring a native
  build (custom native modules, push notifications) will hit this wall.

## Alternatives considered

- **Hold the 0002 line until the engagement gate is met** — the disciplined answer, and
  still defensible. Rejected because the scaffolding cost only grows, and starting it now
  costs a shell rather than a migration. The gate still governs *feature* work.
- **PWA instead of native** — rejected for the same reason 0002 rejected it: install
  prompts and an offline shell for unclear payoff. It also doesn't get us push
  notifications on iOS in the form we'd eventually want.
- **Full `apps/` monorepo restructure in the same change** — rejected as too much churn to
  bundle with a scaffold. It rewrites CI, Playwright config, and most docs cross-references,
  and requires changing Railway's service root directory by hand. Tracked separately.
- **React Native without Expo** — rejected. No reason to take on the build-tooling burden
  Expo absorbs for a single-engineer project.
