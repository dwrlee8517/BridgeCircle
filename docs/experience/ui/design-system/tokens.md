# Civic Editorial Production Tokens

This is the production token contract for BridgeCircle's Civic Editorial system. The interactive HTML prototype remains useful visual context, but implementation should start here and in `app/src/app/globals.css`.

## Color

| Token | Value | Role |
|---|---:|---|
| `background` | `#fafaf9` | Platinum Bone page canvas |
| `foreground` | `#0c0c0b` | Obsidian text and structure |
| `card` | `#ffffff` | Raised card and popover surface |
| `primary` | `#2563eb` | Electric Sky primary actions, links, active states |
| `primary-hover` | `#1d4ed8` | Hover and pressed primary states |
| `primary-on-dark` | `#93c5fd` | Electric Sky accent on Midnight/dark editorial surfaces |
| `surface-midnight` | `#081126` | Midnight blue editorial canvas for heroes and entry moments |
| `surface-midnight-foreground` | `#fafaf9` | Text and controls on Midnight surfaces |
| `surface-midnight-muted` | `rgb(250 250 249 / 68%)` | Secondary copy and metadata on Midnight surfaces |
| `secondary` | `#f4f3ee` | Soft panel, grouped controls |
| `muted` | `#ebebe5` | Dividers, subtle fills |
| `muted-foreground` | `#4d4d4a` | Secondary copy and metadata |
| `border` | `#dcdcd6` | Crisp editorial rule |
| `destructive` | `#9b2c1f` | Destructive and error states |
| `accent-ochre` | `#c8761a` | Warnings, nudges, attention without alarm |
| `accent-rust` | `#b9472a` | Alerts, declines, negative state |
| `accent-sage` | `#3b6e51` | Open, available, accepted |
| `accent-plum` | `#722f37` | Secondary editorial categorization |

Production rule: raw color values should be avoided in app surfaces unless they are stable generated avatar colors, event category colors, chart colors, or a documented one-off.

## Typography

| Token | Size | Role |
|---|---:|---|
| `display-lg` | `36px` | Page-level display moments |
| `display-md` | `28px` | Section and hero subheads |
| `h1` | `20px` | Compact page and panel headings |
| `body-lg` | `15px` | Lead or editorial body copy |
| `body-md` | `13px` | Dense UI body and labels |
| `caption` | `11px` | Secondary labels and short metadata |
| `mono-sm` | `10.5px` | Compact uppercase metadata |
| `mono-xs` | `9px` | Decorative or redundant metadata only |

Production rule: important meaning should not depend on `mono-xs` alone. Use larger body/caption text when the information affects a decision.

## Shape And Spacing

| Token | Value | Role |
|---|---:|---|
| `radius` | `6px` | Default card, input, button, panel, and badge radius |
| `space-1` | `4px` | Icon gaps, dense separators |
| `space-2` | `8px` | Compact control padding |
| `space-3` | `12px` | Small card padding |
| `space-4` | `16px` | Default component gap |
| `space-6` | `24px` | Card and section padding |
| `space-8` | `32px` | Page and major grid gaps |
| `space-12` | `48px` | Editorial section separation |

Production rule: use 6px editorial corners by default. Full circles are reserved for avatars, dots, radio controls, notification counters, and progress bars. Search capsules may use pill shape because it is a familiar input pattern.

## Motion And Focus

- Interaction transitions should be short: 150-200ms.
- Hover lift should be subtle: 1-2px maximum.
- Focus rings use Electric Sky with a low-opacity outer ring.
- Respect reduced-motion preferences in future animation additions.

## Screen-Level Rules

- Every member screen should expose the next useful relationship action without requiring browsing.
- Admin tables may be denser, but still use the same tokens and status language.
- Dark "Midnight editorial" surfaces use `surface-midnight` plus `primary-on-dark`; Midnight is the canvas and Electric Sky remains the blue accent.
- Do not use Midnight for ordinary cards, tables, sidebars, or dense member workflows.
- Cards should read as decision surfaces, not decoration.
