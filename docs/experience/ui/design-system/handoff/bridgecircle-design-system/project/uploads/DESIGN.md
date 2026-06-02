---
version: alpha
name: Civic Editorial
description: BridgeCircle's design system — a member-first, editorial visual language for verified warm-network communities. Anchors on Electric Sky blue for navigation, a single amber CTA per surface, and an editorial calm built from spacing, typography, and decision surfaces rather than ornament.
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-on-dark: "#93c5fd"
  cta: "#f59e0b"
  cta-hover: "#d97706"
  on-cta: "#0c0c0b"
  secondary: "#f4f3ee"
  tertiary: "#7c3aed"
  neutral: "#fafaf9"
  surface: "#ffffff"
  surface-panel: "#f4f3ee"
  surface-subtle: "#ebebe5"
  surface-editorial: "#081126"
  on-surface: "#0c0c0b"
  on-surface-muted: "#4d4d4a"
  on-surface-editorial: "#fafaf9"
  border: "#dcdcd6"
  focus-ring: "#2563eb"
  error: "#9b2c1f"
  warning: "#a16207"
  danger-accent: "#c4314b"
  success: "#15a05f"
  category: "#7c3aed"
  primary-tint: "rgba(37, 99, 235, 0.10)"
  primary-tint-strong: "rgba(37, 99, 235, 0.16)"
  success-tint: "rgba(21, 160, 95, 0.10)"
  warning-tint: "rgba(161, 98, 7, 0.12)"
  danger-tint: "rgba(155, 44, 31, 0.10)"
  category-tint: "rgba(124, 58, 237, 0.10)"
  editorial-rule: "rgba(250, 250, 249, 0.16)"
  editorial-rule-strong: "rgba(250, 250, 249, 0.28)"
typography:
  display-lg:
    fontFamily: Inter Tight
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  display-md:
    fontFamily: Inter Tight
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter Tight
    fontSize: 25.6px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter Tight
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.02em
rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  card-padding: 24px
  section-gap: 32px
components:
  button-cta:
    backgroundColor: "{colors.cta}"
    textColor: "{colors.on-cta}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  button-cta-hover:
    backgroundColor: "{colors.cta-hover}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.card-padding}"
  card-interactive-hover:
    backgroundColor: "{colors.surface}"
  card-editorial:
    backgroundColor: "{colors.surface-editorial}"
    textColor: "{colors.on-surface-editorial}"
    rounded: "{rounded.md}"
    padding: "{spacing.card-padding}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 8px 12px
    height: 40px
  status-badge-info:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  status-badge-success:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  status-badge-warning:
    backgroundColor: "{colors.warning-tint}"
    textColor: "{colors.on-surface}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  status-badge-danger:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.error}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  status-badge-muted:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  avatar:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    size: 40px
---

# Civic Editorial

BridgeCircle's production design system. Canonical specs and live implementation: [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/) and [`app/src/app/globals.css`](app/src/app/globals.css). When code and docs disagree, code wins — fix the doc in the same change.

## Overview

BridgeCircle is a verified warm-network platform for trusted communities. The design system is **member-first** and **editorial**: it carries the product thesis that the platform exists to help members ask for help, offer help, and feel more connected — not to manage them as a CRM does.

The emotional register is **calm, considered, and trustworthy**. Surfaces read as decision moments rather than feed entries; type and spacing do the editorial work that a serif accent face would do elsewhere. The palette is restrained — Platinum Bone canvas, Obsidian text, a single Electric Sky blue for navigation, and one Amber CTA reserved for the highest-stakes action per surface (Send request, RSVP, Accept, Ask).

A two-sided buffer principle informs every peer-to-peer surface: reduce psychological friction for both the initiator and the responder. The system's restraint, the lifecycle status language, and the at-most-one-CTA rule all serve that thesis.

Density is orthogonal to theme. The same tokens render at three density levels — default (single-focus hero surfaces), cozy (list-of-cards member surfaces), and pro (operator/admin surfaces) — so a member home and an admin table share identity without sharing scan-cost.

## Colors

The palette is restrained on purpose. Color carries meaning, not decoration. Raw hex values are not allowed in app surfaces except for stable generated avatar colors, event-category colors, chart colors, or a documented one-off.

