# Field Pro — BridgeCircle design system (TDS baseline)

**Status:** A6-reconciled · 2026-07-04 (ADR 0012) — cleared for Phase B
**Canonical home:** the `fieldpro-design-system` Claude Design project; this
repo folder mirrors it via DesignSync.
**Token export:** [`../colors_and_type.css`](../colors_and_type.css)

Field Pro is BridgeCircle's visual system, built on the Toss Design System
(TDS) idiom and extended with BridgeCircle's brand mechanics. It replaces
Civic Editorial (retired to `_archive/`, ADR 0012). Everything here is the
*design* contract; production translates it into `app/src/app/globals.css`
and the owned component primitives — never a mechanical copy.

> **A5 reconciled (2026-07-04).** Color values are extracted from the
> byte-complete "Toss Style – Field Pro v2" reference. Key corrections vs the
> seed: green anchor `#00c471 → #03b26c`; warning hue bright-orange → muted
> **ochre `#c98a1a`**; School/give bands are exact 3-stops (below). A **dark
> surface band exists** (`--gradient-band-dark`), which amends ADR D5.
>
> **A6 reconciled (2026-07-04).** A full re-read of the reference corrected
> three A5 calls:
> 1. **The give side uses green buttons.** D3 is *not* blue-only in the real
>    file — the give surface's lead action ("Offer to help") is green-filled.
>    The rule is now **one action color per surface, tied to section
>    identity**: blue on ask/connect/default, green on give. (The mockup's
>    `#15c47e` fill + white text is ~2.3:1 → fails AA; production darkens the
>    *fill* to green-700 `#0b8a57` while keeping the green identity.)
> 2. **Violet `#722fc8` does appear** (Mentor role, 7×) — but per the two-verb
>    model (ADR 0011) it is **intentionally not carried over**. Still five
>    member-facing hue families.
> 3. Warning tints are warm cream (`#fef3e2`), the default hairline is
>    `#e6e9ee`, and cards carry a **faint inset ring** (not truly borderless).
> Type/shape/motion stay at seed defaults (uncolored) pending a type pass.

---

## 1 · Principles

1. **Calm surfaces, loud hierarchy.** Near-borderless white cards on a
   grey-100 canvas; separation comes from background contrast, spacing, and a
   whisper-faint inset ring (`--ring-card`), not visible rules. Headlines are
   heavy (700–800) and dark; everything else stays quiet.
2. **One action color per surface, tied to section identity (D3, amended
   A6).** Every surface has exactly *one* lead commitment color. On
   ask/connect/default surfaces it's Toss blue; on the give surface it's
   green (`--action-give`) — giving is meant to feel different from asking.
   *Who is committing* still lives in words and badges too, but the give
   side's lead action legitimately carries the green identity. If **two**
   filled lead buttons compete on one surface, the product decision is
   unresolved.
3. **Identity is ambient — and, on its own surface, operative once (D7 + A6).**
   Sections carry a hue — School's deep-blue band, give-help's green — in
   bands, tints, dots, and badges. That hue may also fill the *single* lead
   action on its own surface (give = green button). Anywhere else, a colored
   button is wrong.
4. **The buffer is copy.** Quiet passes, dignity on declines, two-sided
   reassurance — the brand mechanism survives in language. The visual system
   must never make a decline loud or a pass visible.
5. **Warmth via type and speech, not ornament.** Pretendard at generous
   sizes, sentence case, the coordinator voice. No mascots, no confetti.

## 2 · Color

### Ramps

Five hues, ten stops each (50→900): **grey** (the spine), **blue** (ask /
connect / default action), **green** (give action + success, anchor
`#03b26c`), **ochre** (warning, anchor `#c98a1a` — var names stay
`--orange-*`), **red** (`#f04452`). Exact values in `colors_and_type.css`.

**Violet is a deliberate omission.** Field Pro v2 uses `#722fc8` (7×) for the
**Mentor** role badge/avatar, but ADR 0011's two-verb model retires
mentorship as a distinct type — so violet is **not** carried into the token
layer (A6). Any Mentor-role coloring folds to grey or blue in Phase C, as
does the current app's `accent-plum`. No teal.

### Pairing rule

Text and fill come from the **same ramp**: light mode pairs 50-tint fills
with 600–800 text; dark mode pairs 800-level fills with 100–200 text. Never
plain black/white on a colored tint.

### Roles

