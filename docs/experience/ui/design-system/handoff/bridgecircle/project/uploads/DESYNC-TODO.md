# DesignSync — decided reconciliation (apply in repo, re-sync)

> **STATUS: APPLIED 2026-07-12** (same-day, second re-sync run). §1 specimens
> reworked (school-events · messages · help-heroes — plus desktop-patterns,
> whose hero consumed the removed green band, and spacing-radius's stale card
> body; help-heroes' get hero also moved to the v3 search-first flow); §2 all
> ten specimens authored under `preview/` group "Patterns"; §3 tokens minted /
> changed / removed as listed (E1 applied); §3b brand card rebuilt; §4 ledger
> updated (see OVERRIDES.md). **Second pass (same day): E7 MINTED**
> (--give-tint / --give-tint-weak, Richard: "mint the pair"), dark mode
> PARKED (v1 light-only), expiry copy = both-by-context, "Can help with"
> canonical, ask-composer specimen added — **and §5's literal→var swap is
> DONE** (100 swaps across the .dc.html templates + specimen tints; skeleton
> shimmer + SVG attrs deliberately excluded; templates re-verified via node
> --check and a live dc-runtime render). Remaining parked: skeleton/scrim/
> blue-tint drift list in OVERRIDES pattern guidance.
> Also this run: the Codex `screens/**` slice was removed (Richard,
> 2026-07-12) as redundant with `templates/**`.

2026-07-12 · Audit of `templates/*` (35 files) vs DS sources, with verdicts applied.
Rules used: unused-but-plausibly-needed → **keep**; unused + superseded by a decision →
**remove**; where templates diverged and the newer treatment is better → **templates win**.
All color-ramp steps are kept regardless of usage (future headroom).
DS sources are read-only in this project — every item below is a repo change.

---

## 1 · Specimens — templates/flows win, update specimens

**`preview/school-events.html`**
- Drop: capacity fill bar (→ quiet "16 spots left" text) · "Manage →" · "Viewing" chip ·
  "Calendar →" · navy "The Bridge" tile (→ light card named "Newsletter")
- Add: pre-RSVP "I'm going" cover state · description + host line · "View details →" ·
  "3 from your circle are going" line · dual time zones ("5:30 PM PT · 9:30 AM KST")

**`preview/messages.html`**
- Drop "Schedule a call" · "Day 5 of 14" counter + track (→ "3 days left" flag, last 3 days only)
- Add the pinned foldable "Waiting on you" group (red count badge, inline Accept/Decline)
- "Open to mentor" → "● Open to help" · segmented filters → chips

**`preview/help-heroes.html`** — remove the give capacity meter (rejected 2026-07-05)

**Metadata/comments** — `spacing-radius.html` subtitle: "4/8/12/16/pill" → O6 tiers
(12/14/18/20/pill); `colors_and_type.css` O8 comment + OVERRIDES O8: "Ask for advice" →
"Ask for help". Push the already-reconciled nav-ring/⌘K changes.

## 2 · New specimens to add (built in templates, unlogged)

Log each as a specimen + OVERRIDES extension; templates are the source of truth:
1. **"Waiting on you" group** — foldable pinned card, red count badge visible folded,
   inline Accept/Decline, "also in Messages" echo (Home · Messages · Help arm 3)
2. **Ask status pills** — Waiting (quiet grey) · N offers (blue) · Declined (grey) ·
   Answered (green) · Closes in 3d (`--closing-soon`, see §3)
3. **Home spotlight deck** — auto-advance ~6s, dots + arrows, pause on hover/focus,
   reduced-motion → manual, ~6-item cap
4. **Notification popover + row** (bell popover ships v1)
5. **Profile slide-over** (§7b overlay variant of the People rail)
6. **Decision dialogs** — decline-with-note (default reason / write own / AI relay),
   block + disconnect confirmation guards
7. **Onboarding chrome** — segmented progress, navy bookends, import accelerator,
   cold-start cards
8. **System states** — not-found / permission-denied / offline / module-shaped skeletons
9. **Profile patterns** — "Can speak to" entry cards, enrichment review queue,
   per-item link visibility (Public/Circle/Private)
10. **Settings + circle rows** — settings page, blocked-users list, My-circle rows

## 3 · Tokens — mint / change / remove

**Mint (templates settled these; take values verbatim):**
- `--action-give-text: #029a5e` — "Open to help" green text (×34; already named in
  OVERRIDES prose, never minted)
- `--surface-canvas: #f6f8fa` — page canvas (×71)
- `--surface-inset: #f7f9fc` — quiet inset panels (×13)
- `--icon-muted: #c8cfd8` — muted icon strokes (×8)
- `--closing-soon-text: #b26f00` / `--closing-soon-tint` — the "Closes in 3d" pill.
  NEW role, does NOT reopen O5: `--warning` stays TDS orange; this is the calm
  expiry hue the templates chose (calm-not-urgent). Log as an extension.
- **E1 promoted**: `--pending-text` = quiet grey (text-secondary on subtle tint) —
  templates settled "Waiting" as grey-quiet everywhere; mint the pair, flip E1 to applied.

**Change (templates win):**
- `--border-subtle: #edf0f2` → **`#eef1f5`** — templates used #eef1f5 as the hairline
  ×149, unanimously across 6 template groups; three near-identical greys collapse to
  ramp `--grey-200 #e6e9ee` + hairline `--border-subtle #eef1f5` + `--divider-row #f4f5f7`.
  Re-measure specimens after the swap.
- Blue tints: fold `#e2eeff / #eaf3ff / #fbfdff / #f3f8ff` usage toward `--blue-50` /
  `--selected-tint` at next template pass (low priority; don't mint four new tints).

**Remove:**
- `--gradient-capacity` — sole consumer is the rejected capacity meter
- `--identity-ask / -give / -school` — superseded by the wash tokens (O3 amended)
- `--gradient-band-blue / -green / -school`, `--band-glow`, `--band-toggle-track` —
  confirmed unused (Richard 2026-07-12): Help hero = 1i wash, School + onboarding =
  navy `--cover-event`. KEEP only `--gradient-band-dark` (Entry page backdrop, footers).
  Retire the O3 band anatomy; record in the ledger.

**Keep (unused today, plausibly needed):**
- All color ramps + grey-opacity, every step (explicit: keep full increments)
- Semantic layer (`--warning/--caution/--success/--info/--premium`, `--state-*`) —
  feedback surfaces will need them
- `--action-primary-hover/-pressed`, `--focus-ring-soft`, `--selection`
- Type-role / spacing / motion / radius-role layers — reference for production;
  log the policy that DC templates inline literals (so the ratchet reads it as intent)
- `--avatar-neutral`, table tokens (admin surfaces later), breakpoints
- `--gradient-band-dark` — still earns its keep (Entry backdrop, footer/feature moments)
- Amend O3: navy `--cover-event` sanctioned for event covers **and onboarding bookends**

## 3b · `preview/brand-identity.html` rework (confirmed 2026-07-12)

The Brand card is half-dead — rebuild it around what the product actually uses:
- **Drop** the three identity-band swatches (blue/green/school) + band-glow demo;
  show `--gradient-band-dark` only (label: Entry backdrop / footers)
- **Replace** the identity story with the current one: the 1i wash pair
  (`--wash-get`/`--wash-give`) + the navy `--cover-event` tile
- **Replace** the status-pill row (`--state-*` pills, unused) with the templates'
  real pill vocabulary: Waiting · N offers · Declined · Answered · Closes in 3d
- **Keep** the give-action [O2] and avatar-palette [E2] sections as-is (both in
  heavy use)

## 4 · Ledger updates

- **E1** neutral-pending → applied (values above)
- **E4** CircleMark → v1 decision: "In your circle" chips carry circle state; the mark
  stays proposed for a future brand pass (wordmark already draws the two-circle motif)
- **O3** amend scope (onboarding bookends); **O8** CTA rename

## 5 · Template-side fixes (done in this project, 2026-07-12)

- `Onboarding.dc.html`: `var(--danger, #d64545)` ×4 → `var(--error)` (token is
  `--error`; `--danger` never existed)
- NOT changed: `#191f28`/`#b0b8c1` in SVG `stroke=` attributes (wordmark/CircleMark) —
  var() doesn't resolve in SVG presentation attributes; literals are intentional.
- ~~Deferred until tokens exist in the repo: swapping template literals to the
  new vars.~~ **DONE 2026-07-12 (second pass)** — `#029a5e`(34) `#f7f9fc`(13)
  `#c8cfd8`(7) `#b26f00`(6) + closing/give tints swapped to vars; `#eef1f5`(7
  non-shimmer) swapped; the 71 `#f6f8fa` + 142 `#eef1f5` inside the skeleton
  shimmer gradient were EXCLUDED on purpose (parked skeleton-drift item).
