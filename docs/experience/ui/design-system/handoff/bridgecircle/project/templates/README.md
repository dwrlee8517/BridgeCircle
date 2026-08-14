# BridgeCircle screen templates (Claude Design)

The target-redesign mockups for **every flow and page** in
[`../uploads/FLOWS.md`](../uploads/FLOWS.md). This is the page-and-flow layer that
sits beside the component specimens in [`../preview/`](../preview/).

Everything lives in one folder, [`screens/`](./screens/), because Claude Design
resolves `<dc-import>` against **siblings** — a shared component and the screens
that use it have to be in the same directory. `screens/Screens.dc.html` is the
index and the single template entry ("BridgeCircle member app"); open it first.

## Structure (changed 2026-08-14)

    screens/
      Screens.dc.html      index — links every screen (the template entry)
      AppShell.dc.html     blank screen: Shell + an empty Card. Copy this.
      Shell.dc.html        THE app shell — sidebar, topbar, bell, account menu
      Card.dc.html         the two sanctioned card surfaces (elevated [O9] / flat)
      Avatar.dc.html       initials circle — palette 1–6 [E2], self, neutral
      Toast.dc.html        the confirmation pill
      <Screen>.dc.html     26 screens, each mounting Shell with chrome props
      *-data.js            sample content
      account-menu.js      <bc-account-menu>, mounted by Shell
      ds-base.js           loads this design system — one line to edit
      support.js           the compiled dc-runtime

Before this pass, 24 screens each carried their own hand-maintained copy of the
sidebar and topbar. They had drifted into **13 different sidebars and 18
different topbars** — two back-button treatments (38px chevron / 36px glyph),
two paddings (26 / 30), sticky and non-sticky variants, three different bells,
and a DC-native account menu in Home and AppShell alongside the
`<bc-account-menu>` every other page used. That is now one file.

## Using Shell

```html
<dc-import name="Shell" active="school" title="Newsletter"
  backHref="./School.dc.html" backLabel="Back to School"
  meta="{{ countLabel }}" bell="none" label="School — newsletter archive"
  hint-size="100%,100vh">
  <!-- page content -->
</dc-import>
```

| prop | |
|---|---|
| `active` | `home` · `help` · `people` · `messages` · `school` · `none` |
| `title` `meta` `label` | topbar title, the small `· meta` after it, `data-screen-label` |
| `backHref` + `backLabel` / `backClick` | back button as a link or a handler |
| `crumbLabel` `crumbHref` `crumbHere` | breadcrumb |
| `actionLabel` `actionHref` | the right-hand text link ("All issues →") |
| `bell` | `menu` (popover) · `current` (on the Notifications page) · `none` |
| `msgBadge` `notificationDot` | nav badge count, bell dot |
| `rail` | 72px icon rail instead of the 240px sidebar (Messages) |
| `me*` | `meName` `meInitials` `meMeta` `meEmail` |

`<main>` owns the scroll for every screen (`height:100vh;overflow-y:auto`), so
there is no scroll-mode prop: screens whose content column scrolls internally
never overflow it, screens whose page is long scroll it, and the sticky topbar
stays put either way. Every style attribute in `Shell.dc.html` is a literal —
nav rows are written out per state — so the shell paints as it streams.

Shell owns the bell popover state (`bcNotifRead` / `bcNotifSeen` in
sessionStorage), so screens no longer need it. Several screens still expose
now-unused `bellToggle` / `popOpen` / `showDot` values from their logic class;
harmless, and safe to delete next time you touch them.

## Still to do

- **Cards.** `Card.dc.html` is the canonical surface, and `AppShell` uses it, but
  the other ~89 elevated-card instances across 20 screens are still hand-rolled.
  Migrating them is per-site work (each has its own padding and inner layout).
- **Avatars.** Shell's bell popover uses `Avatar`; the remaining `--avatar-N-bg`
  sites in the screens do not yet.
- **110 hex literals remain** (down from 336). The 226 that had an exact token
  are now `var(--…)`; what is left are one-offs — `#e2eeff`, `#eaf3ff`, `#f3f8ff`,
  `#f2f4f7`, `#33404e`, … — each of which is a question for the ledger, not a
  mechanical swap.

## Needs the repo (not fixable here)

This design system is read-only apart from `templates/`. Three things belong in
the code repo and a `/design-sync` run:

1. **Real design-system components.** `_ds_manifest.json` still reports
   `"components": []` — Shell, Card, Avatar and Toast are *template* components,
   so a consuming project gets them by copying this folder, not from
   `window.Bridgecircle_b07651`.
2. **Retired tokens.** `--identity-*`, `--gradient-band-blue/-green/-school`,
   `--band-glow`, `--band-toggle-track` are documented as gone; delete them and
   let `_adherence.oxlintrc.json` fail on their use instead.
3. **Token kinds.** 31 tokens can't be classified from name or value
   (`--ring-card`, `--gradient-avatar`, `--wash-get`, …); they need
   `/* @kind color|shadow|… */` comments. [`TOKEN-KINDS.md`](./TOKEN-KINDS.md)
   lists every one with the annotation to apply — paste it into the repo's
   `colors_and_type.css` and re-sync.

## Not vendored here

- **`fonts/PretendardVariable.woff2`** — the 2 MB self-hosted font exceeds the
  DesignSync pull cap. Every template loads Pretendard from the CDN, so type
  renders correctly; only `../fonts.css`'s `@font-face` dangles.
- `.thumbnail` previews and `_ds_manifest.json` / `_adherence.oxlintrc.json` —
  app-generated.
