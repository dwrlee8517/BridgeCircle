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
| `action-give*` | `action-offer*` until call sites migrate |
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
| `action-weak-text` | `blue-600` | Text on weak action |
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

Use `Button variant="offer"` for the lead Give commitment while the legacy
variant name remains in production. A bounded Give drafting workflow may use
supporting green cues, but `Send offer` remains its only lead CTA.

## Status

Semantic status pairs are `state-{info,success,warning,caution,danger,premium}`
with `-text` and `-tint` suffixes.

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
| `radius-large` | `20px` | Cards and sheets |
| `radius-card-xl` | `22px` | O9 elevated content card |
| `radius-pill` | `9999px` | Capsules, tabs, avatars |

## Typography

Pretendard is the single production family, self-hosted through
`next/font/local`. The legacy `font-heading`, `font-mono`, and `.bc-fraunces`
entry points currently fold to Pretendard.

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
| `caption`, `label` | `12 / 18` minimum | `400-500` |

Do not introduce member-facing text below 12px. Use named Tailwind utilities;
`pnpm check:tokens` ratchets arbitrary font, tracking, padding, and breakpoint
literals.

## Elevation And Focus

- Default cards compose `ring-card` with `shadow-card`.
- Major content cards may use `surface-card-elevated`,
  `ring-card-elevated`, `shadow-card-elevated`, and `radius-card-xl` through
  `Card variant="elevated"`.
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
| `container-shell` | `1320px` max |
| `sidebar-width` | `240px` |
| `sidebar-width-rail` | `72px` |
| `topbar-height` | `66px` |

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
