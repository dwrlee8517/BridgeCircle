# 0013 — Build a complete Toss (TDS) baseline first, then a thin BridgeCircle brand overlay

- **Status:** proposed — supersedes [0012](0012-tds-design-system.md)
- **Date:** 2026-07-04
- **Decider:** Richard

## Context

[ADR 0012](0012-tds-design-system.md) adopted a TDS-based system ("Field Pro")
by **reconciling a single bundle against a hand-made mockup** — Richard's
Claude Design file *"Toss Style – Field Pro v2"*. That mockup is explicitly
flagged as *"may differ from stock Toss"*, so 0012 tangled two different things
in one token layer: **what Toss actually is** and **what BridgeCircle wants to
change about it**. The A5/A6 reconciliations (PRs #116–#117) and the Phase B
production swap (#118 colour, #119 Pretendard) all inherited that entanglement.

On 2026-07-04 we fetched the **official Toss Design System tokens** — the
`@toss/tds-react-native` foundation docs — and diffed them against Field Pro.
Two findings reframed the decision:

1. **Field Pro is a 5-hue, brand-adapted derivative of an 8-hue system.** Real
   TDS ships grey, blue, red, **orange, yellow, green, teal, purple**. Field
   Pro carries only grey/blue/green/red + a **non-Toss ochre** in place of
   orange, and drops yellow/teal/purple entirely. It also diverges on
   typeface, type scale, radius tiers, and spacing (see Appendix C).
2. **But the color foundation is closer than we thought.** The grey and blue
   ramps match TDS at 9 of 10 stops each, and the **green anchors match
   exactly** (`#15c47e` / `#03b26c`). Only the red ramp (exact at `#f04452`
   only) and the warm hues need real work.

Richard's decision: **stop reconciling against the mockup. Build the complete,
faithful Toss system as a clean baseline from the official tokens, then apply
BridgeCircle brand changes as a thin, explicit overlay — added deliberately,
later, only where the brand needs them.** This is "Option 1" from the
2026-07-04 audit (artifact: *Field Pro vs. Real Toss*). It matches the stated
goal: *replicate Toss fully, then migrate onto it and modify for the brand.*

## Decision

Replace 0012's single "Field Pro" bundle with a **two-layer token
architecture**. The shipped brand system keeps the working name **Field Pro**;
it is now defined as **Toss Base + BridgeCircle Brand**.

- **D1 — Two layers, cleanly separated.**
  - **Layer 0 · `toss-base`** — a *faithful, complete* transcription of TDS:
    all **8 hue families × 10 stops**, the greyOpacity scrim scale, the real
    **type scale**, **8px spacing**, **4/8/12/16 radius** tiers, and TDS's
    **one-blue-action** semantics. This layer is brand-neutral and reusable
    for any Toss-style product. Source of truth = the official `@toss/tds`
    docs (Appendices A–B), **not** the Field Pro v2 mockup.
  - **Layer 1 · `bridgecircle-brand`** — a *thin overlay* that redefines only
    the tokens BridgeCircle deliberately diverges on. It starts near-empty and
    grows one logged entry at a time. Everything the brand does not override
    resolves through `toss-base`.

- **D2 — The baseline is complete and unmodified; every divergence is an
  explicit, logged overlay entry.** No silent softening. If we round a radius,
  swap orange for ochre, or make the give button green, that is a
  `bridgecircle-brand` override with a one-line rationale in the fidelity
  ledger — never a value quietly changed in the baseline. "Faithful first,
  bend later" is the whole point; the ledger makes *what's Toss vs what's ours*
  answerable at a glance.

- **D3 — The one mandatory overlay entry at launch is the typeface.** TDS's
  face is **Toss Product Sans (proprietary)** — unusable. The sanctioned
  substitute is **Pretendard** (OFL), the same open analog already self-hosted
  as a Latin-only subset in #119. This is logged as override #1
  (`--font-sans`), documented as a substitution, not a design change. Every
  *other* Field Pro divergence is **optional and deferred** — the baseline
  ships blue-only action, TDS orange, TDS radii, and the TDS type scale until
  we choose otherwise.

- **D4 — The existing Field Pro divergences become the *candidate* overlay
  backlog, not the baseline.** The brand mechanics 0012 established are
  preserved as **proposed overrides**, each applied only when we decide to:
  per-surface action color (**green give button**, `--action-give` green-700
  `#0b8a57`), **section-identity bands** (School blue, give green, dark grey-
  ink), **ochre warning** `#c98a1a`, **softer radii** (card 20 / bubble 18),
  **heavier/larger type** (display 40/800), and the **CircleMark + two-sided-
  buffer copy**. These are BridgeCircle's, not Toss's — so they live in
  `bridgecircle-brand`, sequenced after the baseline stands. The brand
  mechanic *rationales* in 0012 D3/D7 still hold; only their *location* moves.

- **D5 — Yellow, teal, and purple are carried in the baseline, gated in the
  brand.** `toss-base` transcribes all 8 TDS families for fidelity and reuse.
  `bridgecircle-brand` **narrows the member-facing palette** to the roles the
  product uses (grey/blue/green/red + a warning hue), and documents teal/
  yellow/purple as *available-but-unused* rather than deleting them. (Note the
  mockup's Mentor violet `#722fc8` was itself **not** the real TDS purple
  `#a234c7` — a further reason to source the baseline from TDS, not the mockup.)

- **D6 — Two Claude Design projects (a fork), not one layered project
  *(revised 2026-07-04)*.** The canonical *design* homes are **two separate
  design-system-type projects**, synced to two repo bundles via DesignSync
  (`/design-login` + `/design-sync`, interactive-only; `list_projects →
  get_project` verify type `→ list_files → finalize_plan → write_files`;
  `@dsCard` first-line markers index previews):
  - **`toss-base` project** — a *new*, pristine, faithful Toss system (this is
    what you author and view first). Mirrors `handoff/toss-base/`.
  - **`bridgecircle` project** — created **later** as a **fork/copy** of
    `toss-base`, then modified for the brand. Mirrors `handoff/bridgecircle/`.

  **Rationale for a fork over one layered project:** the base is a *frozen
  snapshot* of real Toss (we transcribe it once; we don't pull Toss updates),
  so the overlay's one advantage — automatic inheritance of base changes — is
  worth almost nothing. A fork wins on the properties that matter here: viewing
  pristine Toss on its own, reusing it as a standalone asset, and never risking
  the clean copy. **The repo still keeps the token *layering* discipline**
  (`@layer base, brand` in `globals.css`, D1) so production retains clean
  revert-to-Toss semantics — design structure (two full projects) and
  production structure (layered tokens) are decoupled. The existing
  `fieldpro-design-system` project (id `afcecbf1-0f0b-4ab6-aec3-5ded55d860e6`)
  and its `Toss Style – Field Pro v2` reference are **retained as the seed for
  the eventual `bridgecircle` fork**, not the baseline.

- **D7 — Guardrails are skin-agnostic and stay (0012 D6, unchanged).**
  Token-ratchet CI, role-token indirection, `:root` + `.dark` parity, density
  modes, the email-safe token table, and the measured-contrast table all
  persist — retuned per layer, not removed. New rule: the ratchet also
  **fails a build if a `bridgecircle-brand` override lacks a ledger entry**, so
  the layer boundary can't erode silently.

## Implementation plan

Sequenced so the baseline is trustworthy before any brand bending, and each PR
ships green through the usual stack (biome / lint / tsc / vitest / Playwright /
ratchet). This **re-expresses** the already-merged 0012 work under two layers;
it does not revert it (see *Migration from 0012*).

### Phase A — Author the complete `toss-base` bundle (Claude)

Canonical bundle layout under `handoff/toss-base/project/`:

| Step | Detail |
|---|---|
| A1 | `colors_and_type.css` — the full TDS transcription from **Appendices A–B below**: 8 families × 10 stops, greyOpacity, semantic (`#0064ff` brand blue distinct from `#3182f6` interactive), radius, spacing, type scale. |
| A2 | `uploads/DESIGN.md` + `SKILL.md` — the faithful TDS spec: blue-only action, borderless-on-grey surfaces, TDS type/shape/spacing, **no brand mechanics**. |
| A3 | `preview/*.html` `@dsCard` specimens: all 8 ramps, type scale, spacing/radius, and **blue-only** component set (button, card, badge, toggle, input, bubble). *(The 2026-07-04 showcase artifact is the design intent for these cards.)* |

### Phase B — Fork into the `bridgecircle` bundle (Claude; **deferred until the base is signed off**)

The `bridgecircle` bundle (`handoff/bridgecircle/project/`) starts as a copy of
`toss-base` and diverges over time. In the repo, brand divergences are recorded
in `OVERRIDES.md` (one row per change: token, from → to, rationale, contrast
note) and expressed in production as the `brand` layer; the first and only
launch entry is `--font-sans` → Pretendard (D3). D4's candidates are logged as
**proposed**, applied one at a time in Phase E.

### Phase C — Sync to Claude Design (Richard, interactive)

Create a **new** `toss-base` design-system-type project; verify
`PROJECT_TYPE_DESIGN_SYSTEM` via `get_project`; `/design-sync` push the
`toss-base` bundle; pull down to confirm parity. This is the pristine system to
view first. The `bridgecircle` fork project is created later (Phase E), seeded
from the existing `fieldpro-design-system` project + its `Toss Style – Field
Pro v2` reference (leave that project's `uploads/**` and `_ds_*` artifacts
untouched — never blanket-delete; see `.design-sync/NOTES.md`).

### Phase D — Re-express the production contract as base + overlay

- Refactor `app/src/app/globals.css` into **`@layer base, brand`**: `base`
  carries the TDS ramps/roles under the existing role-token names (so the 26
  primitives keep compiling); `brand` carries only the applied overrides.
  #118's values re-sort into their correct layer (TDS-matching → base;
  ochre/green-give/softened-radii → brand). #119's Pretendard stays as
  override #1.
- Re-measure the contrast table per layer; update the ratchet baseline and add
  the "override needs a ledger entry" check (D7).

### Phase E — Redesign in Claude Design first; translate flow-by-flow; overrides only as proven

> **Amended 2026-07-04 (design-first).** Richard chose a **complete redesign**
> over a surface-by-surface reskin of existing pages. The order inverts: the
> full experience is **designed and iterated in the `bridgecircle` Claude
> Design project first** (screens as project files, checkpoint-synced into the
> repo bundle), and production translation happens **per stabilized flow**,
> not per existing page. The ledger discipline is unchanged — divergences the
> redesign uses are promoted from *proposed* to *applied* with evidence (the
> Help Hub friction log FL-1…8 already justifies the core batch). IA/flow
> changes the redesign introduces are product scope: update the behavior specs
> (user-flows, screen map) in the same change, and the two-sided buffer
> principle binds every redrawn peer-to-peer surface.

The `bridgecircle` fork is the **main design system** — the target all new
design work builds against. When a designed flow stabilizes: promote the
ledger entries it uses, sync, then hand-translate into production
(`globals.css` `@layer base, brand` + owned primitives; never a mechanical
copy, per 0012 D2). **Close-out, when the redesign has landed:** archive the
Civic Editorial docs and the `handoff/bridgecircle-design-system/` bundle to
`_archive/` with a dated pointer, write the fork's production docs fresh,
amend voice-guidelines §13/§14, and flip this ADR to `accepted` (0012 Phase D
scope).

### Migration from 0012 (already-merged work)

Nothing is reverted. #116/#117 (reconciliation) informed the D4 candidate
backlog; #118 (colour swap) is re-sorted into base vs brand layers in Phase D;
#119 (Pretendard) becomes overlay override #1. The net new work is authoring a
*complete, faithful* base layer (the warm hues, spacing, and real type scale
0012 never captured) and drawing the layer boundary.

## Consequences

- **+** *What's Toss vs what's ours* becomes answerable by reading one small
  overlay file — the reusability and "modify later" goal, made concrete.
- **+** The baseline is a complete, faithful Toss system usable beyond
  BridgeCircle (marketing, prototypes, future products).
- **+** Brand changes become deliberate and reversible: revert an override →
  fall back to faithful Toss, with no archaeology.
- **+** Most of the color foundation already exists (grey/blue/green anchors);
  the incremental cost is the warm hues, spacing, type scale, and the boundary.
- **−** Two layers cost more upfront than one bundle, and add a layering
  concept (`@layer base, brand`) the ratchet must police.
- **−** Carrying all 8 TDS families raises misuse risk; the brand-narrowing in
  D5 + the 2–3-hues-per-surface rule are the guardrail.
- **−** Phase D reshuffles already-merged #118 values across layers — churn
  with no visible change; mitigated by role-token indirection.
- **~** "Field Pro" now names the *composed* result; base is "Toss Base." A
  rename is free (names appear only in folder/project labels).

## Alternatives considered

- **Keep 0012's single reconciled bundle (Option 2 in the audit).** Rejected —
  brand and baseline stay entangled; you can never cleanly re-baseline or reuse
  the Toss layer. Faster to ship, worse to live with.
- **One Claude Design project holding both layers (base + overlay files).**
  Rejected *(reversed 2026-07-04, see D6)* — it doubles as neither a clean Toss
  reference nor a clean brand system in the design pane, and its sole edge
  (overlay auto-inherits base changes) is moot because the base is a frozen
  Toss snapshot. Two forked projects give clean viewing + reuse; the repo keeps
  the layered token discipline for production regardless. The cost is a second
  sync surface and possible base↔fork drift, accepted and mitigated by the
  repo-side `@layer base, brand` source of truth.
- **Delete yellow/teal/purple from the baseline too.** Rejected — the baseline
  is meant to be *faithful*; narrowing is a brand concern (D5), so it belongs
  in the overlay, not the foundation.
- **Author the baseline from Field Pro v2 (as 0012 did).** Rejected — the
  mockup is a lossy, brand-tinted approximation; the official `@toss/tds` docs
  are the authoritative source now that we have them.

---

## Appendix A — Real TDS color tokens (authoritative)

Source: official [`@toss/tds-react-native` colors](https://tossmini-docs.toss.im/tds-react-native/foundation/colors/),
cross-checked against [oh-my-design.kr](https://oh-my-design.kr/design-systems/toss). Fetched 2026-07-04.

| Stop | grey | blue | red | orange | yellow | green | teal | purple |
|---|---|---|---|---|---|---|---|---|
| 50  | `#f9fafb` | `#e8f3ff` | `#ffeeee` | `#fff3e0` | `#fff9e7` | `#f0faf6` | `#edf8f8` | `#f9f0fc` |
| 100 | `#f2f4f6` | `#c9e2ff` | `#ffd4d6` | `#ffe0b0` | `#ffefbf` | `#aeefd5` | `#bce9e9` | `#edccf8` |
| 200 | `#e5e8eb` | `#90c2ff` | `#feafb4` | `#ffcd80` | `#ffe69b` | `#76e4b8` | `#89d8d8` | `#da9bef` |
| 300 | `#d1d6db` | `#64a8ff` | `#fb8890` | `#ffbd51` | `#ffdd78` | `#3fd599` | `#58c7c7` | `#c770e4` |
| 400 | `#b0b8c1` | `#4593fc` | `#f66570` | `#ffa927` | `#ffd158` | `#15c47e` | `#30b6b6` | `#b44bd7` |
| 500 | `#8b95a1` | `#3182f6` | `#f04452` | `#fe9800` | `#ffc342` | `#03b26c` | `#18a5a5` | `#a234c7` |
| 600 | `#6b7684` | `#2272eb` | `#e42939` | `#fb8800` | `#ffb331` | `#02a262` | `#109595` | `#9128b4` |
| 700 | `#4e5968` | `#1b64da` | `#d22030` | `#f57800` | `#faa131` | `#029359` | `#0c8585` | `#8222a2` |
| 800 | `#333d4b` | `#1957c2` | `#bc1b2a` | `#ed6700` | `#ee8f11` | `#028450` | `#097575` | `#73228e` |
| 900 | `#191f28` | `#194aa6` | `#a51926` | `#e45600` | `#dd7d02` | `#027648` | `#076565` | `#65237b` |

**Semantic / surface:** interactive `blue-500 #3182f6` · **brand blue `#0064ff`**
(distinct from interactive) · error `red-500 #f04452` · success `green-500
#03b26c` · warning `orange-500 #fe9800` · caution `yellow-500 #ffc342` · info
`teal-500 #18a5a5` · premium `purple-500 #a234c7` · background `#ffffff` ·
greyBackground `grey-100`. **greyOpacity scrims:** `#020913` @ 0.02 → 0.91.

## Appendix B — Real TDS type, radius, spacing

**Type** (face: Toss Product Sans, proprietary → substitute **Pretendard**;
mono: SF Mono; emoji: Tossface):

| Role | Size | Weight | Line-height |
|---|--:|--:|--:|
| Display Hero | 30 | 700 | 40 |
| Display Large | 26 | 700 | 36 |
| Heading Large | 22 | 700 | 30 |
| Heading | 20 | 600 | 28 |
| Subtitle | 16 | 600 | 24 |
| Body Large | 16 | 400 | 24 |
| Body | 14 | 400 | 22 |
| Body Small | 13 | 400 | 20 |
| Caption | 12 | 400 | 18 |
| Label | 10 | 500 | 1.5 |

**Radius:** compact 4 · standard 8 · comfortable 12 · large 16 · pill 9999.
**Spacing:** 8px base — 4 · 8 · 12 · 16 · 20 (page padding) · 24 · 32 · 40 · 48.

## Appendix C — Current Field Pro deltas (the overlay backlog)

What `bridgecircle-brand` currently diverges on, vs `toss-base`. Each is a
candidate override (D4); all but the font are deferred until a surface needs it.

| Dimension | Toss Base | Field Pro override | Status |
|---|---|---|---|
| Typeface | Toss Product Sans | Pretendard (Latin subset) | **applied** (mandatory substitute) |
| Warning hue | orange `#fe9800` | ochre `#c98a1a` | proposed |
| Give action | blue `#3182f6` | green-700 `#0b8a57` | proposed |
| Section bands | none | School blue / give green / dark grey-ink | proposed |
| Radius | 4 / 8 / 12 / 16 | 12 / 14 / 18 / 20 (softer) | proposed |
| Type scale | max 30/700, floor 10px | display 40/800, floor 12px | proposed |
| grey-200 | `#e5e8eb` | `#e6e9ee` | proposed |
| blue-400 | `#4593fc` | `#3b8bf7` | proposed |
| red ramp | TDS stops | re-interpolated (600 = TDS 700) | proposed — **revert to TDS** |
| green darks | 600–900 TDS | softened | proposed |
| Palette breadth | 8 families | narrow to grey/blue/green/red + warning | proposed (D5) |
| Marks | — | CircleMark, two-overlapping-circles | proposed (brand, not skin) |
