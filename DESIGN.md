---
name: BridgeCircle
description: >
  A verified warm-network platform for trusted alumni communities. The visual
  language is "Sapphire on Midnight on Slate" — a sapphire-blue brand color
  laid over near-black midnight chrome and a cool, slightly blue off-white
  page surface. Editorial Fraunces serif headlines carry warmth and a
  human, institutional voice; a humanist Manrope sans carries everything
  else. The product should feel like a thoughtful alumni coordinator: warm,
  calm, clear, and a little editorial — never CRM, never ad-tech, never
  generic SaaS.

brand:
  name: BridgeCircle
  tagline: "Circles are where trust lives. Bridges are how support reaches you."
  mark:
    concept: >
      Two overlapping outline circles — a left circle in midnight and a
      right circle in sapphire — read as two communities meeting on a
      shared bridge of trust. The mark is line-only (never filled) so it
      reads as connection rather than a logo lockup.
    container_radius: 14px
    container_background: "#f2f4f6"
    stroke_width: 2.5
    left_circle:
      color: "#0b1220"
      role: "Midnight — the home circle, the institution"
    right_circle:
      color: "#0051d5"
      role: "Sapphire — the outward bridge, the active member"
  wordmark:
    typeface: Fraunces
    weight: 700
    tracking: "-0.025em"
    feature_settings: '"SOFT" 50, "WONK" 0, "opsz" 25'
    on_dark:
      bridge: "#ffffff"
      circle: "#b4c5ff"
    on_light:
      bridge: "#0b1220"
      circle: "#0051d5"

color:
  mode_default: light
  light:
    background: "#f7f9fb"            # cool slate page surface
    foreground: "#191c1e"            # on-surface ink, near-black with a cool cast
    card: "#ffffff"
    card_foreground: "#191c1e"
    popover: "#ffffff"
    popover_foreground: "#191c1e"
    primary: "#0051d5"               # Sapphire — primary action
    primary_foreground: "#ffffff"
    secondary: "#eef0f4"             # surface-container-low
    secondary_foreground: "#0e1733"  # near-midnight ink
    muted: "#eef0f3"                 # surface-container
    muted_foreground: "#5d5f66"      # on-surface-variant
    accent: "#dbe1ff"                # pale sapphire (secondary-container)
    accent_foreground: "#00174b"     # on-secondary-container
    destructive: "#ba1a1a"
    border: "#c6c6cd"                # outline-variant
    input: "#c6c6cd"
    ring: "#0051d5"
    success: "#047857"               # emerald-700 — "open to help"
    success_foreground: "#ffffff"
    success_soft_bg: "#d1fae5"       # emerald-100
    success_soft_fg: "#047857"
    warning: "#92400e"               # amber-800
    warning_soft_bg: "#fef3c7"       # amber-100
    warning_soft_fg: "#92400e"
    info_soft_bg: "rgba(0,81,213,0.10)"  # primary/10
    info_soft_fg: "#0051d5"
  dark:
    background: "#0b1220"            # Midnight surface
    foreground: "#f5f5f5"
    card: "#131b2e"                  # primary-container
    card_foreground: "#f5f5f5"
    popover: "#131b2e"
    popover_foreground: "#f5f5f5"
    primary: "#5a86ff"               # lifted sapphire on dark
    primary_foreground: "#ffffff"
    secondary: "#1a2238"
    secondary_foreground: "#f5f5f5"
    muted: "#161e34"
    muted_foreground: "#a3aec0"
    accent: "#1f2e55"
    accent_foreground: "#f5f5f5"
    destructive: "#e0473a"
    border: "rgba(255,255,255,0.10)"
    input: "rgba(255,255,255,0.15)"
    ring: "#5a86ff"
  brand:
    sapphire_500: "#0051d5"          # canonical Sapphire — the brand color
    sapphire_600: "#0044b3"          # darker hover/press
    sapphire_400: "#316bf3"          # mid-blue — active-state underline on dark nav
    sapphire_200: "#b4c5ff"          # pale sapphire — editorial highlight, dark-bg eyebrows
    midnight_900: "#0b1220"          # canonical Midnight — chrome, hero
    midnight_800: "#131b2e"          # primary-container, dark cards
    midnight_700: "#1e293b"          # slate-800 — header divider, hero gradient anchor
    slate_50: "#f7f9fb"              # canonical Slate — page surface
    slate_300: "#cbd5e1"             # nav text on dark
    slate_400: "#94a3b8"             # stat sublabels on hero
  chart:
    primary: "#0051d5"               # sapphire
    success: "#047857"               # emerald
    warning: "#92400e"               # amber
    danger: "#ba1a1a"
    neutral: "#0e1733"               # midnight
  status_badge:
    open:
      bg: "#d1fae5"
      fg: "#047857"
      dot: "#10b981"
      meaning: "mentor accepting / open to help"
    warn:
      bg: "#fef3c7"
      fg: "#92400e"
      dot: "#f59e0b"
      meaning: "paused, pending, stale"
    alert:
      bg: "rgba(186,26,26,0.10)"
      fg: "#ba1a1a"
      dot: "#ba1a1a"
      meaning: "revoked, declined, error"
    info:
      bg: "rgba(0,81,213,0.10)"
      fg: "#0051d5"
      dot: "#0051d5"
      meaning: "active, accepted, neutral-positive"
    muted:
      bg: "#eef0f3"
      fg: "#5d5f66"
      dot: "#5d5f66"
      meaning: "no signal, deactivated"

