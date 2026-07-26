# BridgeCircle UI/UX Handoff

This folder holds the versioned Claude Design handoff bundles that define the
intended BridgeCircle member-app UI/UX direction.

> **Direction (ADR 0013, accepted):** [`bridgecircle/`](bridgecircle/) is the
> **main design system** — the target every new design and the full redesign
> build against. It forks [`toss-base/`](toss-base/) (faithful TDS, Layer 0)
> and diverges only via its
> [`OVERRIDES.md`](bridgecircle/project/uploads/OVERRIDES.md) ledger.
> Production theming already runs the fork.
>
> **Civic Editorial and Field Pro are gone from this tree** (archived
> 2026-07-25 to [`docs/_archive/design-2026-07/`](../../../../_archive/design-2026-07/)),
> along with the `fidelity-ledger.md` that sourced from them. There are only two
> bundles now, so the old "which `bridgecircle*` folder is this?" ambiguity is
> resolved.

## Bundles

| Bundle | Layer | Status |
|---|---|---|
| [`bridgecircle/`](bridgecircle/) | 1 — brand fork | **MAIN design system** — design + redesign target |
| [`toss-base/`](toss-base/) | 0 — faithful TDS | pristine baseline; never carries brand material |

## Source Of Truth

Use this order for UI/UX decisions:

1. [`bridgecircle/project/SKILL.md`](bridgecircle/project/SKILL.md) and [`bridgecircle/project/colors_and_type.css`](bridgecircle/project/colors_and_type.css) — current rules and tokens.
2. [`bridgecircle/project/templates/`](bridgecircle/project/templates/) and [`bridgecircle/project/uploads/FLOWS.md`](bridgecircle/project/uploads/FLOWS.md) — current surface and flow truth.
3. [`bridgecircle/project/uploads/OVERRIDES.md`](bridgecircle/project/uploads/OVERRIDES.md) — audit history for intentional divergence; not a second design source.
4. [`toss-base/project/uploads/DESIGN.md`](toss-base/project/uploads/DESIGN.md) — the faithful baseline for areas the fork has not changed.

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
- preserve production behavior through compatibility aliases where it does
  not conflict with the handoff; `Button variant="offer"` currently maps to
  the canonical `action-give*` roles
- update local production docs when the handoff changes the intended UI/UX
- treat screenshots and `scraps/` as supporting evidence, not primary source

Known export mismatch: `ui_kits/app/README.md` mentions `PersonCard.jsx`, but
the actual file is `MemberCard.jsx`, which exports `BCPersonCard`.

The June 2026 comparison against the then-current production app is archived at
[`docs/_archive/design-2026-07/current-comparison-2026-06-02.md`](../../../../_archive/design-2026-07/current-comparison-2026-06-02.md);
it compares against the retired Civic implementation, so treat it as history.
