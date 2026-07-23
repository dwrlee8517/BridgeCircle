# Mobile development (Expo)

The native iOS/Android app lives in `mobile/` — a standalone Expo SDK 57 +
expo-router app with its own pnpm lockfile. Governing decision:
[ADR 0014](../decisions/0014-expo-native-with-parity-ratchet.md). Parity
machinery: [`parity/README.md`](../../parity/README.md).

## Daily commands

From `mobile/`:

```bash
doppler run -p bridgecircle -c dev_personal -- pnpm ios      # iOS simulator
doppler run -p bridgecircle -c dev_personal -- pnpm android  # Android emulator
pnpm lint            # eslint (expo lint)
pnpm biome check .   # biome
pnpm tsc --noEmit    # typecheck
pnpm vitest run      # unit tests (pure logic only)
pnpm check:parity    # web↔mobile↔layout parity ratchet
pnpm test:e2e        # Maestro flows (needs a built dev app — see mobile/e2e/README.md)
```

Doppler supplies `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
`app.config.ts` maps either those or `EXPO_PUBLIC_*` names into the bundle.
The same seeded dev accounts used by the web e2e suite
([seed-dev](seed-dev.md)) sign in on mobile.

## Architecture rules

- **Reads**: direct Supabase queries on-device under RLS — the same policies
  as the web's per-user server clients. Never use a service key in mobile.
- **Writes with business rules**: do not reimplement `/lib` logic on-device.
  When a mutation flow reaches mobile, expose the existing `/lib` function
  through a thin bearer-auth route handler in `app/src/app/api/` (parse →
  auth → call lib → respond) and call that.
- **Types**: `mobile/src/db/types.ts` type-imports the web's generated
  `database.types.ts`. One schema, one `pnpm db:types`.
- **Tokens**: `mobile/src/theme/tokens.ts` transcribes `globals.css` `:root`
  values under the same role names. A `globals.css` token change updates it
  in the same PR (mid-migration per ADR 0012/0013 — build against names).
- **Window classes**: `useWindowClass()` (compact / medium / expanded from
  `parity/window-classes.json`) decides tab bar vs. navigation rail. New
  screens use the `Screen` scaffold so iPad widths get a bounded column.
- **Copy**: same voice rules as web ([voice-guidelines](../product/voice-guidelines.md),
  ADR 0011 vocabulary — no "mentor/mentorship" in UI copy).

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
- `mobile-e2e.yml` — Maestro on an Android emulator against the seeded dev
  database. Opt-in via the `run-mobile-e2e` PR label (or manual dispatch)
  until the pipeline is proven; then drop the label gate to match `e2e.yml`.

## Not built yet (tracked as baseline gaps, not TODOs in prose)

Run `node parity/check-parity.mjs` and read `parity/parity-baseline.txt` —
that list *is* the mobile backlog, feature by feature. Highlights: Google
OAuth + invite join on native, asks, inbox/DMs (realtime), profile edit,
push notifications, admin surfaces, iPad `layout:expanded` Maestro coverage.
