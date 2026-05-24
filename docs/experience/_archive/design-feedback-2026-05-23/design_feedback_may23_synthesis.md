# BridgeCircle design feedback — synthesis (May 23, 11am)

_Merged from three independent senior UI/UX reviews (`design_feedback_may23_11am_claude.md`, `design_feedback_may23_11am_gpt.md`, `design_feedback_may23_11am_gemini.md`). Recommendations included here are agreed by at least two reviewers, or are reviewer-unique findings that don't conflict with the others. Stylistic disagreements (intensifying the Midnight motif, glassmorphism, CTA gradients, stronger hover affordances) were excluded; they pull against the documented Civic Editorial direction and against the other two reviews._

## Overall direction

The Civic Editorial system itself is strong and distinctive. Most issues are the live UI **drifting from the spec**, not the spec being wrong. The product needs more focus and less duplication — not more visual richness.

When choosing between two design moves, prefer the one that:

1. Makes the **next best relationship action** more obvious.
2. **Rations** a strong visual treatment so it stays meaningful.
3. **Closes a gap** between the documented contract and the live implementation.

---

## P0 — Verify before any visual work

These came from individual reviewers and sit underneath any design polish. None of them are stylistic.

| # | Finding | Source | Notes |
|---|---|---|---|
| P0-1 | Plain `/ask` reportedly routed to Inbox; `/ask?q=test` rendered correctly | GPT | Not reproduced in Claude's session (live navigation to `/ask` rendered the Ask page). Verify behavior across roles, query states, and routes; treat as a bug only if reproducible. |
| P0-2 | Event-card times display UTC-shifted (e.g. `Wed, May 27 · 2:25 AM` for an SF event) | Claude | Real PV/Songdo members will be confused. Fix at the formatter, not per-page. |
| P0-3 | `accent-ochre` is `3.32:1` on `background` — fails WCAG for body text | Gemini (also acknowledged in [`tokens.md`](experience/ui/design-system/tokens.md)) | Audit usage: ochre is approved for borders, dots, fills, large icons only. Body copy must use `state-warning-foreground` (resolves to `foreground`). |

---

## Priority recommendations

Ordered by reach. Each item below is supported by at least two reviewers.

### 1. Re-anchor the home page around one primary action

The home screen currently has at least three things claiming primary attention: a 7xl serif headline, the AskBar, and two separate sets of the same three stats (left tiles + Midnight panel). The contract itself is explicit ([`components.md:88`](experience/ui/design-system/components.md:88)): _"Every screen should have at most one visually dominant primary action per local decision area."_

**Do:**

- Make the AskBar the visual anchor. A small height bump (~92px) + slightly stronger shadow is enough — no gradient.
- Demote the headline from 7xl (72px) to display-md (28px). It bullies the AskBar today.
- Choose one stat treatment: the left tiles **or** the Midnight panel's stats. Showing `6 open helpers` twice within 600px is duplication, not emphasis.
- Demote `FreshnessReviewCard` ([help-network-ui.tsx:351](../app/src/app/(member)/help-network-ui.tsx:351)) — gate on actual profile staleness so it doesn't appear to a user who finished onboarding 30 minutes ago.

### 2. Ration the Midnight `NetworkMotif`

The dark `NetworkMotif` ([help-network-ui.tsx:83](../app/src/app/(member)/help-network-ui.tsx:83)) appears on Home, Ask, Help, and School with roughly the same content. This violates _"Cards are decision surfaces. Do not use cards as page section wrappers"_ ([`components.md:24`](experience/ui/design-system/components.md:24)) and _"Do not use Midnight for ordinary cards, tables, sidebars, or dense member workflows"_ ([`tokens.md:264`](experience/ui/design-system/tokens.md:264)).

**Do:**

- Keep Midnight as a **signature moment** on Home (or sign-in / first-run / major editorial moments). Remove from Ask, Help, and School.
- If the motif stays, make it represent **real data** (e.g. a stylized scatter of cohort or city), not a generic SVG path with dots.
- On secondary pages, use lighter, content-led layouts.

### 3. Make one primary CTA per card unmistakable

