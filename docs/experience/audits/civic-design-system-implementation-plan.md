# Civic Design System Implementation Plan

Status legend: `Not started`, `In progress`, `Done`, `Deferred`.

This is the active UI audit and execution checklist for bringing BridgeCircle's production app into alignment with the Civic Editorial design direction. It is intentionally scoped to visual system quality, interaction hierarchy, accessibility, and implementation consistency. Product behavior remains governed by the phase specs and architecture docs.

Last updated: 2026-05-22.

## Current Assessment

The Civic Editorial direction is the right product fit: high-trust, member-first, structured, editorial, and dense enough for relationship decisions. The gap is operational maturity. The system has a strong prototype, but production needs a single token contract, shared primitive defaults, clearer rules for expressive surfaces, and a screen-by-screen consistency pass.

## Track 1 - Canonical Tokens

Status: `Done`

Problem: The app, design-system prototype, and older reference source used overlapping blue names and values. That made "Cobalt" ambiguous and caused the primary blue to drift darker than the Civic reference.

Target outcome: One production token contract controls color, type, radius, spacing, status tones, and dark editorial accents.

Implementation notes:
- Treat `docs/experience/ui/design-system/tokens.md` as the production token spec.
- Treat `Civic Design System.html` as the interactive visual reference, not the token authority.
- Keep `app/src/app/globals.css` in sync with the production token spec.

Acceptance criteria:
- Primary action color is Electric Sky.
- Dark editorial surfaces use a separate lifted Electric Sky token for readable accents.
- Radius guidance is explicit: 6px default editorial radius, circles only for avatars, dots, radios, and progress indicators.

Verification:
- Token values are documented.
- `globals.css` exposes the matching Tailwind theme variables.
- 2026-05-22: Expanded the token contract with semantic role aliases, tint
  tokens, contrast pairings, motion tokens, density rules, and email-safe
  tokens. `globals.css` exposes matching role and tint aliases.

## Track 2 - Shared Primitives

Status: `Done`

Problem: Several shared primitives still carried softer shadcn defaults, especially larger card and badge radii. Screens compensated with local overrides.

Target outcome: Civic Editorial is the default behavior of shared primitives.

Implementation notes:
- `Button`, `Card`, `Input`, `Badge`, and `StatusBadge` should render sharp 6px editorial controls by default.
- Keep explicit `rounded-full` only where the shape communicates a standard pattern: search capsules, avatar circles, radio controls, notification dots, progress bars.
- Preserve shadcn APIs and variants; change visual defaults only.

Acceptance criteria:
- New cards, badges, and status pills inherit Civic geometry without per-screen overrides.
- Buttons retain shadcn `variant`, `size`, and `asChild` behavior.
- Inputs preserve mobile-safe text sizing and hydration warning suppression.

Verification:
- TypeScript compiles.
- Existing screens render without visual breakage.
- 2026-05-22: Added a component variant/state contract and began moving shared
  primitives from base hue tokens toward semantic role, tint, focus, and motion
  tokens.
- 2026-05-22: Added product component specs for Person Card, Request Card,
  Profile Header, Event Card, Inbox Thread Row, Empty State, Form Section,
  Admin Table, Notification, and Email Template patterns.
- 2026-05-22: Formalized motion and lifecycle states in
  `states-and-motion.md`, added a reduced-motion CSS contract, moved skeletons
  to a tokenized loading pulse, and introduced `LifecycleStatusBadge` for common
  pending/accepted/declined/paused states.
- 2026-05-22: Promoted lifecycle emails into Civic Editorial with a shared
  `CivicEmail` frame, shared CTA/footer/typography helpers, visible fallback
  links for action emails, and Resend delivery that sends both HTML and plain
  text.

## Track 3 - Design-System Documentation Split

Status: `Done`

Problem: The exported HTML prototype is too large and exploratory to be the only production source of truth.

Target outcome: Designers and agents can start from a concise production spec, then open the prototype for visual context.

Implementation notes:
- Update design-system README to put `tokens.md` first.
- Keep reference source marked as explanatory only.
- Do not delete historical Atrium references until a later archive cleanup pass.

