# BridgeCircle Design Feedback - May 23, 11am GPT

## Context

This feedback evaluates BridgeCircle's current design system and UI from a senior UI/UX design perspective. The review is based on the active design-system docs, maintained screenshots, route/component code, and live browser inspection of the member and admin surfaces.

BridgeCircle's product framing is important here: this should feel like a member-first warm-network platform, not generic alumni management software.

## Overall Assessment

The current Civic Editorial direction is strong and distinctive. The Platinum Bone canvas, Obsidian text, Electric Sky actions, Midnight editorial moments, sharp geometry, serif identity, and semantic status colors give the product a memorable voice. It already avoids the generic SaaS look in several important places.

The biggest issue is not raw visual quality. The main issue is focus. Too many surfaces use similar editorial weight, too many cards present multiple competing actions, and mobile often feels like desktop stacked vertically instead of a more decisive mobile experience. The product will become more eye-catching and easier to use by clarifying visual hierarchy, making the primary relationship action obvious, and reserving the strongest visual treatments for the moments that matter most.

## What Is Working Well

- The brand direction is specific. The warm off-white canvas, sharp cards, editorial typography, and blue action color create a recognizable visual system.
- The Home surface is moving in the right direction. The AskBar and "People who can help you" pattern match the core product promise better than a generic dashboard.
- The People surface has the right strategic importance. It is clearly becoming the main discovery and warm-network decision surface.
- The Inbox structure is sound. The split between conversations and message detail is understandable.
- The School surface is visually appealing and gives the platform a broader community feel beyond one-to-one asks.
- Status language and semantic tokens give the product a good foundation for trust, lifecycle, and relationship state.

## Highest-Priority Improvements

### 1. Fix the Ask entry behavior first

In live browser inspection, `/ask?q=test` rendered the Ask page correctly, but plain `/ask` landed on Inbox. If that behavior is intentional, it undercuts the primary navigation and the AskBar promise. If it is a bug, it should be fixed before visual polish because Ask is the core product action.

Relevant files:

- `app/src/app/(member)/nav-links.ts`
- `app/src/app/(member)/help-network-ui.tsx`
- `app/src/app/(member)/ask/page.tsx`

Recommended direction:

- Make `/ask` reliably show the Ask experience.
- If there is no query, show an empty Ask state with prompt guidance, not Inbox.
- Keep the user oriented around "ask the school circle" as a primary workflow.

### 2. Reduce repeated hero weight across Home, Ask, Help, and School

Several main surfaces use large editorial hero sections, prominent serif headlines, and strong visual treatments. Individually, they look polished. Together, they flatten hierarchy because every page feels equally dramatic.

Recommended direction:

- Let Home and Ask carry the strongest editorial weight.
- Make Help more task-focused and lighter.
- Make School feel like a community hub rather than another full hero moment.
- Use smaller page headers on secondary workflows so the product feels faster and more useful.

### 3. Make one primary action per card unmistakable

People and match cards still often present several similar-weight actions, such as "Ask for Advice", "Request Mentorship", and "View profile". That makes users evaluate the UI mechanics instead of the person and the relationship opportunity.

Relevant files:

- `docs/experience/ui/design-system/components.md`
- `app/src/app/(member)/people/result-card.tsx`

Recommended direction:

- Choose one primary CTA per card based on context.
- Demote secondary actions to icon buttons, overflow menus, or quieter links.
- Use the card's copy to answer: "Why this person, why now, and what should I do next?"
- On recommendation cards, prefer a single strong action like "Ask Mark" or "View match" rather than three equal options.

### 4. Treat mobile as a different decision layout

The mobile UI is generally functional, but in key areas it feels like desktop content stacked into a narrow column. This creates long cards, repeated metadata, and important actions that sit too low.

Recommended direction:

- Design mobile People cards as compact decision rows.
- Prioritize name, relationship reason, one high-signal credential, and one primary action.
- Hide or collapse secondary metadata until the profile view.
- Keep tap targets large, but reduce visual repetition.
- Pull the primary action into the top half of the card whenever possible.

### 5. Pull profile actions upward

Profile pages should make the relationship action immediately available. The current structure allows important actions to sit lower in the page or sidebar, which makes the profile feel more like a bio page than a network action surface.

Relevant file:

- `app/src/app/(member)/profile/[id]/page.tsx`

Recommended direction:

- Put the primary relationship action inside the profile header area.
- Keep the user's identity, trust cues, and action in the same visual field.
- Use secondary sections for background, interests, and activity.

### 6. Use the Midnight `NetworkMotif` more selectively

The Midnight motif is visually strong and gives BridgeCircle a distinctive identity. It loses impact when repeated across multiple top-level surfaces.

Recommended direction:

- Keep the motif as a signature moment, not a default page decoration.
- Use it most prominently on Home or a major community moment.
- On secondary pages, use lighter network details, smaller accents, or content-led layouts.
- Avoid letting the motif compete with people, asks, and messages.

### 7. Tighten type scale discipline

The design-system token spec is clear about display type and decorative mono usage, but the app contains many very small text treatments such as `text-[9px]`, `text-[10px]`, and repeated mono metadata. These can look stylish in isolation but become visual noise when repeated.

Relevant file:

- `docs/experience/ui/design-system/tokens.md`

Recommended direction:

- Reserve mono-xs and tiny uppercase labels for rare system details.
- Use readable body and caption sizes for repeated metadata.
- Avoid huge mobile H1s on pages where the task is more important than the editorial statement.
- Make hierarchy come from content importance, spacing, and action weight, not just large type.

### 8. Align primitive defaults with the 6px radius system

