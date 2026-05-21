# Civic Editorial Design System

A high-trust, print-journal-inspired visual system for **BridgeCircle**. 

This design system prioritizes professional clarity, editorial elegance, and structural precision. It rejects overly soft gradients and bubble rounded corners in favor of a crisp, grid-based layout, sharp borders, and technical monospace details.

---

## 1. Color Palette

The color palette is designed for maximum text readability and strong structural boundaries, using a balanced selection of cool slate-greys, true white surfaces, and an authoritative hybrid blue accent scale.

| Category | Token Name | Hex Value | Application |
| :--- | :--- | :--- | :--- |
| **Canvas** | `background` (Platinum Bone) | `#fafaf9` | Page background surface; provides soft contrast for cards |
| **Surfaces** | `card` (True White) | `#ffffff` | Elevated card surfaces; crisp and clean |
| | `panel` (Muted Card) | `#f4f3ee` | Filled cards, hover states, embedded panels |
| **Ink (Text)** | `ink` (Obsidian Ink) | `#0c0c0b` | Primary text, titles, major headers; high authority |
| | `ink2` (Sub-ink) | `#262521` | Secondary headings, body copy |
| | `muted` (Slate Grey) | `#4d4d4a` | Muted descriptions, labels (AA compliant contrast) |
| | `mute2` (Timestamp Grey) | `#8a8a84` | Small system details, timestamps, cohort years |
| **Borders** | `rule` (Crisp Rule) | `#dcdcd6` | Hairline borders, solid card dividers |
| | `rule-soft` (Soft Rule) | `#ebebe5` | Subtle dividers in lists |
| **Accents** | `primary` (Deep Cobalt) | `#173fb3` | Primary call-to-actions, buttons, key links, brand indicators |
| | `interactive` (Civic Blue) | `#4d88ff` | Active navigation highlights, hover states, dark-mode accents |
| **Supporting Blues**| `ice-tint` (Ice Wash) | `#f4f7ff` | Light mode card hovers, banner background washes |
| | `border-blue` (Slate Border) | `#d5e0fa` | Subtle cool blue card boundaries and list delimiters |
| | `dark-obsidian` (Navy Obsidian)| `#0b0f19` | Rich dark mode (Lamplight) page-canvas background |
| | `dark-slate` (Steel Slate) | `#1e293b` | Dark mode container borders and panel lines |
| | `ink-navy` (Deep Ink Navy) | `#0a192f` | Premium high-contrast editorial typography |
| | `sky-glow` (Sky Glow) | `#0ea5e9` | Status indicators, active circles, online badges |
| **Status** | `ok` (Forest Green) | `#165e34` | Success status, accepted requests, open roles |
| | `warn` (Deep Amber) | `#b25e00` | Urgent warnings, pending time tags (e.g. `T-4d`) |
| | `bad` (Crimson Red) | `#9b2c1f` | Error notifications, deleted or closed actions |

### Semantic Token Mapping (Theme Swap)
Rather than hardcoding colors directly, the application maps CSS variables to semantic theme tokens, enabling a seamless transition between the default Light mode and the dark **Lamplight** mode.

| Semantic Token | Light Mode Value (OKLCH / Hex) | Dark Mode Value (OKLCH / Hex) | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.985 0.002 90)` (`#fafaf9`) | `oklch(0.12 0.002 90)` (`#0c0c0b`) | Canvas page background |
| `--foreground` | `oklch(0.12 0.002 90)` (`#0c0c0b`) | `oklch(0.985 0.002 90)` (`#fafaf9`) | Primary text and major headers |
| `--card` | `oklch(1 0 0)` (`#ffffff`) | `oklch(0.16 0.004 90)` (`#1e1e1d`) | Default card surface |
| `--secondary` | `oklch(0.96 0.004 90)` (`#f4f3ee`) | `oklch(0.2 0.004 90)` (`#141416`) | Embedded panels, list items |
| `--muted-foreground` | `oklch(0.43 0.004 90)` (`#4d4d4a`) | `oklch(0.7 0.004 90)` (`#8a8a84`) | Muted metadata and sub-labels |
| `--border` | `oklch(0.88 0.004 90)` (`#dcdcd6`) | `oklch(1 0 0 / 12%)` (`#1e293b`) | Hairline borders and grid lines |
| `--primary` | `oklch(0.42 0.22 265)` (`#173fb3`) | `oklch(0.55 0.2 265)` (`#4d88ff`) | Primary call-to-actions & brand cobalt |
| `--primary-hover` | `oklch(0.35 0.20 265)` (`#112e82`) | `oklch(0.60 0.20 265)` (`#80aaff`) | Interactive hover state for primary CTAs |

---

## 2. Typography

We use two sans-serif faces for reading hierarchy and a high-resolution monospace face for system details and metadata.