Acceptance criteria:
- Docs clearly separate production tokens from interactive prototype examples.
- Downstream implementation no longer has to infer token values from generated HTML.

Verification:
- README points to the active token contract.
- 2026-05-22: Added a production component usage guide and a `reference-src`
  README that explicitly quarantines Atrium-era token exports and copyable
  prototype snippets.

## Track 4 - Home/Auth Visual Drift

Status: `Done`

Problem: The most visible entry surfaces used generic dark blue gradients and decorative dashboard chrome that conflict with the restrained Civic Editorial rule set.

Target outcome: Expressive dark surfaces read as a codified "Midnight editorial" treatment, not generic SaaS gradient styling.

Implementation notes:
- Use Midnight as the dark canvas.
- Use `primary-on-dark` for readable dark-surface Electric Sky accents.
- Keep the two-circle bridge motif, but make it subtle and token-driven.
- Reduce amber/orange gradients to tokenized ochre callouts.

Acceptance criteria:
- Auth and home loading surfaces no longer use raw blue gradients.
- Home hero keeps a premium editorial feel while staying token-driven.
- The primary next action remains visible above the fold.

Verification:
- Browser review at desktop and mobile widths.
- 2026-05-22: Auth layout, member loading state, and member dashboard hero/callouts have been moved off raw gradients and onto documented tokens. The expressive hero canvas now uses the documented `surface-midnight` token rather than pure Obsidian. Auth and authenticated member home are covered in the current screenshot set.
- 2026-05-22: Home now opens with a relationship-focus surface that answers
  either "Who needs me?" or "Who can help me?" before dashboard decks. Layout
  customization was demoted into supporting context instead of floating over the
  first viewport.

## Track 5 - Screen Consistency Pass

Status: `Done`

Problem: People, Inbox, Events, Profile, and Admin mostly align, but still contain local raw colors, oversized roundness, tiny metadata, and inconsistent callout treatment.

Target outcome: Every member screen uses the same visual grammar and preserves a visible next relationship action.

Implementation notes:
- People: preserve decision-card density; audit metadata size and match explanation affordances.
- Inbox: reduce oversized round cards; keep action-required items visually dominant.
- Events: keep civic programming feel; avoid marketing-card decoration.
- Profile: maintain identity, trust, and CTA hierarchy.
- Admin: keep dense tables, but use shared status and action tokens.

Acceptance criteria:
- No new raw palette values unless documented as a data-viz/avatar exception.
- Important text is readable at mobile width.
- Empty states point to a useful next action.

Verification:
- Browser review each top-level route.
- Screenshot set regenerated after the full pass.
- 2026-05-22: Shared primitive changes now apply across screens. The route-level cleanup pass replaced obvious raw status colors, avatar fallback palettes, callout colors, and oversized card/chip roundness in People, Inbox, Events, Profile, Admin, Mentorship, Messages, and Onboarding.

## Track 6 - Screenshot Review And Closure

Status: `Done`

Problem: There is no current screenshot set for the Civic Editorial implementation.

Target outcome: A fresh screenshot review confirms the implemented system matches the active direction.

Implementation notes:
- Capture desktop and mobile screenshots after tracks 1-5.
- Store the final current set under `docs/experience/ui/screenshots/` only after it reflects production.
- Close this audit with remaining risks and deferred follow-ups.

Acceptance criteria:
- Screenshots cover home, people, inbox, events, profile, auth, and one admin view.
- Any visual deviations are documented as intentional or added to the backlog.

Verification:
- `docs/experience/ui/screenshots/README.md` is updated during closure.
- 2026-05-22: Desktop and mobile screenshots were captured for auth, home, people, inbox, events, profile, and admin invite.
- 2026-05-22: Reopened the screenshot review after the user's in-app browser
  showed the newer relationship-first Home while the stored Home screenshots
  still showed the older dark dashboard. Regenerated the canonical screenshot
  set, fixed the broken `/profile/me` self-profile route, and logged the route
  findings in [`screen-visual-qa-2026-05-22.md`](screen-visual-qa-2026-05-22.md).
