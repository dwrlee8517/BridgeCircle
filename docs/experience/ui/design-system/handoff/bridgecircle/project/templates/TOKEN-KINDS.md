# Token `@kind` annotations — for the repo, not for this project

`check_design_system` reports 31 of 371 tokens (22 unique) as unclassifiable.
The fix is a `/* @kind … */` comment after each declaration in
`colors_and_type.css` — which is **synced design-system source and read-only
here**. Annotating it in this project would be overwritten by the next
`/design-sync`, so the edit belongs in the code repo.

Two rules cover every case. Apply them in **both** the `:root` block and the
`.dark` block (the duplicated declarations are why 22 unique tokens produce 31
findings).

## `/* @kind shadow */` — composable `box-shadow` values

These are rings, meant to be composed with a shadow
(`box-shadow: var(--ring-card), var(--shadow-card)`). The value is an `inset`
box-shadow, which the classifier can't tell from a colour.

    --ring-card            /* @kind shadow */
    --ring-card-elevated   /* @kind shadow */
    --ring-avatar          /* @kind shadow */
    --ring-outline         /* @kind shadow */
    --ring-glass           /* @kind shadow */
    --selected-accent      /* @kind shadow */   inset 2px 0 0 — the left accent bar
    --nav-active-ring      /* @kind shadow */   value is `none` (kept so
                                                box-shadow: var(--nav-active-ring)
                                                renders nothing, per E3 2026-07-06)

## `/* @kind color */` — gradients used as backgrounds

Every one of these is a paint value; the classifier only fails because
`linear-gradient(…)` / `radial-gradient(…)` isn't a colour literal.

    --gradient-band-dark      /* @kind color */
    --gradient-avatar         /* @kind color */
    --gradient-primary-btn    /* @kind color */
    --gradient-bubble-me      /* @kind color */
    --avatar-neutral          /* @kind color */
    --surface-card-elevated   /* @kind color */
    --nav-active-bg           /* @kind color */
    --wash-get                /* @kind color */
    --wash-give               /* @kind color */
    --wash-page               /* @kind color */
    --wash-toggle-track       /* @kind color */
    --cover-event             /* @kind color */   3 stacked gradients
    --cover-texture           /* @kind color */   dot grid; pair with
                                                  background-size:18px 18px
    --glass-tile              /* @kind color */

## After the sync

Re-run `check_design_system`. The only finding that should remain is the single
computed style attribute in `templates/screens/Avatar.dc.html`, which is
deliberate: the palette index (1–6) and the pixel size both arrive as data, so
no literal can stand in for them. The checker permits that case.

If a token above turns out not to be in the reported set, annotating it anyway
is harmless — `@kind` only tells the compiler what it already should have
inferred.