### Headings (Display)
- **Font Family**: `"Inter Tight"`, `"Inter"`, system-ui, sans-serif
- **Letter Spacing**: `-0.035em` (tight tracking)
- **Weights**: `500` (Medium) / `600` (Semi-bold)
- **Line Heights**: `1.02` to `1.12`
- **Aesthetic**: Tailored, editorial, high-trust. Used for greeting names and section headers.

### Body Copy
- **Font Family**: `"Inter"`, system-ui, sans-serif
- **Letter Spacing**: `normal`
- **Weights**: `400` (Regular) / `500` (Medium)
- **Line Height**: `1.55`
- **Aesthetic**: Neutral, readable, clean. Used for request descriptions and messages.

### System Metadata (Technical)
- **Font Family**: `"JetBrains Mono"`, ui-monospace, monospace
- **Letter Spacing**: `0.14em` to `0.16em` (wide tracking)
- **Text Transform**: `uppercase`
- **Weights**: `500` (Medium) / `700` (Bold)
- **Aesthetic**: Technical, archival, metadata-focused. Used for edition stamps, date indicators, time remaining counters, and badges.

### Typographic Scale
To prevent size fragmentation, all font sizes and line heights are locked to this strict scale:

| Token | Desktop Size | Mobile Size | Line Height | Application |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | `36px` (`2.25rem`) | `28px` (`1.75rem`) | `1.02` | High-impact headlines, greetings |
| `display-md` | `28px` (`1.75rem`) | `22px` (`1.375rem`) | `1.10` | Section headers |
| `h1` | `20px` (`1.25rem`) | `18px` (`1.125rem`) | `1.20` | Card titles, panel headers |
| `body-lg` | `15px` (`0.9375rem`) | `15px` (`0.9375rem`) | `1.55` | Large copy, standfirsts |
| `body-md` | `13px` (`0.8125rem`) | `14px` (`0.875rem`) | `1.55` | Default body copy, messages |
| `caption` | `11px` (`0.6875rem`) | `12px` (`0.75rem`) | `1.40` | Secondary metadata labels |
| `mono-sm` | `10.5px` (`0.656rem`) | `10.5px` (`0.656rem`) | `1.40` | Uppercase metadata (JetBrains Mono) |
| `mono-xs` | `9px` (`0.5625rem`) | `9px` (`0.5625rem`) | `1.40` | Micro indicators and date stamps |

### Iconography Constraints
- **Stroke Weights**: Icons (e.g. Lucide) must use a consistent stroke weight of `1.5px` on desktop and `2px` on mobile/tablets. Fill styles are prohibited unless denoting a selected/active status.
- **Bounding Boxes**: Icons are bounded inside `16px` (for metadata labels and lists) or `20px` (for buttons and navigation links) squares to maintain alignment beside text.

---

## 3. Shapes & Layout Rules

### Borders & Corners
- **Radius**: All card corners, buttons, and chips use a uniform `--radius` of `6px` (`0.375rem`).
- **Hairlines**: Card borders and table lines are strictly `1px solid var(--rule)` (`#dcdcd6`) or `1px solid var(--rule-soft)` (`#ebebe5`).
- **Dividers**: Section splits are marked by `2px solid var(--ink)` (`#0c0c0b`) top borders to anchor content.

### Line Art & Motifs
- Avoid heavy, muddy background gradients or glowing dots.
- Use crisp, minimalist vector line art (overlapping stroke-only circles in black/cobalt lines) as a watermark/overlay for greetings or banners to add visual interest without compromising professional style.

### Spacing Grid Scale
Margins, paddings, and gaps must follow a strict 4px/8px-based grid to align with editorial columns:

| Spacing Token | Size | Application |
| :--- | :--- | :--- |
| `space-1` | `4px` (`0.25rem`) | Micro paddings, tiny gap between avatar and status dot |
| `space-2` | `8px` (`0.5rem`) | Badge paddings, gap between profile items, inner list gaps |
| `space-3` | `12px` (`0.75rem`) | Card padding (compact density), default list gap |
| `space-4` | `16px` (`1rem`) | Card padding (comfortable density), default button gap |
| `space-6` | `24px` (`1.5rem`) | Card padding (roomy density), gap between main content panels |
| `space-8` | `32px` (`2rem`) | Section grid spacing, vertical page gutter padding |
| `space-12` | `48px` (`3rem`) | Grid row gaps, top banner headers |

### Layout Breakpoints & Containers
- **Max Width**: Member dashboard containers are capped at `1280px` (`80rem`) to prevent text lines from stretching on wide monitors.
- **Responsive Breakpoints**:
  - `sm`: `640px` (Mobile portrait/landscape boundary)
  - `md`: `768px` (Tablet / Sidebar nav collapses to mobile drawer)
  - `lg`: `1024px` (Small desktop / Sidebar collapses/expands boundary)
  - `xl`: `1280px` (Default layout grid constraint)

