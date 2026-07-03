# Field Pro — BridgeCircle design system (TDS baseline)

**Status:** seed v0.1 · PROVISIONAL UNTIL A5 (ADR 0012) · 2026-07-03
**Canonical home:** the `fieldpro-design-system` Claude Design project; this
repo folder mirrors it via DesignSync.
**Token export:** [`../colors_and_type.css`](../colors_and_type.css)

Field Pro is BridgeCircle's visual system, built on the Toss Design System
(TDS) idiom and extended with BridgeCircle's brand mechanics. It replaces
Civic Editorial (retired to `_archive/`, ADR 0012). Everything here is the
*design* contract; production translates it into `app/src/app/globals.css`
and the owned component primitives — never a mechanical copy.

> **A5 warning:** every value in this seed comes from the approved Toss
> exploration + public TDS values. The A5 reconciliation audit replaces them
> with exact values extracted from "Toss Style – Field Pro v2" before any
> production translation. Treat structure as stable, values as provisional.

---

## 1 · Principles

1. **Calm surfaces, loud hierarchy.** Borderless white cards on a grey-100
   canvas; separation comes from background contrast and spacing, not rules.
   Headlines are heavy (700–800) and dark; everything else stays quiet.
2. **One action color (D3).** Every commitment — send, accept, connect, RSVP
   — is Toss blue. *Who is committing* lives in the words and badges, never
   in a button hue. If two blue-filled buttons compete on one surface, the
   product decision is unresolved.
3. **Identity is ambient, never operative (D7).** Sections may carry a hue —
   School's deep-blue band, give-help's green — in bands, tints, dots, and
   badges. The moment a hue lands on a button, it's wrong.
4. **The buffer is copy.** Quiet passes, dignity on declines, two-sided
   reassurance — the brand mechanism survives in language. The visual system
   must never make a decline loud or a pass visible.
5. **Warmth via type and speech, not ornament.** Pretendard at generous
   sizes, sentence case, the coordinator voice. No mascots, no confetti.

## 2 · Color

### Ramps

Five hues, ten stops each (50→900): **grey** (the spine), **blue** (the only
action hue), **green**, **orange**, **red**. Exact values in
`colors_and_type.css`. Teal/violet are **not defined yet** — pending A5; do
not invent stops.

### Pairing rule

Text and fill come from the **same ramp**: light mode pairs 50-tint fills
with 600–800 text; dark mode pairs 800-level fills with 100–200 text. Never
plain black/white on a colored tint.

### Roles

| Role | Light | Use |
|---|---|---|
| `surface-page` | grey-100 | app canvas |
| `surface-card` | white | cards, sheets, popovers (borderless + shadow-card) |
| `surface-panel` | grey-50 | quiet groupings inside cards |
| `text-primary / secondary / muted` | grey-900 / 600 / 500 | hierarchy |
| `action-primary` | blue-500 (hover 700) | every filled commitment |
| `action-weak` | blue-50 + blue-600 text | secondary positive |
| `action-quiet` | grey-100 + grey-700 text | passes, tone lenses, tertiary |
| `state-info / success / warning / danger` | blue / green / orange / red tint+text pairs | badges, banners, dots |

### Section identity + gradation (D7)

| Section | Identity | Treatment |
|---|---|---|
| Ask (default) | blue | standard surfaces |
| Give help | green | green tints/dots/badges; `--gradient-band-green` allowed on its hero band |
| School | deep blue | `--gradient-band-blue` (blue-600 → blue-800) hero band, white text |

Gradients are **same-hue only**, **band surfaces only** (hero/section
headers). Multi-hue or neon gradation stays banned. Buttons inside a band
are still `action-primary` blue (on the green band, use white-fill buttons
with band-hue text if blue clashes — decide per surface at A5).

### Derived palettes (re-derive from ramps, never freelance)

- **Avatar identity pairs** (6): tint fill + 700-stop text from blue, green,
  orange, red, grey ramps + one solid grey-800; contrast-verified.
