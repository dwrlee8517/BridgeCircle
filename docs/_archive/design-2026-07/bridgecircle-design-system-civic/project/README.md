# BridgeCircle Design System
**"Civic Editorial"** — member-first, editorial visual language for verified warm-network communities.

> Structured enough to trust. Warm enough to ask.

---

## Sources

This design system was built from the following resources:

- **GitHub repo:** [dwrlee8517/BridgeCircle](https://github.com/dwrlee8517/BridgeCircle) — full Next.js/React app source, component primitives, globals.css token source of truth
- **Mounted codebase:** `app/` — live Next.js app routes, member/admin screens, inbox, ask/help flows
- **Design spec:** `uploads/DESIGN.md` — canonical Civic Editorial token spec (YAML frontmatter + prose)
- **Docs:** `docs/experience/ui/design-system/components.md` — production component contracts and usage rules

> **Note for readers:** If you have access to the GitHub repo, focus on `app/src/components/ui/` (primitives), `app/src/app/(member)/` (product screens), and `app/src/app/globals.css` (live CSS token source). The `docs/experience/ui/design-system/` folder contains the canonical component guide.

---

## Product Overview

BridgeCircle is a **verified warm-network platform** for alumni groups, student organizations, fellowships, and company alumni networks. It turns shared affiliation into mentoring, hiring, events, and long-term community engagement.

### Core Products / Surfaces

| Surface | Description |
|---|---|
| **Member App** | The primary product — Auth, Onboarding, Home/Dashboard, Ask, Help, People Search, Inbox, Profile, Events, School, Announcements |
| **Admin Console** | Operator surfaces — Approvals, Members table, Event management, Invite/CSV import, Analytics |
| **Email Templates** | Lifecycle emails using Civic Editorial email tokens (separate from app CSS) |

### Main User Groups

- **Emerging members** — students, recent graduates seeking mentorship, referrals, peer continuity
- **Established members** — experienced alumni offering advice, mentorship, recruiting access
- **Administrators** — school/org leads managing verification, moderation, invitations, events

---

## CONTENT FUNDAMENTALS

### Voice & Tone

BridgeCircle copy is **calm, considered, and human**. It reads like a trusted colleague helping you decide — never like an admin dashboard pushing you through a checklist.

**Core register:** Warm but not casual. Direct but not terse. Editorial but not cold.

**Person:** First-person "I / you" framing is standard. The platform speaks to a specific person about their specific network. "Hi Alex" beats "Welcome, user."

**Casing:**
- Headings: Sentence case throughout (not Title Case for body headings)
- Kickers/labels/metadata: `ALL CAPS · TRACKED · SMALL` — used consistently for section kickers, status labels, and metadata categories
- Button labels: Sentence case, verb-first ("Ask for advice", "Request mentorship", "Find people")
- Navigation: Plain, concrete labels ("Ask", "Help", "People", "School", "Inbox")

**Voice examples from the product:**
- `"Hi Alex. Who do you want to ask?"` — dashboard greeting
- `"Find someone who has been there, or offer help where your experience matters."` — dashboard sub
- `"Relationship work is organized by state."` — inbox command center
- `"Nothing needs a reply."` — empty state (names the state, not the feature)
- `"A quick welcome or useful pointer can make the network feel alive."` — nudge copy
- `"Status auto-expires after 14 days."` — settings helper text

**Emoji:** Not used anywhere in the product UI. Zero emoji. The editorial calm depends on it.

**Punctuation:** Em-dashes (—) used in copy. Oxford comma. Ellipsis (…) used in placeholder text, not in UI labels.

**Numbers:** Shown directly where meaningful ("3 open helpers", "Class of '26"). Monospace font for all numeric metadata.

**Microcopy rules:**
- Empty states name the state, not the feature. "Nothing needs a reply." not "Your inbox is empty."
- Loading states use verb-ing copy ("Sending…"), not "Loading…"
- Errors stay attached to their field. Form errors go near submit.
- Placeholder text is never the only label.

---

## VISUAL FOUNDATIONS

### Color

The palette is **intentionally restrained**. Color carries meaning, not decoration. Raw hex values are not used in app surfaces.

| Name | Token | Hex | Role |
|---|---|---|---|
| Electric Sky | `--primary` | `#2563eb` | Navigation, links, secondary positive actions, interactive affordance |
| Amber | `--cta` | `#f59e0b` | Single highest-stakes action per surface (Send, RSVP, Accept, Ask). At most one per local decision area. |
| Platinum Bone | `--background` | `#fafaf9` | Page canvas — softer than white, reads as paper |
| Obsidian | `--foreground` | `#0c0c0b` | Primary text. 18.7:1 on canvas (AAA). |
| Soft Panel | `--secondary` | `#f4f3ee` | Grouped controls, side panels, quiet callouts |
| Surface White | `--card` | `#ffffff` | Raised cards, popovers, decision surfaces |
| Midnight | `--surface-midnight` | `#081126` | Hero, auth, editorial entry moments only — not for cards or tables |
| Muted | `--muted-foreground` | `#4d4d4a` | Secondary copy and metadata. 8.1:1 (AAA). |
| Border | `--border` | `#dcdcd6` | 1px borders on cards, inputs, dividers |

**Accent colors (editorial use):**
- Ochre `#a16207` — warning, mentor paused, request attention
- Crimson `#c4314b` — declined, destructive emphasis
- Emerald `#15a05f` — success, mentor open, completed
- Grape `#7c3aed` — secondary taxonomy (topics, content type)

**Tints:** All accent colors have 10–16% alpha tints for badge fills, selection backgrounds, quiet callouts. Never introduce new hues.

**Key rules:**
- At most one Amber CTA per local decision area
- Midnight editorial surface for hero/auth only
- Warning (#a16207) is contrast-safe for borders/dots/fills only — not for small body text
- On Midnight: use `primary-on-dark` (#93c5fd) for accents, not regular primary

### Typography

Three families. **No serif anywhere.** Editorial weight comes from spacing, hierarchy, and Inter Tight at generous sizes.

| Family | Token | Use |
|---|---|---|
| **Inter Tight** | `--font-display` | Display headings, hero h1s, section h2s, wordmark, card titles, stat numbers, profile names |
| **Inter** | `--font-sans` | Body text, labels, UI, buttons, form fields — the default |
| **JetBrains Mono** | `--font-mono` | System metadata, dates, class years, match scores, technical IDs. Used sparingly. |

**Scale (1.25 Major Third ratio, anchored at 16px body):**
- Display LG: 40px / Inter Tight / 600 / lh 1.1 / ls -0.02em
- Display MD: 32px / Inter Tight / 600 / lh 1.15 / ls -0.02em
- H1: 25.6px / Inter Tight / 600 / lh 1.2 / ls -0.01em
- H2: 20px / Inter Tight / 600 / lh 1.25
- Body LG: 17px / Inter / 400 / lh 1.55
- Body MD: 16px / Inter / 400 / lh 1.5
- Body SM: 14px / Inter / 400 / lh 1.45
- Label MD: 14px / Inter / 500 / lh 1.3
- Caption: 13px / Inter / 400 / lh 1.4
- Mono SM: 12px / JetBrains Mono / 400 / lh 1.4 / ls 0.02em

**Special treatments:**
- **Section kicker:** 11px / Inter / 700 / ALL CAPS / ls 0.12em / Electric Sky, with a `1.75rem × 2px` blue rule before it
- **Pull quote:** Inter italic / sapphire left border 3px / primary blue / used on profile bios, match rationale, inbox summaries
- **Italic:** Reserved for pull-quote treatment and long-form announcement body italic — never in short cards

**Density compression:**
- `density-cozy` (member list surfaces): body → 14px, h1 → 22px
- `density-pro` (admin/operator): body → 14px, h1 → 20px
- Radius, color, font family never change with density

### Backgrounds & Surfaces

- **Page canvas:** `--background` (#fafaf9) Platinum Bone, not pure white
- **Cards:** `--card` (#ffffff) white, 1px `--border` border, 10px radius, hairline shadow
- **Panels:** `--secondary` (#f4f3ee) Soft Panel for sidebars, grouping sections
- **Page band gradient:** `bc-page-band` — white fade + subtle Electric Sky radial bleed, applied to the dashboard hero section
- **Editorial / Midnight:** `--surface-midnight` (#081126) for hero, auth, and onboarding entry. Has faint relationship-map SVG motif overlaid.
- **Command surface:** `bc-command-surface` — the AskBar uses a very subtle grid + radial glow treatment with a blue-tinted border

### Spacing

4px base unit. Steps: 4, 8, 12, 16, 24, 32, 48px. No arbitrary in-between values.
- Card padding: 24px default / 16px cozy / 12px pro
- Section gaps: 32px between major sections / 16px within sections

### Borders, Radius & Shape

- **Default radius:** 10px (`rounded.md`) — community-warm without being childlike
- **Small radius:** 6px (`rounded.sm`) — compact inline chips, dense admin controls
- **Circles:** Avatars, status dots, radio controls, notification counters, progress bars, search capsule pill
- **No sharp (0px) corners** anywhere in the system

### Shadows & Elevation

Paper-weight shadows, not dashboard gloss. 3-step scale:
- **Hairline:** `0 1px 0 rgb(12 12 11 / 0.03)` — quiet rows, inline cards
- **Lift:** `0 4px 12px -2px rgb(12 12 11 / 0.06)` — interactive cards, auth surfaces
- **Hero:** `0 12px 34px -8px rgb(12 12 11 / 0.10)` — hero/feature surfaces, card hover (one per surface)

### Animation & Motion

- **Base:** 150ms `ease-out` (`--motion-base`) — controls, color/bg transitions
- **Medium:** 200ms `cubic-bezier(0.2, 0.8, 0.2, 1)` (`--ease-emphasized`) — overlay enter (dialogs, popovers)
- **Fast:** 100ms — micro-interactions
- **Slow:** 300ms — reserved; rarely used
- **Hover lifts:** 1–2px `translateY`, combined with shadow step-up
- **Loading pulse:** 1.4s `ease-out` infinite opacity cycle (56% → 100% → 56%)
- `prefers-reduced-motion: reduce` respected — non-essential transitions disabled automatically
- Do not animate layout-critical row height, text wrapping, or control width

### Hover & Interaction States

- **Interactive cards:** 1–2px upward translateY + shadow step-up on hover. Static cards don't animate.
- **Buttons:** bg color darkens 1 shade (`primary-hover`, `cta-hover`). `active:opacity-80`.
- **Links/nav items:** `text-foreground` on hover (from `text-muted-foreground`)
- **Nav active state:** 2px `bg-primary` underline at bottom of header link
- **Focus ring:** 2px `--focus-ring` + 4px `--focus-ring-muted` halo. Mandatory on all interactive elements.
- **Prompt chips / filter pills:** `hover:bg-primary/[0.04] hover:border-primary/30`

### Imagery

- **Avatars:** Photo first; initials fallback uses Inter Tight in a stable muted background
- **Illustrations:** The NetworkMotif (home dashboard) uses an inline SVG — relationship graph with soft circles and gradient arcs in Electric Sky → Sage → Ochre. This is the only decorative illustration in the product.
- **Background imagery:** Not used. Surfaces use color tokens, gradients, and the bc-page-band treatment.
- **Color vibe:** Editorial, restrained. No stock photography or marketing imagery in the app.
- **Dark editorial surface:** The Midnight card (`surface-midnight`) has an SVG network motif overlay at 70% opacity.

### Cards

Cards are **decision surfaces**, not section wrappers.
- 10px radius, 24px padding, 1px border, hairline shadow
- Interactive cards: `hover:-translate-y-[1px] hover:shadow-card-hover` (lift animation)
- Do not stack cards inside cards (except for repeated row/list items)
- Editorial card (Midnight): `bg-surface-midnight text-surface-midnight-foreground`, uses `editorial-rule` for dividers

### Density Modes

| Class | Surface | What changes |
|---|---|---|
| (none) | Single-focus hero surfaces (onboarding, auth, profile detail) | Default scale |
| `density-cozy` | Member-facing list-of-cards (home, ask results, people, inbox) | Type compresses ~1.15x, card padding tightens |
| `density-pro` | Operator/admin surfaces (tables, analytics, ambassador dashboards) | Type tightest, CTA reverts to primary blue |

---

## ICONOGRAPHY

BridgeCircle uses **Lucide React** icons throughout — stroke-weight 2, dynamically sized with Tailwind `size-*` classes.

Common icons in use:
- `Menu` — hamburger nav toggle
- `Search` — search inputs and the header search bar
- `ArrowRight` — CTA button suffixes, section "view all" links
- `Bell` / `BellDot` — notifications
- `ChevronRight` — disclosure arrows, inbox chevrons
- `Inbox` — inbox empty state
- `Megaphone` — announcement banner
- `Sparkles` — AI/match signal
- `CalendarDays` — events
- `CircleHelp` — AskBar icon (the blue square)
- `MessageCircleQuestion` — ask/help icon
- `ArrowLeft` — mobile back navigation
- `X` — clear/dismiss

**Wordmark logo:** Custom inline SVG — two overlapping circles. Left circle in `currentColor` (Obsidian in light mode), right circle in `var(--primary)` (Electric Sky). This is the only custom SVG asset. 28×28px, stroke 1.4px, no fill.

```svg
<svg width="28" height="28" viewBox="0 0 28 28">
  <circle cx="11" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
  <circle cx="17" cy="14" r="9" fill="none" stroke="var(--primary)" strokeWidth="1.4" />
</svg>
```

**Icon style:** Lucide (stroke, not fill). No filled icons, no emoji as icons, no unicode char icons.
**CDN:** `lucide-react` npm package in the app; for standalone HTML, use `https://unpkg.com/lucide@latest`.

Assets copied to `assets/`:
- `logo-mark.svg` — standalone wordmark SVG
- `network-motif.svg` — the SVG relationship graph used in the Midnight card

---

## File Index

```
README.md                          This file — product context, design foundations
SKILL.md                           Agent skill definition for Claude Code
colors_and_type.css                CSS custom properties for all tokens (colors, type, spacing, motion, shadows)

assets/
  logo-mark.svg                    BridgeCircle two-circle wordmark
  network-motif.svg                Relationship map SVG for editorial Midnight surfaces

preview/
  colors-brand.html                Brand / primary palette swatches
  colors-semantic.html             Semantic / state color tokens
  colors-tints.html                Tint tokens and surface colors
  type-display.html                Display and heading type specimens
  type-body.html                   Body, label, caption, mono specimens
  type-kicker.html                 Section kicker and pull-quote treatments
  spacing-tokens.html              Spacing scale tokens
  spacing-shadows.html             Shadow and elevation scale
  components-buttons.html          Button variants and states
  components-badges.html           StatusBadge and Badge variants
  components-cards.html            Card variants and decision surface patterns
  components-inputs.html           Input, Textarea, Select states
  components-avatar.html           Avatar system (photo + initials fallback)
  components-density.html          Density mode comparison

ui_kits/
  app/
    README.md                      App UI kit overview
    index.html                     Interactive prototype — Home → People → Inbox
    Header.jsx                     MemberHeader component
    Nav.jsx                        MemberNav + mobile hamburger
    PersonCard.jsx                 ResultCard (comfortable + compact density)
    InboxPanel.jsx                 Inbox two-column layout
    AskBar.jsx                     Command surface AskBar + PromptChips
    NetworkMotif.jsx               Dashboard Midnight editorial panel
    StatusBadge.jsx                StatusBadge + LifecycleStatusBadge
    Button.jsx                     Button all variants
```
