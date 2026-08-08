# BridgeCircle Mobile

Expo (SDK 57) + Expo Router native shell for BridgeCircle.

**Status: boots-only scaffold.** There is one screen and no product code — no Supabase,
no auth, no API calls, no design-system port. It exists so the native target is real in
CI and so the next slice has somewhere to land. See
[`../docs/decisions/0016-native-mobile-via-expo.md`](../docs/decisions/0016-native-mobile-via-expo.md)
for why this now exists at all, given ADR 0002 was web-first.

## Not a pnpm workspace member (yet)

`mobile/` installs independently, with its own lockfile. There is deliberately **no**
`pnpm-workspace.yaml` at the repo root: Railway's service root directory is `app/`, and
CI runs with `working-directory: app` and `cache-dependency-path: app/pnpm-lock.yaml`.
A root workspace file would make pnpm walk up from `app/`, switch to a root lockfile,
and break both. Real workspace wiring — plus shared `packages/` — comes with the
`apps/web` + `apps/mobile` restructure tracked in
[`../product-spec-obsidian-vault/Prototype/phase-1/post-launch-backlog.md`](../product-spec-obsidian-vault/Prototype/phase-1/post-launch-backlog.md).

`.npmrc` sets `node-linker=hoisted`, which is the layout Expo supports under pnpm.

## Commands

From `mobile/`:

```bash
pnpm install
```

```bash
pnpm start
```

```bash
pnpm typecheck
```

```bash
pnpm export
```

`pnpm ios` / `pnpm android` need a local simulator toolchain. This Mac has no full Xcode
install, so the practical local loop is `pnpm web` (or `pnpm start` + Expo Go on a
device); `typecheck` and `export` are what CI enforces.

## Conventions that carry over

- Routes live in `src/app/` (Expo Router file-based routing, typed routes enabled).
- The `/lib` discipline from [`../app/CLAUDE.md`](../app/CLAUDE.md) is the reason a native
  client is tractable at all: business logic is framework-agnostic and dependency-injected.
  When mobile starts consuming real logic, extract it into a shared package rather than
  importing across app boundaries or forking it here.
- User-facing copy follows [`../docs/product/voice-guidelines.md`](../docs/product/voice-guidelines.md).
- App icons and the splash image are still the Expo template placeholders. Replace them
  before any build goes to a device that isn't yours.
