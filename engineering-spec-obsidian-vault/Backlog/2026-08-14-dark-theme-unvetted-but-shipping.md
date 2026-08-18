---
type: risk
area: design-system
severity: high
found_during: design-system org migration (PR #187) — bundle-vs-production token parity sweep
date: 2026-08-14
---

# Dark theme ships to members but was never design-reviewed or contrast-measured

## What I saw

`app/src/app/globals.css` (`.dark`, 134 tokens) · `app/src/app/layout.tsx:55` (next-themes
provider) · `app/src/app/(member)/settings/theme-picker.tsx` (member-facing picker)

Production has a complete dark theme and a switch that members can use. Richard confirmed
2026-08-14 that it was built as an **experiment**: never design-reviewed, contrast pairs never
measured.

Until 2026-08-14 the design system claimed the opposite — `colors_and_type.css` said dark was
"PARKED … v1 SHIPS LIGHT-ONLY" and "nothing in v1 should emit `.dark`" — while carrying a 39-token
derived guess that disagreed with what actually ships on 11 of the 12 tokens both defined. PR #187
replaced that with 108 declarations mirrored from production and verified value-for-value, so the
bundle is now *honest* about what dark renders. It is explicitly **not** a sign-off.

## Why it might matter

Members can switch to a theme nobody has checked for legibility. Pairs most likely to fail WCAG AA,
as a starting list:

- `--action-give-text` and `--action-give-weak-text`, both `#4dd49b`, on dark surfaces
- `--closing-soon-text` `#ffbd51` on `--closing-soon-tint`
- `--action-weak-text` `#8db9ff` on `rgb(100 168 255 / 0.12)`
- `--text-faint` `#79808c` on `--surface-base` `#16171d`
- every `state-*-text` / `state-*-tint` pair — these still inherit light-theme ramp stops

No `preview/*` specimen renders dark either, so the design gallery cannot catch a failure visually.

Exposure today is limited because production runs the pre-pilot `test-org` — worth re-confirming.
It becomes real the moment the Chadwick pilot has members.

## Not doing it now because

Two reasons, one of them a scheduling argument rather than a time argument. The redesign is actively
re-cutting the light surfaces these pairs sit on, so measuring now produces numbers that the
redesign invalidates. And the exposure question (gate vs. fix) is a product call, not a parity fix.

## Possible fix

Two steps, in this order:

1. **Before the pilot has real members: gate the picker.** Hide or feature-flag the dark option so
   the unvetted theme is unreachable. Small, reversible, and it converts an open-ended unknown into
   zero risk. Belongs on the pre-pilot launch checklist.
2. **After the redesign's light surfaces settle: do the real pass.** Measure every text/tint pair to
   AA, fix `globals.css`, then re-mirror into the bundle and add dark specimens to `preview/`.

Standing rule recorded in `SKILL.md` / `OVERRIDES.md` / `NOTES.md` meanwhile: design in light, read
`.dark` only as a record of current behavior, and **fix production then re-mirror** — hand-editing
the bundle's dark block is exactly how the 2026-07 drift started.