### Z-Index Layering Stack
To prevent visual overlap bugs between floating panels, modals, dropdowns, and notifications, developers must use the following standard z-index values:

```css
--z-base: 0;
--z-card-hover: 10;
--z-sticky-nav: 100;
--z-floating-dock: 200;
--z-dropdown-popover: 300;
--z-command-drawer: 1000;
--z-modal-dialog: 1100;
--z-toast-notification: 1200;
```

---

## 4. Component Standards

### CivicButton
- **Shape**: Rectangular with a sharp `6px` radius.
- **Micro-animation**: Slight physical scale down on click (`active:translate-y-[0.5px]`).
- **Variants**:
  - **Primary**: Solid background (`var(--primary)` or `var(--ink)`) with high-contrast text.
  - **Outline**: Transparent background with a `1px` border of `var(--ink)` or `var(--primary)`.
  - **Ghost**: Transparent background, text only, matches container padding.

### CivicChip (Status Tags)
- **Font**: Monospace `JetBrains Mono` (`fontSize: 10px`, uppercase, spaced).
- **Background**: Light tint (`14%` alpha) of status color.
- **Border**: Thin line matching status color.

### CivicAvatar (Initials)
- **Shape**: Square block layout (`border-radius: 6px` or `2px`).
- **Color**: Stable-hashed selection of primary brand colors (Ink, Cobalt, Forest Green, Amber) based on the user's name.

### Interactive States
All buttons, inputs, links, and card items must have explicit states to ensure feedback:
- **Hover**: Backgrounds or borders shift by `4%` opacity or change color to indicate interactivity.
  - *Light Mode Cards*: Shift background from `#ffffff` (True White) to `#fafaf9` (Platinum Bone) or shift `#f4f3ee` (Muted Card) to `#ebebe5`.
  - *Accents*: Primary button moves to `var(--primary-hover)`.
- **Focus Outline**: Focusable elements must render a crisp outline to guarantee accessibility. Avoid hiding outlines unless replacing with:
  `outline: 2px solid var(--primary); outline-offset: 2px;`
- **Disabled**: Interactive items must ignore pointer events and render with `opacity: 0.4; cursor: not-allowed;`.
- **Loading**: Primary actions display a low-profile loading spinner or fade the label to prevent double submissions.

---

## 5. Dashboard Layout Structure

1. **Announcements Strip**: A low-profile rolling bar showing critical system events with a cool-tinted background.
2. **Greeting Strip**: A crisp white greeting card utilizing a monochrome vector circle overlay, and uppercase monospace metadata (Edition number, Cohort details).
3. **KPI Desk Strip**: A two-tiered metric card:
   - **Inverse Upper Block**: Charcoal-black surface (`#0c0c0b`) detailing urgent desk actions (e.g. `3 replies pending`) with a solid accent button.
   - **Metrics Lower Grid**: A three-column grid divided by clean hairline dividers representing secondary counts.
4. **Three Action Buckets**: Clean rails separated by 2px solid top rules:
   - **Requests Waiting**: Flat list of requests containing user metadata and inline CTA buttons.
   - **Upcoming Gatherings**: Featured host event card (with visual T-minus counter and going progress bar) + mini gathering list.
   - **Recently Joined**: A grid of profile cards with a clean lifting shadow transition on hover.

---

## 6. Advanced Interactive Components

These components provide specific, high-value patterns for scheduling, input, search, dialogue, and night readability.

### A. Advanced Selectors & Forms
- **Date Picker**: Monochromatic calendar grid displaying viewable months with Monday-first rows, selected dates highlighted in the primary accent, and past dates disabled.
- **Time Slots**: Fast-booking 15-minute slot grids (e.g. `10:00–10:15`) to schedule mentorship sessions or quick advice phone calls.
- **File Uploader**: Solid dashed dropzone containing animated upload progress bars with success chip feedback.
- **Profile Onboarding Wizard**: A step-by-step progress stepper utilizing a horizontal timeline indicator mapped to user state.

### B. Command Palette & AI Search
- **⌘K Command Palette**: A keyboard-accessible drawer overlay allowing searching/filtering of pages, actions, and members, using arrow key navigation and Escape to clear.
- **AI Query Search**: High-profile search input with suggested query chips that pre-populate the input on click, enabling natural language search for the vetted directory (e.g. *"Songdo fintech developers"*).

### C. Dialogue & Network Viz
- **Discussion Threads**: Editorial conversation card utilizing block initials avatars, author role subtitles, and threaded inline upvoting.
- **Network Graph**: Minimalist SVG node-and-link layout indicating mutual connections between members. Solid colored paths represent verified vouched links.