typography:
  fonts:
    sans:
      family: Manrope
      fallback: "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
      role: "Body, UI, controls, navigation, labels — every non-editorial moment."
    serif:
      family: Fraunces
      fallback: "ui-serif, Georgia, 'Times New Roman', serif"
      role: >
        Editorial voice — wordmark, hero headline, section titles, profile-card
        names, footer microcopy, and the optional bio pull-quote. Never for
        body, controls, or buttons.
      axes_used: [SOFT, WONK, opsz]
      typical_variation_settings: '"SOFT" 50, "WONK" 0, "opsz" 25'
    mono:
      family: Geist Mono
      fallback: "ui-monospace, SFMono-Regular, Menlo, monospace"
      role: "Reserved for code snippets, IDs, raw values."
  scale:
    display:
      font: serif
      size_min: 36px
      size_max: 56px
      line_height: 1.05
      tracking: "-0.025em"
      weight: 700
      usage: "Hero headline on the member home (e.g. 'Good morning, Sam.')"
    section_title:
      font: serif
      size_min: 24px
      size_max: 28px
      line_height: 1.15
      tracking: "-0.02em"
      weight: 700
      usage: "Section headers under an uppercase eyebrow."
    profile_name:
      font: serif
      size: 18px
      tracking: "-0.015em"
      weight: 600
      usage: "Names on profile tiles and profile-card hero."
    card_title:
      font: sans
      size: 16px
      line_height: 1.35
      weight: 600
      usage: "Card titles, dialog titles, inbox row leads."
    body:
      font: sans
      size: 14px
      line_height: 1.55
      weight: 400
      usage: "Default body, list rows, descriptions."
    body_emphasis:
      font: sans
      size: 14px
      weight: 600
      usage: "Names within a row, primary nouns in mixed-weight lines."
    small:
      font: sans
      size: 13px
      line_height: 1.5
      weight: 400
      usage: "Card sublabels, notification copy."
    caption:
      font: sans
      size: 12px
      line_height: 1.4
      weight: 400
      usage: "Timestamps, tag chips, meta footers."
    eyebrow:
      font: sans
      size: 11px
      weight: 600
      tracking: "0.18em"
      case: uppercase
      color_on_light: "#5d5f66"      # muted-foreground
      color_on_dark: "#b4c5ff"       # pale sapphire
      usage: >
        Above section titles and on dark hero/event-card headers. The
        signature pacing element of the layout — never skip it before a
        Fraunces title.
    button:
      font: sans
      size: 14px
      weight: 600
      tracking: "0em"
      case: sentence
  pull_quote:
    font: serif
    style: italic
    line_height: 1.5
    left_rule:
      color: "#0051d5"
      width: 3px
      gap: 0.75rem
    usage: "Profile bios on V3+ cards; rare editorial moments."

spacing:
  unit: 4px
  scale:
    "0": 0px
    "1": 4px
    "2": 8px
    "3": 12px
    "4": 16px
    "5": 20px
    "6": 24px
    "7": 28px
    "8": 32px
    "10": 40px
    "12": 48px
    "14": 56px
    "16": 64px
    "20": 80px
  container:
    page_max_width: 1152px           # max-w-6xl, the canonical body width
    wide_max_width: 1280px           # max-w-7xl, used by the header
    page_padding_x_mobile: 16px
    page_padding_x_desktop: 32px
    section_gap: 48px
    card_gap: 16px

