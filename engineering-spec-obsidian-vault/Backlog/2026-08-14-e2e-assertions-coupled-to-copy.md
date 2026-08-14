---
type: debt
area: ci
severity: medium
found_during: design-system org migration (PR #187) — auditing E2E health
date: 2026-08-14
---

# E2E assertions key on product copy, so voice revisions break the suite

## What I saw

The locator strategy is otherwise good — `getByRole` 260 uses vs `getByText` 41, and zero test-ids —
but the accessible *names* being matched are user-facing copy:

- `tests/e2e/home/home.spec.ts:58` — `getByRole('textbox', { name: 'What do you need help with?' })`
- `tests/e2e/messages/messages.spec.ts:190` — `getByRole('dialog', { name: 'Mark this ask resolved?' })`
- `tests/e2e/messages/messages.spec.ts:159` — `getByText('Start with who bears completion risk')`
- `tests/e2e/messages/messages.spec.ts:113` — a full sentence of seeded message body

Two commits at `main` exist purely to chase this: `af2f5dc` (*follow the voice v1.2
profile-unavailable copy*) and `00e823e` (*wait for hydration before driving the RSVP control*).

## Why it might matter

`docs/product/voice-guidelines.md` is actively revised — v1.2 landed a brevity principle and a
shipped-copy sweep. Every such sweep now also breaks E2E, which turns a copy edit into a test-fixing
task and trains everyone to treat red E2E as "probably just copy again." With `retries: 1` in CI
(`app/playwright.config.ts:35`) the intermittent cases pass on the second attempt and are never seen
at all.

Worth being honest that this is a real tension, not a pure defect: asserting on copy is also how you
catch an accidental copy regression. The problem is that *every* assertion does it, so there's no
signal about which strings are load-bearing.

## Not doing it now because

Out of scope for a docs-and-bundle PR, and the right split depends on which strings the voice work
considers stable.

## Possible fix

Pick a small set of strings that are *deliberately* asserted (the socially risky moments the voice
guidelines care about most — decline copy, expiry copy) and let those keep exact-text assertions.
For everything else, key on stable roles/labels or add explicit `aria-label`s that copy sweeps don't
touch. Separately, surface Playwright's flaky count in the job summary so retried tests stop being
invisible.
