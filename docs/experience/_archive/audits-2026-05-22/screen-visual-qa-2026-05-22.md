# Screen Visual QA - 2026-05-22

Status: `Current`.

This pass audits the active Civic Editorial implementation against the current
rendered app, not the stale screenshot set that briefly showed the older dark
Home dashboard.

## Evidence

- App: `http://localhost:3000`
- Account: `admin-amy@example.com`
- Captures: [`../ui/screenshots/`](../ui/screenshots/)
- Viewports: desktop `1440x1000`, mobile `390x844`
- Routes: auth sign-in, Home, People, Inbox, Events, Profile, Admin invite
- Console check: no browser warnings, errors, or page errors on the audited
  authenticated routes.

## Discrepancies Found

1. The prior Home screenshots were stale. They showed the old dark editorial
   dashboard, while the live app renders the newer relationship-first Home with
   "Who can help me?"
2. The in-app browser viewport is useful for checking what a user sees, but its
   viewport override did not map one-to-one to CSS pixels in this session. The
   canonical screenshots were regenerated with Playwright for exact desktop and
   mobile captures.
3. The Next.js dev overlay appeared in the screenshot set and visually covered
   lower-left content. The regenerated captures hide that dev-only control.
4. `/profile/me` rendered the 404 page during the first refresh. This was a real
   route bug, not a design artifact. It is fixed with a redirect to the signed-in
   member's profile, and update/settings CTAs now point to edit/settings screens.

## Overall Assessment

The system is now directionally correct: it feels more editorial, more trusted,
and less like a generic alumni CRM. The biggest remaining problem is that the
design still asks users to browse too often. Home asks "Who can help me?", but
the local rows mostly say "View profile." People cards have the right data, but
their primary actions are small and visually equivalent. Profile and Admin still
push important actions too far away on mobile.

The design should not be redesigned. It needs a tighter action model, better
mobile density, and fewer decorative or dashboard-like elements competing with
relationship decisions.

## Scorecard

| Surface | Hierarchy | Action Clarity | Density | Mobile | Accessibility | Token Fit | Priority |
|---|---:|---:|---:|---:|---:|---:|---|
| Auth | 4 | 4 | 4 | 3 | 4 | 4 | Medium |
| Home | 4 | 3 | 3 | 3 | 3 | 4 | High |
| People | 4 | 3 | 3 | 2 | 2 | 4 | High |
| Inbox | 3 | 2 | 3 | 2 | 3 | 4 | High |
| Events | 4 | 3 | 4 | 3 | 3 | 3 | Medium |
| Profile | 4 | 2 | 4 | 2 | 3 | 4 | High |
| Admin invite | 3 | 3 | 4 | 1 | 2 | 2 | High |

Scale: `1` poor, `3` acceptable but flawed, `5` strong.

## Cross-Surface Flaws

- Medium-width layouts are under-tested. The user's in-app browser was around a
  tablet-width content area: the header collapsed to hamburger, but the page
  content still behaved like desktop. Add a canonical tablet capture.
- Important microcopy often drops to tiny mono text. Metadata is stylish, but
  some values are decision-critical: statuses, counts, dates, filters, and row
  actions need readable minimum sizes.
- Several surfaces still use "view" as the local action when the product thesis
  is asking, helping, replying, joining, or editing.
- Empty or quiet states are too quiet. Inbox, Home recent activity, and admin
  tables need next-step copy instead of blank/near-blank space.
- Mobile pages are clean but very long. The app often stacks full desktop cards
  rather than creating mobile-specific decision rows.
- Decorative hierarchy sometimes outranks useful data. Event index numbers,
  black section rules, and large motifs can pull attention away from date,
  status, and action.

## Surface Findings

### Auth

Strengths:
- Desktop split layout has a clear trust signal and strong brand memory.
- Form hierarchy is simple, predictable, and accessible enough.

Flaws:
- Mobile loses the "Build from a circle you already trust" thesis entirely.
- Google sign-in and email/password sign-in are both visually strong, but the
  preferred sign-in method is not explained by hierarchy.

Fix:
- Add a compact mobile brand strip above the card: BridgeCircle, verified alumni
  network, one sentence. Keep it uncarded and avoid reintroducing a full hero.

### Home

Strengths:
- The first screen now answers the right question: "Who can help me?"
- Dashboard material has been moved below the relationship-first surface.

Flaws:
- The available-help rows under-deliver on the headline. They show profile links
  but do not expose "Ask for advice" or "Request mentorship" in place.
- The hero has strong whitespace, but the relationship card and CTA relationship
  are not tight enough; on desktop the left side feels underused.
- Mobile still becomes a long dashboard after the first card. Supporting context
  is better than before, but it remains too dominant by sheer vertical length.
- "Update your advice settings" uses a stronger ochre treatment than many actual
  relationship actions.

Fix:
- Convert Home helper rows into action rows: name, role, helper state, match
  reason, and one local CTA.
- Collapse lower decks on mobile into a compact "Today" stack: next event, one
  profile/action nudge, one activity item.
- Keep telemetry below the fold and make it visibly secondary.

### People

Strengths:
- This is still the core product surface and has the richest relationship data.
- Desktop card density and filter scaffolding are usable.