People grid and match cards present `Ask for Advice` (ghost) · `Request Mentorship` (filled blue) · `View profile` (ghost). The product thesis is _"lightweight asks first, formal mentorship later,"_ but `Request Mentorship` gets the blue treatment by default — the action you most want clicked is the least visually weighted.

**Do:**

- Default the primary action by helper signal:
  - `open_to_advice` true → "Ask {Name} for Advice" is the filled primary; "Request Mentorship" becomes outline.
  - Only `open_to_mentorship` true → "Request Mentorship" stays primary.
  - Neither → "View profile" is the only action; remove the disabled-looking ghosts.
- Use **action-oriented, personalized labels**: "Ask Mark for Advice" beats "Ask for Advice."
- Demote `View profile` to a card-wide click target or a ghost link, so the bottom of the card holds at most one filled button.

### 4. Tighten typography discipline

Mono-xs (9px) is doing too much work. The spec itself warns ([`tokens.md:171`](experience/ui/design-system/tokens.md:171)): _"important meaning should not depend on `mono-xs` alone."_ Live usage spans in-card section labels, stat labels on the dark panel, profile metadata, page kickers, and backlinks — the cumulative effect is that everything looks like metadata.

**Do:**

- Reserve mono-xs for **rare, decorative kickers** (page-level orientation like `CLASS OF 2005 · CHADWICK SCHOOL` is fine).
- Replace in-card section labels (`WHY THIS MATCH`, `SUGGESTED FIRST ASK`, `CAREER`, `SKILLS & EXPERTISE`, `OPEN TO`, `LINKS`, `VERIFICATION`) with **caption-sized (11px) sentence case**.
- Decision-critical metadata (mentor capacity, request status counts, RSVP capacity) must be at least caption (11px), preferably body-md (13px) semibold.
- Don't combine `density-compact` with `mono-xs` for required information ([`tokens.md:240`](experience/ui/design-system/tokens.md:240)).
- Reduce repeated large H1s on workflow pages; let hierarchy come from content importance and action weight, not raw type size.

### 5. Pull relationship actions into profile headers

A profile should convert interest into action. Today the primary action sits in a right-rail card on desktop and at the bottom of a long stack on mobile.

**Do:**

- Place the primary relationship action (`Add friend`, `Ask for advice`, `Request mentorship`, or `Message` for friends) inside the profile header card, next to identity and trust cues.
- Keep career history, education, skills, links as secondary sections.
- On mobile, pin the action in the top half of the viewport — either as part of the header or a sticky action footer.
- Differentiate the **Verified** pill from **Open to mentor / Open to advice** pills. Today both render as green dot pills side by side on profile headers; viewers can't tell verification from availability. Verification is a category, not a state — give it a distinct treatment (e.g. an outlined check icon without a status dot).

### 6. Treat mobile as a different decision layout

Stacking full desktop cards on mobile produces multi-screen-tall pages. People and match cards should compress to a decision row, not just shrink in place.

**Do:**

- Define a `PersonDecisionRow` mobile pattern: 40px avatar, name and class year inline, single relationship-reason line, one primary action icon-button, "Why?" as a disclosure tap-target instead of an inline panel.
- Target row height ~80px (down from ~240px stacked card) so a viewport shows 6–8 candidates at a glance.
- Profile own-actions: move "Edit profile" and "Update availability" into the header card on mobile, or pin to a sticky footer. Don't make the user scroll past their entire career history to edit it.
- Admin tables: collapse to row-cards under 640px (name + status badge + 1–2 quick actions); swap admin tab nav for a native `<select>` under 768px.

### 7. Resolve the radius drift to 6px

The spec specifies 6px ([`tokens.md:177`](experience/ui/design-system/tokens.md:177)) but most cards render at 8px today:

