# Field Pro — BridgeCircle design system (TDS baseline)

**Status:** A5-reconciled · 2026-07-04 (ADR 0012) — cleared for Phase B
**Canonical home:** the `fieldpro-design-system` Claude Design project; this
repo folder mirrors it via DesignSync.
**Token export:** [`../colors_and_type.css`](../colors_and_type.css)

Field Pro is BridgeCircle's visual system, built on the Toss Design System
(TDS) idiom and extended with BridgeCircle's brand mechanics. It replaces
Civic Editorial (retired to `_archive/`, ADR 0012). Everything here is the
*design* contract; production translates it into `app/src/app/globals.css`
and the owned component primitives — never a mechanical copy.

> **A5 reconciled (2026-07-04).** Color values are now extracted from the
> byte-complete "Toss Style – Field Pro v2" reference. Key corrections vs the
> seed: green anchor `#00c471 → #03b26c`; warning hue bright-orange → muted
> **ochre `#c98a1a`**; School/give bands are exact 3-stops (below). Field Pro
> v2 uses **five hue families only — no teal, no violet**. A **dark surface
> band exists** (`--gradient-band-dark`), which amends ADR D5. Type/shape/
> motion stay at seed defaults (uncolored) pending a dedicated type pass.

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
action hue), **green** (give/success, anchor `#03b26c`), **ochre** (warning,
anchor `#c98a1a` — var names stay `--orange-*`), **red** (`#f04452`). Exact
values in `colors_and_type.css`. **No teal, no violet** — confirmed absent in
Field Pro v2 (A5); the current app's `accent-plum` usages fold into blue or
green in Phase C, they do not get a new ramp.

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

| Section | Identity | Band (exact, A5) |
|---|---|---|
| Ask (default) | blue `#3182f6` | none — standard grey/white surfaces |
| Give help | green `#03b26c` | `#23c386 → #15a368 → #0b8a57` (160°) |
| School | blue `#2f73e6` | `#3f88f1 → #2f73e6 → #1f5bcc` (162°) |
| Dark surface | grey-ink | `#2a3340 → #191f28` (157°) — footer/feature; amends D5 |

Gradients are **same-hue only**, **band surfaces only** (hero/section
headers). Multi-hue or neon gradation stays banned. Buttons inside a band
are still `action-primary` blue; on the green/blue bands, on-band buttons use
**white fill with band-hue text** (Field Pro v2 does this — e.g. white
button, `#0b8a57` text on the give band).

### Derived palettes (re-derive from ramps, never freelance)

- **Avatar identity pairs** (6): tint fill + 700-stop text from blue, green,
  orange, red, grey ramps + one solid grey-800; contrast-verified.
- **Give-help subject rotation:** green-led — green-500, blue-500, grey-600.
- **School event accents:** assigned from ramp 500 stops.
- **Charts (admin):** blue-500, green-500, orange-500, grey-400 in that
  order; tints for fills, 600s for lines.

### Contrast (A5-reconciled; re-confirm in Phase B against the live theme)

| Pair | Ratio | Verdict |
|---|---:|---|
| grey-900 on white | 16.7:1 | body ✓ |
| grey-600 on white | 5.5:1 | secondary ✓ |
| grey-500 on grey-100 | 3.9:1 | metadata only (≥12px, non-essential) |
| white on blue-500 `#3182f6` | 3.7:1 | buttons ✓ (≥14px semibold UI text) |
| white on School band mid `#2f73e6` | ~4.6:1 | band heads ✓ |
| white on School band deep `#1f5bcc` | ~6.6:1 | band body ✓ |
| white on give band deep `#0b8a57` | ~4.8:1 | band text ✓ |
| white on give anchor `#03b26c` | ~2.7:1 | **fill only** — no white text; text-bearing greens use `#0b8a57` |
| green-700 `#0b8a57` on green-50 | ~5.6:1 | success text ✓ |
| ochre-700 `#8a5c11` on orange-50 | ~6.1:1 | warning text ✓ |
| blue-600 `#2272eb` on blue-50 | ~4.9:1 | weak buttons ✓ |

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