radii:
  none: 0px
  sm: 4.8px                          # calc(--radius * 0.6) for inline chips
  md: 6.4px                          # calc(--radius * 0.8) inputs/menu items
  lg: 8px                            # --radius — buttons, inputs, card edges by default
  xl: 12px                           # cards (rounded-xl is the canonical card edge)
  "2xl": 16px
  "3xl": 20px
  "4xl": 22px                        # badges/pills — high-radius pill chrome
  full: 9999px                       # avatars, status dots, hero pill chips
  notes: >
    Cards are rounded-xl (12px). Buttons and inputs are rounded-lg (8px).
    Badges/pills and status chips are rounded-full or 4xl. Avatars are
    always full-round. The 8px base is intentional — soft enough to feel
    warm, not so round it reads as toy-like.

elevation:
  shadow_none: "none"                # default for cards at rest
  shadow_sm: "0 1px 2px rgba(15, 23, 42, 0.04)"
  shadow_md: "0 4px 12px rgba(15, 23, 42, 0.08)"  # hover state for clickable cards
  shadow_lg: "0 12px 32px rgba(15, 23, 42, 0.12)"
  shadow_overlay: "0 24px 48px rgba(11, 18, 32, 0.30)"  # popovers, dialogs
  ring_focus: "0 0 0 4px rgba(0, 81, 213, 0.10)"
  ring_focus_invalid: "0 0 0 4px rgba(186, 26, 26, 0.15)"
  notes: >
    Cards rest flat (no shadow) and lift to shadow-md on hover when
    clickable, often combined with a primary/60 border. Modals and
    popovers use a soft overlay shadow plus a 1px foreground/10 ring,
    never a thick stroke.

borders:
  width_hairline: 1px
  width_emphasis: 1.5px              # SVG decorative motif strokes
  width_focus_outline: 1px           # border-ring used with the ring shadow
  color_default: "#c6c6cd"           # --border
  color_subtle_on_dark: "#1e293b"    # header divider
  color_hover_emphasis: "rgba(0,81,213,0.60)"  # primary/60 on card hover

motion:
  easing:
    standard: "cubic-bezier(0.2, 0, 0, 1)"   # ease-out — default in the system
    emphasized: "cubic-bezier(0.3, 0, 0, 1)"
    decel: "cubic-bezier(0, 0, 0, 1)"
  duration:
    instant: 100ms                   # dialog fade/zoom
    fast: 150ms
    base: 200ms                      # default for buttons, cards, links
    medium: 300ms
    slow: 500ms
  transitions:
    button: "all 200ms ease-out"
    card_hover: "border-color 200ms ease-out, box-shadow 200ms ease-out"
    nav_underline: "opacity 200ms ease-out"
    dialog_in: "fade-in-0 + zoom-in-95, 100ms"
    dialog_out: "fade-out-0 + zoom-out-95, 100ms"
  principles: >
    Motion is restrained. Hover transitions are short (200ms), modal
    transitions are even shorter (100ms) so the product feels responsive
    rather than animated. We never use bouncy easing or staggered entrance
    animations — this is a warm-tone product, not a playful one.

iconography:
  library: lucide-react
  stroke_width: 2
  default_size: 16px                 # size-4 — inline with body text
  small_size: 12px                   # size-3
  medium_size: 20px                  # size-5
  color_default: currentColor
  color_meaningful_accent: "#0051d5"
  recurring_icons:
    Handshake: "asks / mentorship — the canonical action verb of the product"
    UserPlus: "friendship request received/accepted"
    MessageSquare: "DM / ask message"
    CalendarDays: "events"
    MapPin: "city / location meta"
    Megaphone: "announcements"
    Search: "discover"
    Menu: "mobile nav"