Flaws:
- Mobile cards are too small for decision work. Names, role, metadata, tags, and
  three actions compete inside a narrow card.
- "No personal bio shared" repeats across the page and reads like a product
  failure, not useful absence.
- Actions are visually small and too equal. "Ask for Advice", "Request
  Mentorship", and "View profile" should not have the same local weight.
- Search placeholder is too long on mobile, and the Search button becomes a tiny
  blue capsule.
- The selected/focused card border can look accidental in screenshots.

Fix:
- Create a mobile `PersonDecisionRow`: identity, role, two trust/help chips,
  one primary action, and a secondary profile link.
- Replace negative absence copy with useful fallback: "Add a topic to know what
  to ask them" or hide unavailable fields.
- Use a single primary action chosen by availability: ask, request mentorship,
  message, or view.

### Inbox

Strengths:
- Desktop shell is structurally understandable.
- Selected state is now visible and tokenized.

Flaws:
- Desktop detail pane has too much blank space for a two-message thread.
- The disabled composer says the user cannot send messages, but does not explain
  the rule or offer the next action.
- Mobile shows only a list row. There is no visible message detail or clear
  "open thread" affordance beyond the chevron.
- Empty/search states were not represented in the screenshot set.

Fix:
- Add a compact thread summary header: status, relationship rule, and next action
  if messaging is gated.
- On mobile, use list-to-detail routing with a clear thread detail capture.
- Add explicit empty states for no requests, no DMs, and no search results.

### Events

Strengths:
- The event surface feels intentional and editorial rather than a generic
  calendar list.
- Mobile typography is bold and readable.

Flaws:
- Decorative event numbers and colored top rules can outrank the date and RSVP
  decision.
- "Required preparations" truncates on mobile, hiding the useful part of the
  instruction.
- Register buttons are small relative to the decision being made.
- Admin-only "Create event" appears as the dominant action on the member event
  list for admin users; it competes with the member RSVP job.

Fix:
- Make date/time and RSVP state the card's strongest scan elements.
- Limit prep notes to one readable line with a disclosure, or move them below
  the RSVP decision.
- For admins, demote "Create event" into a secondary admin action or admin rail.

### Profile

Strengths:
- Identity, verification, career, and education sections are coherent.
- The timeline treatment feels distinct without becoming decorative noise.

Flaws:
- Own-profile action is too late on mobile. "Edit profile" appears after career,
  education, open-to, skills, and links.
- The "Open to" section says "Not accepting right now" but does not offer a
  helper-preferences action.
- Desktop right rail is useful, but the action card is detached from the header.
- Heavy black rules are consistent, but there are too many of them on mobile.

Fix:
- Move own-profile primary actions into the header on every viewport: Edit
  profile, helper preferences, import profile.
- Add inline actions to "Open to": update mentorship/advice availability.
- Reduce repeated section rules on mobile; use spacing and title weight instead.

### Admin Invite

Strengths:
- The desktop form is straightforward and low risk.
- The task density is appropriate for operations.

Flaws:
- Mobile admin nav horizontally clips. "Announcements" is visibly cut off.
- The recent invites table clips columns on mobile; "Sent" is partially visible
  and row actions are absent.
- Status uses a generic blue badge rather than the lifecycle status language.
- The admin surface reads generic form/table, not Civic Editorial operations.

Fix:
- Convert mobile admin tables into stacked rows with label/value pairs and row
  actions.
- Add invite actions: copy link, resend, revoke, inspect accepted member.
- Use `LifecycleStatusBadge` for invite states.
- Replace the top admin tab strip with a responsive segmented menu or dropdown
  below tablet width.

## Improvement Plan

1. Fix correctness and artifact hygiene.
   - Keep `/profile/me` redirect as the safety net.
   - Keep profile/settings CTAs pointed at `/profile/edit` or
     `/mentorship/settings`.
   - Regenerate screenshots without dev overlays after every visual pass.

2. Tighten relationship actions.
   - Home helper rows should have a direct ask/request action.
   - People cards should choose one local primary action.
   - Profile headers should carry self/friend/not-friend actions above the fold.

3. Add tablet QA.
   - Capture a `900-960px` viewport because that is the real split-pane view the
     user saw.
   - Check hamburger/header state, search availability, and first-screen action
     clarity at that width.

4. Rebuild mobile cards and tables.
   - Person cards become mobile decision rows.
   - Admin tables become stacked mobile rows.
   - Event cards preserve prep notes without truncating decision-critical copy.

5. Expand state coverage.
   - Capture and score empty, loading, disabled, error, selected, unread,
     pending, accepted, declined, paused, and admin revoked/deactivated states.
   - The current screenshot set mostly covers happy/default populated states.

6. Reduce dashboard gravity.
   - Keep Home supporting context, but compress it on mobile.
   - Move telemetry into a secondary disclosure or lower-priority band.
   - Let "today's relationship work" stay visually dominant.

## Next QA Targets

- Tablet viewport: `920x900`.
- People mobile after `PersonDecisionRow`.
- Inbox request/action-needed states.
- Admin mobile table rows.
- Profile own-user header actions.
- Event card RSVP states: going, waitlisted, full, past.
