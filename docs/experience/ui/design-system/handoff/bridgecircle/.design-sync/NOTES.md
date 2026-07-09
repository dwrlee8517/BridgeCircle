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