### D. System Alerts & Lamplight
- **Toast Notifications**: Slide-in banner alerts in the lower-right corner indicating action feedback (success, warning, error, neutral).
- **Lamplight Theme (Night Mode)**: A high-contrast inverted theme option swapping `Platinum Bone` canvas to `Obsidian Ink` (`#0c0c0b`) and white surfaces to charcoal-black paneling (`#141416`) to optimize evening reading.

### E. Form Fields & Inputs
- **Base Style**: Input inputs must use a `1px` solid border (`var(--border)` / `#dcdcd6`), sharp `6px` radius, and a background color of `var(--card)`.
- **Focus**: Transitions the border color to `var(--primary)` with a subtle shadow overlay over `0.15s ease`.
- **Placeholder**: Set to `var(--muted-foreground)` with `50%` opacity to maintain a readable yet low-contrast visual cue.
- **Validation (Error)**: Input border shifts to `1.5px solid var(--bad)` (`#9b2c1f`). An error text label is rendered directly below the input in Crimson Red.

---

## 7. Navigation Archetypes

To support varying application contexts and viewport sizes, the Civic Editorial system supports three navigation layout options, each adhering to the print-journal aesthetic and the professional color palette.

### Option A: The Editorial Header (Sticky Top Bar)
- **Visual Structure**: A horizontal full-width bar (height: `72px`) pinned to the top of the viewport. Uses a `1px` solid border (`#dcdcd6`) underneath to define the grid boundary.
- **Background Tones**: Light mode uses True White (`#ffffff`); Lamplight uses Charcoal-black (`#141416`).
- **Typography & Interactions**: 
  - Logo and wordmark are placed on the far left.
  - Desktop nav links are rendered in `Inter` (Medium, `13px`) with a tight letter spacing and a spacing gap of `28px`.
  - The active page indicator is a solid bottom underline (`2px` thick, `#173fb3` in light, `#ffffff` in dark) positioned `12px` below the text.
  - Secondary metadata and utility tools (search, notifications bell, account dropdown) are grouped on the far right.
- **Best Use Case**: Standard dashboard pages requiring high density and constant visibility of standard actions.

### Option B: The Minimalist Floating Dock (Pill Dock)
- **Visual Structure**: A floating pill-shaped container (height: `56px`) centered at the bottom (or top) of the viewport. Features a heavy backdrop filter (`blur(16px)`), a subtle outline border, and a shadow offset.
- **Background Tones**: Transparent glass overlay (e.g. `rgba(255, 255, 255, 0.75)` in light, `rgba(20, 20, 22, 0.75)` in dark).
- **Typography & Interactions**:
  - Contains icons + labels in a compact row.
  - Active state features a sliding pill bubble selector (`#173fb3` or `#0c0c0b` text, sitting inside a grey or cobalt outline bubble background) that transitions smoothly via CSS `transform` and `transition`.
  - Links expand or reveal tooltips on hover for a tactile, responsive feel.
- **Best Use Case**: Focused reading interfaces, single-column threads, or mobile views where maximizing viewport screen estate is the priority.

### Option C: The Editorial Side Rail (Vertical Gutter)
- **Visual Structure**: A vertical panel (width: `240px`) docked to the left of the screen. Aligns with vertical page rules (`1px` right border `#dcdcd6`).
- **Background Tones**: Platinum Bone (`#fafaf9`) or True White (`#ffffff`) for a clear division of layout panels.
- **Typography & Interactions**:
  - Branding is stacked or rotated at the top.
  - Navigation links are stacked vertically (gap: `16px`) using `Inter Tight` (Medium, `14px`).
  - Emphasizes a print-journal feel by prefixing links with uppercase monospace counters (`01 // Directory`, `02 // Inbox`, `03 // Events`).
  - Active states use a solid vertical line indicator (`2px` wide, `#173fb3`) aligned to the left edge of the link text.
- **Best Use Case**: Enterprise dashboards, directory filtering screens, and desktop layouts with deeply nested sub-sections.

---

## 8. Accessibility (a11y) Rules

1. **Touch Targets**: Any interactive element on mobile screens must have a minimum clickable area of `44px` x `44px`, regardless of the visible element size (achieved via CSS padding or invisible margins).
2. **Text Contrast**: Text colors must maintain a contrast ratio of at least `4.5:1` against their canvas. Standard body copy in Slate Grey (`#4d4d4a` on `#fafaf9`) has been verified to meet this WCAG AA standard.
3. **Keyboard Navigation & Trapping**: Full modal sheets (e.g. the onboarding wizard) and the ⌘K command drawer must lock keyboard focus inside their container while active, allowing clean Tab navigation without selecting elements in the background.