| Component | Actual | Source |
|---|---|---|
| `AskBar` | 8px | [help-network-ui.tsx:41](../app/src/app/(member)/help-network-ui.tsx:41) |
| `NetworkMotif` | 8px | [help-network-ui.tsx:93](../app/src/app/(member)/help-network-ui.tsx:93) |
| `MatchBriefCard` | 8px | [help-network-ui.tsx:190](../app/src/app/(member)/help-network-ui.tsx:190) |
| `HelpOpportunityCard` | 8px | [help-network-ui.tsx:301](../app/src/app/(member)/help-network-ui.tsx:301) |
| `SchoolPulseCard` | 8px | [help-network-ui.tsx:333](../app/src/app/(member)/help-network-ui.tsx:333) |
| `HomeSignal` tiles | 8px | [dashboard-client.tsx:246](../app/src/app/(member)/dashboard-client.tsx:246) |
| `PersonAvatar` | 8px | [help-network-ui.tsx:415](../app/src/app/(member)/help-network-ui.tsx:415) |
| `Button` | 6px (specified inline) | various |

**Do:**

- Pick one. If the system is genuinely 6px, update primitives to default 6px and audit route-local `rounded-[6px]` overrides afterward — they should disappear once primitives are correct. If 8px is the intended card scale, update [`tokens.md`](experience/ui/design-system/tokens.md) and explain when each is used.
- Keep larger radii only for deliberate exceptions documented in the spec.

### 8. Empty states must offer a next action

Empty states across the product are too passive. _"No messages."_ _"Ask, help, and connection threads will appear here."_ _"No announcements yet."_ — none of these route the user anywhere.

**Do:**

- Inbox empty: _"Nothing demands a reply right now — look around People or set what you're open to."_ + button to `/people` or `/help`.
- Announcements empty: keep brand voice; this is a deliberately quieter network, say so.
- Thread detail when gated: explain the gate. _"Messaging opens once Amy accepts your advice request. You can update your request details here."_
- Every empty state should name the state, explain why it's empty, and offer the credible next step ([`components.md`](experience/ui/design-system/components.md) — Empty State spec).

---

## Surface-by-surface notes

### Home

