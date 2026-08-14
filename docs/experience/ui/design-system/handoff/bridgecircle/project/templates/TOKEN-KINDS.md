# Token `@kind` annotations — remaining work

**Status 14 Aug:** the first paste landed. Unclassifiable tokens went from
**22 → 6**. Groups 1 (`@kind shadow`, the `inset` rings) and 2 (`@kind color`,
the gradients) are done and need no further attention.

Six remain. The checker now names all of them, so this is an exact list rather
than the reconstruction the earlier version of this file contained.

All six are declared in `:root` only — the motion block has no `.dark`
counterpart — so unlike the first batch there is nothing to mirror.

## `--lh-label` → `/* @kind font */`

`colors_and_type.css:398`

    --font-size-label: 12px; --lh-label: 1.5;  /* @kind font */

Every other line-height in the type scale is a px value (`--lh-body-sm: 20px`,
`--lh-caption: 18px`) and classifies on sight. This one is a unitless ratio, so
there is nothing in the value to go on and the name does not carry a kind word.
`font` is the right bucket — it belongs to the type scale, not to spacing.

## Motion and easing → `/* @kind other */`

`colors_and_type.css:436-440`. Durations and easing curves are none of
color, spacing, radius, shadow or font, so `other` is the honest answer rather
than forcing them into a bucket.

    --motion-fast:     100ms;                          /* @kind other */
    --motion-base:     150ms;                          /* @kind other */
    --motion-slow:     250ms;                          /* @kind other */
    --ease-standard:   ease-out;                       /* @kind other */
    --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1); /* @kind other */

## After this paste

`check_design_system` should report no token findings at all. The only
remaining item will be the single style-attribute note for
`templates/screens/Avatar.dc.html`, which is deliberate and permitted: the
palette index (1–6) and the pixel size both arrive as data, so no literal can
stand in for them.
