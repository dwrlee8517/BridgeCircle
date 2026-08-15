# Token `@kind` annotations — complete

**Status 14 Aug: done. `check_design_system` reports zero token findings.**
Nothing here is outstanding; this is the record of what was applied and why.

The only item the checker still reports is the single style-attribute note on
`templates/screens/Avatar.dc.html`, which is deliberate and permitted — the
palette index (1–6) and the pixel size both arrive as data, so no literal can
stand in for them.

## What was applied

39 `/* @kind … */` annotations in `colors_and_type.css`, in two passes:

| Kind | Count | What |
|---|---|---|
| `color` | 21 | gradients used as paint — `linear-gradient(…)` / `radial-gradient(…)` isn't a colour literal |
| `shadow` | 12 | composable `inset` rings, meant to pair with a shadow (`box-shadow: var(--ring-card), var(--shadow-card)`) |
| `other` | 5 | `--motion-fast/-base/-slow`, `--ease-standard`, `--ease-emphasized` — durations and easing curves are none of the five buckets |
| `font` | 1 | `--lh-label`, the only line-height in the type scale written as a unitless ratio (`1.5`, not `20px`) |

The counts do not equal the number of token *names*: 21 names carry a `color` or
`shadow` kind, but 12 of them are redeclared in `.dark`, so they are annotated in
both blocks — 33 declarations from the first pass. The six from the second pass
are `:root`-only.

## Two things worth not relearning

**Applying the rules is only half the job — the file has to be synced up.** The
first pass was written into the repo's `colors_and_type.css` and the file itself
was never pushed. This project went on serving a copy with **zero** occurrences of
`@kind`, so the checker kept reporting every token as unclassifiable no matter how
correct the repo was. Push `colors_and_type.css` after any annotation change, and
read it back.

**Structural parity is not content parity.** A `list_files` diff was green
throughout that period, because both sides had a file called
`colors_and_type.css`. Only a content check catches it.

## What was deliberately left alone

`--weight-regular/-medium/-semibold/-bold` look unclassifiable to a naive scan
(bare `400`–`700`), but the checker never named them, so it classifies them fine.
An earlier version of this file reconstructed its list heuristically and got 4 of
6 right on the second batch — the checker's own list is the authority, and
annotating past it is guessing.

## Authoring rule

`colors_and_type.css` is synced design-system source and **read-only in this
project** — a `/design-sync` overwrites it. Author any change in the code repo,
then sync the file up.
