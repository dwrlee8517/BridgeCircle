@AGENTS.md

# BridgeCircle Mobile

Expo (SDK 57) + Expo Router native shell. Project framing lives in [`../AGENTS.md`](../AGENTS.md)
and [`../CLAUDE.md`](../CLAUDE.md); setup and commands are in [`README.md`](README.md).

## Scope discipline

This is a **boots-only scaffold** — one screen, no Supabase, no auth, no product code.
That is deliberate, not unfinished work you should helpfully complete.
[ADR 0016](../docs/decisions/0016-native-mobile-via-expo.md) authorized the scaffold and its
CI pipeline; it did **not** authorize feature parity, and the repeat-engagement gate in
[ADR 0002](../docs/decisions/0002-web-first-defer-native.md) still governs native features.
Adding auth, tabs, or product screens here needs explicit user approval first.

## Rules that bite here specifically

- **No root pnpm workspace.** `mobile/` installs on its own lockfile. Do not add a
  `pnpm-workspace.yaml` at the repo root — pnpm resolves its workspace root by walking up,
  so that breaks installs inside `app/`, the app-scoped CI jobs, and Railway (service root
  directory = `app/`). The restructure that fixes this properly is in the
  [post-launch backlog](../product-spec-obsidian-vault/Prototype/phase-1/post-launch-backlog.md).
- **Do not import across `app/` and `mobile/`.** There is no shared package yet. When
  mobile needs real business logic, extract it into `packages/` as part of the restructure
  rather than reaching into `../app/src/lib/` or copy-pasting it.
- **Do not commit `ios/` or `android/`.** Both are gitignored; this stays a managed
  (CNG) project. Anything needing a custom native module is a decision, not a detail.
- **`.npmrc` sets `node-linker=hoisted`.** Metro and React Native autolinking walk
  `node_modules` directly and break under pnpm's default symlinked layout. Leave it.

## Verification

There is no full Xcode on this Mac, so there is no local iOS simulator — `pnpm ios` will
not work. What CI enforces, and what you should run before declaring anything done:

```bash
pnpm typecheck && pnpm export
```

For a visual check, `pnpm web` (Expo web) or Expo Go on a physical device.
