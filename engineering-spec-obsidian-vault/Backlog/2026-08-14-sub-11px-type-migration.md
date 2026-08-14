---
type: debt
area: design-system
severity: medium
found_during: design-system org migration (PR #187) — carrying forward the 2026-08-13 drift audit
date: 2026-08-14
---

# ~26 call sites still use the `micro` / `fine` type sizes that O4 closed

## What I saw

The 2026-08-13 drift audit narrowed the O4 label floor from a never-enforced 12px to **11px**, with
a deliberately narrow legal tier: `overline` 11px and `chip` 11.5px for short uppercase eyebrows,
counters and compact chips only. `micro` 10px and `fine` 10.5px were **closed to new use and
scheduled for removal** — but roughly **26 call sites still use them** and have not been migrated.

Recorded in `uploads/OVERRIDES.md` (O4, amended 2026-08-13) and `docs/experience/ui/design-system/tokens.md`.

## Why it might matter

The floor is documented as 11px while the code still renders 10px in ~26 places, so the contract is
false wherever those sites live — the same class of drift the 08-13 audit existed to remove. It also
blocks actually deleting the two tokens: they can't be removed from `globals.css` until the call
sites are gone, and every day they remain is another chance for a new site to adopt them.

## Not doing it now because

PR #187 is documentation and design-bundle only; migrating ~26 component call sites is app work with
its own visual review.

## Possible fix

Enumerate the sites (`rg 'text-micro|text-fine' app/src`), decide per site whether the content is a
legitimate eyebrow/counter (→ `overline` / `chip`) or was just small (→ `caption` 12px), migrate,
then delete both tokens and let `pnpm check:font-size-tokens` hold the line. Worth pairing with the
`StatusBadge size="sm"` question — it renders 11px against a 12px default at 10 other sites.
