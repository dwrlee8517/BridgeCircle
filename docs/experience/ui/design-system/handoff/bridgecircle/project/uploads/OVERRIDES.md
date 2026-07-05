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
| O2 | Action color on the give surface | blue everywhere | **green give lead action** — `--action-give` green-700 `#0b8a57` fill (AA ~4.8:1), hover green-800; weak variant `#e7f8f0` + green-500 text | FL-2 (N identical blue buttons), FL-3 (giving reads transactional) · ADR-C | proposed |
| O3 | Section identity | none — all surfaces identical | ambient section hues + same-hue gradient bands (give green `#23c386→#15a368→#0b8a57`, School blue `#3f88f1→#2f73e6→#1f5bcc`, dark grey-ink `#2a3340→#191f28`) | FL-1 (mode invisible below the toggle) · ADR-C | proposed |
| O4 | Type scale ceiling | Display Hero 30/700, floor 10px | display **40/800** (tracking −0.025em), floor 12px | FL-4 (landing moment undersold) · ADR-C | proposed |
| O5 | Warning hue | orange-500 `#fe9800` (bright) | muted **ochre `#c98a1a`** ramp, warm-cream tint `#fef3e2` | ADR-C (Field Pro A5: the brand reads calmer without bright orange) | proposed |
| O6 | Radius tiers | 4 / 8 / 12 / 16 / pill | softer: control 12 / box 14 / bubble 18 / **card 20** / pill | ADR-C (Field Pro v2 reference) | proposed |
| O7 | grey-200 hairline | `#e5e8eb` | `#e6e9ee` + lighter `--border-subtle #edf0f2` + faint `--ring-card` inset | ADR-C (A6: cards are near-borderless, not borderless) | proposed |

## Extensions

| # | Ground | What | Evidence | Status |
|---|---|---|---|---|
| E1 | Pending status | a **neutral-pending** state token pair — "waiting, and that's okay" — distinct from warning/caution (which alarm) and grey (which reads disabled) | FL-5 ("Waiting" has no honest hue) | proposed |
| E2 | Avatar identity | a dedicated **avatar tint palette decoupled from semantic ramps** (contrast-verified pairs), so a green avatar doesn't read "success" | FL-6 (avatar tints smuggle meaning) · Field Pro's 6 `avatarColorClasses` pairs | proposed |
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

*(none yet)*

---

## How to apply an entry

1. Change the fork's tokens/specimens (never `toss-base`).
2. Flip the entry to **applied**, date it, and note the exact values.
3. Re-measure any contrast pair the change touches.
4. Sync the fork project; translate to production per ADR 0013 Phase D/E.
