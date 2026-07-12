# DesignSync notes — bridgecircle (brand fork)

## Shape: hand-authored fork (NOT the converter flow)

Byte-copy of the `toss-base` bundle (2026-07-04, post PR #121) plus the
divergence ledger (`uploads/OVERRIDES.md`) and the baseline-test evidence
(`Help Hub.html`). Direct file push of `project/**`; no converter, no
`register_assets` (`@dsCard` markers index the cards).

## Project pin

Created and pinned (2026-07-04). Project `bridgecircle`
(`b07651c7-8d28-43bd-ad1a-7af68e3f219b`, created via DesignSync
`create_project` — design-system type) is recorded in `config.json`. First
push **done 2026-07-04**: all 18 `project/**` files (12 preview specimens + app
starter + `colors_and_type.css` + `SKILL.md` + `uploads/DESIGN.md` +
`uploads/OVERRIDES.md` + `Help Hub.html` — a legitimate bundle file in THIS
fork, unlike in toss-base) pushed at their project-relative paths; no deletes.
A re-sync is a direct `write_files` of the changed `project/**` files against
this pin — no converter, no `register_assets` (`@dsCard` markers index the
cards), no anchor (compare against a fresh `list_files`). Write a
`_ds_needs_recompile` sentinel after adding/renaming `@dsCard` specimens.

**Re-sync log — 2026-07-05.** Fork diverged from the 18-file byte-copy to **26
files** (20 preview specimens): brand overrides applied to `colors_and_type.css`
and most specimens, plus 8 new specimens across three new groups — **Brand**
(`brand-identity`), **Desktop** (`desktop-shell`, `desktop-patterns`,
`desktop-tables` — the E3 extension), and **Pages** (`help-heroes`, `messages`,
`people-directory`, `school-events`). Full bulk re-push of all 26 files against
the pin; no deletes; recompile sentinel armed.

**Re-sync log — 2026-07-07.** Targeted push of 7 changed files + sentinel
(no deletes, no bulk re-push): **`uploads/FLOWS.md` pushed for the first time**
(the full redesign flow spec — it had never been synced), `uploads/OVERRIDES.md`
(E3 ⌘K + nav-ring amendments + a new "audit-ledger, not a design source"
orientation header), `colors_and_type.css` + `SKILL.md` (⌘K/global-search
removed from the topbar; `--nav-active-ring: none`), and specimens
`desktop-shell.html` (search bar removed), `people-directory.html`
(⌘K chip removed; "Ask for advice" → "Ask for help"), `help-heroes.html`
(same CTA rename). `_ds_needs_recompile` armed. Push driven directly via the
`DesignSync` tool (hand-authored fork = not the converter flow); Richard's
claude.ai/design login was live in-session.

**Pull log — 2026-07-12 (reverse direction: remote → local).** Richard built
a full Claude Design mockup set covering every flow/page in `uploads/FLOWS.md`;
this run synced it DOWN into `project/templates/`. Pulled **66 files** — the
`templates/**` tree (27 `<name>.dc.html` DesignComponent screens across
app-shell · entry · help · home · messages · my-circle · notifications ·
onboarding · people · profile · profile-self · profile-slideover · school ·
settings · system-states, each with its own `ds-base.js` / `support.js`
(dc-runtime) / `*-data.js`, plus `app-shell/account-menu.js`) — and the root
`Career Timeline Options.html`, plus two tiny runtime deps the `.dc.html`
`<head>` chain needs: `_ds_bundle.js` (near-empty namespace stub — these are
hand-authored templates, not registered components; React is provided by the
Claude Design host) and `fonts.css`.

Fidelity: **byte-faithful, not transcribed.** `DesignSync get_file` streams
content into context; large results persist to the harness `tool-results/`
dir, small ones inline into the session `.jsonl`. Both hold the full JSON, so
extraction is `json.load`-clean from disk (scratchpad `sync_extract.py`) — no
hand-copying. All 66 validated with `node --check` (JS + every embedded
`data-dc-script`) and an HTML structure pass; all 92 `var(--*)` tokens resolve
against `colors_and_type.css` (the lone `--danger`, onboarding only, carries an
inline `#d64545` fallback).

Intentionally **not vendored**: per-template `.thumbnail` JPEGs (app-generated
previews), `_ds_manifest.json` + `_adherence.oxlintrc.json` (app-internal
index/lint), and `fonts/PretendardVariable.woff2` — the 2 MB font exceeds
`get_file`'s 256 KiB cap so it can't be pulled whole; templates load Pretendard
from the CDN (`cdn.jsdelivr.net/gh/orioncactus/pretendard`), so rendering is
unaffected and `fonts.css`'s `@font-face` is the only dangling ref. No push /
no `register_assets` this run — pull only; the remote project is unchanged.

**Re-sync log — 2026-07-12 (second run, bidirectional).** Structural diff vs a
fresh `list_files` after the morning pull. **Pulled (2):**
`uploads/DESYNC-TODO.md` — Richard's remote-authored reconciliation plan
(2026-07-12 templates-vs-DS audit with decided verdicts; it's a repo work plan,
tracked locally now, **not yet applied**) — and
`templates/onboarding/Onboarding.dc.html`, which Richard fixed remotely
(`var(--danger, #d64545)` ×4 → `var(--error)`) *after* the morning pull; the
pull-log line above about the `--danger` fallback is superseded. Both verified
byte-faithful via transcript extraction. **Pushed (19 + sentinel):** the new
`screens/**` gallery (11 files, `@dsCard` groups "Screens", "Screens · People",
"Screens · Profile" — first push), `templates/README.md` (local-authored),
`SKILL.md` (Jul 10 edit), `uploads/FLOWS.md` (v3 body, d5123f6 — remote was
stale since the 07-07 push), `uploads/OVERRIDES.md`, plus idempotent re-pushes
of `colors_and_type.css` and the three d5123f6 specimens (desktop-shell,
help-heroes, people-directory) since commit-vs-push timing was ambiguous.
No deletes; `_ds_needs_recompile` armed. Templates deliberately NOT pushed —
remote is their source of truth (per DESYNC-TODO: DS sources read-only there,
templates authored there).

**Re-sync log — 2026-07-12 (third run: DESYNC-TODO applied).** The remote
audit plan was executed in-repo the same day: tokens minted/changed/removed
per §3 (E1 applied; E5/E6 new; `--border-subtle` → #eef1f5; band anatomy
retired — see the OVERRIDES O3/O7 amendments), §1 specimens reworked
(school-events, messages, help-heroes + the v3 search-first get hero,
desktop-patterns — an unlisted consumer of the removed green band — and
spacing-radius's stale body), §3b brand card rebuilt, §2's ten new "Patterns"
specimens authored from the templates (waiting-on-you · ask-status ·
home-spotlight · notifications · profile-slideover · profile-patterns ·
decision-dialogs · system-states · onboarding-chrome · settings-circle).
Validation: all 30 preview specimens grep-verified (every var() resolves; no
removed token remains; @dsCard first lines intact) + browser render-check via
the static-docs server. Push: 37 writes + sentinel. **Deleted `screens/**`
(11 files) local + remote** — Richard's call: the Codex People/Profile slice
is redundant with `templates/**`; references fixed in README/SKILL/FLOWS/
templates-README. New ledger items for the NEXT pass: **E7 proposed** (the
templates' translucent green tint pair) and a parked template↔token drift
list (scrim value, skeleton greys, expiry-pill copy variants, can-speak-to
naming, School dropping --cover-texture, dialog radius/shadow, #f4f6f9).
§5's template-literal swap pass is still deferred (template-side).

**Re-sync log — 2026-07-12 (fourth run: pre-build ratchet + DESYNC §5).**
Richard's calls: **E7 minted** (`--give-tint` .12 / `--give-tint-weak` .1 —
comparison artifact 8cfd6a36); **dark mode parked, v1 light-only**; expiry
copy = both variants by context; **"Can help with" canonical** (renamed in
FLOWS §7, ProfileSelf + Help templates, profile-patterns specimen).
**`preview/ask-composer.html` added** (the last pattern-layer hole; browser-
verified). **DESYNC §5 DONE:** scripted literal→var swap — 99 hex/tint swaps
across 18 `.dc.html` templates + 10 tint swaps in specimens; skeleton-shimmer
gradients and SVG presentation attributes deliberately excluded; the 0.14
dot-halo left as a one-off. Evidence correction logged on E5: the audit's
"×71 page canvas" for `--surface-canvas` was the shimmer mid-stop. Validated:
all template var() resolve, `node --check` clean (files + dc-scripts), live
dc-runtime render of Help.dc.html clean. Push: 31 files + sentinel (this run
DOES push templates — a sanctioned one-off inversion for the mechanical swap;
remote remains the design origin, now byte-equal to the repo).

## Help Hub.html provenance

Originally designed by Richard **in the `toss-base` Claude Design project**
(2026-07-04 faithful-baseline test; pulled down the same day). The local
mirror was moved here because it is brand content (ADR 0013 layer discipline).

- The **remote original in the `toss-base` project** stays there until Richard
  moves it inside Claude Design — toss-base syncs must **never delete or
  overwrite it** (it is listed in that bundle's preserved-files rule).
- Once the `bridgecircle` project exists, this copy pushes there like any
  bundle file, and the fork project becomes its natural home. If Richard keeps
  editing the original in toss-base instead, re-pull from there before
  trusting this copy.

## Divergence discipline

- The fork may differ from `toss-base` ONLY per applied `OVERRIDES.md`
  entries. Scaffolded at O1 (Pretendard); as of 2026-07-05 it has diverged
  much further — brand overrides (O2/O3/E2 per the `brand-identity` specimen)
  and the E3 desktop extension are applied, and most specimens now differ from
  the baseline. **`uploads/OVERRIDES.md` is the ledger of record** — every
  divergence from `toss-base` must be entered there; keep it current so the
  fork stays auditable against the baseline.
- When applying an entry: change fork tokens/specimens → flip entry to
  applied with date + exact values → re-measure touched contrast pairs →
  sync → translate to production (`@layer base, brand`).
- Desktop work (E3) is an *extension* — new ground, not an override; TDS is
  mobile-only (see toss-base DESIGN.md §7).