- Re-anchor on the AskBar (see #1).
- Drop the duplicated stat strip (left tiles vs Midnight panel).
- When matches are templated or weak, demote stacked match cards to compact list rows — three identical cards in a column reveals the templating. The seeded "Mark Mentor / Mei Mentor / Felix Atcapacity" cards show the same Suggested-First-Ask copy verbatim, which kills the value of personalization. Drop the Suggested-First-Ask block when there is no query.

### Ask

- Verify P0-1 (`/ask` routing).
- If `/ask` has no query, render a strong empty state with prompt guidance rather than redirecting. The empty state is the AskBar plus a few high-signal prompts — the same shape the Home page uses.
- Reduce hero weight once a user is in task mode.

### Help

- Reduce page-header weight; today it reads as another editorial landing.
- Lead with **actionable opportunities** (who needs help, why you might be relevant) — copy and visual emphasis should follow the request, not the brand statement.
- Don't repeat the Midnight motif (#2).

### People

- Replace the generic fallback copy _"Add a specific question to see why this person may be useful"_ — it appears on every card by default and trains the eye to skip it.
- Make match reason more prominent than profile-completeness signals.
- Mobile uses `PersonDecisionRow` (#6).
- Filters should feel like relationship-finding tools ("Open to advice on X", "Lives in Y"), not database controls.

### Inbox

- "Warm reactions — no emoji, just intent" panel is a beautiful product idea, but at present it's a **permanent explainer panel** on the most-visited surface. After visit #2 it becomes wallpaper.
  - First-visit popover + a small `?` affordance to re-open it.
  - Or compress to icons-only with hover tooltips once the user has used a reaction at least once.
- Thread detail header should ground the conversation: _"You are messaging Amy ('18). She is helping you with 'Move from consulting into product.'"_
- "Needs reply" rows need stronger visual weight than read rows — apply `request-attention` + `warning-tint` ([`tokens.md`](experience/ui/design-system/tokens.md)) consistently.
- Empty state copy: see #8.

### School

- Remove Midnight motif if Home keeps it (#2).
- Member actions (View events, Read announcements) are primary; admin actions (Create event, Post announcement) stay quieter unless the user is clearly in admin mode.
- Make the page feel like a living pulse, not a content board.
- Verify P0-2 (event time display).

### Profile

- Primary relationship action moves into the header (#5).
- Differentiate Verified pill from open-to status pills.
- Avatar fallback colors are randomized by name hash today ([help-network-ui.tsx:434](../app/src/app/(member)/help-network-ui.tsx:434)) — three adjacent people can pull the same rust color while a fourth gets sage. Viewers will look for meaning and find none. Either tie color to a real property (cohort, region) or use one muted token for all initials.

### Admin

- Mobile tables collapse to row-cards under 640px (#6).
- Use `LifecycleStatusBadge` consistently across status columns; no ad-hoc color text.
- Tighten spacing and action hierarchy in invite workflows — admin can feel utilitarian but should still belong to the Civic Editorial system.

---

## Design-system updates

### Relationship action hierarchy contract

Define how the product chooses and displays relationship actions. This contract should govern People cards, Home recommendations, Ask results, Help opportunities, and Profile headers.

- **Primary** — the one action the viewer is most likely to take now, chosen by helper signal + relationship state. Filled `action-primary`.
- **Secondary** — useful but not the immediate move. `outline` or `secondary` variant.
- **Tertiary** — profile view, save, overflow. Ghost link or card-wide click target.
- **Status-only** — communicates state but does not invite action. `StatusBadge`, never a button.

### Mobile-specific patterns to define

Mobile needs patterns of its own, not smaller desktop cards. Promote these as named primitives in [`components.md`](experience/ui/design-system/components.md):

- `PersonDecisionRow` — compact mobile People row (#6).
- `MatchBriefCard` compact variant — drops Suggested-First-Ask when no query.
- `HelpOpportunityRow` — single-action compact row for the Help surface.
- `ConversationPriorityRow` — Inbox row with strong `Needs reply` weight.

Each should specify visible metadata, action placement, truncation behavior, and empty/loading states.

### Decorative budget

Ration the strongest brand moves so they stay meaningful:

- Large serif headlines belong on **primary orientation moments**.
- Midnight panels and network motifs belong on **signature pages only** (#2).
- Tiny mono labels should be **rare and functional** (#4).
- Electric Sky should identify the **next best action**, not every possible action.

### Primitive normalization

Shared primitives should carry the system so routes do less visual correction:

- Pick 6px or 8px as the default card radius and align all primitives + routes to it (#7).
- Reduce route-level `rounded-[6px]` overrides after primitives are correct.
- Reduce ad-hoc raw color use where semantic tokens already exist.
- Keep shadows, transforms, and hover states restrained and consistent — the Civic Editorial system is crisp, not layered.

---

## Implementation sequence

**P0 — verify before any visual work**

1. Reproduce or rule out the `/ask` routing report (P0-1).
2. Fix event-card UTC time display (P0-2).
3. Audit ochre usage; remove from body copy (P0-3).

**P1 — week 1 (highest impact)**

4. Re-anchor home around the AskBar; drop duplicated stats; demote 7xl headline.
5. Make one primary CTA per card unmistakable (People grid + match cards).
6. Cut mono-xs labels on in-card section headers in half; move to caption sentence case.

**P2 — weeks 2–3**

7. Ration the Midnight motif (Home keeps it; Ask, Help, School lose it).
8. Pull profile relationship actions into the header.
9. Ship compact `PersonDecisionRow` for mobile.
10. Admin mobile row-cards + consistent `LifecycleStatusBadge` usage.

**P3 — cleanup**

11. Normalize primitive radius (decide on 6px or 8px and align).
12. Differentiate Verified pill from open-to status.
13. Gate `FreshnessReviewCard` on actual staleness signals.
14. Avatar fallback color: tie to meaning or use one muted token.
15. Empty-state copy across surfaces (Inbox, Announcements, gated thread).

---

## What couldn't be evaluated

- **True mobile (≤480px).** Window-resize in the browser MCP doesn't change the page viewport. The `@container` hamburger at 900px and the `lg:grid-cols-[1fr_420px]` hero collapse are sound on paper, but should be verified on a real device before P2 ships.
- **Dark mode.** The token file has full dark coverage; the system was not viewed in dark.
- **Loading and error states.** Live data was fully populated; skeletons and error panels were not exercised.

---

## Closing test

Every surface should answer three questions quickly:

- **Who matters here?**
- **Why are they relevant to me?**
- **What should I do next?**

If a surface needs more than a few seconds to answer all three, the recommendations above are the highest-leverage path to fixing it.
