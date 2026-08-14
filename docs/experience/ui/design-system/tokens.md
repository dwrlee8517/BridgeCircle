# BridgeCircle Production Tokens

This is the production token contract for the BridgeCircle brand fork. The
live implementation is [`app/src/app/globals.css`](../../../../app/src/app/globals.css).

## Authority

Use these sources in order:

1. [`handoff/bridgecircle/project/SKILL.md`](handoff/bridgecircle/project/SKILL.md)
2. [`handoff/bridgecircle/project/colors_and_type.css`](handoff/bridgecircle/project/colors_and_type.css)
3. The stabilized templates in
   [`handoff/bridgecircle/project/templates/`](handoff/bridgecircle/project/templates/)
4. [`handoff/bridgecircle/project/uploads/FLOWS.md`](handoff/bridgecircle/project/uploads/FLOWS.md)

[`handoff/bridgecircle/project/uploads/OVERRIDES.md`](handoff/bridgecircle/project/uploads/OVERRIDES.md)
is the divergence audit ledger, not a parallel design source. Civic Editorial
and Field Pro files are production history, not the target direction.

## Production Mapping

The canonical fork roles are available directly in `globals.css`. Existing
shadcn and production names remain as temporary compatibility aliases so the
redesign can land route by route.

| Canonical role | Production compatibility |
|---|---|
| `surface-page` | `background` |
| `surface-card` | `card`, `popover` |
| `text-primary` | `foreground`, `card-foreground` |
| `action-primary` | `primary` |
| `action-primary-hover` | `primary-hover` |
| `action-on-primary` | `primary-foreground` |
| `focus-ring-soft` | `focus-ring-muted` |

New code should use canonical role names. Compatibility aliases exist to avoid
a destructive all-pages migration; they are not permission to create another
token vocabulary.

## Core Palette And Surfaces

The eight Toss ramp families remain available as `grey-*`, `blue-*`, `red-*`,
`orange-*`, `yellow-*`, `green-*`, `teal-*`, and `purple-*`. The applied O7
change is `grey-200: #e6e9ee`.

| Token | Value | Use |
|---|---:|---|
| `surface-page` | `grey-100` | Member page canvas |
| `surface-base` | `#ffffff` | Full-bleed white surface |
| `surface-card` | `#ffffff` | Cards and overlays |
| `surface-panel` | `grey-50` | Quiet grouped content |
| `surface-subtle` | `grey-100` | Neutral controls and low-emphasis fills |
| `surface-canvas` | `#f6f8fa` | Template-settled shimmer/canvas role |
| `surface-inset` | `#f7f9fc` | Insets inside cards |
| `surface-thread` | `#fbfcfd` | Message-thread canvas |
| `border` | `#e6e9ee` | Standard hairline |
| `border-subtle` | `#eef1f5` | Quiet card and shell hairline |
| `divider-row` | `#f4f5f7` | Repeated row divider |
| `icon-muted` | `#c8cfd8` | Muted icon strokes |

Text roles are `text-primary`, `text-secondary`, `text-muted`, `text-faint`,
`text-disabled`, and `text-on-fill`. Use them by meaning instead of selecting a
grey stop in route code.

## Actions

### Ask and general actions

| Token | Value | Use |
|---|---:|---|
| `action-primary` | `blue-500` | Small/repeated filled action |
| `action-primary-hover` | `blue-600` | Hover |
| `action-primary-pressed` | `blue-700` | Pressed |
| `action-weak` | `blue-50` | Tinted secondary action |
| `action-weak-text` | `blue-700` | Text on weak action |
| `gradient-primary-btn` | `#3b8bf7 -> #2f7ce9` | O8 lead CTA finish |
| `shadow-primary-btn` | soft blue shadow | Lead CTA elevation |

Use `Button variant="cta"` for the single lead action in a local decision
area. Use the flat `default` variant for smaller or repeated blue actions.

### Give actions

