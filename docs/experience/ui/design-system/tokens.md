# Civic Editorial Production Tokens

This is the production token contract for BridgeCircle's Civic Editorial system. The interactive HTML prototype remains useful visual context, but implementation should start here and in `app/src/app/globals.css`.

## Authority

This file is the only production token spec. The matching live CSS contract is
`app/src/app/globals.css`.

Do not use token exports from `reference-src/`, especially
`reference-src/ds-tokens-export.jsx` or `reference-src/ds-foundations.jsx`.
Those files are Atrium-era prototype references and contain obsolete terracotta,
oat, lamplight, and multi-accent examples.

For component usage, use [`components.md`](components.md).

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

## Role Tokens

Base color tokens describe the palette. Role tokens describe product intent.
New production UI should use role tokens first, then fall back to base tokens
only when maintaining an existing primitive API.

### Surface Roles

| Token | Maps To | Use |
|---|---|---|
| `surface-page` | `background` | Page canvas |
| `surface-card` | `card` | Cards, popovers, raised decision surfaces |
| `surface-panel` | `secondary` | Grouped controls, side panels, quiet callouts |
| `surface-subtle` | `muted` | Low-emphasis fills and separators |
| `surface-editorial` | `surface-midnight` | Hero, auth, and entry editorial moments |
| `surface-editorial-foreground` | `surface-midnight-foreground` | Text on editorial surfaces |
| `surface-editorial-muted` | `surface-midnight-muted` | Secondary text on editorial surfaces |

### Action Roles

| Token | Maps To | Use |
|---|---|---|
| `action-primary` | `primary` | Main action, active control, selected object |
| `action-primary-hover` | `primary-hover` | Hover and pressed primary action |
| `action-on-primary` | `primary-foreground` | Text or icon on primary fill |
| `action-on-editorial` | `primary-on-dark` | Electric Sky accent on Midnight editorial surfaces |
| `link` | `primary` | Inline links and low-emphasis navigation links |
| `link-hover` | `primary-hover` | Hovered inline links |
| `focus-ring` | `ring` | Focus border and focus halo source color |

### State Roles

| Token | Maps To | Use |
|---|---|---|
| `state-info` | `primary` | Active, accepted, neutral-positive state |
| `state-info-foreground` | `primary` | Text on light info tint |
| `state-success` | `accent-sage` | Open, available, accepted |
| `state-success-foreground` | `accent-sage` | Text on light success tint |
| `state-warning` | `accent-ochre` | Pending, stale, attention needed |
| `state-warning-foreground` | `foreground` | Text on light warning tint |
| `state-danger` | `destructive` | Error, declined, revoked, destructive |
| `state-danger-foreground` | `destructive` | Text on light danger tint |
| `state-categorized` | `accent-plum` | Secondary editorial categorization |
| `state-categorized-foreground` | `accent-plum` | Text on light category tint |
| `state-muted` | `muted-foreground` | Deactivated, unavailable, no signal |

State role rule: `state-warning` is safe for borders, dots, fills, and large
icons. It is not approved for small body text on light backgrounds. Use
`state-warning-foreground`, which resolves to `foreground`, for readable warning
copy.

### Product Roles

| Token | Maps To | Use |
|---|---|---|
| `match-signal` | `primary` | Match percentage, compatibility, suggested-fit emphasis |
| `mentor-open` | `accent-sage` | Mentor accepting conversations |
| `mentor-paused` | `accent-ochre` | Mentor paused or limited capacity |
| `request-attention` | `accent-ochre` | User needs to act |
| `request-declined` | `accent-rust` | Declined or negative request lifecycle |
| `verification` | `accent-sage` | Verified identity, school, or account state |
| `event-featured` | `primary` | Featured or recommended event |
| `admin-operational` | `foreground` | Admin counts, controls, and operational emphasis |

Product roles should stay semantic. Do not create `blue-event`,
`green-mentor`, or similar hue names.

