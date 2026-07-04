# toss-base — the faithful Toss Design System (TDS)

**Status:** Layer 0 · faithful · 2026-07-04 (ADR 0013)
**Canonical home:** the `toss-base` Claude Design project; this repo folder
mirrors it via DesignSync.
**Token export:** [`../colors_and_type.css`](../colors_and_type.css)

`toss-base` is a **complete, unbent transcription of TDS** from the official
[`@toss/tds-react-native`](https://tossmini-docs.toss.im/tds-react-native/foundation/colors/)
foundation docs. It is the **pristine foundation** BridgeCircle forks into the
`bridgecircle` brand system (Layer 1) — nothing here is brand-specific.

> **Do not add brand tokens to this layer.** No green "give" action, no
> section-identity bands, no ochre warning, no CircleMark. Those belong in the
> `bridgecircle` fork. Keep `toss-base` faithful so it stays a legible Toss
> reference and a reusable asset. See ADR 0013 for the two-layer architecture.

---

## 1 · Principles (the Toss idiom)

1. **Calm surfaces, one loud action.** Near-borderless white cards on a
   grey-100 canvas; separation comes from background contrast and space, not
   rules. Type is mostly quiet; the single blue CTA carries the emphasis.
2. **One action color — blue, always.** Every primary commitment is Toss blue
   `#3182f6`. Identity and status hues never fill an action button. A colored
   button that isn't blue is wrong at this layer.
3. **Restraint in shape and type.** Tight radii (nothing rounder than 16 but
   pills), a compact type scale that tops out at 30/700, an 8px spacing grid.
4. **Semantic color stays ambient.** The warm and cool hues appear as tints,
   dots, badges, and icons — carrying meaning, not driving action.

## 2 · Color

### Ramps — 8 families × 10 stops

| Family | Role | 500 anchor |
|---|---|---|
| grey | neutral spine — surfaces, text, hairlines | `#8b95a1` |
| blue | **interactive** — the one action color | `#3182f6` |
| red | error / danger | `#f04452` |
| orange | warning | `#fe9800` |
| yellow | caution | `#ffc342` |
| green | success | `#03b26c` |
| teal | info | `#18a5a5` |
| purple | premium | `#a234c7` |

Exact stops (50→900) are in [`colors_and_type.css`](../colors_and_type.css).
Also transcribed: the **greyOpacity** scrim scale (`rgb(2 9 19 / …)`, 0.02 →
0.91) for backdrops and dividers-on-photos, and the **brand blue `#0064ff`** —
a *separate* token from interactive `#3182f6` (brand blue is the logo/marketing
blue; the UI never uses it as a button fill).

### Pairing rule

Text and fill come from the **same ramp**: light mode pairs 50-tint fills with
600–800 text; dark mode pairs deep fills with 100–200 text. Never plain
black/white on a colored tint.

### Roles

| Role | Light | Use |
|---|---|---|
| `surface-page` | grey-100 | grouped app canvas (white cards float on it) |
| `surface-base` | white | full-bleed screens (TDS `background`) |
| `surface-card` | white | cards, sheets, popovers |
| `text-primary / secondary / muted / faint` | grey-900 / 700 / 600 / 500 | hierarchy |
| `action-primary` | blue-500 (hover 600, pressed 700) | the one lead action |
| `action-weak` | blue-50 + blue-600 text | secondary positive |
| `action-quiet` | grey-100 + grey-700 text | tertiary / neutral |
| `state-info / success / warning / caution / danger / premium` | teal / green / orange / yellow / red / purple tint+text | badges, banners, dots |
| `border` | grey-200 `#e5e8eb` | hairline (used sparingly) |

## 3 · Typography

**One family: Pretendard** (the open substitute for the proprietary **Toss
Product Sans**; OFL). Mono: SF Mono. The scale is compact and restrained:

| Role | Size | Weight | Line-height |
|---|--:|--:|--:|
| Display Hero | 30 | 700 | 40 |
| Display Large | 26 | 700 | 36 |
| Heading Large | 22 | 700 | 30 |
| Heading | 20 | 600 | 28 |
| Subtitle | 16 | 600 | 24 |
| Body Large | 16 | 400 | 24 |
| Body | 14 | 400 | 22 |
| Body Small | 13 | 400 | 20 |
| Caption | 12 | 400 | 18 |
| Label | 10 | 500 | 1.5 |

Headings carry slight negative tracking (`-0.02em`). 10px is the floor.

## 4 · Shape, spacing & elevation

- **Radius:** compact 4 · standard 8 · comfortable 12 · large 16 · pill 9999.
  Full circles for avatars, dots, and pills only.
- **Spacing:** 8px base grid — 4 · 8 · 12 · 16 · **20 (page padding)** · 24 ·
  32 · 40 · 48.
- **Elevation:** soft, low shadows (`--shadow-card`); most separation is
  contrast, not shadow. `--shadow-raised` for overlays/sheets. No hover-lift.

## 5 · Components (starter kit — [`../ui_kits/app/`](../ui_kits/app/))

| Component | Spec |
|---|---|
| Button | primary (blue-500/white, radius-comfortable, weight 600) · weak (blue-50/blue-600) · quiet (grey-100/grey-700) · bottom-CTA (full-width, radius-large). **One blue lead action.** |
| Badge / status pill | tint + same-ramp text, radius-pill, 12px weight 600 |
| Card | white, radius-large, `shadow-card`, padding 20–24 |
| Segmented control | grey-100 track, white active segment with soft shadow |
| Text field | grey-50 fill, grey-200 border, radius-comfortable; focus = blue ring |
| Message bubble | me: blue-500 fill + white; them: grey-100 + grey-900; radius-large with a 5px anchor corner |
| List row | avatar → title (weight 600) + subtitle (grey-500) → trailing value/chevron |

## 6 · Contrast (WCAG, light theme)

| Pair | Ratio | Verdict |
|---|--:|---|
| grey-900 on white | 16.7:1 | body ✓ |
| grey-700 on white | 8.9:1 | secondary ✓ |
| grey-600 on white | 5.9:1 | muted ✓ |
| grey-500 on grey-100 | 3.4:1 | metadata only (≥12px, non-essential) |
| white on blue-500 `#3182f6` | 3.7:1 | buttons ✓ (≥14px semibold UI text / large text) |
| white on blue-600 `#2272eb` | 4.9:1 | small text on blue ✓ |
| teal-700 on teal-50 | ~5.2:1 | info text ✓ |
| green-600 on green-50 | ~4.0:1 | success text ✓ (≥14px) |
| orange-700 on orange-50 | ~4.9:1 | warning text ✓ |
| yellow-800 on yellow-50 | ~5.0:1 | caution text ✓ (yellow needs a dark pair) |
| red-600 on red-50 | ~5.3:1 | danger text ✓ |

## 7 · Known gaps (reconcile before production use)

- **Dark theme is provisional.** The fetched TDS docs did not include dark-mode
  token values; the `.dark` block in `colors_and_type.css` is *derived* (grey
  flip + tint reduction), not the real TDS dark theme. Reconcile when we obtain
  the TDS dark tokens.
- **Typeface is a substitute.** Toss Product Sans is proprietary; Pretendard
  stands in. Metrics are close but not identical.
- **Component set is a starter, not exhaustive.** TDS ships many more
  primitives (dialog, bottom sheet, tabs, tooltip, snackbar, spinner, progress,
  checkbox/radio/switch, select). Add them here as faithful specimens as needed.

## 8 · What NOT to add here

Anything brand-specific. The moment you reach for a green button, a gradient
band, an ochre warning, or a CircleMark, that work belongs in the `bridgecircle`
fork (Layer 1) with an `OVERRIDES.md` ledger entry — not in `toss-base`.