| Token | Value | Use |
|---|---:|---|
| `action-give` | `#0b8a57` | O2 lead Give commitment |
| `action-give-hover` | `#077046` | Hover |
| `action-give-weak` | `#e7f8f0` | Weak Give button |
| `action-give-weak-text` | `green-500` | Weak Give button text |
| `action-give-text` | `#029a5e` | Open-to-help text |
| `give-tint` | `rgb(3 178 108 / 0.12)` | Positive/Give pill |
| `give-tint-weak` | `rgb(3 178 108 / 0.10)` | Open-to-help chip |

Use `Button variant="give"` for the lead Give commitment. (The variant and its
`action-offer*` token aliases were renamed from `offer` to the canonical `give`
vocabulary on 2026-07-25.) A bounded Give drafting workflow may use supporting
green cues, but `Send offer` remains its only lead CTA.

## Status

Semantic status pairs are `state-{info,success,warning,caution,danger,premium}`
with `-text` and `-tint` suffixes. `info`, `success`, `warning`, and `danger`
also carry a `-foreground` role, which is what component code should use for
copy sitting on the matching tint. `state-categorized` (plus
`state-categorized-foreground` and `palette-purple-tint`) is a seventh family,
used by `StatusBadge tone="categorized"`.

Waiting and Declined intentionally use `text-secondary` on `surface-subtle`.
Do not recreate a `pending-*` role or make a quiet decline look like an error.
`closing-soon-text` and `closing-soon-tint` are the distinct calm expiry pair;
they do not replace the general warning roles.

## Identity And Composition

- Help Get uses `wash-get`; Help Give uses `wash-give`.
- `wash-page` is the ambient page-top wash.
- Saturated Help bands and `identity-*` aliases are retired.
- `cover-event` is limited to event covers and onboarding bookends.
- `gradient-band-dark` remains for Entry, footer, and feature moments.
- `gradient-avatar` is for the signed-in member and brand tiles.
- Other people default to the six contrast-verified `avatar-1..6-bg/fg`
  identity pairs. Avatar color carries no status meaning.
- `avatar-neutral` is an option for dense operator surfaces.

## Shape

| Token | Value | Use |
|---|---:|---|
| `radius-compact` | `4px` | Small inner element |
| `radius-standard` | `8px` | Compact control |
| `radius-comfortable` | `12px` | Inputs and buttons |
| `radius-box` | `14px` | Inner boxes and icon tiles |
| `radius-bubble` | `18px` | Message bubbles and compact overlays |
| `radius-large` | `16px` | Cards and sheets |
| `radius-card-xl` | `16px` | O9 elevated content card |
| `radius-pill` | `9999px` | Capsules, tabs, avatars |

**Decided 2026-08-13.** This contract documented 20px and 22px; production has
shipped 16px for both since `56002cd` (2026-07-21), which reverted the O6/O9
card radius without a ledger entry. The drift audit surfaced the conflict,
Richard compared 20 against 16, and **kept the tighter 16** — so this is a
confirmed decision, not a documentation lag. O6 and O9 are amended to match in
the handoff bundle's `OVERRIDES.md`; box 14 and bubble 18 remain
brand-softened, so only the card tier returns to the TDS value.

Because the two radius values are now identical, `Card variant="elevated"` is
**not** a distinct shape tier — elevation is carried entirely by
`shadow-card-elevated`, `ring-card-elevated`, and the `surface-card-elevated`
gradient. Do not describe the elevated card as a larger radius, and do not
reintroduce a radius step without changing the token in both the app and the
bundle.

## Typography

Pretendard is the single production family, self-hosted through
`next/font/local`. The legacy `font-heading` / `font-mono` utilities and the
`--font-display` / `--font-mono` aliases behind them were removed on 2026-07-25
now that one family is settled; `.bc-fraunces` became `.bc-display` and
contributes display letter-spacing only. Numeric data uses `tabular-nums`.

| Role | Size / line height | Weight |
|---|---:|---:|
| `display-xl` | `40 / 48` | `800` |
| `display-hero` | `30 / 40` | `700` |
| `display-large` | `26 / 36` | `700` |
| `heading-large` | `22 / 30` | `700` |
| `heading` | `20 / 28` | `600` |
| `subtitle` | `16 / 24` | `600` |
| `body-lg` | `16 / 24` | `400` |
| `body` | `14 / 22` | `400` |
| `body-sm` | `13 / 20` | `400` |
| `caption`, `label`, `kicker` | `12 / 18` | `400-500` |

