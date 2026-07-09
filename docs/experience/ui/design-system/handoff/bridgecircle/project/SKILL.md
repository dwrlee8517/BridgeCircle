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

**Applied (2026-07-04 brand batch):** O1 Pretendard · O2 green give action
(`--action-give #0b8a57`, give surface's single lead action only) · O3 section
identity + gradient bands (`--gradient-band-{green,blue,dark}`) · O4 Display XL
40/800 + 12px floor · O6 softer radii (card 20 / box 14 / bubble 18 / control
12) · O7 hairline `#e6e9ee` + `--border-subtle` + `--ring-card` · E2 avatar
palette (`--avatar-1..6`, no status meaning).

**Applied (2026-07-05):** E3 desktop extension — breakpoints 768/1024/1280,
`--container-shell 1320` (max, fluid below) / `--container-reading 680`,
**sidebar shell** (240px, **icon nav** — 20px strokes, radius `--radius-box`,
NOT identity dots; two-tone wordmark; `--gradient-avatar` member card),
**topbar** (`--topbar-height 66`: blurred white, title, round icon actions —
no ⌘K/global search, removed 2026-07-06), pointer states (`--hover-tint`, `--row-hover`; hover =
background shift, never a lift), operator data table tokens, wide band hero.
Specimens: `preview/desktop-{shell,tables,patterns}.html`.

**Identity mapping (corrected 2026-07-05 vs the reference):** blue band
`--gradient-band-blue` = Help **get/ask** mode · green = Help **give** mode ·
plain dark = footers/features. Band anatomy: compose `--band-glow` over the
gradient; two-circle watermark ~16% white; mode toggle ON the band (white
active pill on `--band-toggle-track`); floating cards use
`--shadow-band-card`.

**Alternatives idiom (Richard's chosen page directions, 2026-07-05 —
O8/O9 + amendments):**
- **Major CTAs use the gradient finish** `--gradient-primary-btn` +
  `--shadow-primary-btn` (O8); chat me-bubbles share it.
- **Major content cards are elevated**: `--surface-card-elevated` +
  `--ring-card-elevated` + `--shadow-card-elevated`, radius
  `--radius-card-xl` 22, rows split on `--divider-row` (O9).
- **Avatars: the 6 rotating colored pairs (`--avatar-1..6`) are the default**
  for other people (Richard's call); `--avatar-neutral` is an option for
  dense operator surfaces only. Status lives in chips either way; avatar
  color carries no status meaning. Self = `--gradient-avatar`.
- **Active nav & selection**: gradient `--nav-active-bg` only (no ring —
  `--nav-active-ring` is `none` as of 2026-07-06); selected list items
  `--selected-tint` + `--selected-accent`.
- **HELP HERO DECIDED (2026-07-05): the 1i wash** (`--wash-get`/`--wash-give`,
  ink text) **with the pill toggle** (icons, white active pill, mode-colored
  text, `--wash-toggle-track`). Saturated bands (O3) are for
  **onboarding/marketing moments only** — never in-product page heroes.
- **School (1h)**: light canvas + `--wash-page`; identity lives in **navy
  event covers** (`--cover-event` + `--cover-texture` + glass tiles) —
  navy is sanctioned for event covers ONLY.
- In-row give action = the **weak green pill** (`rgb(3 178 108/.12)` /
  `#029a5e`); the solid `--action-give` fill is for a surface's single lead
  action.

**Page specimens (from the chosen alternatives):**
`preview/people-directory.html` (1a) · `preview/help-heroes.html` (Current +
1i A/B) · `preview/messages.html` (1e) · `preview/school-events.html` (1h).

**Redesign IA (locked by Richard, 2026-07-05):** the member shell has FIVE
sections — **Home** (dashboard) · **Help** (one page; ask/give selected by an
in-page toggle — never separate nav items; split blue/green dot) · **People**
(directory) · **Messages** (all member-to-member communication, one inbox) ·
**School** (events + announcements). Design every screen within this IA.

**Rejected:** O5 ochre warning (2026-07-05) — **warning is TDS orange
`#fe9800`**, do not reach for ochre.
**Still proposed:** E1 neutral-pending hue · E4 CircleMark (the wordmark's
two-circle motif appears in the shell specimen as a preview, not yet a token).
Hard rules that survive the batch: ONE lead action per surface (green only on
give, blue everywhere else — any other colored button is wrong); gradients
same-hue + band surfaces only; text/fill from the same ramp; every card
composes `var(--ring-card), var(--shadow-card)`. All entries remain adjustable
or revertible — flip the ledger row and the fork falls back to Toss.

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
