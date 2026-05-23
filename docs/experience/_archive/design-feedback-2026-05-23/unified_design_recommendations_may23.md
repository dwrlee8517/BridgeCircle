# BridgeCircle Unified Design Recommendations
*Synthesized on May 23, 2026*

This document consolidates the agreed UI/UX recommendations from the Gemini, Claude, and GPT design audits. Disagreements and visual contradictions have been resolved into a single coherent roadmap to polish the **Civic Editorial** system.

---

## High Priority: Action Clarity & Viewport Density

### 1. Consolidate Card CTAs (Action Gating)
* **Problem**: [ResultCard](file:///Users/richardlee/Developer/BridgeCircle/app/src/app/(member)/people/result-card.tsx#L66) displays multiple similar visual actions ("Ask for Advice", "Request Mentorship", "View Profile") that cause user decision paralysis.
* **Fix**: Programmatically choose **one** primary blue CTA based on the helper's preferences:
  * If the member is open to mentorship, show **Request Mentorship** as the primary blue button.
  * If they are open to advice only, show **Ask for Advice** as the primary blue button.
  * Demote the other actions to outlines, ghost buttons, or collapse them into the card container clicks.
  * Personalize button text: e.g., "Ask Felix for Advice" instead of "Ask".

### 2. Implement Mobile Card Rows (`PersonDecisionRow`)
* **Problem**: Stacking full-height desktop cards on mobile creates massive scroll fatigue and pushes actions below the fold.
* **Fix**: Map the mobile list search results to a compact row-based layout:
  * Collapse the `52px` avatar to `40px` and display name, cohort, and status dots inline.
  * Move the current job title/company directly below the name.
  * Collapse the AI Match Rationale behind a subtle "Why?" chevron or disclosure button.
  * Place the single primary action inline or at the right of the row.

### 3. Pull Profile Actions Above the Fold on Mobile
* **Problem**: On self-profile page `/profile/me` and member profiles, action buttons ("Edit Profile", "Request Advice") sit below work and education history.
* **Fix**: Bring these actions directly into the identity header on mobile so that self-management and connection triggers are instantly accessible.

### 4. Selective Midnight Motif Usage
* **Problem**: The dark Midnight [NetworkMotif](file:///Users/richardlee/Developer/BridgeCircle/app/src/app/(member)/help-network-ui.tsx#L83) card is repeated on secondary pages (Home, Ask, Help, School), which dilutes the brand identity and wastes screen estate.
* **Fix**: Keep the Midnight motif panel strictly on the **Home dashboard** as a signature first-screen entry moment. On secondary pages, use lighter visual treatments. Replace the generic SVG sine wave with live cohort data (e.g. city/class coordinate mapping) so it functions as a real connection signal rather than pure decoration.

---

## Medium Priority: Typography & Primitive Alignment

### 5. Protect Decision-Critical Metadata Sizing
* **Problem**: Key values like mentor capacity (e.g. `Capacity: 2/5 active`) and status tags are rendered in `mono-xs` (9px) JetBrains Mono, making them unreadable for older alumni.
* **Fix**: Restrict `mono-xs` to purely decorative kickers (e.g., page-level subtitle banners). Elevate functional metadata labels and badge states to `caption` (11px) or `body-md` (13px) in sentence-case. For example, change `WHY THIS MATCH` to `Why this match`.

### 6. Standardize Border-Radius Defaults
* **Problem**: The token spec [tokens.md](file:///Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/tokens.md) defines a sharp `6px` default radius, but shared primitives (`Card`, `Input`, `Avatar`) default to `8px` (`rounded-lg`), creating visual drift.
* **Fix**: Align the default border-radius in all shared primitives to the token standard `6px` (`rounded-lg` mapping to `--radius` in `globals.css`). Reduce local inline radius overrides.

### 7. Stack Admin Tables on Mobile
* **Problem**: Wide administrative tables (invites, member lists) horizontally clip or hide actions on mobile viewports.
* **Fix**: Convert table listings to flexible stacked cards on viewports narrower than `640px`. Stack details vertically and position row actions (revoke, resend invite) cleanly at the bottom of the card row.
* **Fix**: Replace horizontal admin tab bars with a clean segmented drop-down selector below `768px` to prevent text truncation.

### 8. Premium Glassmorphism for Overlays
* **Problem**: Floating menus, dropdowns, and sticky headers look flat and disconnected when overlaying text.
* **Fix**: Add a subtle frosted-glass treatment (`backdrop-filter: blur(12px) bg-white/80`) to floating overlays to establish visual depth and an editorial, state-of-the-art feel.

---

## Low Priority: Polish & Cleanup

### 9. Inbox Thread Context & Gating Explainers
* **Problem**: The message pane `/messages/[id]` does not reinforce relationship context, and disabled compilers do not offer an action pathway.
* **Fix**: Add a header card to chat threads: *"You are messaging Amy ('18) about 'Moving from consulting into product'."*
* **Fix**: When messaging is locked, display a helper note in the composer: *"Messaging opens once Amy accepts your advice request. [Update Request]"*

### 10. Correct Time-Shift & Initials Color Meaning
* **Problem**: Event times appear UTC-shifted on lists, and avatar color assignments are randomized, which can imply semantic status where none exists.
* **Fix**: Apply timezone conversions so event dates render in PV/Songdo local time.
* **Fix**: Change initials-only avatar background generation to use a single muted token color, or tie colors strictly to real structural attributes (like graduation cohort decade).

---

## Senior UX Judgment on Design System Disagreements

The different model design passes presented distinct philosophies on aesthetics and UX behavior. Grounded in the project's core documents ([project-summary.md](file:///Users/richardlee/Developer/BridgeCircle/project-summary.md), [tokens.md](file:///Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/tokens.md), and [components.md](file:///Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/components.md)), the senior design judgments are detailed below:

### 1. The Network Motif: Animate (Gemini) vs. Simplify/Remove (Claude/GPT)
* **The Conflict**: Gemini recommended adding keyframe node/line animations to the Midnight panel SVG. Claude and GPT argued the Midnight panel is generic decoration that eats 30% of above-the-fold space and violates [components.md](file:///Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/components.md)'s directive that cards should be decision surfaces, not page wrappers.
* **The Judgment**: **Simplify and Limit Page Distribution (Claude/GPT wins)**. 
  * **Rationale**: [tokens.md](file:///Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/tokens.md#L264) explicitly mandates: *"Do not use Midnight for ordinary cards, tables, sidebars, or dense member workflows."* Stacking it on secondary pages (Ask, Help, School) creates excessive visual weight and violates the Civic Editorial layout philosophy. 
  * **Resolution**: Remove the motif panel from secondary pages. Keep it strictly on the Home landing feed, but compress its height and use it to plot actual cohort data (e.g. member location distributions) rather than static curves. Refuse keyframe animations as they clash with the calm, editorial "newspaper" voice.

### 2. Visual Polish: Gradients & Shadows (Gemini) vs. Flat Outlines (Claude/GPT)
* **The Conflict**: Gemini recommended introducing dual-tone blue CTA gradients and soft tinted shadow layers. Claude and GPT stressed maintaining flat, clean, outlines and structured color blocks.
* **The Judgment**: **Flat Editorial Palette with Selective Glassmorphism (Claude/GPT wins, with a Gemini exception)**.
  * **Rationale**: The Civic Editorial brand is modeled on high-contrast print layouts. Gradients and distinct shadow filters introduce SaaS-like visual noise. [tokens.md](file:///Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/tokens.md#L128) explicitly locks outlines + low-contrast opacity layers for depth over shadows.
  * **Resolution**: Keep buttons, cards, and input backgrounds flat and solid. However, approve Gemini's recommendation for **frosted-glass backdrop-blur** (`backdrop-filter: blur(12px) bg-white/80`) *strictly* on floating overlay primitives (like the sticky main header and dropdown menus) to preserve scroll legibility without cluttering card layouts.

### 3. Numbered Navigation: Keep (Gemini/GPT) vs. Drop (Claude)
* **The Conflict**: Claude argued prefixing the main navigation items with step numerals (`01 Ask`, `02 Help`) implies a linear workflow sequence, confusing users who should jump directly to parallel tasks, and creating visual noise. Other models kept the default numeric implementation in [member-nav.tsx](file:///Users/richardlee/Developer/BridgeCircle/app/src/app/(member)/member-nav.tsx).
* **The Judgment**: **Drop the Numbers (Claude wins)**.
  * **Rationale**: Numbers naturally communicate order of operations. In a persistent, non-linear app navigation shell, step indicators lead to false prioritization (e.g. implying users must complete "Ask" tasks before "Help" tasks). 
  * **Resolution**: Remove the `01`, `02` prefix index generator from [member-nav.tsx](file:///Users/richardlee/Developer/BridgeCircle/app/src/app/(member)/member-nav.tsx). Let clean type spacing and the primary bottom bar active indicator carry the editorial feel.

### 4. Inbox Explainer Panel: Permanent Sidebar vs. Collapsible Widget (Claude)
* **The Conflict**: Claude recommended converting the permanent "Warm reactions" panel on the right rail of the Inbox into a first-visit popover or collapsible "?" trigger. The current code houses it permanently.
* **The Judgment**: **Convert to Collapsible / Tooltip (Claude wins)**.
  * **Rationale**: On mid-width screens and smaller desktops, a permanent instructional sidebar blocks valuable thread list and message viewport space, forcing horizontal crowding. Once a member learns the reaction mechanics (usually after visit #2), it acts as visual dead weight.
  * **Resolution**: Collapse the reaction explanations behind a secondary trigger button or compress them to hover-tooltips, preserving maximum width for active chats.

