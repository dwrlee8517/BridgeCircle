---
name: fieldpro-design
description: Use this skill to generate well-branded interfaces and assets for BridgeCircle's "Field Pro" design system (TDS/Toss baseline) — production surfaces or throwaway prototypes/mocks. Contains tokens, type, color ramps, section identities, and starter UI kit components.
user-invocable: true
---

Read `uploads/DESIGN.md` and `colors_and_type.css` in this project, then
explore `preview/` and `ui_kits/app/`.

If creating visual artifacts (mocks, slides, prototypes), copy the token CSS
in and build static HTML. If working on production code, translate to the
role tokens in `app/src/app/globals.css` — never copy inline styles.

**A6-reconciled (2026-07-04)** against the byte-complete "Toss Style – Field
Pro v2" reference. Colors are the real values; cleared for Phase B. A6 fixed
three A5 calls: the give side uses **green** buttons (not blue-only);
**violet is dropped** (reference had it for the retiring Mentor role); warning
tints are warm cream, hairline `#e6e9ee`, cards carry a faint inset ring.

---

## Quick reference

**System:** Field Pro — TDS (Toss) baseline + BridgeCircle brand mechanics.
Replaces Civic Editorial (ADR 0012).

**Font:** Pretendard only (OFL; **Latin-only subset — English-only, no
Hangul/CJK**; self-hosted via next/font/local). Headlines 700–800, tight
tracking. Digits: tabular-nums. 12px floor. Sentence case.

**Key colors (ramps 50–900 in colors_and_type.css):**
- `#3182f6` blue-500 — action on ask/connect/default surfaces (hover blue-700)
- `#e8f3ff` blue-50 — weak (tinted) secondary actions
- `#0b8a57` green-700 (`--action-give`) — **give-side lead action** fill (AA-safe)
- `#f2f4f6` grey-100 — page canvas; white cards float on it (faint ring)
- `#191f28` grey-900 — primary text
- `#03b26c` green-500 — give-help identity + success (band `#23c386 → #0b8a57`)
- `#2f73e6` — School band mid; band `#3f88f1 → #2f73e6 → #1f5bcc`
- `#c98a1a` ochre-500 — warning/attention (muted, NOT bright orange)
- `#f04452` red-500 — danger/decline tints
- No teal, no violet (reference's Mentor `#722fc8` intentionally dropped, A6)

**Hard rules:**
- **One action color per surface (D3, amended A6):** blue on ask/connect/
  default; green (`--action-give`) on the give surface's single lead action.
  Everywhere else, colored buttons are wrong. Other identity hues live in
  bands, tints, dots, badges (D7).
- Gradients: same-hue, band surfaces only (blue-600→800, green-500→700).
- Text/fill pair from the same ramp (light: 50 fill + 600–800 text).
- Cards: white, radius 20, one soft shadow + faint inset ring, no visible border.
- Radius tiers: card 20 / box 14 / control 12 / bubble 18 / pill 999.

**Brand marks:** two-overlapping-circles motif + CircleMark (recognition —
only on connected members' names) persist across skins; `currentColor`.

**Voice:** docs/product/voice-guidelines.md governs all strings — warm,
specific, calm; decline dignity; no emoji, no hype.

**Key files:**
- `uploads/DESIGN.md` — full spec (principles, ramps, roles, identities, contrast)
- `colors_and_type.css` — the token export (light + dark)
- `preview/` — @dsCard specimens (ramps, identity, type, components)
- `ui_kits/app/index.html` — starter prototype (hub toggle, inbox, bubbles, bands)