Supporting roles in the shipped scale, previously undocumented: `page-title`
(24px), `section-title` (19px), `nav` (15px, the E3 sidebar label), `control`
(13.5px), `mono-sm` (12px), and the School display sizes `display-event` (36px)
and `event-date` (52 / 56 / 64px). `kicker` is an alias of `label`.

### The 11px floor

**Revised 2026-08-13.** This contract previously set a 12px floor and claimed
the sub-12px tokens had been removed. Neither was true: four sub-12px tokens
ship, and they are used at roughly 81 call sites against 69 at 12px. Rather than
keep a rule the product has never held, the floor is now **11px**, with a
narrow legal tier above it:

| Token | Value | Status |
|---|---:|---|
| `overline` | `11px` | Legal — uppercase eyebrows, dense metadata |
| `chip` | `11.5px` | Legal — compact chips and counters |
| `fine` | `10.5px` | **Scheduled for removal** — migrate to `overline` |
| `micro` | `10px` | **Scheduled for removal** — migrate to `overline` |

`overline` and `chip` are for short, high-contrast, non-prose labels: eyebrows,
counters, chips. Never body copy, never the only carrier of a lifecycle state.
`fine` and `micro` are the genuinely hard-to-read tier and are being retired;
they remain in `globals.css` with call sites still to migrate, so treat them as
closed to new use. Do not add a fifth sub-12px token.

Use named Tailwind utilities; `pnpm check:tokens` ratchets arbitrary font,
tracking, padding, and breakpoint literals, and `pnpm check:font-size-tokens`
guards the font-size class group registration (see the tailwind-merge note in
`components.md`).

## Elevation And Focus

- Default cards compose `ring-card` with `shadow-card`.
- Major content cards may use `surface-card-elevated`, `ring-card-elevated`,
  and `shadow-card-elevated` through `Card variant="elevated"`. The variant also
  applies `radius-card-xl`, but that token equals `radius-large`, so elevation
  reads through shadow, ring, and gradient only — not through shape.
- Outline controls use `ring-outline`.
- Keyboard focus uses a 2px `focus-ring` outline with a 2px offset, or the
  shared focus ring plus `focus-ring-soft` where a field halo is useful.
- Desktop hover feedback is a background/shadow shift, never a positional
  lift.
- Reduced-motion preferences disable nonessential animation.

## Shell Geometry

| Token | Value |
|---|---:|
| `container-reading` | `680px` |
| `sidebar-width` | `240px` |
| `sidebar-width-rail` | `72px` |
| `topbar-height` | `66px` |

**The member shell has no maximum width, by decision (2026-08-13).** A
`container-shell` token claiming a 1320px cap was documented here but never
defined in `globals.css` and never applied in `(member)/layout.tsx`. Capping the
shell strands the sidebar against empty gutters on large displays, so the
unbounded shell is intended behavior. The token has been removed from this
contract; do not add it. Reading measure is held where it matters by
`container-reading`, not by a shell cap.

The member shell uses five durable sections: Home, Help, People, Messages, and
School. There is no global search or command palette; search stays local to
People and Help.

## Parked Work

Do not resolve these during unrelated implementation:

- template scrim literals versus `scrim`
- template skeleton shimmer literals versus `skeleton-base/pulse`
- remaining blue-tint literals
- School cover texture usage
- dialog-specific radius/shadow tokens
- the Why-this-match inset literal

Dark-mode reconciliation is also parked. The app keeps its existing production
theme behavior, but new v1 redesign decisions are made against the verified
light tokens only. Do not infer new dark values from the light fork.

## Implementation Rules

- Prefer shared primitives and canonical roles over route-local styling.
- Do not copy inline template CSS into React pages.
- Preserve compatibility aliases until their existing consumers are migrated.
- A new semantic role requires evidence and an applied ledger entry.
- Raw literals are allowed only for the explicitly parked rendering set,
  generated identity/data colors, or a documented one-off.