## Tint Tokens

Use tint tokens for selection backgrounds, status badge fills, quiet callouts,
and inline notification panels. Tints are not a license to introduce new hues.

| Token | Value | Use |
|---|---:|---|
| `primary-tint` | `rgb(37 99 235 / 10%)` | Info badge fill, selected item background |
| `primary-tint-strong` | `rgb(37 99 235 / 16%)` | Active row, stronger selected state |
| `success-tint` | `rgb(59 110 81 / 10%)` | Open, accepted, completed background |
| `warning-tint` | `rgb(200 118 26 / 12%)` | Attention-needed background |
| `danger-tint` | `rgb(155 44 31 / 10%)` | Error and destructive warning background |
| `plum-tint` | `rgb(114 47 55 / 10%)` | Editorial category background |
| `editorial-rule` | `rgb(250 250 249 / 16%)` | Divider on Midnight editorial surfaces |
| `editorial-rule-strong` | `rgb(250 250 249 / 28%)` | Strong divider or outline on Midnight editorial surfaces |
| `focus-ring-muted` | `rgb(37 99 235 / 10%)` | Outer focus halo |

Dark mode may override tint alpha and source values while preserving the same
token names.

## Contrast Pairings

Approved production pairs, measured on 2026-05-22 using WCAG relative
luminance:

| Pair | Ratio | Use |
|---|---:|---|
| `foreground` on `background` | `18.74:1` | Primary text on page canvas |
| `foreground` on `card` | `19.57:1` | Primary text on cards and popovers |
| `muted-foreground` on `background` | `8.12:1` | Metadata on page canvas |
| `muted-foreground` on `card` | `8.48:1` | Metadata on cards |
| `primary` on `background` | `4.95:1` | Links, labels, and compact action text |
| `primary` on `card` | `5.17:1` | Links and labels on cards |
| `primary-foreground` on `primary` | `5.17:1` | Primary filled buttons |
| `surface-midnight-foreground` on `surface-midnight` | `17.98:1` | Text on Midnight editorial surfaces |
| `primary-on-dark` on `surface-midnight` | `10.41:1` | Links and accents on Midnight editorial surfaces |
| `destructive` on `background` | `7.25:1` | Error text on page canvas |
| `accent-sage` on `background` | `5.69:1` | Success text on page canvas |
| `accent-rust` on `background` | `5.03:1` | Negative state text on page canvas |
| `accent-plum` on `background` | `9.24:1` | Category text on page canvas |

Known limits:

- `accent-ochre` on `background` is `3.32:1`; use it as a border, dot, fill,
  or large icon only.
- `primary` on `surface-midnight` is `3.63:1`; use `primary-on-dark` on
  Midnight editorial surfaces.
- Any new foreground/background pair needs a contrast check before production.

## Typography

### Type system

Three families, **no serif**. The Civic Editorial voice comes from
spacing, hierarchy, and Electric Sky accents — not from a serif accent
face.

| Variable | Tailwind | Family | Role |
|---|---|---|---|
| `--font-sans` | `font-sans` | Inter | Body, labels, UI, buttons |
| `--font-display` | `font-heading` | Inter Tight | Hero h1s, section h2s, wordmark, profile names, card titles, stat numbers |
| `--font-mono` | `font-mono` | JetBrains Mono | System metadata, dates, technical details |

Implementation lives in `app/src/app/layout.tsx` (via `next/font/google`).

A brief IBM Plex full-system swap was tried and reverted on 2026-05-24
because Plex replaced Inter Tight on hero h1s, changing surfaces that
weren't meant to change. The exploration is preserved in
[`../../explorations/typography-2026-05/font_explorations_may24_companies_claude.html`](../../explorations/typography-2026-05/font_explorations_may24_companies_claude.html)
for future reference, but is not the current direction.

