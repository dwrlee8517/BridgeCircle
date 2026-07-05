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
| O3 | Section identity | none — all surfaces identical | `--identity-ask/give/school` + same-hue gradient bands: give `#23c386→#15a368→#0b8a57` (160°), School `#3f88f1→#2f73e6→#1f5bcc` (162°), dark grey-ink `#2a3340→#191f28` (157°). White band text measured: School mid ~4.6:1, deep ~6.6:1; give deep ~4.8:1 | FL-1 (mode invisible below the toggle) · ADR-C | **applied 2026-07-04** |
| O4 | Type scale ceiling | Display Hero 30/700, floor 10px | new **Display XL 40/800/48** tier (tracking −0.025em) above the TDS scale; label floor raised **10px → 12px** (TDS core roles unchanged) | FL-4 (landing moment undersold) · ADR-C | **applied 2026-07-04** |
| O5 | Warning hue | orange-500 `#fe9800` (bright) | ~~muted ochre ramp (anchor `#c98a1a`)~~ — **TDS orange kept** | ADR-C proposed it; Richard rejected on review | **rejected 2026-07-05** (was applied 2026-07-04) |
| O6 | Radius tiers | 4 / 8 / 12 / 16 / pill | softer: control 12 / **box 14** / **bubble 18** / **card 20** (`--radius-large` 16→20) / pill; compact 4 + standard 8 stay for small inner elements | ADR-C (Field Pro v2 reference) | **applied 2026-07-04** |
| O7 | grey-200 hairline | `#e5e8eb` | `--grey-200` → `#e6e9ee`; new `--border-subtle #edf0f2`; new `--ring-card` inset (5% ink), composed with `--shadow-card` on every card | ADR-C (A6: cards are near-borderless, not borderless) | **applied 2026-07-04** |

## Extensions

| # | Ground | What | Evidence | Status |
|---|---|---|---|---|
| E1 | Pending status | a **neutral-pending** state token pair — "waiting, and that's okay" — distinct from warning/caution (which alarm) and grey (which reads disabled) | FL-5 ("Waiting" has no honest hue) | proposed |
| E2 | Avatar identity | dedicated **`--avatar-1..6-bg/-fg` pairs decoupled from semantic ramps**, rotation-assigned, no status meaning: blue `#e8f3ff/#1b64da` · slate `#f2f4f6/#4e5968` · sand `#fef3e2/#8a5c11` · rose `#fdebee/#b01824` · sea `#e7f8f0/#0b8a57` · ink `#333d4b/#fff` (all fg-on-bg ≥4.5:1) | FL-6 (avatar tints smuggle meaning) · Field Pro's 6 `avatarColorClasses` pairs | **applied 2026-07-04** |
| E3 | Desktop / wide viewport | grid, sidebar nav, hover states, desktop tables, density modes (`density-cozy` / `density-pro`) — TDS ships no desktop system; adapt the idiom, seeded from the production app's existing solutions | FL-8 (the calm turns empty at 1280px) | proposed |
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