- **Primary (#2563eb) — Electric Sky:** navigation, links, secondary positive actions, link-as-button. The blue is the workhorse — it carries most interactive affordance.
- **CTA (#f59e0b) — Amber:** reserved for the single highest-stakes action per surface — Send request, RSVP, Accept, Ask for advice. At most one amber control per local decision area. If two compete, the product decision is unresolved.
- **Secondary (#f4f3ee) — Soft Panel:** grouped controls, quiet callouts, side panels.
- **Tertiary (#7c3aed) — Grape:** editorial categorization for secondary taxonomy (topics, content type). Not an alarm color.
- **Neutral (#fafaf9) — Platinum Bone:** page canvas. Softer than pure white; reads as paper rather than dashboard.
- **Surface (#ffffff):** raised cards, popovers, decision surfaces.
- **Surface Editorial (#081126) — Midnight:** reserved for hero, auth, and entry editorial moments. Not for ordinary cards, tables, or dense workflows. On Midnight, use `primary-on-dark` (#93c5fd) for accents — ordinary `primary` fails contrast.
- **On-surface (#0c0c0b) — Obsidian:** primary text. 18.7:1 on canvas, 19.6:1 on cards (AAA).
- **On-surface-muted (#4d4d4a):** secondary copy and metadata. 8.1:1 on canvas (AAA).
- **Semantic palette:** `error` (#9b2c1f, destructive/declined), `warning` (#a16207, attention without alarm), `success` (#15a05f, open/accepted), `category` (#7c3aed, grape taxonomy), and `danger-accent` (#c4314b, declined/negative accent). Warning is border/dot/fill-safe but not safe for small body text — use `on-surface` for warning copy.

Tints (`primary-tint`, `success-tint`, `warning-tint`, `danger-tint`, `category-tint`) carry selection backgrounds, badge fills, and quiet callouts at 10–16% alpha. Tints are not a license to introduce new hues.

Production rule: prefer role tokens (`surface-panel`, `on-surface-muted`, `focus-ring`) over base hue tokens. Base hues exist for compatibility with primitive APIs that predate role naming.

## Typography

Three families, **no serif anywhere**: editorial weight comes from spacing, hierarchy, and tight letter-spacing on Inter Tight at generous sizes, not from a serif accent.

- **Inter** — body, labels, UI, buttons. The default sans.
- **Inter Tight** — display family for hero h1s, section h2s, wordmark, profile names, card titles, stat numbers.
- **JetBrains Mono** — system metadata, dates, technical IDs. Used sparingly; mono is for fixed-width data, not decorative kickers.

The scale uses a **1.25 modular ratio (Major Third)** anchored at body 16px. Italics are reserved for the pull-quote treatment (sapphire left rule + italic Inter). Body italic is acceptable in long-form announcement bodies; avoid it in short cards. Do not introduce sizes below `mono-sm` (12px) — the previous 9px token was removed because "do not depend on it alone" was easier to break than to enforce.

Density compresses the scale without changing families or roles. In `cozy` density, body drops to 14px and h1 to 22px. In `pro` density, body stays at 14px and h1 drops to 20px. Radius, color, and font family never flip with density.

## Layout

The layout follows a **fluid container model** anchored on a 4px base unit. Surfaces stack vertically with consistent section gaps; multi-column layouts collapse on mobile rather than reflowing rows.

- **Base unit:** 4px. The scale steps at 4, 8, 12, 16, 24, 32, 48. No arbitrary in-between values.
- **Card padding:** 24px default on member surfaces; 16px on cozy density list rows; 12px on pro density admin tables.
- **Section gaps:** 32px between major sections on a page; 16px within a section between sibling components.
- **Content width:** Member surfaces use a comfortable measure (max ~720px for prose, ~960px for card grids). Admin surfaces may extend to viewport with horizontal scroll for tables.
- **Mobile collapse:** Two-column field rows collapse to one column below tablet width. Primary actions stay above long descriptive content. Critical columns in admin tables remain accessible via horizontal scroll rather than being hidden.

Density modes flip padding and gap weight, not the underlying grid. A `density-cozy` wrapper reduces card padding and tightens row gaps; `density-pro` tightens further for operator scan-density.

## Elevation & Depth

Lift comes from **paper-weight shadows + 1–2px hover translate**, not heavy drop shadow. The three-step scale stays subtle on purpose; dashboard gloss is off-brand.

- **Hairline (`shadow-card`):** `0 1px 0 rgb(12 12 11 / 0.03)`. Quiet rows and inline cards. Often equivalent to "no shadow."
- **Lift (`shadow-card-hover`):** `0 4px 12px -2px rgb(12 12 11 / 0.06)`. Default on interactive cards and auth/sign-in surfaces.
- **Hero (`shadow-hero`):** `0 12px 34px -8px rgb(12 12 11 / 0.10)`. Reserved for hero/feature surfaces and the hover state of interactive cards. One per surface.

Borders carry as much hierarchy as shadows. A 1px border at `--border` (#dcdcd6) plus 24px padding plus restrained shadow reads as a decision surface; the same border without shadow reads as a quiet section. Do not stack `shadow-hero` on nested elements — if two surfaces both want hero lift, the page hierarchy is wrong.

Dark mode raises shadow alpha while preserving the same token names. The Midnight editorial surface uses `editorial-rule` (16% white) and `editorial-rule-strong` (28% white) for dividers rather than dark-mode borders.

## Shapes

The shape language is **soft-editorial**: 10px radius default reads as community-warm without slipping into childlike. Full circles are reserved for identity and atomic affordances.

- **Default radius:** 10px (`rounded.md`) on cards, inputs, buttons, panels, badges.
- **Smaller radius:** 6px (`rounded.sm`) for tightly packed inline chips and compact admin controls when 10px would overwhelm the row.
- **Circles (`rounded.full`):** avatars, status dots, radio controls, notification counters, progress bars, and search capsules. The search capsule is the one pill exception because pill-shape is a familiar input pattern.

Do not mix sharp (0px) corners with the system. Do not introduce new radius values for a single surface — extend the scale instead.

## Components

Component primitives live in [`app/src/components/ui/`](app/src/components/ui/). Start from the shared primitive and its variants before writing local class strings. Routes should not rebuild hover, focus, disabled, loading, or invalid behavior with one-off styles.

### Action hierarchy

| Level | Component | Use |
|---|---|---|
| **CTA** | `Button variant="cta"` | The **single** highest-stakes action per surface. Amber fill. In `density-pro`, reverts to primary blue automatically. |
| Primary | `Button variant="default"` | Secondary positive actions, navigation, link-as-button. Electric Sky blue. |
| Secondary | `Button variant="secondary"` or `outline` | Useful alternative action. |
| Tertiary | `Button variant="ghost"` or `link` | Navigation, disclosure, low-risk movement. |
| Destructive | `Button variant="destructive"` | Delete, revoke, cancel, decline. |
| Status-only | `StatusBadge` | Communicates state without inviting action. |

### Buttons

40px default height, 10px radius, 16px horizontal padding, `label-md` typography. Hover transitions use `motion-base` (150ms) with `ease-standard`. Focus-visible is mandatory: 2px `focus-ring` plus a low-alpha `focus-ring-muted` halo. Disabled states reduce interactivity but keep readable text contrast. Loading states preserve button width — text is swapped for verb-ing copy (e.g., "Sending…") and a spinner, not by shrinking the control.

### Cards

Cards are **decision surfaces**, not section wrappers. Default radius 10px, 24px padding, hairline shadow. Interactive cards may lift 1–2px on hover; static cards do not animate. Do not stack cards inside cards unless the inner item is a repeated row or list item.

Product cards (Person Card, Request Card, Event Card, Inbox Thread Row) follow documented content contracts in [`docs/experience/ui/design-system/components.md`](docs/experience/ui/design-system/components.md). Each card carries identity, status, rationale, and exactly one primary action; secondary actions move to overflow.

### Status badges

`StatusBadge` carries semantic state through tone, not raw color. `LifecycleStatusBadge` maps common lifecycle words (`pending`, `accepted`, `active`, `completed`, `declined`, `revoked`, `expired`, `paused`, `unread`, `disabled`, `error`) to canonical tones. Unread requires dot **plus** stronger text weight — never color alone. Pill shape (full radius) on a tint background. Do not invent route-local lifecycle color maps.

### Inputs

40px default height, 10px radius, 1px border at `--border`. Focus state: 2px `focus-ring` border with low-alpha halo, no layout shift. Placeholder is never the only label. Invalid state uses `error` border and `danger-tint` halo with the error message attached to the field on mobile. Pending state preserves the input width; submission spinners attach to the submit button, not the field.

### Empty states

Every empty state names the state (not the feature) and offers the next useful action when one exists. `default` variant for whole-page or major-tab empties; `inline` variant for section, table, or card-body empties. No marketing copy. No decorative-only empty states unless the user truly cannot do anything next.

### Dialogs, popovers, menus

Use `Dialog` for confirmation, explanation, and focused secondary tasks. Keep content editorial and concise — dialogs are not full pages. Overlay enter uses `motion-medium` (200ms) with `ease-emphasized` (`cubic-bezier(0.2, 0.8, 0.2, 1)`). Popovers and dropdown menus inherit the same overlay motion.

### Avatars

40px default, full radius, photo first. Initials fallback uses `font-heading` (Inter Tight) at the matching size with a stable generated background color.

## Do's and Don'ts

- **Do** use amber CTA for exactly one action per local decision area.
- **Do** prefer role tokens (`surface-panel`, `state-warning`, `focus-ring`) over raw hex literals.
- **Do** apply density via wrapper class (`density-cozy`, `density-pro`) — never restyle type sizes per route.
- **Do** keep unread state visible through dot + text weight, not color alone.
- **Do** preserve control footprint across loading, pending, and disabled states.
- **Do** put field errors beside fields and form errors near submit; mobile errors stay attached to their field.
- **Do** respect `prefers-reduced-motion: reduce` — non-essential transitions are disabled automatically in the live CSS contract.

- **Don't** invent new tokens, hues, or accent maps when an existing role token covers the meaning.
- **Don't** stack `shadow-hero` on nested elements — the page hierarchy is wrong if two surfaces both want hero lift.
- **Don't** use `warning` (#a16207) as small body text on light backgrounds — its 3.3:1 contrast is border/dot/fill-only.
- **Don't** use Midnight editorial surfaces for ordinary cards, tables, inbox rows, or forms.
- **Don't** use placeholder text as the only label, or hide accept/decline behind an overflow menu for incoming requests.
- **Don't** introduce text below `mono-sm` (12px) — small mono is the floor.
- **Don't** animate layout-critical row height, text wrapping, or control width.
- **Don't** reach for raw shadcn primitives or hex literals unless explicitly asked to invent a new pattern.
- **Don't** use serif fonts anywhere. If a surface wants editorial weight, use Inter Tight at a generous size with tight letter-spacing.