The helper class `.bc-fraunces` (defined in `app/src/app/globals.css`) is
a legacy name from when an editorial serif was used — it now resolves to
Inter Tight (the display family). Rename to `.bc-display` in a follow-up
pass when convenient; the current ~10 call sites work without changes.

The pull-quote treatment `.bc-pull-quote` (sapphire left rule + italic)
uses italic Inter rather than an italic serif. The editorial moment
comes from the left rule and italic style, not from a serif family.

### Role contract

| Role | Family | Class | Example |
|---|---|---|---|
| Wordmark | Display sans | `bc-fraunces` (legacy class) or `font-heading` | "BridgeCircle" in header, auth screen, onboarding shell, 404 |
| Profile-card name | Display sans | `bc-fraunces` or `font-heading` | The member's display name on MatchBriefCard, ResultCard, profile detail h1 |
| Avatar initials fallback | Display sans | `font-heading` | Two-letter initials when no avatar photo is uploaded |
| Pull-quote | Sans italic | `.bc-pull-quote` | Profile bio quote with the sapphire left rule |
| Hero / display title | Display sans | `font-heading` | Hero h1 on every page (`text-3xl/4xl/5xl`) |
| Section h2 | Display sans | `font-heading` | "People who can help you", "Upcoming events", "Needs your reply" |
| Card title | Display sans | `font-heading` | `SchoolPulseCard.title`, `HelpOpportunityCard.title`, `FreshnessReviewCard.title`, empty-state titles |
| Stat number | Display sans | `font-heading` | NetworkStat value, match-score percent, capacity numbers |
| Body paragraph | Sans | `font-sans` (default) | Descriptions, lede paragraphs, hero subtitles |
| UI label / button text | Sans | `font-sans` (default) | Form labels, button labels, status pills |
| Eyebrow / kicker | Sans | (none, just sentence-case caption) | "Class of 2005 · Chadwick School" page kicker |
| System metadata | Mono | `font-mono` | Dates, IDs, technical details. Sparingly. |

Production rules:

- No serif font anywhere in the system. If a surface wants editorial
  weight, use Inter Tight at a generous size with tight letter-spacing.
- Italic is reserved for the pull-quote treatment. Body italic is
  acceptable in long-form announcement bodies; avoid it in short cards.
- Mono is for metadata that benefits from a fixed-width skeleton (dates,
  counts, technical IDs). Do not use mono for decorative kickers when a
  caption-sentence-case label would carry the same orientation.

### Size scale

| Token | Size | Role |
|---|---:|---|
| `display-lg` | `36px` | Page-level display moments |
| `display-md` | `28px` | Section and hero subheads |
| `h1` | `20px` | Compact page and panel headings |
| `body-lg` | `15px` | Lead or editorial body copy |
| `body-md` | `13px` | Dense UI body and labels |
| `caption` | `11px` | Secondary labels and short metadata |
| `mono-sm` | `10.5px` | Compact uppercase metadata |

Production rule: do not introduce sizes below `mono-sm` (10.5px). The previous `mono-xs` (9px) token was removed because the rule "do not depend on it alone" was easier to break than to enforce. If a surface seems to need 9px, it almost certainly needs a tighter layout instead.

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

| Token | Value | Use |
|---|---:|---|
| `motion-instant` | `0ms` | State changes that must not animate |
| `motion-fast` | `100ms` | Hover color, icon color, small opacity transitions |
| `motion-base` | `150ms` | Default controls and card affordances |
| `motion-medium` | `200ms` | Dialogs, popovers, larger transforms |
| `motion-slow` | `300ms` | Rare page-level transitions only |
| `ease-standard` | `ease-out` | Default UI easing |
| `ease-emphasized` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Entry or emphasized motion |

Motion recipes are defined in [`states-and-motion.md`](states-and-motion.md).
Token usage should stay consistent with that contract:

