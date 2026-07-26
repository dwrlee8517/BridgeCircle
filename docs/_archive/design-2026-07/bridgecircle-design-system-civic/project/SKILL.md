---
name: bridgecircle-design
description: Use this skill to generate well-branded interfaces and assets for BridgeCircle ("Civic Editorial" design system) — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the member-facing app and admin console.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

---

## Quick reference

**Brand:** BridgeCircle — "Civic Editorial" — verified warm-network platform for alumni communities.

**Tagline:** "Structured enough to trust. Warm enough to ask."

**Fonts (Google Fonts):**
- Inter Tight — display headings, wordmark, hero h1, card titles
- Inter — body, labels, UI, buttons
- JetBrains Mono — metadata, dates, class years, match scores

**Key colors:**
- `#2563eb` Electric Sky — navigation, links, interactive affordance
- `#f59e0b` Amber — CTA (one per surface: Send, RSVP, Ask, Accept)
- `#fafaf9` Platinum Bone — page canvas
- `#0c0c0b` Obsidian — primary text
- `#081126` Midnight — hero/editorial surfaces only
- `#f4f3ee` Soft Panel — side panels, groups
- `#dcdcd6` Border

**Border radius:** 10px default / 6px compact / 9999px circles
**Shadows:** hairline → lift → hero (3-step, paper-weight)
**Motion:** 150ms ease-out (controls) / 200ms cubic-bezier(0.2,0.8,0.2,1) (overlays)

**Density modes:** default (hero/auth) · `density-cozy` (member lists) · `density-pro` (admin, CTA reverts to blue)

**Iconography:** Lucide React (stroke-2, no fill). Wordmark: two overlapping circles SVG.

**Voice:** Sentence case. Warm but direct. No emoji. Em-dashes. Section kickers in ALL CAPS tracked.

**Key files:**
- `README.md` — full design system documentation
- `colors_and_type.css` — all CSS custom properties
- `assets/` — logo SVGs, network motif SVG
- `ui_kits/app/index.html` — interactive prototype (Home, People, Inbox, School)
- `ui_kits/app/*.jsx` — React components (Button, StatusBadge, Avatar, Header, AskBar, PersonCard, InboxPanel)
- `preview/` — design system cards (colors, type, spacing, components)
