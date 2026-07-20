# Design QA — People and Profile vertical slice

## Comparison target

- Source visual truth:
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/people/People.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/my-circle/MyCircle.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/profile/Profile.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/profile/ProfileSelf.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md`, especially §§4, 7, 7b, 7c, and 7d. Where the older profile specimen still shows “Why this match,” the later explicit decision in FLOWS §7 is canonical and removes it from profiles.
- Implementation routes:
  - `http://localhost:3000/people`
  - `http://localhost:3000/people/circle`
  - `http://localhost:3000/profile/:userId`
  - `http://localhost:3000/profile/me`
- Primary comparison viewport: 1280 × 820.
- Responsive verification viewports: 390 × 844 and 320 × 700.
- Authenticated state: Richard Lee; four visible directory members; one current connection, Mei Park.

## Browser-rendered evidence

All files below are in `/private/tmp/bridgecircle-people-profile-ui-qa-2026-07-15`.

- Source captures:
  - `reference-people-1280x820.png`
  - `reference-my-circle-1280x820.png`
  - `reference-profile-1280x820.png`
  - `reference-profile-self-1280x820.png`
- Exact 1280 × 820 implementation captures:
  - `after-people-1280x820.png`
  - `after-my-circle-1280x820.png`
  - `after-profile-1280x820.png`
  - `after-profile-self-1280x820.png`
- Exact 390 × 844 implementation captures:
  - `after-people-390x844.png`
  - `after-my-circle-390x844.png`
  - `after-profile-390x844.png`
  - `after-profile-self-390x844.png`
- Full-view paired comparisons:
  - `compare-people-1280x820.jpg`
  - `compare-my-circle-1280x820.jpg`
  - `compare-profile-1280x820.jpg`
  - `compare-profile-self-1280x820.jpg`
- Focused paired comparisons:
  - `focus-people.jpg`
  - `focus-my-circle.jpg`
  - `focus-profile.jpg`
  - `focus-profile-self.jpg`

## Findings

No actionable P0, P1, or P2 mismatch remains.

- The final People composition matches the source hierarchy: page title, full-width search, the three scope controls, exactly three visible structured filters, result metadata, and elevated rows.
- The My circle managed view matches FLOWS §7d and the specimen’s hierarchy with per-row Message and Disconnect actions. Source and implementation row counts and identities intentionally differ because the implementation uses the current seed.
- The member profile preserves the approved header, exactly two primary relationship verbs, facts column, Can help with section, entitled links, shared context when available, and staleness hint. The older specimen’s “Why this match” rail is intentionally absent because FLOWS §7 explicitly removed it from profiles.
- The self profile preserves same-layout inline editing, per-link and per-section audience controls, the read-only Help availability mirror, and quiet notification settings. The source’s enrichment-review banner is a different data state; the current owner has no pending proposals.
- Connection dates/context shown in the MyCircle specimen are demo data, not required by FLOWS §7d; the live managed view does not fabricate missing relationship history.

## Comparison history

### Iteration 1

The pre-fix captures were:

- `before-people-desktop-1280x820.png`
- `before-profile-1280x820.png`
- `before-profile-self-1280x820.png`

Findings and fixes:

- P1 — FLOWS §7d required a managed My circle surface, but only a People scope existed. Added `/people/circle`, linked it from People, Messages, and the account menu, and implemented Message plus confirmed Disconnect.
- P2 — People exposed a fourth “More filters” control that was absent from the settled handoff. Removed it while retaining its backend query capabilities for the deferred search pass.
- P2 — self-profile audience copy exposed database terminology. Replaced it with Public, Circle, and Private and the exact viewer explanation.
- P2 — profile and destructive-action navigation/copy were inconsistent across entry points. Unified shell ownership, back behavior, action notices, and the exact Block/Disconnect confirmations from FLOWS §7c.
- P2 — the slice lacked complete in-shape loading/error/not-found/offline states. Added route-shaped skeletons, calm retry/back cards, and a shared connectivity notice.

Post-fix evidence is the final exact-viewport and focused comparison set above. No later visual fix was required after the final comparison.

## Required fidelity surfaces

- Fonts and typography: passed. The BridgeCircle Pretendard hierarchy, weights, compact metadata, and section headings align with the handoff.
- Spacing and layout rhythm: passed. Shell proportions, content widths, search/filter rhythm, card radii, row density, profile grid, and responsive stacking remain coherent at all tested sizes.
- Colors and visual tokens: passed. Canvas wash, elevated surfaces, blue/green relationship states, neutral destructive controls, dividers, shadows, and focus rings use the active design-system variables.
- Image and asset quality: passed. Existing BridgeCircle branding, Lucide icons, avatar components, and real/fallback member data are used; no approximate custom graphic was introduced.
- Copy and content: passed. Visible filter names, privacy audiences, block/disconnect explanations, empty/error/offline states, and Help availability language follow FLOWS and the handoff. Seed-specific identities and sparse histories are expected data variance.
- Interaction and accessibility: passed for the manually exercised roads. Buttons, links, dialogs, headings, active scopes, focus defaults, and status regions expose semantic browser roles.

## Primary interactions tested

- People All → In your circle → Manage circle.
- My circle Message presence and Disconnect confirmation/cancel without mutating the seed.
- Member profile intercepted overlay, full-profile transition, People-owned back target, and Links & contact visibility.
- More actions → Block confirmation/cancel with the exact mutual-invisibility copy.
- Self-profile audience editor with Public/Circle/Private options and close without saving.
- Desktop and mobile People, My circle, member profile, and self profile rendering.
- Horizontal-overflow checks at 390 × 844 and 320 × 700; every route remained exactly within the viewport.
- Browser console after fresh navigations: no runtime exception or error entry; only normal Next.js development info/log events.

## Verification

- Focused Biome check across all changed People/Profile/shell files: passed after formatting.
- Full TypeScript inventory: still red in unrelated pre-v2 scripts/admin/events/invite test factories after the destructive schema cutover; zero diagnostics matched any changed People/Profile, My circle, shell, route-state, or avatar file.
- `git diff --check`: passed before the documentation/test updates and is rerun in the final gate.
- Search ranking, natural-language routing, indexing, and query-plan tuning remain explicitly deferred until after the visual and interaction slices, per the current product decision.

final result: passed
