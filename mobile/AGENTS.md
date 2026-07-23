# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. Notably, expo-router 57 no longer depends on `@react-navigation/*` — navigator types (e.g. `BottomTabBarProps`) come from `expo-router/js-tabs` and the vendored fork inside expo-router.

# BridgeCircle mobile

The Expo iOS/Android counterpart of [`../app/`](../app/). Governing decision: [`../docs/decisions/0016-expo-native-with-parity-ratchet.md`](../docs/decisions/0016-expo-native-with-parity-ratchet.md). Daily commands + the parity loop: [`../docs/runbooks/mobile-dev.md`](../docs/runbooks/mobile-dev.md).

Rules that are easy to get wrong:

- **Parity ratchet.** Every feature here maps to an id in [`../parity/features.json`](../parity/features.json); Maestro flows in `e2e/flows/` claim coverage via `# feature:<id>` comment tags. Run `pnpm check:parity` before declaring work done, and ratchet the baseline down (`node ../parity/check-parity.mjs --update`) in the PR that closes a gap.
- **Data access is RPC-first.** Call the same `api`-schema functions the web repositories use (`supabase.schema('api').rpc('list_people', …)` — see `app/src/db/repositories/*.ts` for the contracts). They run as the signed-in user (token session in `src/lib/supabase.ts`). Never reimplement their business rules on-device, never use a service key here.
- **Types** come from the web app's generated `database.types.ts` via the type-only bridge `src/db/types.ts`. Do not fork the types.
- **Design tokens** (`src/theme/tokens.ts`) transcribe `app/src/app/globals.css` `:root` under the same role names — change both in the same PR. No hardcoded hex in components.
- **Window classes** (`useWindowClass()` — compact/medium/expanded from [`../parity/window-classes.json`](../parity/window-classes.json)) drive the shell: bottom tab bar vs. navigation rail. New screens use the `Screen` scaffold so expanded widths get a bounded column, not full-bleed stretch.
- **Copy** follows [`../docs/product/voice-guidelines.md`](../docs/product/voice-guidelines.md) and the ADR 0011 vocabulary (asks and connects — never "mentor/mentorship" in UI copy).
- **Unit tests** (vitest) cover pure `.ts` logic only — nothing importing `react-native` (no RN runtime under vitest). UI behavior is Maestro's job.
- Package manager is **pnpm 10.33.2** with `node-linker=hoisted` (`.npmrc`) — do not use npm or yarn, do not remove the `.npmrc`.