components:
  button:
    sizes:
      xs: { height: 28px, padding_x: 10px, font_size: 12px, icon_size: 12px, radius: 8px }
      sm: { height: 32px, padding_x: 12px, font_size: 12.8px, icon_size: 14px, radius: 8px }
      default: { height: 40px, padding_x: 16px, font_size: 14px, icon_size: 16px, radius: 8px }
      lg: { height: 44px, padding_x: 20px, font_size: 15.2px, icon_size: 16px, radius: 8px }
      icon: { size: 40px, radius: 8px }
    variants:
      default: "Sapphire fill, white text. The hero CTA, primary form submit."
      outline: "1px border, card background. The supporting action — 'See past events'."
      secondary: "Pale neutral surface (secondary), midnight ink. Used in form footers."
      ghost: "No chrome. Used in card actions and dropdown rows."
      destructive: "Red-tinted (destructive/10) fill — soft, never an alarm-red button."
      link: "Sapphire text, hover-underline. For inline copy actions."
    focus: "4px sapphire/10 ring + sapphire border."
    weight: 600
    transition: "all 200ms ease-out; active state drops to opacity 0.8."
  badge:
    height: 20px
    padding_x: 8px
    radius: full
    font_size: 12px
    weight: 500
    variants:
      default: "Sapphire fill"
      secondary: "Neutral surface"
      outline: "Border + foreground"
      destructive: "destructive/10 + destructive ink"
      ghost: "Transparent until hover"
      link: "Inline-link styling"
  status_badge:
    description: >
      Separate from Badge: a semantic state pill that maps a tone
      (open/warn/alert/info/muted) to a fixed color set, with an optional
      colored dot. Used wherever a single field describes membership,
      mentorship, or request lifecycle state.
    height: 20px
    radius: full
    dot_size: 6px
  card:
    radius: 12px
    border: "1px solid var(--border)"
    background: "var(--card)"
    padding_y: 20px
    padding_x: 20px
    gap: 16px
    footer:
      background: "muted/50"
      border_top: "1px solid var(--border)"
      padding: 16px
    sizes:
      default: { padding_y: 20px, padding_x: 20px, gap: 16px }
      sm: { padding_y: 12px, padding_x: 16px, gap: 12px }
    hover_clickable:
      border_color: "rgba(0,81,213,0.60)"
      shadow: "0 4px 12px rgba(15,23,42,0.08)"
      transition: "all 200ms ease-out"
  input:
    height: 40px
    radius: 8px
    border: "1px solid var(--input)"
    background: "var(--card)"
    padding_y: 8px
    padding_x: 12px
    font_size: 16px                  # 14px on md+ — 16px on mobile prevents iOS zoom
    placeholder_color: "var(--muted-foreground)"
    focus_border: "var(--ring)"
    focus_ring: "0 0 0 4px rgba(0,81,213,0.10)"
    invalid_border: "var(--destructive)"
    invalid_ring: "0 0 0 4px rgba(186,26,26,0.15)"
  avatar:
    sizes:
      sm: 24px
      default: 32px
      lg: 40px
    radius: full
    fallback_bg: "var(--muted)"
    fallback_color: "var(--muted-foreground)"
    border: "1px solid var(--border) with mix-blend-darken for warm overlap on white"
  dialog:
    radius: 12px
    background: "var(--popover)"
    ring: "1px solid rgba(25,28,30,0.10)"
    overlay: "rgba(0,0,0,0.10) + backdrop-blur-xs"
    max_width: 384px                  # sm:max-w-sm
    padding: 16px
    footer:
      background: "muted/50"
      border_top: "1px solid var(--border)"
      padding: 16px
    motion: "fade + zoom-95, 100ms"
  empty_state:
    container: card
    icon_circle:
      bg: "var(--accent)"
      fg: "var(--accent-foreground)"
      size: { default: 48px, inline: 40px }
    title: { font: sans, weight: 500, size: { default: 16px, inline: 14px } }
    description: { color: muted-foreground, max_width: 384px }
    padding_y: { default: 56px, inline: 32px }
  hero_member_home:
    background: "linear-gradient(135deg, #0b1220 0%, #131b2e 50%, #1e293b 100%)"
    overlay_dot_grid:
      color: "rgba(180,197,255,0.10)"
      dot_radius: 1.5px
      cell: 24px
    decorative_motif:
      shape: "two overlapping outline circles, top-right anchored"
      colors: ["#b4c5ff", "#316bf3"]
      opacity: 0.20
      stroke_width: 1.5px
    headline:
      font: serif
      color: "#ffffff"
      accent_line_color: "#b4c5ff"     # second line of the headline lifts to pale sapphire
    eyebrow_color: "#b4c5ff"
    subline_color: "#cbd5e1"
    stat_divider: "rgba(180,197,255,0.18)"
    stat_value_color: "#ffffff"
    stat_label_color: "#94a3b8"
    padding_y_desktop: 80px
    padding_y_mobile: 64px
  member_header:
    height: 72px
    background: "#0b1220"
    border_bottom: "1px solid #1e293b"
    text_color: "#cbd5e1"
    sticky: true
    z_index: 50
    container_query_breakpoint: 900px # below this, collapse nav to hamburger
    active_nav:
      color: "#b4c5ff"
      underline_color: "#316bf3"
      underline_offset: 12px
      underline_height: 2px
    search_pill:
      visible_from: 1080px
      height: 36px
      radius: full
      bg: "#1e293b"
      border: "1px solid #334155"
      icon_color: "#64748b"
      placeholder: "Search the circle…"

