# Civic Editorial Production Tokens

This is the production token contract for BridgeCircle's Civic Editorial system. The interactive HTML prototype remains useful visual context, but implementation should start here and in `app/src/app/globals.css`.

## Authority

The handoff files
[`handoff/bridgecircle-design-system/project/uploads/DESIGN.md`](handoff/bridgecircle-design-system/project/uploads/DESIGN.md)
and
[`handoff/bridgecircle-design-system/project/colors_and_type.css`](handoff/bridgecircle-design-system/project/colors_and_type.css)
define the intended UI/UX token direction. This file documents how that token
direction is implemented in production, alongside the matching live CSS contract
in `app/src/app/globals.css`.

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
| `primary` | `#2563eb` | Electric Sky — links, navigation, secondary positive actions |
| `primary-hover` | `#1d4ed8` | Hover and pressed primary states |
| `primary-on-dark` | `#93c5fd` | Electric Sky accent on Ink/dark editorial surfaces |
| `cta` | `#f59e0b` | Amber — single highest-stakes action per surface (Send request, RSVP, Accept) |
| `cta-hover` | `#d97706` | Amber hover state |
| `cta-foreground` | `#0c0c0b` | Text on amber (Obsidian — 8.2:1 contrast, AAA) |
| `surface-ink` | `#1b1813` | Warm Ink editorial canvas for heroes and entry moments — the Obsidian family as a surface. Replaced the placeholder Midnight navy `#081126` (2026-06-11), which was the only cold neutral in the warm system. Dark mode lifts it to `#211e19` so the band stays distinct from the dark canvas |
| `surface-ink-foreground` | `#fafaf9` | Text and controls on Ink surfaces |
| `surface-ink-muted` | `rgb(250 250 249 / 68%)` | Secondary copy and metadata on Ink surfaces |
| `secondary` | `#f4f3ee` | Soft panel, grouped controls |
| `muted` | `#ebebe5` | Dividers, subtle fills |
| `muted-foreground` | `#4d4d4a` | Secondary copy and metadata |
| `border` | `#dcdcd6` | Crisp editorial rule |
| `destructive` | `#9b2c1f` | Destructive and error states |
| `accent-ochre` | `#a16207` | Warnings, nudges, attention without alarm |
| `accent-rust` | `#c4314b` | Crimson — alerts, declines, negative state |
| `accent-sage` | `#15a05f` | Emerald — open, available, accepted |
| `accent-plum` | `#7c3aed` | Grape — secondary editorial categorization |

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
| `surface-editorial` | `surface-ink` | Hero, auth, and entry editorial moments |
| `surface-editorial-foreground` | `surface-ink-foreground` | Text on editorial surfaces |
| `surface-editorial-muted` | `surface-ink-muted` | Secondary text on editorial surfaces |

### Action Roles

| Token | Maps To | Use |
|---|---|---|
| `action-primary` | `primary` | Secondary positive actions, navigation buttons, link-as-button |
| `action-primary-hover` | `primary-hover` | Hover and pressed primary action |
| `action-on-primary` | `primary-foreground` | Text or icon on primary fill |
| `action-on-editorial` | `primary-on-dark` | Electric Sky accent on Ink editorial surfaces |
| `action-offer` | `accent-sage` | Helper-side "give help" actions — Offer mentorship, Accept, You're going. The helper-side mirror of amber; never asker-side, never destructive |
| `action-offer-hover` | — | Hover state for offer actions |
| `action-on-offer` | — | Text/icon on offer fill |
| `cta` | `cta` (amber) | The single social-commitment action per screen — Send, RSVP, Ask for advice |
| `cta-hover` | `cta-hover` | CTA hover state |
| `cta-foreground` | `cta-foreground` | Text/icon on amber CTA fill |
| `link` | `primary` | Inline links and low-emphasis navigation links |
| `link-hover` | `primary-hover` | Hovered inline links |
| `focus-ring` | `ring` | Focus border and focus halo source color |

CTA rule: amber appears **at most once per viewport**, on the moment of social
commitment (composer "Send ask to {first}", profile "Ask for advice", home
"Find matches", event RSVP). It is **never repeated per-card in a list** —
multi-card browse surfaces (ask results, people, home suggestion grids) use
`action-primary` blue for card actions, and search re-run buttons on results
pages stay blue too. Scarcity is what makes amber mean something. If two amber
controls compete on one screen, the product decision is unresolved. In
`density-pro` (operator surfaces), `cta` reverts to `primary` because admin
contexts have many equal-weight actions.