- **Give-help subject rotation:** green-led — green-500, blue-500, grey-600.
- **School event accents:** assigned from ramp 500 stops.
- **Charts (admin):** blue-500, green-500, orange-500, grey-400 in that
  order; tints for fills, 600s for lines.

### Contrast (provisional measurements — re-measure at A5 and in Phase B)

| Pair | Ratio | Verdict |
|---|---:|---|
| grey-900 on white | 16.7:1 | body ✓ |
| grey-600 on white | 5.5:1 | secondary ✓ |
| grey-500 on grey-100 | 3.9:1 | metadata only (≥12px, non-essential) |
| white on blue-500 | 3.7:1 | buttons ✓ (≥14px semibold UI text) |
| white on blue-800 (band) | 8.6:1 | band text ✓ |
| white on green-600 | 3.1:1 | large text only — prefer green-700 fills for text-bearing greens |
| blue-600 on blue-50 | 4.9:1 | weak buttons ✓ |
| green-700 on green-50 | 5.6:1 | success text ✓ |

## 3 · Typography

**One family: Pretendard** (Variable; OFL; Latin + full Hangul — the Songdo
pilot renders natively). Production self-hosts via `next/font/local` (D4);
previews may use the jsDelivr dynamic-subset CSS.

| Level | Size | Weight | Tracking |
|---|---:|---:|---|
| display | 40px | 800 | -0.025em |
| h1 | 28px | 800 | -0.02em |
| h2 | 22px | 700 | -0.015em |
| h3 | 18px | 700 | -0.01em |
| body-lg / body | 17 / 16px | 400 | -0.01em |
| body-sm | 14px | 400/500 | 0 |
| caption | 13px | 500 | 0 |
| micro | 12px | 500–700 | +0.02em when uppercase |

Rules: sentence case everywhere; digits use `font-variant-numeric:
tabular-nums` for class years, dates, and counts (JetBrains Mono retires);
12px is the floor; italics only for member-written quotes (quotes stay
sacred — system text never wears them).

## 4 · Shape & elevation

- Radius tiers: **card 20 / box 14 / control 12 / bubble 18 / pill 999**.
  Full circles only for avatars, dots, and pills.
- One soft shadow (`--shadow-card`) on white cards; `--shadow-raised` for
  overlays. No hover-lift theatrics; hover is a background shift.
- Hairline borders are the exception (tables, input outlines), not the
  default.

## 5 · Components (starter kit — `../ui_kits/app/`)

| Component | Spec |
|---|---|
| Button | fill (blue-500/white, radius-control, weight 600) · weak (blue-50/blue-600) · quiet (grey-100/grey-700). One fill per surface. |
| Badge / status pill | tint + same-ramp text, radius-pill, 12–13px weight 600–700 |
| Card | white, radius-card, shadow-card, padding 20–24, **no border** |
| Segmented toggle | pill container grey-100/white; active segment blue-500 fill |
| Message bubble | me: blue-500 fill + white text; them: grey-100 + grey-900; radius-bubble with 6px anchor corner |
| Inbox row | avatar → name (weight 600) + class year (tabular-nums, grey-400) + CircleMark → preview grey-500 → time grey-400; hairline row separators inside the card |
| CircleMark | brand: two overlapping circles, `currentColor` (blue-500 on light); only for connected members |

## 6 · Voice & motion

Voice: unchanged — [voice-guidelines.md](../../../../../product/voice-guidelines.md)
governs every string (coordinator narrator, embarrassed-asker default,
decline dignity). Motion: carried from Civic (150ms ease-out controls, 200ms
emphasized overlays, reduced-motion respected) — behavior-neutral through
the reskin.

## 7 · What production must NOT copy

- Inline styles from prototypes — translate to role tokens.
- Preview font loading (CDN) — production self-hosts.
- Any teal/violet improvisation before A5.
- Colored buttons. Ever. (D3.)
