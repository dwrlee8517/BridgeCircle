# Phase 1 Post-Launch Backlog

Not blockers for launch. Revisit after the product is opened to real members.

## Monorepo restructure: `apps/web` + `apps/mobile` + `packages/`

Adding the Expo shell at `mobile/` ([ADR 0016](../../../docs/decisions/0016-native-mobile-via-expo.md))
deliberately took the low-churn path: `app/` stayed exactly where it is, `mobile/` installs
independently with its own lockfile, and there is **no** root `pnpm-workspace.yaml`. That
last part is not an oversight — pnpm finds its workspace root by walking up, so a root
workspace file would make installs inside `app/` switch to a root lockfile and break both
the app-scoped CI jobs (`working-directory: app`, `cache-dependency-path: app/pnpm-lock.yaml`)
and Railway, whose service root directory is `app/`.

The consequence is that there is currently **no way to share code between web and mobile**.
The first mobile feature slice will want `app/src/lib/` logic and will otherwise duplicate it.

The restructure, when it happens:

- `app/` → `apps/web`, `mobile/` → `apps/mobile`, shared logic extracted to `packages/`
  (the `/lib` layer from [ADR 0007](../../../docs/decisions/0007-lib-discipline.md) is
  already framework-agnostic and dependency-injected, which is what makes this tractable).
- Root `pnpm-workspace.yaml` + single lockfile; drop `mobile/pnpm-lock.yaml`.
- Rewrite both GitHub workflows (`working-directory`, lockfile cache paths).
- Update `playwright.config.ts`, `scripts/`, and the Doppler/worktree invocations.
- Update ~every docs cross-reference to `app/` — including `AGENTS.md`, `CLAUDE.md`,
  `app/CLAUDE.md`, and `docs/INDEX.md`.
- **Manual, external step:** change the Railway service's root directory from `app` to
  `apps/web` in the dashboard, and coordinate it with the deploy so prod doesn't break.

Best done when no other large branch is in flight, and ideally sequenced with (or after)
the pending Bun migration so the lockfile churn happens once rather than twice.

## Cost monitoring on Anthropic API

Current NL search queries hit Haiku up to twice; resume import hits it once.
No observability today. Consider Sentry breadcrumbs or a counter row.

ADR 0009's hybrid Ask matching target will add more retrieval stages and may
add embedding generation/backfill plus vector search. Instrument latency and
cost by stage before shipping that as the default Ask results path.

## Persistent `dev` branch on prod project

Replace `bridgecircle-dev` (separate project, now under the same Pro org as prod — see [ADR 0005](../../../docs/decisions/0005-hybrid-supabase-branching.md)) with a persistent dev branch on the prod project (~$10/mo). Would unify the dashboard, enable cheap dev resets, and remove the manual `pnpm dlx supabase db push` step from daily dev. Skipped at the 2026-04-29 cutover because the cost-vs-marginal-improvement math didn't justify it pre-launch; revisit now that the "Free tier covers dev" argument no longer applies.

## Announcement expiry (`expires_at`)

The home banner currently hides announcements older than 14 days, but
content-level deadlines ("register by May 30") can pass while the
announcement is still fresh by age. Add an optional `expires_at` column to
`announcements` (forward-only migration) and have admins set it when an
announcement has a deadline; the banner and pinned School row should hide
expired items.

## Richer LLM rationales on home suggestion cards

The "Why they might fit" line on home falls back to a static template
(`buildHomeRationale`) when no LLM rationale exists. Worth generating short
per-viewer rationales (Haiku, cached) so the home grid reads as observed
context rather than templated copy. Mind the cost-monitoring item above.

## Notification mark-read on row click

/notifications rows navigate but don't mark as read; only the bell popover
acknowledges. Reuse the popover's mark-read action on row click so the page
isn't a read-only mirror.

## Tailwind class linting upgrade

The design-token ratchet (scripts/check-design-tokens.sh) is a grep-based
baseline check — cheap and dependency-free, but it can't see context.
Once the baseline is at/near zero, consider eslint-plugin-tailwindcss (or
Biome's plugin API when it lands) for proper class-aware linting with
per-line allowlists.
