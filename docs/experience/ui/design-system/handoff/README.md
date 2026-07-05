# BridgeCircle UI/UX Handoff

This folder holds the versioned Claude Design handoff bundles that define the
intended BridgeCircle member-app UI/UX direction.

> **Direction (2026-07-04, ADR 0013):** [`bridgecircle/`](bridgecircle/) is the
> **main design system** — the target every new design and the full redesign
> build against. It forks [`toss-base/`](toss-base/) (faithful TDS, Layer 0)
> and diverges only via its
> [`OVERRIDES.md`](bridgecircle/project/uploads/OVERRIDES.md) ledger.
> **Civic Editorial** (the `bridgecircle-design-system/` bundle below — note
> the confusingly similar folder name; it is the *old* system) remains the
> reference for **live production behavior only** until the redesign lands,
> and is **archived to `_archive/` when the redesign is done** (ADR 0013
> Phase E close-out).

## Bundles

| Bundle | Layer | Status |
|---|---|---|
| [`bridgecircle/`](bridgecircle/) | 1 — brand fork | **MAIN design system** — design + redesign target |
| [`toss-base/`](toss-base/) | 0 — faithful TDS | pristine baseline; never carries brand material |
| [`fieldpro-design-system/`](fieldpro-design-system/) | — | superseded (ADR 0012); its reconciled values seeded the fork's ledger |
| [`bridgecircle-design-system/`](bridgecircle-design-system/) | — | **Civic Editorial (old)** — mirrors live production until the redesign lands; archive after |

## Source Of Truth

Use this order for UI/UX decisions:

1. [`bridgecircle/project/uploads/OVERRIDES.md`](bridgecircle/project/uploads/OVERRIDES.md) — the divergence ledger; what is *applied* is law, what is *proposed* is a candidate.
2. [`bridgecircle/project/`](bridgecircle/project/) — the main system: tokens, spec, specimens, designed screens.
3. [`toss-base/project/uploads/DESIGN.md`](toss-base/project/uploads/DESIGN.md) — the baseline spec; answers everything the fork doesn't override.
4. [`bridgecircle-design-system/project/`](bridgecircle-design-system/project/) — Civic Editorial; **current production reality only**, not target direction.

## Implementation Rule

The handoff defines the intended visual hierarchy, interaction model, screen
composition, and component behavior. The production app still defines current
runtime behavior, data contracts, auth, routing, and real Supabase-backed state.

Use the prototype for screen composition and interaction details. Use
`uploads/DESIGN.md` and `colors_and_type.css` for token values when inline
prototype styles or exploration files disagree with the token spec.

When implementing from the handoff:

- translate the prototype output into existing production primitives and
  tokens instead of copying inline styles mechanically
- preserve production-only improvements when they are compatible with the
  handoff, such as `Button variant="offer"` for give-help actions
- update local production docs when the handoff changes the intended UI/UX
- treat screenshots and `scraps/` as supporting evidence, not primary source

Known export mismatch: `ui_kits/app/README.md` mentions `PersonCard.jsx`, but
the actual file is `MemberCard.jsx`, which exports `BCPersonCard`.

For the initial comparison against the current production app, see
[`current-comparison-2026-06-02.md`](current-comparison-2026-06-02.md).
