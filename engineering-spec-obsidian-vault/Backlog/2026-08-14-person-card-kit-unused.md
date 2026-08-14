---
type: question
area: design-system
severity: low
found_during: design-system org migration (PR #187) — carrying forward the 2026-08-13 drift audit
date: 2026-08-14
---

# `person-card.tsx` has zero importers; People directory reimplements it inline

## What I saw

`app/src/components/**/person-card.tsx` — the kit component has **no importers at all**. The People
directory builds the same thing inline instead, reimplementing the match band and topic chips.

Flagged in `docs/experience/ui/design-system/components.md` during the 2026-08-13 audit as needing a
wire-up-or-delete decision; still undecided.

## Why it might matter

Two implementations of one visual pattern drift apart silently, and the documented one is the one
nobody renders — so `components.md` describes a card members never see. Either direction is fine;
the cost is leaving it ambiguous, because the next person to touch the directory has to guess which
is authoritative.

## Not doing it now because

Out of scope for a docs-and-bundle PR, and the answer depends on where the redesign lands for the
People surface.

## Possible fix

Decide during the People slice of the redesign: if the redesign's directory row matches the kit,
delete the inline version and import the kit; if the inline version is what the redesign wants,
delete `person-card.tsx` and update `components.md`.