layout:
  shell: "Sticky midnight header → main canvas on slate page surface → optional dark hero band → 6-col content max-width."
  body_max_width: 1152px
  hero_max_width: 1152px
  body_padding:
    mobile_x: 16px
    desktop_x: 32px
    section_y: 48px
  home_grid: "lg: 3-col (2 + 1 sidebar); below lg collapses to a stack"
  page_top_pattern: >
    Most member pages either (a) open with a dark hero band followed by
    the body, or (b) open directly with section eyebrow + Fraunces title
    at the top of the slate canvas. Admin pages skip the hero and use
    desktop-primary tables.

accessibility:
  color_contrast:
    body_on_slate_min: "AAA (~16:1)"
    primary_on_white: "AA-large (4.6:1 — Sapphire is a deliberate brand choice; pair with foreground ink on dense copy, never body-set)"
    eyebrow_on_dark_min: "AA (4.5:1)"
  focus:
    visible: true
    style: "4px ring (primary/10) + 1px ring-colored border"
  motion:
    respect_reduced_motion: true
    transitions_kept_under: 300ms
  forms:
    invalid_state: "border + ring switch to destructive; aria-invalid drives styling"
    field_min_height: 40px
    label_position: "above field, sans, 14px, weight 500"
  viewport: "width=device-width, initial-scale=1; pinch-zoom NOT disabled"
---

# BridgeCircle Design System

## Voice And Feeling

BridgeCircle is a verified warm-network platform — alumni and trusted-community members helping each other with mentorship, asks, events, and friendship. The product should feel like a thoughtful alumni coordinator who notices good connections and helps people reach out. It must not feel like a CRM, a donor database, a generic social network, or an ad platform.

Three feelings drive every visual decision:

1. **Warm**. Cards are flat and quiet at rest. Headlines use a humanist serif (Fraunces) that softens the institutional weight of dark chrome. Greetings on the home hero address the member by first name with time-of-day awareness.
2. **Trustworthy and institutional**. The brand color is Sapphire — a deep, considered blue, not a bright SaaS azure. The header is a near-black Midnight that grounds the product like the wood-paneled foyer of a familiar building. White space is generous, never anxious.
3. **A little editorial**. The Fraunces serif appears in the wordmark, hero, section titles, profile names, hero stat values, and pull-quotes. Everywhere it appears, it carries the same variable-font settings — `"SOFT" 50, "WONK" 0, "opsz" 25` — so the warmth reads as intentional, not decorative.

If a screen feels like it could ship on a recruiting marketplace, it has drifted. Pull back the saturation, slow the motion, and let the serif do the editorial work.

## Color Story — "Sapphire on Midnight on Slate"

The whole palette is three colors plus a soft accent and one functional semantic ramp.

- **Slate (`#f7f9fb`)** is the page surface. It is intentionally not pure white — the slight cool tint lets a white card sit on top of it with a subtle visual edge even when the card has no border, and it cues "thoughtful product" the way a printed program cues "institution." All long-form reading happens on slate or on white cards over slate.
- **Sapphire (`#0051d5`)** is the brand color. It is reserved for action: primary buttons, links, the focused input ring, the active-state nav underline, and the focused-event accent strip. Sapphire is never used for body text. Pale Sapphire (`#b4c5ff`) is the editorial partner — uppercase eyebrows on the dark hero, the second line of the hero headline, the "Circle" half of the wordmark on dark.
- **Midnight (`#0b1220`)** is the chrome and the optional hero band. It carries the sticky member header, the featured-event card header, and the home dashboard's introductory band. Midnight gives the product its institutional weight; without it, the slate page feels too consumer.

Functional color is reserved for state, not decoration:

