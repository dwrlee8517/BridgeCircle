---
type: debt
area: mobile
severity: medium
found_during: rebasing the last two stale PRs onto main
date: 2026-08-17
---

# The mobile member screens live only in closed PR #156

## What I saw

`mobile/` on main is the boots-only Expo shell from
[ADR 0016](../../docs/decisions/0016-native-mobile-via-expo.md) — 17 files, one
screen (`mobile/src/app/index.tsx`), no Supabase, no auth, by design.

Closed PR #156 (`claude/expo-ios-android-parity-7a9952`, last touched
2026-07-23) contains 27 files that exist nowhere else:

- `mobile/src/app/sign-in.tsx` and the `(member)` tab group —
  `index`, `help`, `messages`, `people`, `school`, plus `_layout.tsx`
- `mobile/src/components/` — `member-shell.tsx`, `screen.tsx`, `ui.tsx`
- `mobile/src/lib/` — `session.tsx`, `supabase.ts`, `member-context.ts`,
  `window-class.ts` + its test, `use-window-class.ts`
- `mobile/src/theme/tokens.ts`
- `mobile/e2e/flows/` — Maestro flows `sign-in.yaml`, `member-shell.yaml`
- `mobile/app.config.ts`, `biome.json`, `eslint.config.js`, `vitest.config.ts`

It was closed as superseded rather than merged: main independently landed its
own `mobile/` shell and `parity/` ratchet on 2026-08-08, two weeks after that
branch stopped moving, so a rebase produced `add/add` conflicts on all 19
shared files and would have regressed `parity/features.json` from main's
`schemaVersion: 2` (31 features, four-state `shipped`/`planned`/`gated`/
`wont-do` model) back to the flat `platforms: []` form.

## Why it might matter

The parity manifest on main declares all 31 mobile features `gated` (23) or
`wont-do` (8) — nothing is claimed as built, so nothing here is *lying*. The
cost is that a working sign-in + tab shell, a Supabase session layer, and two
Maestro flows already exist in a form nobody will find, and the next person to
start native work will write them again without knowing.

Branch `claude/expo-ios-android-parity-7a9952` is the only copy. It is not
deleted, but nothing links to it from the vault or the ADR, and a closed PR is
not somewhere anyone looks.

## Not doing it now because

Porting is real work, not conflict resolution. Those screens were written
2026-07-23 against the pre-database-v2 data layer — the branch carries its own
`mobile/src/db/types.ts` — and main has since completed both the database v2
cutover and the GraphQL v2 data plane. The data-fetching half needs rewriting
regardless; only the presentation layer and the Maestro flows port cleanly.

Flipping features from `gated` to `shipped` is also an ADR 0016 decision, not a
side effect of landing code.

## Possible fix

When native work restarts, port a slice at a time onto main's shell — sign-in
plus the member tab shell first — reading the closed branch for the
presentation layer and rewriting data access against the v2 repositories. Keep
main's `parity/features.json` schema and move each feature `gated` → `shipped`
as its Maestro coverage lands. If that never happens, delete this entry and say
in the commit that native is not being pursued, so the branch stops being an
implied obligation.

Related: [[2026-08-14-cd-self-jams-on-unactioned-promotion]] is the other entry
from this pipeline cleanup.
