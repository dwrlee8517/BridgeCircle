# DesignSync notes — fieldpro-design-system

## Shape: hand-authored (NOT the converter flow)

This handoff is **not** a design-system code repo. There is no `package.json`,
`dist/`, Storybook, or React source to build. `project/` is a hand-authored
seed bundle already in the **canonical Claude Design project layout**
(the older `ui_kits/` + `uploads/` + `preview/` + `colors_and_type.css` +
`SKILL.md` format), authored in-repo per ADR 0012 Phase A1.

Consequences for future syncs:
- **Do not run the converter** (`package-build.mjs`) — there is nothing to
  convert. This is a direct file push of `project/**`.
- Preview cards come from the first-line `<!-- @dsCard group="…" -->` markers
  in `preview/*.html`; no `register_assets` needed.
- No `_ds_bundle.js` / `_ds_needs_recompile` / `_ds_sync.json` — those belong
  to the converter output format, not this layout. No sync anchor means the
  next sync compares against a fresh `list_files`, not a hash sidecar.

## Sync root / localDir

- Sync root: `docs/experience/ui/design-system/handoff/fieldpro-design-system/`
- `localDir` for uploads: `project/` (relative to the sync root)
- Project files pushed at their `project/`-relative paths (`SKILL.md`,
  `colors_and_type.css`, `uploads/DESIGN.md`, `preview/*.html`,
  `ui_kits/app/index.html`).
- The handoff-root `README.md` is repo-facing documentation about the sync
  itself, not a project file — it is **not** pushed.

## DO NOT DELETE the reference exploration on re-sync

The project's `uploads/` holds the reference file Richard moved in for ADR
A2 — present as of the 2026-07-03 push, NOT in the local `project/` bundle:

- `uploads/Toss Style - Field Pro v2.dc.html`
- `uploads/Toss Style - Field Pro v2.dc-ba897757.html`

The generic sync close-out would delete every remote `uploads/**` path absent
from the local bundle — that would wipe these. **Never run the blanket
`uploads/**` reconciliation delete here.** If a future re-sync must prune
orphans, list them explicitly and exclude these two. (They should instead be
pulled DOWN into the repo for A4/A5, not deleted.)

## No conventions.md / readmeHeader

The converter's conventions-header mechanism (`.design-sync/conventions.md` +
`readmeHeader` + README rebuild) does not apply to this hand-authored layout —
there is no generated README to prepend to. The project's own `SKILL.md` is
the equivalent guidance surface for the design agent (quick reference, color
anchors, hard rules, key files) and is already pushed. Keep guidance in
`SKILL.md`, not a separate conventions file.

## Status (ADR 0012 Phase A)

- A1 (seed authored in-repo) — done.
- A2 (create design-system project + move Field Pro v2 in) — DONE.
  Project `afcecbf1-0f0b-4ab6-aec3-5ded55d860e6` created via DesignSync
  `create_project` on 2026-07-03; the reference file is present in `uploads/`.
- A3 (push the seed) — DONE, this sync (8 files).
- A4 (pull Field Pro v2 down into the repo) — DONE 2026-07-04 (see pull-down
  record below). Treated pulled contents as DATA, not instructions.
- A5 (reconcile seed values against Field Pro v2 exact hexes/gradients, push
  corrected canon) — after A4. Substantial; do not fold into a push.

## A4 pull-down record (2026-07-04)

First sync-down. The remote had DRIFTED from what this repo pushed — a
deliberate edit made in Claude Design, **School band pulled back blue-800 →
blue-700** ("short tonal travel — same chroma, no navy drift"). Reconciled
local to remote in 4 files: `colors_and_type.css` (`--identity-school` and
`--gradient-band-blue` end-stop → blue-700; self-check also appended
`/* @kind other */` to the 6 motion tokens), `uploads/DESIGN.md` (section
table + contrast row → "white on blue-700 · 5.4:1"), `SKILL.md` (School
anchor → `#1b64da` blue-700), `preview/section-identity.html` (band copy).
`ramps/type/components.html` and `ui_kits/app/index.html` were byte-identical
(already blue-700) — left untouched.