- **Emerald** → mentor is open / accepting / available
- **Amber** → paused / pending / stale ("we are waiting on someone")
- **Destructive red (`#ba1a1a`, used as `destructive/10` fills)** → declined / revoked / error. The product favors a soft red wash with red text rather than a bright red button — failures should be legible, not alarming.
- **Sapphire-tinted info** → neutral-positive states like "accepted" or "active"

Dark mode flips the palette but keeps the same intent: Midnight becomes the page, a lifted Sapphire (`#5a86ff`) keeps actions legible, and white-on-translucent borders replace the slate hairlines.

## Typography

Two voices, used with discipline:

- **Manrope** (sans) handles 95% of the surface — navigation, buttons, body, list rows, descriptions, captions, eyebrows. Manrope is a humanist geometric sans; it reads warmer than Inter and more modern than Helvetica, which suits the "warm-but-professional" tone.
- **Fraunces** (serif) is the editorial accent. It only appears in: the BridgeCircle wordmark; the hero headline on the member home; section headers under uppercase eyebrows; profile-card names; hero stat values (e.g. "42" for "alumni this week"); the optional italic pull-quote with a sapphire left rule on profile bios. Fraunces is **never** used for body text, button labels, form labels, or table cells.

The signature layout rhythm is **eyebrow → Fraunces title → body**: a small 11px uppercase tracked label (color `#5d5f66` on light, `#b4c5ff` on dark) sits above a Fraunces title in `-0.02em` tracking. This pacing pattern repeats from hero down through every section, so the page reads as a single editorial document rather than a stack of widgets.

Geist Mono is reserved for code, IDs, and raw values in admin surfaces. It rarely appears in member-facing screens.

## Shape, Edge, And Elevation

- **Radius scale builds from an 8px base** (`--radius`). Buttons and inputs are `rounded-lg` (8px). Cards are `rounded-xl` (12px). Pills and status badges are `rounded-full` or `rounded-4xl` (~22px). Avatars are always fully round.
- **Borders are hairline.** A 1px outline-variant (`#c6c6cd`) divides cards from the slate page. On dark chrome we use slate-800 (`#1e293b`) for the same role. We never use a heavy 2px border around interactive elements; the focus state does that work instead.
- **Elevation is restrained.** Cards rest flat. Clickable cards lift on hover with a soft `0 4px 12px rgba(15,23,42,0.08)` shadow and a sapphire/60 border tint, signaling interactivity without making the page busy. Dialogs and popovers use a 1px foreground/10 ring plus a 24-48px overlay shadow — soft, not dramatic.
- **Focus is sapphire and 4px wide.** Every interactive element gets a 4px `primary/10` ring plus a sapphire border on focus. This is the same recipe everywhere — buttons, inputs, links, list items — so keyboard users always know where they are.

## Layout

The product runs on a slate canvas with a constrained `max-w-6xl` (1152px) body. The header uses the wider `max-w-7xl` (1280px) so wordmark + 7 nav items + bell + avatar can fit on a 13" laptop without crowding.

Most member pages follow one of two openings:

1. **Hero + body.** The member home opens with a 80px-tall Midnight gradient band (`linear-gradient(135deg, #0b1220 0%, #131b2e 50%, #1e293b 100%)`) overlaid with a 24px sapphire/10 dot grid and a translucent two-circle decorative motif anchored top-right. The hero carries the time-of-day greeting, the activity headline (whose second line shifts to pale sapphire), a one-line subline, primary + outline CTAs, and a 4-tile stat strip divided by `rgba(180,197,255,0.18)` rules.
2. **Eyebrow + Fraunces title.** Inner pages like `/discover`, `/ask`, `/inbox`, `/events` skip the dark band and open directly on slate with the canonical eyebrow → title pattern.

Below the hero (or directly on inner pages), the home dashboard uses an `lg:grid-cols-3` layout — a two-column main rail (mentees waiting + new alumni) plus a one-column sidebar (featured event + recent activity). The sidebar cards use a colored "Featured event" gradient header in a 135° sapphire wash, while activity rows in the sidebar use a 32px circle-icon avatar tinted to the notification category (sapphire for asks/messages, emerald for friend events, amber for announcements, destructive red for event cancellations).

Admin surfaces (under `/admin/*`) drop the hero pattern and use desktop-primary tables. They are intentionally less editorial — they are working tools, not member-facing space.

## Components

