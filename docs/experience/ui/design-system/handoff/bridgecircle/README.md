# bridgecircle — handoff bundle

**BridgeCircle's MAIN design system** — Layer 1 of
[ADR 0013](../../../../../decisions/0013-toss-baseline-then-brand-overlay.md).
A fork of [`toss-base`](../toss-base/) (faithful TDS) that diverges only
through logged entries in
[`project/uploads/OVERRIDES.md`](project/uploads/OVERRIDES.md).

This is the system all new design work targets: the **complete redesign is
designed in the `bridgecircle` Claude Design project first**, then translated
to production flow-by-flow (ADR 0013 Phase E, design-first). Civic Editorial
(`../bridgecircle-design-system/` — the old system, unrelated despite the
similar name) describes live production only and is archived when the
redesign lands.

The fork now carries the applied O1–O4 and O6–O9 overrides plus E2 and E3:
Pretendard, the green Give lead action, constrained section identity, the
larger type ceiling, softer radii, refined hairlines, gradient primary finish,
elevated cards, the avatar palette, and the desktop shell. O5 was rejected;
E1 and E4 remain proposed. `project/uploads/OVERRIDES.md` is authoritative.

## Layout

```
bridgecircle/
  project/                     ← the sync localDir (pushed to the fork project)
    colors_and_type.css        ← fork tokens (= toss-base + applied ledger entries)
    SKILL.md                   ← design-agent guidance (ledger-first)
    uploads/OVERRIDES.md       ← THE DIVERGENCE LEDGER (read first)
    uploads/DESIGN.md          ← fork framing; baseline spec stays in toss-base
    preview/  ui_kits/         ← component and pattern specimens
    templates/                 ← page + flow mockups (Claude Design DC templates)
    Help Hub.html              ← baseline-test evidence (Ask/Give + friction log)
  README.md                    ← this file (repo-facing; NOT pushed)
  .design-sync/                ← sync notes + the project pin
```

## First sync (Richard, interactive `claude` session)

1. In Claude Design, create a **new design-system-type project** named
   `bridgecircle` (type is immutable at creation).
2. `/design-sync` push with `localDir` = `project/` (verify
   `PROJECT_TYPE_DESIGN_SYSTEM` via `get_project` first).
3. Pin the project id in `.design-sync/config.json`
   (same shape as the toss-base pin).

## Rules

- **Never edit `toss-base` for brand reasons** — divergence happens here, with
  a ledger entry.
- **Unlogged divergence is drift.** If the fork's tokens differ from the
  baseline without an OVERRIDES.md entry, that's a bug.
- Complete page work is designed in the `bridgecircle` Claude Design project
  and synced down to `project/templates/`; `project/preview/` remains the
  component/pattern specimen layer. (The earlier Codex `screens/` slice was
  removed 2026-07-12 as redundant with the templates.)
- Production translation: `app/src/app/globals.css` uses
  `@layer base, brand` — the brand layer carries only **applied** entries.