| Recipe | Token Pair | Use |
|---|---|---|
| Control hover | `motion-base` + `ease-standard` | Buttons, tabs, links, compact controls |
| Selection change | `motion-fast` + `ease-standard` | Selected rows, selected cards, active tabs |
| Interactive surface hover | `motion-base` + `ease-standard` | Clickable cards, never static cards |
| Overlay enter | `motion-medium` + `ease-emphasized` | Dialogs, popovers, menus |
| Loading pulse | `motion-slow` + `ease-standard` | Skeleton placeholders only |
| Error reveal | `motion-fast` + `ease-standard` | Inline validation and notification copy |

Motion rules:

- Interaction transitions should usually use `motion-base` or `motion-medium`.
- Hover lift should be subtle: 1-2px maximum.
- Focus rings use `focus-ring` with `focus-ring-muted` as the low-opacity outer halo.
- Do not animate layout-critical row height, text wrapping, or control width.
- Respect reduced-motion preferences. The live CSS contract disables
  non-essential transitions and animations under `prefers-reduced-motion:
  reduce`.

## Shadow

Three-step editorial scale. Shadows should suggest paper, not dashboard gloss.
The scale stays subtle on purpose: lift comes from the border + 1-2px hover
translate, not from a heavy drop shadow.

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 1px 0 rgb(12 12 11 / 0.03)` | Hairline on quiet rows and inline cards. Often equivalent to "no shadow." |
| `shadow-card-hover` | `0 4px 12px -2px rgb(12 12 11 / 0.06)` | Default lift on interactive cards and auth/sign-in surfaces. |
| `shadow-hero` | `0 12px 34px -8px rgb(12 12 11 / 0.10)` | Reserved for hero/feature surfaces and interactive-card hover. One per surface. |

Production rules:

- Arbitrary `shadow-[…]` literals are not allowed. If a surface needs a value
  outside the scale, extend the scale instead.
- Dark mode raises the alpha but keeps the same token names; the live CSS
  contract handles this in `.dark`.
- Do not stack `shadow-hero` on nested elements. If two surfaces both want
  hero lift, the page hierarchy is wrong.

## Density

Density tokens are multipliers for component spacing decisions, not global page
scales. Use density to make a known workflow more efficient without changing
the visual identity.

| Token | Value | Use |
|---|---:|---|
| `density-compact` | `0.875` | Admin tables, repeated inbox rows, dense filter bars |
| `density-default` | `1` | Member-facing default density |
| `density-roomy` | `1.125` | Onboarding, auth, explanation-heavy editorial moments |

Density rules:

- Member decision screens use `density-default` unless the repeated object is
  clearly scannable.
- Admin screens may use `density-compact`, but text cannot drop below caption
  for meaningful labels.

## Email-Safe Tokens

Email clients cannot reliably consume app CSS variables. Lifecycle emails
should inline these stable values instead of using `var(...)`.

| Token | Value | Use |
|---|---:|---|
| `email-background` | `#fafaf9` | Email body canvas |
| `email-card` | `#ffffff` | Main content container |
| `email-foreground` | `#0c0c0b` | Primary copy |
| `email-muted` | `#4d4d4a` | Secondary copy |
| `email-border` | `#dcdcd6` | Dividers and container borders |
| `email-primary` | `#2563eb` | Links and primary CTA |
| `email-primary-hover` | `#1d4ed8` | Webmail hover where supported |
| `email-destructive` | `#9b2c1f` | Error or destructive copy |
| `email-radius` | `6px` | Buttons and containers |
| `email-font-family` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | Email typography |

## Screen-Level Rules

- Every member screen should expose the next useful relationship action without requiring browsing.
- Admin tables may be denser, but still use the same tokens and status language.
- Dark "Midnight editorial" surfaces use `surface-midnight` plus `primary-on-dark`; Midnight is the canvas and Electric Sky remains the blue accent.
- Do not use Midnight for ordinary cards, tables, sidebars, or dense member workflows.
- Cards should read as decision surfaces, not decoration.