The system is built on shadcn/ui primitives (we own the source), styled with the radix-nova preset and tuned to BridgeCircle's tokens. The components are intentionally few:

- **Button** in six variants (default, outline, secondary, ghost, destructive, link) and seven sizes including three icon sizes. The default size is 40px tall — comfortable for touch without feeling chunky. The "destructive" variant is a soft red wash, not a saturated red fill.
- **Card** in two sizes (default 20px padding, sm 12-16px) with a `rounded-xl` edge. Cards expect to be composed: a `CardHeader` (with optional `CardAction` in the top-right slot), `CardContent`, and an optional `CardFooter` that uses a `muted/50` wash and a top border to read as a distinct tray.
- **Input** at 40px height, 16px font on mobile (avoids iOS auto-zoom) and 14px on desktop, with the standard sapphire focus ring.
- **Badge** for short status nouns, and **StatusBadge** for semantic lifecycle states. StatusBadge owns the open/warn/alert/info/muted tone mapping so every page renders the same color for the same state. It is the right primitive whenever a single label describes "what state is this in?"
- **Avatar** at 24/32/40px, always fully round, with a `mix-blend-darken` outline so circular profile photos overlap cleanly on white. `AvatarGroup` uses `-space-x-2` stacking with a 2px background-colored ring.
- **Dialog** with a soft `bg-black/10 + backdrop-blur-xs` overlay, a `rounded-xl` panel with a 1px foreground/10 ring, and a 100ms fade+zoom-95 transition. Dialogs are deliberately quiet.
- **EmptyState** is the standard "nothing here yet" tray — an accent-colored icon circle in a Card, with a 14-16px title, a muted description, and an optional primary action. It replaces the "lone card in a vast empty page" pattern.

## Motion

Motion is restrained. Hover transitions on buttons, cards, and nav are 200ms `ease-out`. Dialog enter/exit is 100ms — fast enough that the modal feels like it appeared in response to your click, not animated in. We do not use spring or bouncy easing. We do not stagger entrance animations. The product should feel responsive and calm; the motion language matches the tone of the copy.

`prefers-reduced-motion` is respected throughout — no transitions exceed 300ms, and decorative motion (the hero dot grid, the two-circle motif) is static, not animated.

## Iconography

Icons come from `lucide-react`, set at the default 2px stroke. They sit inline at 16px in body copy (`size-4`) and 20px in headers (`size-5`). Icons inherit `currentColor` by default but switch to sapphire (`#0051d5`) when they are the meaning of the line — e.g. the calendar icon next to an event date, the megaphone icon in an announcement banner. Recurring product icons:

- `Handshake` = asks / mentorship — the canonical verb of the product
- `UserPlus` = friend request received or accepted
- `MessageSquare` = direct message or ask thread
- `CalendarDays` = events
- `MapPin` = city / location meta
- `Megaphone` = announcements

## Brand Mark Behavior

The mark is two overlapping outline circles inside a soft 14px-radius rounded square. On the light mark, the left circle is Midnight (`#0b1220`) and the right circle is Sapphire (`#0051d5`). On the dark mark, the same construction flips to white and pale sapphire. The mark is paired with the Fraunces wordmark where the "Bridge" half takes the foreground color (white on dark, midnight on light) and the "Circle" half lifts to the editorial pale sapphire `#b4c5ff` on dark or to Sapphire on light. The wordmark always uses `letter-spacing: -0.025em` and the variable-font axis settings `"SOFT" 50, "WONK" 0, "opsz" 25`.

Two-circle imagery appears as a decorative motif behind hero sections at 20% opacity — a quiet reinforcement of the "Circles meet on a Bridge" thesis without ever overpowering the headline.

## Copy Voice (Visual Implications)

The brand voice is warm, calm, clear, respectful, supportive, human, and lightly professional. Visually this means:

- Greeting copy uses first names and time-of-day awareness ("Good morning, Sam.").
- Empty states are reassuring, not apologetic ("Nothing on the calendar right now."), and offer one clear next action.
- Status copy describes the situation in human terms ("Pending response" rather than "STATUS: pending").
- We avoid "AI", "match", "automated", "lead", and "funnel" in member-facing UI. The product surfaces "Suggested person", "Why this person might be helpful", "Open to helping with career questions" instead.

The design system serves the same promise the brand line carries: **Circles are where trust lives. Bridges are how support reaches you.** Every component, color, and rule above exists to make asking for help feel safer, and offering help feel lighter.
