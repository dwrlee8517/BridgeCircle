---
name: toss-base-design
description: Use this skill to generate interfaces and assets in the faithful Toss Design System (TDS) — the pristine, brand-neutral Layer 0 baseline (ADR 0013). Contains the complete TDS tokens (8 hue families, real type scale, 8px spacing, radius tiers) and blue-only starter components. For BridgeCircle-branded work, use the `bridgecircle` fork instead.
user-invocable: true
---

Read `uploads/DESIGN.md` and `colors_and_type.css` in this project, then
explore `preview/` and `ui_kits/app/`.

This is **faithful Toss** — a complete, unbent transcription of TDS from the
official `@toss/tds-react-native` docs. It is **brand-neutral**: use it for a
pure Toss look, a reusable reference, or as the foundation the BridgeCircle
brand system forks from. **Do not add brand tokens here** (no green give
action, no bands, no ochre, no CircleMark) — those live in the `bridgecircle`
fork (ADR 0013, Layer 1).

If creating visual artifacts (mocks, slides, prototypes), copy the token CSS in
and build static HTML. If working on production code, translate to the role
tokens — never copy inline styles.

---

## Quick reference

**System:** toss-base — faithful TDS. Layer 0 of ADR 0013.

**Font:** Pretendard (open substitute for proprietary Toss Product Sans; OFL).
Compact scale: Display Hero 30/700 → Label 10/500. Headings 600–700, slight
negative tracking. 10px floor.

**Color — 8 families, 500 anchors:**
- `#3182f6` blue-500 — **the one action color** (hover 600 `#2272eb`, weak tint blue-50 `#e8f3ff`)
- `#0064ff` brand blue — logo/marketing only, **never** a button fill
- `#8b95a1` grey-500 · spine ranges `#f9fafb` (50) → `#191f28` (900)
- `#f04452` red-500 — error · `#fe9800` orange-500 — warning · `#ffc342` yellow-500 — caution
- `#03b26c` green-500 — success · `#18a5a5` teal-500 — info · `#a234c7` purple-500 — premium
- greyOpacity scrims `rgb(2 9 19 / 0.02→0.91)` for backdrops

**Hard rules:**
- **One action color — blue, always.** Status/semantic hues never fill an action button.
- Text/fill pair from the **same ramp** (light: 50 tint fill + 600–800 text).
- Surfaces: white cards on grey-100, borders sparingly (`--border` grey-200).
- Radius tiers: compact 4 / standard 8 / comfortable 12 / large 16 / pill 9999.
- Spacing: 8px base grid; 20px standard page padding.

**Known gaps:** dark theme is provisional (derived, not real TDS dark);
Pretendard substitutes for Toss Product Sans; fintech components (Keypad,
Asset, Amount Top, Agreement, Chart) deliberately omitted.

**Key files:**
- `uploads/DESIGN.md` — full spec (principles, ramps, roles, type, contrast, the ~40-component table, gaps)
- `colors_and_type.css` — the token export (light + provisional dark)
- `preview/` — @dsCard specimens: ramps · type · spacing-radius · components · forms · overlays · navigation · lists · feedback · inputs-extended · results · content
- `ui_kits/app/index.html` — starter prototype