Offer rule: `action-offer` (sage) is the third action color — helper-side
"give help" commitments only (Offer mentorship, Accept a request, You're
going). It mirrors amber's asker-side role across the two-sided exchange and
is implemented as `Button variant="offer"`. Sage remains a state color
elsewhere; the action role never applies to asker-side or destructive
controls.

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
| `success-tint` | `rgb(21 160 95 / 10%)` | Open, accepted, completed background |
| `warning-tint` | `rgb(161 98 7 / 12%)` | Attention-needed background |
| `danger-tint` | `rgb(155 44 31 / 10%)` | Error and destructive warning background |
| `plum-tint` | `rgb(124 58 237 / 10%)` | Editorial category background |
| `editorial-rule` | `rgb(250 250 249 / 16%)` | Divider on Ink editorial surfaces |
| `editorial-rule-strong` | `rgb(250 250 249 / 28%)` | Strong divider or outline on Ink editorial surfaces |
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
| `surface-ink-foreground` on `surface-ink` | `16.9:1` | Text on Ink editorial surfaces (measured 2026-06-11) |
| `primary-on-dark` on `surface-ink` | `9.8:1` | Links and accents on Ink editorial surfaces (measured 2026-06-11) |
| `destructive` on `background` | `7.25:1` | Error text on page canvas |
| `accent-sage` on `background` | `5.69:1` | Success text on page canvas |
| `accent-rust` on `background` | `5.03:1` | Negative state text on page canvas |
| `accent-plum` on `background` | `9.24:1` | Category text on page canvas |

Known limits:

- The older ochre `#c8761a` was `3.32:1` on `background` and is superseded.
  Current `accent-ochre` `#a16207` is `4.71:1`, but warning body copy should
  still use `state-warning-foreground` so warnings are not dependent on color
  alone and do not visually compete with amber CTA.
- `primary` on `surface-ink` is `3.4:1`; use `primary-on-dark` on
  Ink editorial surfaces.
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
- **Quotes are sacred.** Quotation marks, the pull-quote rule, and italics
  appear only around words a human actually wrote (bios, personal notes,
  real ask text). System-generated rationale renders as plain text under a
  card label — the product never fabricates member speech.
- Mono is for metadata that benefits from a fixed-width skeleton (dates,
  counts, ratios, technical IDs, ledger numerals). Never decorative kickers.

### Label voices

Three label styles, each with exactly one job:

| Voice | Class | Job | Example |
|---|---|---|---|
| Page eyebrow | `.bc-section-kicker` | Page-level wayfinding (blue, leading rule) | "Ask", "Help queue", "People search" |
| Card label | `.bc-card-label` | Section naming inside cards — Inter 12px/600 uppercase, muted ink | "Why they might fit", "Today", "Getting there" |
| Data | `font-mono` | Fixed-width data only | "sent 12 days ago", "4 / 50", "01–04" |

The decorative-mono kicker pattern (MATCH BRIEF, CAPACITY, COORDINATES…) is
retired; sweep any reappearance to `.bc-card-label`.

### Avatar colors

Initials fallbacks use a stable generated color via `avatarColorClasses()`
in `app/src/lib/utils.ts`: hash(userId, or name for display-only rows) → one
of six verified-contrast tint/ink pairs (sky, sage, plum, ochre, rust on
tints; Ink solid). Photo first; gray `surface-panel` avatars are
retired — with no photos yet, a stable personal color is the card's human
presence.

### Size scale

| Token | Size | Role |
|---|---:|---|
| `display-lg` | `40px` | Page-level display moments |
| `display-md` | `32px` | Section and hero subheads |
| `h1` | `25.6px` | Real page-level h1 |
| `body-lg` | `17px` | Lead or editorial body copy |
| `body-md` | `16px` | Default body — meets mobile-readability minimum |
| `caption` | `13px` | Secondary labels and short metadata |
| `mono-sm` | `12px` | Compact uppercase metadata |

The scale uses a **1.25 modular ratio (Major Third)** anchored at body 16px. The above values are for the default density. `density-cozy` compresses to body 14px / h1 22px for list-of-cards member surfaces; `density-pro` compresses further to body 14px / h1 20px for operator surfaces (see § Density modes).

Production rule: do not introduce sizes below `mono-sm` (12px). The previous `mono-xs` (9px) token was removed because the rule "do not depend on it alone" was easier to break than to enforce.

### Named utilities (no `text-[Npx]` literals)

Every scale step has a Tailwind utility, mapped through the `--font-size-*`
custom properties so density modes keep working:

| Utility | Resolves to | Notes |
|---|---|---|
| `text-kicker` | 11px | eyebrow/kicker lines |
| `text-caption` | 13px (12px cozy/pro) | secondary labels |
| `text-body-sm` | 14px | compact body |
| `text-body-md` | 16px (14px cozy/pro) | default body |
| `text-body-lg` | 17px (15px cozy) | lede copy |
| `text-h1` / `text-h2` | 25.6/20px (density-aware) | page headings |
| `text-display-md` / `text-display-lg` | 32/40px (density-aware) | hero moments |
| `tracking-label` | 0.08em | uppercase card labels |
| `tracking-kicker` | 0.12em | page kickers |
| `tracking-hero` | 0.18em | wide editorial-hero kickers (auth) |
| `detail:` / `max-detail:` | 761px breakpoint | the master-detail layout pivot |

Hero display sizes flow through the density contract: a `density-cozy`
surface renders `text-display-lg` at 34px on purpose — do not hardcode
40px to escape it.