| Role | Light | Use |
|---|---|---|
| `surface-page` | grey-100 | app canvas |
| `surface-card` | white | cards, sheets, popovers (`ring-card` + shadow-card) |
| `surface-panel` | grey-50 | quiet groupings inside cards |
| `text-primary / secondary / muted` | grey-900 / 600 / 500 | hierarchy |
| `action-primary` | blue-500 (hover 700) | lead commitment on ask / connect / default surfaces |
| `action-give` | green-700 `#0b8a57` (hover 800) | lead commitment on the **give** surface ("Offer to help") |
| `action-give-weak` | `#e7f8f0` + green-500 text | give's secondary / low-match offer |
| `action-weak` | blue-50 + blue-600 text | secondary positive (blue surfaces) |
| `action-quiet` | grey-100 + grey-700 text | passes, tone lenses, tertiary |
| `state-info / success / warning / danger` | blue / green / orange / red tint+text pairs | badges, banners, dots |
| `border` / `border-subtle` | grey-200 `#e6e9ee` / `#edf0f2` | default hairline / lighter divider |

### Section identity + gradation (D7)

| Section | Identity | Band (exact, A5) |
|---|---|---|
| Ask (default) | blue `#3182f6` | none — standard grey/white surfaces |
| Give help | green `#03b26c` | `#23c386 → #15a368 → #0b8a57` (160°) |
| School | blue `#2f73e6` | `#3f88f1 → #2f73e6 → #1f5bcc` (162°) |
| Dark surface | grey-ink | `#2a3340 → #191f28` (157°) — footer/feature; amends D5 |

Gradients are **same-hue only**, **band surfaces only** (hero/section
headers). Multi-hue or neon gradation stays banned.

Two button rules interact with identity (A6):
- **On a color band** (the hero itself), buttons use **white fill with
  band-hue text** — e.g. the give toggle is a white pill with `#0b8a57`
  text on the green band.
- **In the give surface's content** (the list below the band), the lead
  action is **green-filled** (`--action-give`) — this is the one place a
  section hue legitimately fills a button. Everywhere else, filled
  buttons are `action-primary` blue.

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
| white on mockup give fill `#15c47e` | ~2.3:1 | ✗ **fails** — the reference uses this for "Offer to help"; production must not |
| white on give button `#0b8a57` (`--action-give`) | ~4.8:1 | give lead action ✓ (production fill) |
| green-700 `#0b8a57` on green-50 | ~5.6:1 | success text ✓ |
| ochre-700 `#8a5c11` on orange-50 | ~6.1:1 | warning text ✓ |
| blue-600 `#2272eb` on blue-50 | ~4.9:1 | weak buttons ✓ |

## 3 · Typography

**One family: Pretendard** (Variable; OFL). Production self-hosts a
**Latin-only subset** via `next/font/local` (D4) — **English-only, no
Hangul/CJK** (2026-07-04 decision); ~100 KB variable woff2, weight axis
45–930. Previews may use the jsDelivr CDN build.

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
- Cards compose a **faint inset ring** (`--ring-card`, ~5% ink) with one
  soft shadow (`--shadow-card`): `box-shadow: var(--ring-card),
  var(--shadow-card)`. The ring gives near-borderless cards a crisp edge on
  the grey canvas without a visible rule. `--shadow-raised` for overlays. No
  hover-lift theatrics; hover is a background shift.
- Hairline borders (`--border` / lighter `--border-subtle`) are for tables,
  input outlines, and row splits — not the default separator.

## 5 · Components (starter kit — `../ui_kits/app/`)

| Component | Spec |
|---|---|
| Button | fill (blue-500/white, radius-control, weight 600) · **give-fill** (green-700 `#0b8a57`/white, give surface only) · weak (blue-50/blue-600) · give-weak (`#e7f8f0`/green-500) · quiet (grey-100/grey-700). **One lead fill per surface** — blue by default, green on give. |
| Badge / status pill | tint + same-ramp text, radius-pill, 12–13px weight 600–700 |
| Card | white, radius-card, `ring-card` + shadow-card, padding 20–24, **faint inset ring, no visible border** |
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
- Teal, or violet (the reference's Mentor `#722fc8` is intentionally dropped).
- The mockup's `#15c47e` give-button fill with white text (~2.3:1) — use
  `--action-give` (`#0b8a57`) instead.
- **Two** filled lead buttons on one surface. One lead action per surface —
  blue by default, green on the give side (A6). A colored button anywhere
  other than the give surface's single lead action is still wrong.
