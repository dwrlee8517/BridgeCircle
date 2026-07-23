# Feature parity — web ↔ mobile ↔ layouts

This directory is the machinery that keeps the Next.js app (`app/`) and the
Expo app (`mobile/`) at feature parity, and keeps window-size (breakpoint)
coverage honest on both. It exists so that shipping a new feature *forces*
the parity question instead of leaving it to memory.

## Pieces

| File | Role |
|---|---|
| `features.json` | The feature manifest — every user-facing feature, the routes it owns, the platforms it must exist on, the window-size layouts it must be tested at. |
| `check-parity.mjs` | The enforcer. Run `node parity/check-parity.mjs` (or `pnpm check:parity` from `app/` or `mobile/`). |
| `parity-baseline.txt` | Known, consciously-accepted gaps (the ratchet — same idea as `app/scripts/design-tokens-baseline.txt`). Gaps may only be removed over time; adding one is a code-review decision. |
| `window-classes.json` | The shared breakpoint contract: `compact` (<761), `medium` (761–1023), `expanded` (≥1024). Web `detail:`/`lg:` breakpoints, the Playwright viewport projects, and the mobile `useWindowClass()` hook all derive from it. |

## How coverage is counted

- **Web**: a Playwright spec in `app/tests/e2e/` tagged `@feature:<id>`.
  Layout coverage: untagged specs run in the desktop (expanded) project; a
  spec additionally tagged `@layout:compact` / `@layout:medium` runs in the
  matching viewport project (see `app/playwright.config.ts`).
- **Mobile**: a Maestro flow in `mobile/e2e/flows/` tagged `# feature:<id>`.
  Phone runners count as `compact`; a flow tagged `# layout:expanded` claims
  tablet (navigation-rail) coverage.
- **Routes**: every `page.tsx` under `app/src/app` must be claimed by exactly
  one feature. A new page without a manifest entry fails the check outright —
  this is the hook that makes the mechanism impossible to forget.

## The loop for a new feature

1. Build the web feature. The new route fails `check:parity` until you add a
   `features.json` entry declaring platforms + layouts.
2. Write the web e2e spec tagged `@feature:<id>` (and `@layout:` variants for
   the breakpoints the manifest declares).
3. Write the Maestro flow tagged `# feature:<id>` and build the mobile
   feature until the flow passes.
4. If mobile genuinely ships later, record the gap with
   `node parity/check-parity.mjs --update` **in the PR that adds the
   feature** — the baseline diff is the visible, reviewable IOU, and the
   parity gap count on CI is the running debt total.

Closing a gap prints a "ratchet down" note — re-run with `--update` in that
PR so the baseline only ever shrinks by accident of progress, never grows in
silence.
