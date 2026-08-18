# DesignSync notes — bridgecircle (brand fork)

## Shape: hand-authored fork (NOT the converter flow)

Byte-copy of the `toss-base` bundle (2026-07-04, post PR #121) plus the
divergence ledger (`uploads/OVERRIDES.md`) and the baseline-test evidence
(`Help Hub.html`). Direct file push of `project/**`; no converter, no
`register_assets` (`@dsCard` markers index the cards).

## ⚠ SYNC IN FLIGHT — templates restructure, pull complete (2026-08-14)

The remote restructured `templates/` on 2026-08-14: the 15 per-flow folders are
gone, replaced by a flat `templates/screens/` (26 screens + shared `Shell`, `Card`,
`Avatar`, `Toast`, `Screens`). Claude Design resolves `<dc-import>` against
**siblings**, so a shared component and the screens using it must sit in one
directory — that is what the flat tree buys, and it is what collapsed 13 divergent
sidebars and 18 divergent topbars into a single `Shell.dc.html`.

The initiative tracking this:
[`Initiatives/design-templates-syncdown/plan.md`](../../../../../../../engineering-spec-obsidian-vault/Initiatives/design-templates-syncdown/plan.md)

Done in PR #194: token `@kind` annotations (33 declarations), both
`templates/*.md`, and `ds-base.js` base-path verification (`'../..'` is correct).

**Re-sync log — 2026-08-14, the pull.** All 42 files of `templates/screens/` are
now on disk and byte-exact: 32 `.dc.html`, 9 data/menu `.js`, plus the one vendored
`support.js` (64,222 b — the compiled dc-runtime, one copy for the whole flat
tree). Verification clean: no zero-byte file, no fetch reported `truncated`, every
`.dc.html` opens `<!DOCTYPE html>` and closes `</html>`, `node --check` passes on
all 10 `.js`, and every `var(--…)` resolves against `colors_and_type.css`. The 5
stale per-flow references in `design-qa.md`, `preview/system-states.html`, and
`preview/decision-dialogs.html` now point at `templates/screens/`.

Two mechanics worth not rediscovering. `DesignSync` is **main-thread only** — a
subagent cannot see the tool, so this can never be delegated. And `get_file`
returns bodies into the model context, which must never be retyped into a `Write`;
content is extracted from the session transcript, or — for results over ~50 KB,
which the harness spills to `tool-results/*.txt` instead of inlining — from that
sidecar file. Both are byte-exact; retyping is not.

The 15 per-flow folders (65 files) are deleted, so `templates/screens/` is the
only tree under `templates/` and there is nothing left to confuse it with.

A structural diff against `list_files` puts the bundle at parity, with exactly
four remote files deliberately not vendored — `templates/sync-plan/{SyncPlan.dc.html,
ds-base.js,support.js}` and `uploads/repo_copy-1786737908051-cmac.html`. Those are
remote-authored files outside this sync's scope, left in place by decision rather
than missed. Local-only paths are `screenshots/**` (QA evidence, never pushed) and
gitignored `.DS_Store`.

**Pushed back the same day, closing the loop.** Three files went up —
`preview/system-states.html` and `preview/decision-dialogs.html` (provenance
comments repointed at `templates/screens/`) and `templates/TOKEN-KINDS.md` (its
prose claimed "22 unique" unclassifiable tokens while listing 21; corrected to 21,
with the 21-names → 33-declarations arithmetic spelled out) — plus a
`_ds_needs_recompile` sentinel. `TOKEN-KINDS.md` was read back and is byte-
identical at 3,094 b.

Four files were deleted from the remote in the same plan, all of them finished
scaffolding for this sync: `templates/sync-plan/{SyncPlan.dc.html,ds-base.js,
support.js}` — the decision brief plus the runtime duplicated only to render it —
and `uploads/repo_copy-1786737908051-cmac.html`, a pre-restructure snapshot of
`Onboarding` that still carried the old per-flow links (`../home/Home.dc.html`).
Both were actively wrong to keep: the first re-introduced the duplicate runtime
the flatten removed, the second preserved the paths this sync purged. The brief's
four decisions survive in the initiative's decisions log, so nothing was lost.

**The two sides are now at parity** — a structural diff against `list_files`
returns nothing missing locally. Local-only paths are `screenshots/**` (QA
evidence, never pushed) and gitignored `.DS_Store`.

### The `@kind` annotations had never actually reached the project (2026-08-14)

Chasing the "31 of 371" discrepancy turned up the real problem. The annotations
were written into the repo's `colors_and_type.css` in PR #194 — but **that file was
never pushed**. The project kept serving an un-annotated copy: **0** occurrences of
`@kind` remotely against **33** locally. A diff showed 66 changed lines that were
*only* those 33 declarations, annotated versus not — no value drift anywhere.

So `check_design_system` had been reading a file with no annotations in it, and
re-running it would have reported every token as unclassifiable no matter how
correct the repo was. Applying the rules is only half the job; the file has to be
re-synced. `colors_and_type.css` was pushed and read back byte-identical
(31,514 b, 33 `@kind`), and `TOKEN-KINDS.md` now carries a STATUS block recording
that it is applied and synced, so nobody redoes the work.

**Worth generalizing:** file-name parity is not content parity. The structural
diff against `list_files` was green the whole time this was wrong, because both
sides had a file called `colors_and_type.css`. Content-check the files that matter
after any push.

### Closed out — zero token findings (2026-08-14)

Richard re-ran `check_design_system` after the sync fix. The first pass took it
from 22 findings to 6, and the checker then **named those six outright** instead
of the earlier heuristic reconstruction: `--lh-label` → `@kind font` (the only
line-height in the type scale written as a unitless ratio, so neither value nor
name classifies it) and the five motion/easing tokens → `@kind other` (durations
and curves are none of the five buckets). All six are `:root`-only, so unlike the
first batch there was nothing to mirror into `.dark`.

Applied, pushed, and read back byte-identical. **The re-run after that reports
zero token findings.** Total is 39 annotations — 21 color, 12 shadow, 5 other,
1 font. The one item the checker still reports is the style-attribute note on
`Avatar.dc.html`, which is permitted by design.

`--weight-regular/-medium/-semibold/-bold` were deliberately left un-annotated:
a naive scan flags them as bare numerics, but the checker never named them, so it
classifies them fine. The checker's list is the authority — annotating past it is
guessing, which is what made the earlier reconstruction 4-for-6.

Note for anyone doing this again: `check_design_system` is app-side, inside the
Claude Design project. There is no Claude Code tool binding and no repo script, so
it cannot be run from here — the repo can prepare and sync the annotations, but a
human has to run the check in the project and report back.

## Project pin — migrated to the BridgeCircle org (2026-08-14)

**Current pin: `403a99dc-f481-472b-974d-aea93ee512f9`** (`bridgecircle`,
design-system type), created in the **BridgeCircle Team org** and recorded in
`config.json`. Use this one.

Why the move: the account's claude.ai context is now the BridgeCircle Team org
(`8f170479-757f-4e24-a49b-84b49214ccb2`, joined 2026-07-25), and the two
original projects — created 2026-07-04, before that — sit outside it. They are
**invisible in the org**: `list_projects` returns nothing for them, the Design
systems tab is empty, `claude.ai/design/<id>` redirects to `/design`, and they
don't appear in the composer's design-system picker. They remain reachable by
pin through `DesignSync` (`canEdit: true`), so nothing is lost, but they can be
neither renamed nor deleted (the tool has no method, and the UI can't open
them). The new org project now lists and resolves normally.

**Legacy pins (reachable by id only, read-only from here on):**

- `b07651c7-8d28-43bd-ad1a-7af68e3f219b` — Richard's original `bridgecircle`.
  Frozen at the 2026-07-12 push; verified byte-identical to `d528f7d1` on
  2026-08-13. Keep as the pre-migration snapshot.
- `1212d2cf-4e45-4dfc-8519-93f06b1bb758` — Daniel's original pin.
- `f58b5256-e8d6-4e4f-b164-7f1bdd33760d` — `toss-base` baseline (16 files).
  **Staying unmigrated by decision (Richard, 2026-08-14)**: it's the frozen
  faithful-TDS reference the fork audits against, it holds the remote original
  of `Help Hub.html`, and it's reachable by pin. Not a TODO.

**One shared pin — the per-user convention is retired (2026-08-14).** Daniel is
in the same BridgeCircle org, so `403a99dc…` is writable by both maintainers and
the committed `config.json` is the pin for everyone. The gitignored
`config.local.json` override is **gone**: delete any stale local copy, because it
still points at a pre-org project that is invisible in the org. The section below
is kept only as the historical record of why the split existed.

Two people, one account: the API reports this account's display name
inconsistently (`list_projects` → "Richard", `get_project` → "Dongwoo"). Both are
Richard — not a second maintainer, and not a sharing problem.

**Migration run — 2026-08-14.** `create_project` → `finalize_plan` →
one `write_files` of **111 files** (the 110 syncable bundle files +
`_ds_needs_recompile`); no deletes. `list_files` confirms all 111 landed, and
`colors_and_type.css` read back from the remote matches local. Deliberately not
pushed, unchanged from the standing rule: `screenshots/**` (51 local QA PNGs),
`.DS_Store`, and the app-generated set (`.thumbnail` ×15, `_ds_manifest.json`,
`_adherence.oxlintrc.json`). `fonts/PretendardVariable.woff2` is still absent —
it was never pullable (2 MB vs the 256 KiB `get_file` cap), so `fonts.css`'s
`@font-face` dangles and templates load Pretendard from the CDN, exactly as
before. It *is* pushable if a self-hosted copy is ever wanted (the cap is on
reads, not writes). **New in this push:** `Production/README.md` and
`Prototype/README.md`, the vault-mirroring split scaffold, which had never been
synced anywhere.

**Production parity sweep — 2026-08-14.** Before pushing, the bundle's tokens
were compared against `app/src/app/globals.css` with every `var()` chain
resolved and px/rem normalized. **246 of 249 shared light tokens already
matched**; three didn't, and production won all three (see the ledger's
"Production parity sweep" section): `--action-weak-text` → `--blue-700`,
`--state-danger-text` → `--red-700`, `--divider` → `var(--divider-row)`. Light
is now **249/249**. Doc drift fixed in the same pass: the stale "floor raised
10px → 12px" comment (the 08-13 amendment made it 11px), and — the significant
one — **the "dark is parked, v1 light-only" claim, which production has
contradicted since it shipped a 134-token `.dark` theme, a next-themes
provider, and a member-facing theme picker.** The bundle's 39-token `.dark`
disagrees with production on 11 of the 12 tokens both define. Flagged in
`colors_and_type.css`, `SKILL.md`, and the ledger; **not reconciled** — whether
the fork adopts production's dark values or runs its own dark pass is a design
call. `templates/README.md`'s "copies edited in Claude Design are canonical"
rule was also inverted to match reality (see below).

