# bridgecircle — divergence ledger

> **Audit ledger — not a design source.** This file records how the fork
> diverged from the `toss-base` baseline (dated entries, strikethroughs,
> before/after values). For the **current** design truth to build against,
> read `SKILL.md` + `colors_and_type.css` + the `preview/*.html` specimens,
> and `uploads/FLOWS.md` for the flows. Use this file only to audit divergence.

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
against — kept for the record) · **retired** (previously applied, then removed
because the stabilized templates proved the extra role unnecessary).

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
| O2 | Action color on the give surface | blue everywhere | **green give composition** — `--action-give` literal `#0b8a57` fill (white ~4.8:1 AA — deliberately NOT this fork's TDS green-700 `#029359`), hover `#077046`; weak `#e7f8f0` + green-500 `#03b26c` text. The dedicated offer-drafting surface may reuse the solid give hue for supporting cues intrinsic to that job: the AI mark, the member's draft bubble, the compact AI-send control, and the completion mark. **Send offer remains the only lead CTA.** Outside that bounded give workflow, solid green remains reserved for the lead give action; passive/status treatments use the weak/text roles. | FL-2 (N identical blue buttons), FL-3 (giving reads transactional) · ADR-C · stabilized GiveOffer template | **applied 2026-07-04, amended 2026-07-13** |
| O3 | Section identity | none — all surfaces identical | `--identity-ask/give/school` + gradient bands. **Mapping corrected 2026-07-05 against the byte-complete reference:** blue `#3f88f1→#2f73e6→#1f5bcc` (162°) = **Help GET/ASK mode band** (A5 had mislabeled it "School"); green `#23c386→#15a368→#0b8a57` (160°) = **Help GIVE mode band**; **School = `--gradient-band-school`** — the dark band with blue `rgb(73 147 252/.5)` + violet `rgb(114 47 200/.4)` radial glows (the retired Mentor violet survives only as this glow); plain dark `#2a3340→#191f28` (157°) = footers/features. **Band anatomy added (reference):** `--band-glow` radial white overlay, two-circle watermark ~16% white, on-band toggle (white active pill on `--band-toggle-track`), floating cards with `--shadow-band-card`. White band text measured: blue mid ~4.6:1, deep ~6.6:1; give deep ~4.8:1. **Amended again (alternatives, 2026-07-05):** (a) **HELP HERO DECIDED (Richard, 2026-07-05): the 1i wash** (`--wash-get #e3effd` / `--wash-give #e0f5ea`, fading into the canvas, ink text) **with the band variant's pill-toggle geometry** — icons, 13px/9-17px padding, white active pill with mode-colored text (get blue-600 / give `#029a5e`), on the soft `--wash-toggle-track` + hairline ring. **Saturated bands are reserved for onboarding/marketing moments**, not in-product heroes; (b) ambient canvas-top wash `--wash-page`; (c) **School re-corrected per 1h**: the page canvas is LIGHT (grey-100 + wash) and School's identity lives in **navy event covers** — `--cover-event` (`#0d1b36→#122a52` + blue glows), `--cover-texture` dot grid, glass tiles (`--glass-tile` + `--ring-glass`) — deliberately crossing the old "no navy" line, sanctioned for event covers only. ~~`--gradient-band-school` (dark+glows) remains available but 1h supersedes it as School's default.~~ **Amended ×3 (2026-07-12, template audit): BAND ANATOMY RETIRED.** The full Claude Design template set confirmed the saturated bands unused — Help hero is the 1i wash, School + onboarding are navy `--cover-event`. Removed: `--identity-ask/-give/-school`, `--gradient-band-blue/-green/-school`, `--band-glow`, `--band-toggle-track`. Kept: `--gradient-band-dark` (Entry-page backdrop, footers/features), `--wash-toggle-track`, `--shadow-band-card` (cards on dark/cover surfaces). **`--cover-event` scope widened: event covers AND onboarding bookends** (the templates' Welcome/all-set screens). | FL-1 · ADR-C · Field Pro v2 reference · chosen alternatives 1i/1h · 2026-07-12 template audit (DESYNC-TODO) | **applied 2026-07-04, amended 2026-07-05 ×2, 2026-07-12 ×3** |
| O4 | Type scale ceiling | Display Hero 30/700, floor 10px | new **Display XL 40/800/48** tier (tracking −0.025em) above the TDS scale; label floor raised **10px → 12px** (TDS core roles unchanged) | FL-4 (landing moment undersold) · ADR-C | **applied 2026-07-04** |
| O5 | Warning hue | orange-500 `#fe9800` (bright) | ~~muted ochre ramp (anchor `#c98a1a`)~~ — **TDS orange kept** | ADR-C proposed it; Richard rejected on review | **rejected 2026-07-05** (was applied 2026-07-04) |
| O6 | Radius tiers | 4 / 8 / 12 / 16 / pill | softer: control 12 / **box 14** / **bubble 18** / **card 20** (`--radius-large` 16→20) / pill; compact 4 + standard 8 stay for small inner elements | ADR-C (Field Pro v2 reference) | **applied 2026-07-04** |
| O7 | grey-200 hairline | `#e5e8eb` | `--grey-200` → `#e6e9ee`; new `--border-subtle` ~~`#edf0f2`~~ → **`#eef1f5` (amended 2026-07-12** — the templates used #eef1f5 as the hairline ×149, unanimously across 6 groups; the grey trio collapses to ramp `--grey-200 #e6e9ee` · hairline `--border-subtle #eef1f5` · row split `--divider-row #f4f5f7`**)**; new `--ring-card` inset (5% ink), composed with `--shadow-card` on every card | ADR-C (A6: cards are near-borderless, not borderless) · 2026-07-12 template audit | **applied 2026-07-04, amended 2026-07-12** |
| O8 | Primary action finish | flat blue-500 fill | **vertical gradient** `--gradient-primary-btn` `#3b8bf7→#2f7ce9` + `--shadow-primary-btn` soft blue glow, on major CTAs (Search, Send, ~~Ask for advice~~ **"Ask for help"** — CTA renamed 2026-07-07, comment reconciled 2026-07-12); flat blue-500 stays valid for small buttons. Member-to-member Messages and ask-drafting me-bubbles share the gradient (`--gradient-bubble-me`); the dedicated give offer-drafting bubble is O2's scoped green exception. | A5 diff item #9 · every chosen alternative (1a/1i/1e) · stabilized GiveOffer template | **applied 2026-07-05, amended 2026-07-13** |
| O9 | Elevated card treatment | flat white card, radius 20, `#edf0f2` rows | major content cards: `--surface-card-elevated` (`#fff→#fdfdfe`), `--ring-card-elevated` (4.5% ink inset), `--shadow-card-elevated` (layered), **`--radius-card-xl` 22**; rows split on **`--divider-row #f4f5f7`**. The O7 flat-card treatment remains for small/simple cards. | alternatives 1a/1e/1h (identical treatment across all) | **applied 2026-07-05** |

## Extensions

| # | Ground | What | Evidence | Status |
|---|---|---|---|---|
| E1 | Pending status | A **neutral-pending** token pair was briefly introduced for "waiting, and that's okay": `--pending-text: var(--text-secondary)` on `--pending-tint: var(--surface-subtle)`. The stabilized templates deliberately use those base roles directly for Waiting and Declined. Because the aliases had no distinct value and no template consumer, the templates won: remove the aliases and keep the calm neutral treatment without a separate semantic layer. | FL-5 ("Waiting" has no honest hue) · 2026-07-12 template audit · stabilized templates | **retired 2026-07-13** (was applied 2026-07-12) |
| E2 | Avatar identity | dedicated **`--avatar-1..6-bg/-fg` pairs decoupled from semantic ramps**, rotation-assigned, no status meaning: blue `#e8f3ff/#1b64da` · slate `#f2f4f6/#4e5968` · sand `#fef3e2/#8a5c11` · rose `#fdebee/#b01824` · sea `#e7f8f0/#0b8a57` · ink `#333d4b/#fff` (all fg-on-bg ≥4.5:1). **+ `--gradient-avatar` `linear-gradient(135deg,#3b8bf7,#2272eb)`** — the signed-in member's avatar / brand icon tiles (the recurring gradient A5 diff item #4 flagged; reference-exact, added 2026-07-05). **Richard's call (2026-07-05): the 6 rotating colored pairs are the DEFAULT** — the alternatives' neutral-gradient avatars were evaluated and demoted to `--avatar-neutral`, an option for dense operator surfaces (admin tables). Status chips ("In your circle" blue-tint · "Open to help" green-dot `#029a5e` on `rgb(3 178 108/.1)` · "Requested" grey) carry status regardless; avatar color is identity-only, per FL-6 | FL-6 · Field Pro's 6 `avatarColorClasses` pairs · reference · alternatives evaluated | **applied 2026-07-04 · rotation confirmed default 2026-07-05** |
| E3 | Desktop / wide viewport | **desktop token layer + 3 specimens** — breakpoints 768/1024/1280; **the member shell fills the viewport (`width:100%`) while content owns measured columns** (`--container-reading 680`, Help 860, wider list/detail surfaces as specified). The Field Pro v2 1320×880 frame remains visual evidence, but its outer radius and 1320 cap are mockup-canvas artifacts and do not constrain the real shell. **Sidebar shell** 240px (+72 rail): icon nav (20px strokes, grey-400 inactive/currentColor active), item radius `--radius-box` 14, count badge, two-tone wordmark, and `--gradient-avatar` member card. **Topbar `--topbar-height 66`**: blurred white, page title 18/700, 42px actions, notification dot; cross-surface search remains removed in favor of per-surface search. Pointer states use background shifts, never lift; active nav uses the blue gradient without a ring; selections use `--selected-tint` plus a 2px accent. Includes operator data tables, two-column list/detail, wide wash heroes, and shared `:focus-visible`. Nav remains **Home · Help · People · Messages · School** with the member sidebar and auth/marketing top nav. | FL-8 · Field Pro v2 reference desktop shells · Richard wide-viewport review 2026-07-14 | **applied 2026-07-05 · amended 2026-07-06 (search/ring) · amended 2026-07-14 (full-viewport shell)** |
| E4 | Brand marks | **CircleMark** (two overlapping circles, `currentColor`, connected members only) + wordmark treatment. **v1 decision (2026-07-12): "In your circle" chips carry circle state in v1; the mark stays proposed for a future brand pass** (the wordmark already draws the two-circle motif) | brand, not skin — persists across systems | proposed (chips carry it in v1) |
| E5 | Template-settled roles | four literals the DC templates settled unanimously, minted verbatim (2026-07-12): **`--surface-canvas #f6f8fa`** · **`--surface-inset #f7f9fc`** quiet inset panels (×13) · **`--icon-muted #c8cfd8`** muted icon strokes (×8) · **`--action-give-text #029a5e`** "Open to help" green text (×34; named in E2 prose since 2026-07-05, never minted). **Evidence correction (§5 pass):** the audit's "×71 page canvas" for `--surface-canvas` was actually the skeleton-shimmer MID-STOP (all 71 occurrences sit inside `linear-gradient(90deg,#eef1f5 25%,#f6f8fa 50%,#eef1f5 75%)`); templates use `--surface-page` for page canvas. The token stays minted but its real consumer is the shimmer — resolve together with the parked skeleton-drift item. Blue tints `#e2eeff/#eaf3ff/#fbfdff/#f3f8ff` deliberately NOT minted — fold toward `--blue-50`/`--selected-tint` at the next template pass | 2026-07-12 template audit (DESYNC-TODO) · §5 correction | **applied 2026-07-12** |
| E6 | Closing-soon expiry | **`--closing-soon-text #b26f00` on `--closing-soon-tint rgb(254 152 0 / 0.14)`** — the "Closes in 3d" pill (last-3-days flag). A NEW role, NOT a reopening of O5: `--warning` stays TDS orange; this is the calm expiry hue the templates chose (calm-not-urgent; ×6 template groups, unanimous) | 2026-07-12 template audit · FLOWS §3 uniform 14-day close | **applied 2026-07-12** |
| E7 | Green translucent tint | **`--give-tint rgb(3 178 108 / 0.12)`** (Answered / Resolved / Going pills, green CTA tints, ×8+ across Help·AskHistory·AskStatus·Home) + **`--give-tint-weak rgb(3 178 108 / 0.1)`** ("Open to help" chips). Alpha on purpose — the tint picks up the surface beneath (inset panels, selected rows) where opaque `--action-give-weak #e7f8f0` reads as a sticker; give-weak keeps its separate weak-BUTTON job (O2). Richard: "mint the pair" (comparison artifact 8cfd6a36); templates + specimens swapped to the vars in the §5 pass | 2026-07-12 specimen authoring (×4 independent extractions) · Richard 2026-07-12 | **applied 2026-07-12** |

## Pattern guidance (not tokens)

- **One invitation per job (FL-7).** The Toss idiom's fixed bottom CTA and an
  inviting inline field duplicate each other on the ask surface. Pick one per
  screen; don't ship both. This is a composition rule, not a token.
- **Voice is the buffer.** Two-sided psychological-barrier reduction (quiet
  passes, decline dignity) lives in copy per
  `docs/product/voice-guidelines.md` — no token can do this job.
- **DC templates may retain deliberate render literals (policy, amended
  2026-07-13).** The ratchet reads templates as renderings, not token sources.
  Settled repeated roles were minted under E5/E6/E7 and swapped to vars where
  the semantic indirection earns its keep; the remaining scrim, skeleton,
  blue-tint, dialog, and inset literals are the explicitly parked set below.
- **Give composition (O2/O8, amended 2026-07-13).** A give workflow still has
  one lead commitment CTA. Inside the bounded offer-drafting experience,
  compact green cues may reinforce the member's giving role without becoming
  competing lead actions: AI mark, member draft bubble, AI-send control, and
  completion mark. Actual member-to-member Messages remain blue-gradient.
- **Dark mode PARKED (Richard, 2026-07-12): v1 ships LIGHT-ONLY.** The
  `.dark` block in `colors_and_type.css` is an unverified derived guess and
  the 2026-07 tokens have no dark values; it stays as raw material for a
  future dark iteration. Nothing in v1 builds against it.
- **Expiry-pill copy rule (Richard, 2026-07-12): both variants, by context.**
  Short "Closes in 3d" in dense rows/pills (Home, Help, ask rows); long
  "N days left before this ask closes" in the Messages about-rail, where
  there's room and the register is conversational. Same `--closing-soon-*`
  treatment either way.
- **Section name canonical (Richard, 2026-07-12): "Can help with"** — the
  viewer-facing templates settled it and it reads as an offer (two-sided
  buffer). Renamed in FLOWS §7, ProfileSelf template, Help give-arm hint,
  and the profile-patterns specimen. "Can speak to it" survives only as
  match-language copy discipline (FLOWS §3), never as a section title.
- **Template↔token drift still parked (2026-07-12 findings, undecided):**
  scrim — templates use `rgb(25 31 40 / 0.35–0.45)` vs token `--scrim
  rgb(3 24 50 / 0.46)`; skeleton — templates shimmer `#eef1f5/#f6f8fa` vs
  tokens `#e6e9ee/#f2f4f6` (shimmer gradients deliberately EXCLUDED from the
  §5 swap for this reason); blue tints `#e2eeff/#eaf3ff/#fbfdff/#f3f8ff`
  (fold toward `--blue-50`/`--selected-tint` later, per DESYNC); School
  templates dropped the `--cover-texture` dot grid (Onboarding's bookends
  still use it); dialog radius 20 + shadow `0 24px 60px rgb(25 31 40 /
  0.25)` recur untokenized; "Why this match" inset `#f4f6f9` is a fourth
  near-grey. Reconcile template-side or mint deliberately — don't let these
  in by accident.

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