**Enforcement:** `pnpm check:tokens` (scripts/check-design-tokens.sh, also a
CI step) ratchets the count of arbitrary `text-[Npx]` / `tracking-[…]` /
`p*-[Npx]` / `min|max-[Npx]` literals — it fails when the count rises above
`scripts/design-tokens-baseline.txt`, and the baseline only moves down. The
~16 remaining literals are deliberate (Ink date-block display sizes,
28px between-scale heroes, sub-0.01em negative tracking, the 480px mobile
cutoff).

## Shape And Spacing

| Token | Value | Role |
|---|---:|---|
| `radius` | `10px` | Default card, input, button, panel, and badge radius — community-warm Soft UI Evolution band |
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

## Density modes

Density is an orthogonal axis to theme. Surfaces declare a density via an
HTML/wrapper class. The class overrides type sizes, padding, shadow weight,
and (in pro mode) the CTA color. Radius, color palette, font family, and
focus styles never flip with density — those are brand identity.

| Class | Body | h1 | Use |
|---|---:|---:|---|
| (no class — default) | 16px | 25.6px | Single hero surfaces — onboarding, auth, profile detail header |
| `.density-cozy` | 14px | 22px | List-of-cards member surfaces — home, ask results, inbox, people |
| `.density-pro` | 14px | 20px | Operator surfaces — admin tables, analytics, ambassador dash |

### What changes with density

| Token | default | cozy | pro |
|---|---:|---:|---:|
| `--font-size-body-md` | `1rem` (16px) | `0.875rem` (14px) | `0.875rem` (14px) |
| `--font-size-h1` | `1.6rem` (25.6px) | `1.375rem` (22px) | `1.25rem` (20px) |
| `--font-size-caption` | `0.8125rem` (13px) | `0.75rem` (12px) | `0.75rem` (12px) |
| Shadow weight | full scale | slightly lighter | hairline only |
| `--cta` color | amber | amber (kept) | reverts to primary blue |

### What does NOT change with density

- `--radius` (always 10px)
- Color palette (always Electric Sky + brand neutrals)
- Font family (always Inter / Inter Tight)
- Focus styles (always the same focus ring)

### Surface assignment

| Surface | Density | Why |
|---|---|---|
| Onboarding, auth, sign-in | default | New reader needs confidence; single focus |
| Profile detail header (single person) | default | Identity moment, single focus |
| **Home (list of match cards)** | **cozy** | Scanning 3-5 cards, not focusing on one |
| **Ask results, People search** | **cozy** | Same — list of match cards |
| **Inbox, message threads** | **cozy** | Repeated rows, each row is a relationship |
| Mentor settings, profile editor | default | Decisions matter, user-controlled |
| **Admin members table** | **pro** | Operator workflow, scan-dense |
| **Admin analytics, ambassador dash** | **pro** | Operator workflow, scan-dense |

### Implementation

Density is applied via a wrapper class on the route's layout or page:

```tsx
// app/src/app/(member)/page.tsx (home)
return <div className="density-cozy">{children}</div>

// app/src/app/(member)/admin/layout.tsx
return <div className="density-pro">{children}</div>
```

The class can be applied at any level — `<html>`, route layout, or single
component — because density tokens are CSS custom properties that inherit
through the cascade.

### Density multipliers (legacy)

The previous `--density-compact / -default / -roomy` numeric multipliers are
preserved for components that read them directly, but new code should prefer
the `.density-cozy` and `.density-pro` classes above.

| Token | Value | Use |
|---|---:|---|
| `density-compact` | `0.875` | Legacy — admin tables, dense filter bars |
| `density-default` | `1` | Legacy — member-facing default |
| `density-roomy` | `1.125` | Legacy — onboarding, auth, explanation moments |

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
| `email-primary` | `#2563eb` | Links and secondary positive CTA in email body |
| `email-primary-hover` | `#1d4ed8` | Webmail hover where supported |
| `email-cta` | `#f59e0b` | Amber CTA — the single highest-stakes action per email (Accept invitation, RSVP) |
| `email-cta-foreground` | `#0c0c0b` | Text on amber CTA |
| `email-destructive` | `#9b2c1f` | Error or destructive copy |
| `email-radius` | `10px` | Buttons and containers (matches app `--radius`) |
| `email-font-family` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | Email typography |

## Screen-Level Rules

- Every member screen should expose the next useful relationship action without requiring browsing.
- Admin tables may be denser, but still use the same tokens and status language.
- Dark "Ink editorial" surfaces use `surface-ink` plus `primary-on-dark`; warm Ink is the canvas and Electric Sky remains the blue accent.
- Do not use Ink for ordinary cards, tables, sidebars, or dense member workflows.
- The overlapping-circles motif (`components/ui/circles-motif.tsx`) appears
  only on Ink surfaces and inside the shared `EmptyState` component, at
  low opacity — never as general card decoration.
- Dark mode is live: `next-themes` applies `.dark` from the OS preference,
  with a Light/Dark/System override in the account menu. New tokens must be
  added to both `:root` and `.dark`.
- Cards should read as decision surfaces, not decoration.