**Gap closure — 2026-08-14 (second push).** The two gaps left open by the
migration were closed rather than carried:

- **Dark mode adopted from production.** Decided rather than deferred: the
  39-token guess was replaced with **108 declarations generated from
  production** (18 ramp flips + 90 role overrides, in production's idiom), and
  the resolved-value sweep now reads **light 249/249 and dark 67/67 identical**.
  Dark is a buildable layer again; see the ledger's dark-theme entry for what
  the adoption does and doesn't cover. Comments in `colors_and_type.css`,
  `SKILL.md`, and the ledger all updated — nothing still says "parked".
- **Font vendored, `@font-face` no longer dangling.** `fonts/` never existed in
  this bundle because the 2 MB `PretendardVariable.woff2` exceeded the 256 KiB
  read cap. But production doesn't serve that file — it self-hosts a **101 KB
  Latin-only subset** (`app/src/app/fonts/PretendardLatinVar.woff2`, weight axis
  45–930, via next/font/local). That file is in the repo, under the cap, and is
  what members actually load, so it was copied to
  `fonts/PretendardLatinVar.woff2` and `fonts.css` repointed at it (weight range
  corrected 45–920 → 45–930 to match). No download was needed; the design system
  and production now serve the same face. Templates keep loading the CDN
  dynamic-subset CSS as well, unchanged.

**Write access — resolved (Richard, 2026-08-14).** Daniel owns this org's
permissions, so he can write `403a99dc…`; the shared-pin convention holds. The
project also shows as the org's **default** design system in the composer picker.
Nothing to verify.

**`toss-base` is Richard's personal project, deliberately outside the org**
(Richard, 2026-08-14) — not an oversight and not a migration TODO. Its
`config.json` keeps the pre-org pin `f58b5256…`; syncing it works by pin, it just
won't appear in the org's Design systems list. Don't "fix" it.

**Dark mode is NOT done and NOT contrast-measured (Richard, 2026-08-14).**
Production's dark theme was built as an *experiment*: it ships with a real theme
picker, so members can turn it on, but it has never been design-reviewed and its
contrast pairs have never been measured. The bundle now mirrors it, which makes
the design system honest about what dark renders — it is **not** a sign-off.
Standing rule until a real dark pass: design in light, read `.dark` as a record
of current behavior, and don't ship new dark-only surfaces or cite dark values as
precedent without a WCAG AA check. Fix path is *fix production, then re-mirror* —
hand-editing the bundle is how the 2026-07 drift started. Flagged in
`colors_and_type.css`, `SKILL.md`, and the ledger, each carrying the same
starting list of likely-failing pairs. No specimen renders dark either, so the
gallery can't catch a failure visually.

**Template authorship inverted (2026-08-13 finding).** The remote stopped being
the source of truth for `templates/**` on 2026-07-15. Commits `9dcc4a3f`
(asker-side v2 flows) and `f03b84f7` (v2 flow closure) authored **24 of the 27
`.dc.html` screens in the repo**, and a 7-file structural diff against the old
project confirmed the remote had changed nothing since the 07-12 push — every
sampled file matched `d528f7d1` byte-for-byte (`README.md`, `Entry`,
`SignedOut` identical to local as well; `AskHistory`, `AnnouncementRead`,
`SystemStates`, `DESYNC-TODO.md` stale). So the repo is canonical for templates
now, and `templates/README.md` says so.

## Per-user project pins — RETIRED 2026-08-14 (historical record only)

> **Do not follow this section.** It described the pre-org world, where each
> maintainer pushed into their own account's project. Both maintainers are now
> in the BridgeCircle org and share one pin (`403a99dc…` in `config.json`).
> Kept only to explain the legacy pins above.

The repo bundle is the shared source of truth; each syncer pushes it into
their **own** Claude Design project (projects are per-account — Daniel cannot
see Richard's, and vice versa). Convention:

- `config.json` (committed) stays Richard's pin
  (`b07651c7-8d28-43bd-ad1a-7af68e3f219b`) — do not overwrite it.
- Each other syncer keeps a **gitignored** `config.local.json` next to it with
  their own `projectId`. When present, `config.local.json` wins; otherwise fall
  back to `config.json`. Daniel's pin
  (`1212d2cf-4e45-4dfc-8519-93f06b1bb758`, created 2026-07-10) lives there.
- Worktree gotcha: `config.local.json` is gitignored, so it does **not** exist
  in fresh git worktrees (or fresh clones). Recreate it from the pin recorded
  above before syncing — never fall back to `config.json` just because the
  local file is missing (that would push into the other maintainer's project).

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

**Doc-drift pass — 2026-07-12 (fifth run).** Reconciled the design docs made
stale by the 07-12 changes. Fixed: **SKILL.md** (retired the band-anatomy
"Identity mapping" section → wash heroes + navy covers; added the 2026-07-12
applied block; E1 applied not proposed; in-row give pill → `--give-tint-weak`;
`--border-subtle #eef1f5`; dark parked), **uploads/DESIGN.md** (batch-3 line:
bands→washes, E1/E5/E6/E7, dark parked, "Can help with"; also fixed a
	pre-existing historical "1140px shell" → 1320 correction, superseded by the
	2026-07-14 full-viewport shell rule), the repo-facing **README.md** (applied-
overrides paragraph: E1–E3+E5–E7, washes not bands, v1 light-only), and a
dated snapshot-note on **ADR 0013 Appendix C** pointing at OVERRIDES.md for
live status (the appendix is a 2026-07-04 snapshot; not retro-edited).
Pushed SKILL.md + DESIGN.md (design-agent inputs) + sentinel; README and the
ADR are repo-only. Confirmed NOT drift and left alone: the `docs/experience/
screens/` index references (that's the canonical product screen-map, a
DIFFERENT dir from the deleted Codex bundle slice) and 0011's "what they can
speak to" (match-language copy, not the section title).

**Re-sync log — 2026-08-13 (drift audit reconciliation).** A production-vs-docs
drift audit found the *bundle* and production disagreeing on two applied
overrides, in the direction of production having silently reverted them:
`--radius-large` 20→16 and `--radius-card-xl` 22→16 shipped in `56002cd`
(2026-07-21, "fix: finish UI audit polish", ~30 files) with **no ledger entry**,
and O4's 12px label floor had never been held in production at all (~81
sub-12px call sites vs 69 at 12px; `StatusBadge size="sm"` is itself 11px).
Richard reviewed 20 against 16 side by side and **kept the tighter 16**, so the
bundle was amended to production rather than production restored to the bundle.

**Pushed (5 + sentinel):** `colors_and_type.css` (`--radius-large` 20→16,
`--radius-card-xl` 22→16, O6/O9 comment blocks and the header override summary
rewritten), `SKILL.md` (applied-overrides line: card 16, 11px floor; the
elevated-card rule now states radius is *not* a differentiator),
`uploads/OVERRIDES.md` (**O6, O9, O4 amended 2026-08-13** in the ledger's
strike-through style, each carrying the evidence and the decision), and
specimens `preview/spacing-radius.html` (@dsCard subtitle + tier heading +
Card value 20→16) and `preview/type.html` (floor 12→11px). No deletes.
`_ds_needs_recompile` armed — the spacing-radius **@dsCard subtitle** changed,
and the card index is compiled from those first lines.

Verified: all four sources (app `globals.css`, bundle `colors_and_type.css`,
production `tokens.md`, ledger) now read 16/16; every `var()` in both touched
specimens still resolves; `get_file` read back from the remote confirms the
push landed. Templates were **not** touched — the 20px literals in
`templates/**` and `preview/decision-dialogs.html` are *dialog* radii, which
remain on the parked template↔token drift list, not the card tier.

O4's amendment is a *narrowing*, not a rejection: floor 11px, with `overline`
11 / `chip` 11.5 legal for eyebrows and counters only, and `micro` 10 /
`fine` 10.5 closed to new use and scheduled for removal (~26 call sites still
to migrate in the app — **not yet done**). Still above the TDS 10px floor.

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
