# 0016 — Expo native apps, gated by a feature-parity ratchet

- **Status:** accepted (supersedes [0002](0002-web-first-defer-native.md))
- **Date:** 2026-07-22
- **Decider:** Daniel (explicit user direction)

## Context

ADR 0002 deferred native mobile until repeat-engagement signals. The owner
has now explicitly directed building Expo iOS/Android apps, with three
requirements: (1) a mechanism that *ensures* 100% web↔mobile feature parity
— when a new feature lands, updating the tests must be sufficient for the
failing tests to enumerate what mobile work remains; (2) mobile CI that
mirrors web CI; (3) large-screen (tablet) breakpoints designed in from the
start, on both platforms.

The `/lib` discipline (ADR 0007) was always the hedge for this moment:
business logic is framework-agnostic. But the web client consumes it through
React Server Components and server actions, which a native client cannot
call.

## Decision

1. **Standalone Expo app at `mobile/`** (Expo SDK 57, expo-router, pnpm,
   TypeScript), not a monorepo conversion — `app/` keeps its lockfile, CI,
   and conventions untouched. Shared contracts cross the boundary as data,
   not runtime imports: the generated `database.types.ts` (type-only
   import), `parity/window-classes.json` (breakpoints), and the design
   tokens transcribed into `mobile/src/theme/tokens.ts` (same role-token
   names as `globals.css`).
2. **Mobile talks to Supabase directly with a token session** (AsyncStorage)
   and calls the same `api`-schema RPC boundary the web repositories use
   (`get_my_member_context`, `get_school_home`, `list_people`, …). Those
   functions run as the signed-in user and own the business rules — the v2
   database rewrite made the server boundary natively consumable, so
   nothing is reimplemented on-device and no extra HTTP layer is needed.
3. **Parity is enforced by a ratchet, not a doc** — `parity/features.json`
   declares every user-facing feature, its routes, platforms, and window-
   class layouts; `parity/check-parity.mjs` fails CI when a `page.tsx` ships
   unclaimed or a declared platform/layout has no tagged test
   (Playwright `@feature:`/`@layout:` tags; Maestro `# feature:` tags).
   Known gaps live in `parity-baseline.txt` and may only shrink silently.
   See `parity/README.md`.
4. **Mobile e2e = Maestro** (YAML flows, Android emulator in CI, opt-in
   label at first), mirroring Playwright's role on web. Mobile CI mirrors
   `ci.yml` step-for-step (biome, eslint, tsc, vitest, parity), with
   `expo export` standing in for `next build`.
5. **Window-size classes are a first-class shared contract**:
   `compact` (<761), `medium` (761–1023), `expanded` (≥1024), aligned with
   the web's `detail:` and `lg:` breakpoints. Web gets Playwright viewport
   projects per class; mobile gets `useWindowClass()` driving a bottom tab
   bar (compact/medium) vs. a navigation rail (expanded/iPad).

## Consequences

- **+** Adding a page without declaring parity intent is a hard CI failure;
  parity debt is a visible, reviewable, monotonically shrinking baseline.
- **+** No churn to the web app's toolchain; the two apps share schema,
  RLS, types, breakpoints, token names, and test-seed data.
- **−** Two UI implementations to maintain; the manifest + tags add a small
  tax to every feature PR (that tax is the mechanism working).
- **−** Push notifications, Google OAuth on native, and app-store delivery
  are new infra, all currently recorded as baseline gaps.
- Notifications remain email-only until the mobile inbox slice lands.

## Alternatives considered

- **pnpm monorepo with shared packages** — cleaner imports, but converts the
  web app's lockfile/CI for a benefit that today is three small contracts;
  revisit when a real shared runtime package emerges (e.g. zod schemas).
- **React Strict DOM / react-native-web single codebase** — rejected;
  Next 16 RSC/server-action architecture doesn't translate, and the design
  system is mid-migration (ADR 0013).
- **Detox** for mobile e2e — heavier native tooling; Maestro's YAML flows
  keep parity tests greppable by the same tag scanner as Playwright's.
