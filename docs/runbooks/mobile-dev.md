# Mobile development (Expo)

The native iOS/Android app lives in `mobile/` — a standalone Expo SDK 57 +
expo-router app with its own pnpm lockfile. Governing decision:
[ADR 0016](../decisions/0016-expo-native-with-parity-ratchet.md). Parity
machinery: [`parity/README.md`](../../parity/README.md).

## Daily commands

From `mobile/`:

```bash
# iOS simulator against the local Supabase stack (start it first: cd app && pnpm db:start)
doppler run -p bridgecircle -c dev_local -- pnpm ios
pnpm lint            # eslint (expo lint)
pnpm biome check .   # biome
pnpm tsc --noEmit    # typecheck
pnpm vitest run      # unit tests (pure logic only)
pnpm check:parity    # web↔mobile↔layout parity ratchet
pnpm test:e2e        # Maestro flows (needs a built dev app — see mobile/e2e/README.md)
```

`app.config.ts` maps either `EXPO_PUBLIC_*` or the web's `NEXT_PUBLIC_*`
Supabase names into the bundle, so the same Doppler configs work for both
apps. The iOS simulator reaches the host's local stack on `localhost`;
Android emulators use `10.0.2.2` instead — override with
`EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321` for `pnpm android`.
Sign in with the seeded personas from `app/supabase/seeds/seed.sql`
(e.g. `richard@example.com` / `devseed-password-richard`).

## Architecture rules

- **Data access is RPC-first, like the web.** The v2 boundary is the `api`
  schema (`supabase.schema('api').rpc('get_school_home', …)`) — the same
  functions the web repositories call
  (`app/src/db/repositories/*.ts`), running as the signed-in user. Mobile
  calls them directly; never reimplement their business rules on-device and
  never use a service key here.
- **Types**: `mobile/src/db/types.ts` type-imports the web's generated
  `database.types.ts`. One schema, one `pnpm db:types`.
- **Tokens**: `mobile/src/theme/tokens.ts` transcribes `globals.css` `:root`
  values under the same role names. A `globals.css` token change updates it
  in the same PR (mid-migration per ADR 0012/0013 — build against names).
- **Window classes**: `useWindowClass()` (compact / medium / expanded from
  `parity/window-classes.json`) decides tab bar vs. navigation rail. New
  screens use the `Screen` scaffold so iPad widths get a bounded column.
- **Copy**: same voice rules as web ([voice-guidelines](../product/voice-guidelines.md),
  ADR 0011 vocabulary — asks and connects, never "mentor/mentorship").

## Adding a feature to mobile (the parity loop)

1. The feature's entry already exists in `parity/features.json` (the route
   tripwire forced it when the web page shipped).
2. Write the Maestro flow in `mobile/e2e/flows/`, tagged `# feature:<id>`.
3. Build the screen(s) until the flow passes.
4. `pnpm check:parity` now reports the gap closed — run
   `node parity/check-parity.mjs --update` in the same PR to ratchet the
   baseline down.

## CI

- `mobile-ci.yml` — biome, eslint, parity, tsc, vitest, `expo export`
  (both platforms) on every PR. Mirrors `ci.yml`.
- `mobile-e2e.yml` — Maestro on an Android emulator against the same local
  Supabase stack (migrations + seeds) the web Playwright suite uses. Opt-in
  via the `run-mobile-e2e` PR label (or manual dispatch) until the pipeline
  is proven; then drop the label gate to match `e2e.yml`.

## Not built yet (tracked as baseline gaps, not TODOs in prose)

Run `node parity/check-parity.mjs` and read `parity/parity-baseline.txt` —
that list *is* the mobile backlog, feature by feature. Highlights: Google
OAuth + invite join on native, asks/offers, the Messages inbox (realtime),
profile viewing/editing, event RSVP, push notifications, admin surfaces,
and iPad `layout:expanded` Maestro coverage.
