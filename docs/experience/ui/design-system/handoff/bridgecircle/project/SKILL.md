---
name: bridgecircle-design
description: Use this skill to generate interfaces and assets for BridgeCircle's brand design system — the Layer-1 fork of the faithful Toss baseline (ADR 0013). Starts as pure Toss; diverges only through logged entries in uploads/OVERRIDES.md. For brand-neutral pure-Toss work, use the toss-base project instead.
user-invocable: true
---

Read `uploads/OVERRIDES.md` FIRST — it is the single source of truth for how
this fork differs from faithful Toss. Then `colors_and_type.css` and the
`preview/` specimens.

**The rule of this layer:** everything is Toss (`toss-base`) unless
`OVERRIDES.md` says otherwise. Only **applied** entries are real; **proposed**
entries are candidates awaiting a decision — do not design with them as if
they were law, but you may explore them when asked. If you need a divergence
that isn't in the ledger, propose a new entry; never just freelance it.

Currently applied: **O1 only** (Pretendard for Toss Product Sans). Everything
else — green give action, section bands, ochre warning, softer radii, larger
display type, pending-status hue, avatar palette, desktop system, CircleMark —
is **proposed**. Until applied, surfaces follow pure Toss: blue-only action,
30/700 type ceiling, 4/8/12/16 radii, bright-orange warning.

**Evidence trail:** `Help Hub.html` in this project is the 2026-07-04
faithful-baseline test (Ask/Give screens + friction log) that motivates most
proposed entries. Treat it as reference data.

**Voice:** `docs/product/voice-guidelines.md` governs all strings — warm,
specific, calm; decline dignity; no emoji, no hype.

**Key files:**
- `uploads/OVERRIDES.md` — the divergence ledger (read first)
- `uploads/DESIGN.md` — fork framing + pointer to the baseline spec
- `colors_and_type.css` — fork tokens (currently = toss-base + O1)
- `preview/` — specimens (diverge from toss-base only as entries apply)
- `Help Hub.html` — the baseline-test evidence
