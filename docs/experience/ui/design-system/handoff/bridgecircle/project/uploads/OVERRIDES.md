# bridgecircle — divergence ledger

**Layer 1 of ADR 0013.** This fork starts as a byte-copy of `toss-base`
(faithful TDS) and diverges **one logged entry at a time**. Every difference
from the baseline lives in this file — if a divergence isn't logged here, it's
drift, and the token ratchet should fail it.

Two kinds of entry:

- **Overrides** — a Toss value we deliberately changed.
- **Extensions** — new ground Toss never covered (TDS is mobile-only; it has
  no desktop grid, no pending-status hue, no brand marks).

Statuses: **applied** (in the fork's tokens/specimens) · **proposed**
(candidate with evidence, not yet applied) · **rejected** (considered, decided
against — kept for the record).

Evidence keys: `FL-n` = Friction log entry *n* in
[`../Help Hub.html`](../Help%20Hub.html) (the 2026-07-04 faithful-baseline
test — designed in pristine toss-base to see where it fights BridgeCircle's
content). `ADR-C` = ADR 0013 Appendix C (Field Pro reconciliation values,
PRs #115–#117).

---

## Overrides

| # | Token / rule | Toss base | Override | Evidence | Status |
|---|---|---|---|---|---|
| O1 | `--font-sans` | Toss Product Sans (proprietary) | **Pretendard** (OFL; production self-hosts Latin subset via `next/font/local`, PR #119) | licensing — mandatory substitute | **applied** |
| O2 | Action color on the give surface | blue everywhere | **green give lead action** — `--action-give` literal `#0b8a57` fill (white ~4.8:1 AA — deliberately NOT this fork's TDS green-700 `#029359`), hover `#077046`; weak `#e7f8f0` + green-500 `#03b26c` text | FL-2 (N identical blue buttons), FL-3 (giving reads transactional) · ADR-C | **applied 2026-07-04** |
| O3 | Section identity | none — all surfaces identical | `--identity-ask/give/school` + gradient bands. **Mapping corrected 2026-07-05 against the byte-complete reference:** blue `#3f88f1→#2f73e6→#1f5bcc` (162°) = **Help GET/ASK mode band** (A5 had mislabeled it "School"); green `#23c386→#15a368→#0b8a57` (160°) = **Help GIVE mode band**; **School = `--gradient-band-school`** — the dark band with blue `rgb(73 147 252/.5)` + violet `rgb(114 47 200/.4)` radial glows (the retired Mentor violet survives only as this glow); plain dark `#2a3340→#191f28` (157°) = footers/features. **Band anatomy added (reference):** `--band-glow` radial white overlay, two-circle watermark ~16% white, on-band toggle (white active pill on `--band-toggle-track`), floating cards with `--shadow-band-card`. White band text measured: blue mid ~4.6:1, deep ~6.6:1; give deep ~4.8:1. **Amended again (alternatives, 2026-07-05):** (a) a second, LIGHT identity treatment exists — **wash heroes** (`--wash-get #e3effd` / `--wash-give #e0f5ea`, fading into the canvas, ink text; 1i) — the Help hero decision (saturated band vs wash) is **deferred to design**, both are tokenized; (b) ambient canvas-top wash `--wash-page`; (c) **School re-corrected per 1h**: the page canvas is LIGHT (grey-100 + wash) and School's identity lives in **navy event covers** — `--cover-event` (`#0d1b36→#122a52` + blue glows), `--cover-texture` dot grid, glass tiles (`--glass-tile` + `--ring-glass`) — deliberately crossing the old "no navy" line, sanctioned for event covers only. `--gradient-band-school` (dark+glows) remains available but 1h supersedes it as School's default. | FL-1 · ADR-C · Field Pro v2 reference · chosen alternatives 1i/1h | **applied 2026-07-04, amended 2026-07-05 ×2** |
| O4 | Type scale ceiling | Display Hero 30/700, floor 10px | new **Display XL 40/800/48** tier (tracking −0.025em) above the TDS scale; label floor raised **10px → 12px** (TDS core roles unchanged) | FL-4 (landing moment undersold) · ADR-C | **applied 2026-07-04** |
| O5 | Warning hue | orange-500 `#fe9800` (bright) | ~~muted ochre ramp (anchor `#c98a1a`)~~ — **TDS orange kept** | ADR-C proposed it; Richard rejected on review | **rejected 2026-07-05** (was applied 2026-07-04) |
| O6 | Radius tiers | 4 / 8 / 12 / 16 / pill | softer: control 12 / **box 14** / **bubble 18** / **card 20** (`--radius-large` 16→20) / pill; compact 4 + standard 8 stay for small inner elements | ADR-C (Field Pro v2 reference) | **applied 2026-07-04** |
| O7 | grey-200 hairline | `#e5e8eb` | `--grey-200` → `#e6e9ee`; new `--border-subtle #edf0f2`; new `--ring-card` inset (5% ink), composed with `--shadow-card` on every card | ADR-C (A6: cards are near-borderless, not borderless) | **applied 2026-07-04** |
| O8 | Primary action finish | flat blue-500 fill | **vertical gradient** `--gradient-primary-btn` `#3b8bf7→#2f7ce9` + `--shadow-primary-btn` soft blue glow, on major CTAs (Search, Send, Ask for advice); flat blue-500 stays valid for small buttons. Chat me-bubble shares the gradient (`--gradient-bubble-me`). | A5 diff item #9 · every chosen alternative (1a/1i/1e) | **applied 2026-07-05** |
| O9 | Elevated card treatment | flat white card, radius 20, `#edf0f2` rows | major content cards: `--surface-card-elevated` (`#fff→#fdfdfe`), `--ring-card-elevated` (4.5% ink inset), `--shadow-card-elevated` (layered), **`--radius-card-xl` 22**; rows split on **`--divider-row #f4f5f7`**. The O7 flat-card treatment remains for small/simple cards. | alternatives 1a/1e/1h (identical treatment across all) | **applied 2026-07-05** |

## Extensions

| # | Ground | What | Evidence | Status |
|---|---|---|---|---|
| E1 | Pending status | a **neutral-pending** state token pair — "waiting, and that's okay" — distinct from warning/caution (which alarm) and grey (which reads disabled) | FL-5 ("Waiting" has no honest hue) | proposed |
| E2 | Avatar identity | dedicated **`--avatar-1..6-bg/-fg` pairs decoupled from semantic ramps**, rotation-assigned, no status meaning: blue `#e8f3ff/#1b64da` · slate `#f2f4f6/#4e5968` · sand `#fef3e2/#8a5c11` · rose `#fdebee/#b01824` · sea `#e7f8f0/#0b8a57` · ink `#333d4b/#fff` (all fg-on-bg ≥4.5:1). **+ `--gradient-avatar` `linear-gradient(135deg,#3b8bf7,#2272eb)`** — the signed-in member's avatar / brand icon tiles (the recurring gradient A5 diff item #4 flagged; reference-exact, added 2026-07-05). **Amended (alternatives): OTHER people render as `--avatar-neutral`** (`#eef1f6→#dde3ec` + `--ring-avatar`) — identity color moved from avatars into **status chips** ("In your circle" blue-tint · "Open to help" green-dot `#029a5e` on `rgb(3 178 108/.1)` · "Requested" grey), which reinforces FL-6's original point; the 6 colored pairs stay available as an optional rotation | FL-6 · Field Pro's 6 `avatarColorClasses` pairs · reference · alternatives 1a/1e/1i | **applied 2026-07-04, amended 2026-07-05** |
| E3 | Desktop / wide viewport | **desktop token layer + 3 specimens** — breakpoints 768/1024/1280; containers `--container-reading 680` / **`--container-shell 1320` MAX, fluid below** (reference-aligned 2026-07-05; the reference's radius-24 outer frame is a mockup artifact — real shells are full-bleed); **sidebar shell** 240px (+72 rail): **icon nav** (20px strokes, grey-400 inactive / currentColor active — reference; replaces the earlier identity-dot idea), item radius `--radius-box` 14, 15px/600→700, count badge; **two-tone wordmark** (ink + blue circles); member card with `--gradient-avatar`; **topbar `--topbar-height 66`** — blurred white, page title 18/700, global search pill (440 max, ⌘K kbd chip), 42px round icon actions + notification dot; pointer states (`--hover-tint` ink 4% ≈ grey-100 on white — chosen over a literal grey-100 so it stays visible on panel surfaces; `--row-hover`, `--nav-active-*` — **active nav amended 2026-07-05 to the gradient treatment** `#eaf4ff→#e2efff` + inset blue ring, per every chosen alternative, reversing the earlier flat call; selection = `--selected-tint #eef5ff` + `--selected-accent` 2px left bar; outline pills `--ring-outline`; hover is a background shift, never a lift); operator **data table** (`--table-row-height 44`, header bg, sortable/hover/pagination); two-column list+detail; wide band hero; `:focus-visible` reuses `--focus-ring`. Invention in the Toss spirit — TDS ships no desktop — seeded from production + the Field Pro v2 reference shells (1320×880). Nav: **sidebar for the member shell**, top-nav for auth/marketing. **Redesign IA (Richard, final 2026-07-05): Home (dashboard) · Help (ONE page, ask/give toggle in-page) · People (directory) · Messages — *not "Chat"* — (all member communication, ADR 0011 one-inbox) · School (events + announcements), in that order** (reference had People before Help and "Chat"; Richard's order + label win). | FL-8 · Field Pro v2 reference desktop shells | **applied 2026-07-05** |
| E4 | Brand marks | **CircleMark** (two overlapping circles, `currentColor`, connected members only) + wordmark treatment | brand, not skin — persists across systems | proposed |

## Pattern guidance (not tokens)

- **One invitation per job (FL-7).** The Toss idiom's fixed bottom CTA and an
  inviting inline field duplicate each other on the ask surface. Pick one per
  screen; don't ship both. This is a composition rule, not a token.
- **Voice is the buffer.** Two-sided psychological-barrier reduction (quiet
  passes, decline dignity) lives in copy per
  `docs/product/voice-guidelines.md` — no token can do this job.

## Rejected

- **O5 — ochre warning (rejected 2026-07-05).** Applied in the 2026-07-04
  batch, reverted the next day on Richard's review: **TDS orange `#fe9800`
  stays** as the warning hue. The fork's `--orange-*` ramp is back to faithful
  TDS values. The Field Pro ochre (`#c98a1a`) remains in the ADR-C record if
  ever reconsidered. Note: the E2 avatar "sand" pair keeps its warm literals
  (`#fef3e2`/`#8a5c11`) — that's avatar identity, decoupled by design, not a
  warning role.

---

## How to apply an entry

1. Change the fork's tokens/specimens (never `toss-base`).
2. Flip the entry to **applied**, date it, and note the exact values.
3. Re-measure any contrast pair the change touches.
4. Sync the fork project; translate to production per ADR 0013 Phase D/E.