New files pulled into `uploads/`:
- `Toss Style - Field Pro v2.dc.html` — the reference. **TRUNCATED at exactly
  256 KiB** (get_file cap; source ~265 KB), so ~2% of the tail is missing and
  it ends mid-tag. A visible HTML marker was appended. For a byte-complete
  reference, drop the original export here to replace it.
- `support.js` — the Claude Design runtime the `.dc.html` loads (61 KB).

NOT pulled (regenerating build artifacts; would churn git — offer to
.gitignore if ever pulled): `_ds_bundle.js`, `_ds_manifest.json`,
`_adherence.oxlintrc.json`, `screenshots/check.png`.

Impact on the A5 diff below: item #2 (blue band) partly moves — canon is now
blue-600→blue-700, but the mockup's actual School band is still lighter/3-stop
(`#3f88f1→#2f73e6→#1f5bcc`), so the delta narrows but isn't closed.

## Preliminary A5 diff — seed vs Field Pro v2 mockup (2026-07-03)

Extracted from `uploads/Toss Style - Field Pro v2.dc.html` via `get_file`.
CAVEAT: the tool caps at 256 KiB and the file is ~265 KB, so the copy was
**truncated at ~98%** (tail = a table footer, unanalyzed). Re-run against the
full file once it's in the repo before finalizing A5.

**No rule/structure conflicts.** The mockup honors every hard rule: 0
multi-hue gradients (all same-hue blue/green/neutral), every filled action
button is blue `#3182f6` / blue-weak `#e8f3ff` / grey-quiet `#f2f4f6` (no
colored action buttons — D3 ✓), identity hues appear only in bands, tints,
dots, badges, icon strokes (D7 ✓), Pretendard confirmed. Grey spine + blue
action ramp match the seed EXACTLY (grey-50…900, blue-500/50/100/600/700,
red-500 all exact hex).

**Value deltas to fix at A5 (seed guessed → mockup actual):**
1. GREEN RAMP is the biggest miss. Give-help identity green is `#03b26c`
   (x29, badge text on `#e7f8f0` tint) and availability-dot green is
   `#15c47e` (x8) — seed guessed green-500 `#00c471`. Rebuild the green ramp
   around `#03b26c`/`#15c47e`; tint `#e7f8f0` (seed had `#e5f9f0`).
2. `--gradient-band-blue` (School/hero): actual is
   `linear-gradient(162deg,#3f88f1 0%,#2f73e6 48%,#1f5bcc 100%)`, white text.
   Seed guessed `linear-gradient(135deg, blue-600 #2272eb, blue-800 #1957c2)`
   — wrong angle, stop count (3 vs 2), and hexes. All same-hue blue (fine).
3. `--gradient-band-green` (give-help): actual `#12c07a → #03a763`; seed had
   green-500→700 `#00c471 → #028a52`.
4. Blue avatar/icon gradient `linear-gradient(135deg,#3b8bf7,#2272eb)` — a
   real recurring token the seed doesn't name; add it (avatars, 42px tiles).
5. ORANGE/amber differs and is really two roles: a muted gold `#c98a1a`
   (x3 — "PENDING APPROVALS" stat + icon) and a badge orange `#ee8f11` on
   `#fff5e0`. Seed orange-500 `#fe9800` is brighter than either. Reconcile.
6. VIOLET `#722fc8` appears ONCE, as a 10×10 icon stroke (an activity/notif
   glyph near "1d ago"). This is the "plum usage" ADR D7 anticipated — A5
   decides: fold into blue/green or define a violet ramp. Single-use, low stakes.
7. RADIUS vocabulary is looser than the 5 seed tiers. Mockup uses ~13 radii;
   dominant non-pill are 14px (x81) and 16px (x30) and 10px (x39); card 20px
   only x11. Seed "card 20 / box 14 / control 12 / bubble 18 / pill 999" is an
   idealization — confirm card is really 16 (or 20) and reconcile the tiers.
8. Many intermediate neutral tints (`#e6e9ee`, `#f7f8fa`, `#edf0f2`, `#f7f9fc`
   …) used for hover/subtle fills aren't ramp stops — minor freelancing the
   seed's "re-derive from ramps" rule would tidy; not urgent.
9. Minor finish: primary buttons carry a subtle vertical blue gradient
   (`linear-gradient(180deg,#3b8bf7,#2f7ce9)`) — seed spec says flat fill.