The design system specifies a sharp 6px default radius, but shared primitives use `rounded-lg` while route-level code often overrides with `rounded-[6px]`. This creates unnecessary inconsistency and makes local overrides more common.

Relevant files:

- `docs/experience/ui/design-system/tokens.md`
- `app/src/components/ui/button.tsx`
- `app/src/components/ui/card.tsx`

Recommended direction:

- Make shared primitives match the design-system radius by default.
- Reduce route-level radius overrides.
- Keep larger radii only for deliberate exceptions.

## Surface-Level Feedback

### Home

Home is much stronger than a conventional dashboard. The AskBar and "People who can help you" area express the product's core value clearly.

Improve by:

- Reducing the height and visual weight of stat cards on mobile.
- Pulling helper actions higher in each card.
- Making the first recommended person feel like the obvious next step.
- Ensuring the Home screen does not compete with Ask as the user's primary task entry.

### Ask

Ask is strategically the most important product surface. It should feel fast, direct, and trustworthy.

Improve by:

- Fixing or clarifying the plain `/ask` behavior.
- Showing a strong empty state when no query exists.
- Making the page less hero-heavy once the user is in task mode.
- Keeping the result cards focused on the best next relationship action.

### Help

Help has good intent and strong positioning: "Your experience can shorten someone else's path." The opportunity is to make it feel more operational and less like another editorial landing page.

Improve by:

- Reducing page-header weight.
- Highlighting the most actionable help opportunities.
- Making "who needs help" and "why you are relevant" immediately scannable.
- Avoiding repeated large motifs or decorative treatments already used elsewhere.

### People

People is the core discovery surface, but it can still read a little directory-like. The design should help users decide whom to contact, not simply browse profiles.

Improve by:

- Replacing repeated generic fallback copy such as "Add a specific question..." when it appears often.
- Making match reason and relationship path more prominent than profile completeness details.
- Reducing equal-weight action clusters.
- Designing a tighter mobile decision row or compact card.
- Making search and filters feel like tools for finding the right relationship, not just database controls.

### Inbox

Inbox has a solid structural foundation, but the empty state is weak compared with the importance of messaging in the product.

Improve by:

- Giving empty states a useful next action.
- Connecting Inbox back to Ask, Help, or People.
- Making "Needs reply" feel like a high-priority operational state.
- Using stronger visual hierarchy for conversations that require user attention.

### School

School is visually appealing and gives the product a sense of shared community. The risk is that admin or creator actions can compete with member-facing actions.

Improve by:

- Making member actions like "View events" and "Read announcements" visually primary for most users.
- Keeping admin actions such as "Create event" quieter unless the user is clearly in admin mode.
- Reducing reuse of the large Midnight motif if Home already carries that identity moment.
- Making the page feel like a living school pulse, not just a content board.

### Profile

Profile pages should convert interest into action. The current layout has useful content, but relationship actions should be closer to the identity header.

Improve by:

- Placing the main action in the hero/header area.
- Keeping trust cues near the action.
- Making self-profile actions easier to find.
- Prioritizing connection context over long biography-style presentation.

### Admin

Admin is the least integrated visual surface. It works, but it feels plainer and more table-driven than the member experience.

Relevant file:

- `app/src/app/(member)/admin/invite/page.tsx`

Improve by:

- Converting mobile tables into stacked rows.
- Using design-system lifecycle/status badges consistently.
- Tightening spacing and action hierarchy in invite workflows.
- Letting admin feel utilitarian while still belonging to the same Civic Editorial system.

## Design-System Recommendations

### Create a relationship action hierarchy

The design system should define how BridgeCircle chooses and displays relationship actions.

Recommended hierarchy:

- Primary: the one action the user is most likely to take now.
- Secondary: useful but not immediate actions.
- Tertiary: profile viewing, saving, or overflow actions.

This hierarchy should govern People cards, Home recommendations, Ask results, Help opportunities, and Profile headers.

### Define mobile-specific card patterns

Mobile needs its own patterns rather than smaller desktop cards.

Recommended patterns:

- `PersonDecisionRow`
- `MatchBriefCard`
- `HelpOpportunityRow`
- `ConversationPriorityRow`

Each should specify visible metadata, action placement, truncation behavior, and empty/loading states.

### Be stricter about decorative treatments

The strongest brand elements should be rationed.

Recommended rules:

- Large serif headlines belong on primary orientation moments.
- Midnight panels and network motifs belong on signature pages or major modules.
- Tiny mono labels should be rare and functional.
- Electric Sky should identify the next best action, not every possible action.

### Normalize primitives

Shared primitives should carry the system so route files do less visual correction.

Recommended updates:

- Align button and card radius with the documented 6px default.
- Audit route-local `rounded-[6px]` overrides after primitives are fixed.
- Reduce ad hoc raw color use where semantic tokens already exist.
- Keep shadows, transforms, and hover states restrained and consistent.

## Suggested Implementation Sequence

1. Fix or verify the `/ask` entry behavior.
2. Create a mobile `PersonDecisionRow` or equivalent compact People card pattern.
3. Update `MatchBriefCard` and `ResultCard` to choose one primary CTA.
4. Move profile relationship actions into the profile header.
5. Reduce repeated `NetworkMotif` usage on secondary surfaces.
6. Normalize primitive radius and type defaults.
7. Revisit Admin mobile table layouts and status badge consistency.

## Final Takeaway

BridgeCircle already has a design direction with real character. The next design pass should focus less on adding more visual styling and more on making the product's relationship decisions obvious. The UI will feel more polished, more eye-catching, and more trustworthy when every surface answers three questions quickly:

- Who matters here?
- Why are they relevant to me?
- What should I do next?
