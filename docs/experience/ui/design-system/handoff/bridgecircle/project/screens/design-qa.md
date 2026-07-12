# Design QA — People and Profile first slice

## Comparison target

- Shell source visual:
  `/Users/richardlee/.codex/generated_images/019f4aba-feb8-72f1-99e9-c7b614db0524/exec-c6504890-f14e-4c3e-b117-8ce84c5ea62b.png`
- People source visual:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/design-system-audit/12-bridge-people.png`
- Implementation:
  `people-directory.html`, `people-profile-overlay.html`, and
  `profile-self.html`
- Implementation screenshot:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-mockups/people-implementation-final.png`
- Full shell comparison:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-mockups/shell-reference-vs-implementation.png`
- Focused People-content comparison:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-mockups/people-reference-vs-implementation.png`
- Viewport: 1280 × 720 for full-view QA; gallery also inspected at its
  390px narrow-frame setting.
- State: People search results with direct full-profile routing; profile page
  and Connect panel inspected separately. The accepted section-led profile is
  the only other-member profile artifact.

## Findings

No actionable P0, P1, or P2 findings remain.

- [P3] Narrow People rows truncate supporting metadata early
  - Location: `people-directory.html` at the 390px gallery preview.
  - Evidence: the primary name, relationship state, and action remain visible,
    but the role line truncates and topics are intentionally hidden.
  - Impact: acceptable for this desktop-first slice; a dedicated mobile
    composition may choose a two-line row later.
  - Follow-up: decide the mobile row anatomy during the mobile adaptation pass.

## Required fidelity surfaces

- Fonts and typography: Pretendard loads from the same source as the current
  BridgeCircle specimens. Weight, display hierarchy, metadata sizing, and row
  density match the selected references. The page title is intentionally
  stronger inside the full shell than in the isolated specimen.
- Spacing and layout rhythm: the 240px/72px shell widths, 66px topbar, 20–22px
  major radii, subtle rings, and row dividers remain intact. The member card
  is sticky to the viewport bottom.
- Colors and tokens: all product colors and surfaces resolve through
  `../colors_and_type.css`; blue remains the normal primary action and green
  appears only in the “Open to help” state. No new brand hue was introduced.
- Image quality and asset fidelity: the source screens use initials-based
  identity avatars rather than photography. The implementation reuses that
  tokenized avatar system and the shell's existing source icon paths; there
  are no missing raster assets or placeholder illustrations.
- Copy and content: the screens use Ask, Connect, Open to help, and Circle.
  They do not reintroduce mentor/mentee language, activity scores, followers,
  endorsements, or profile-level “Why this match.”
- Icons: shell and utility icons follow one 1.9–2.1px outline family and retain
  the source specimen's optical sizes.
- States and interactions: selecting a row or member name opens the same
  member-specific full-profile route; Message, Connect, and Pending stay
  independent. Closing the profile restores query, scope, page, and member
  position. Connect opens without losing profile context; the known/stranger mode switch works;
  inline profile editing enables in place; enrichment changes can be approved
  or dismissed; notifications open from the bell.
- Responsiveness: the shell collapses to its 72px rail at the documented
  breakpoint and removes the sidebar below 620px. Every viewport uses the same
  direct full-profile route. The gallery's 390px review frame showed no visible
  horizontal overflow or clipped primary action.
- Accessibility: semantic name links, action buttons, labels, `aria-current`,
  disabled pending state, dialog names, and content-edit labels are present.
  Result articles do not pretend to be listbox options. A formal focus-order
  audit remains.

## Comparison history

### Pass 1 — blocked

- [P2] The docked preview's Ask/Message actions fell below the 720px viewport.
- [P2] The sidebar member identity followed document height instead of staying
  anchored to the viewport.

Fixes:

- Combined Career and You share into compact paired facts, widened the rail,
  reduced secondary spacing, and preserved the provenance line.
- Made the sidebar sticky at `100vh` while the main page scrolls independently.

### Pass 2 — passed

- Ask for help and Message are fully visible at 1280 × 720.
- Iris Lau's member card remains visible at the bottom of the shell.
- The normalized People-content comparison preserves the source hierarchy,
  while the intentional fourth result and selected-row tint improve the
  full-shell state.
- Fresh browser interaction checks passed with no page console errors.

## Implementation checklist

- [x] Canonical review gallery
- [x] People search/results/default state
- [x] Relationship-aware row actions
- [x] Direct row/name routing to the canonical full profile
- [x] Other-member profile overlay
- [x] Connect quick-hello and shaped-intro modes
- [x] Self profile with inline editing
- [x] Enrichment proposal approval/dismissal
- [x] Per-link visibility controls
- [x] Relationship-aware Message / Connect / Pending profile variants
- [x] Search-context restoration after closing a full profile
- [x] Report / Block / Disconnect confirmation flows
- [x] Empty, loading, failed-search, permission, blocked, and gone states
- [x] 1280px and 390px visual review

## Follow-up polish

- Decide whether the narrow People row uses a two-line role block or a compact
  detail sheet in the later mobile adaptation pass.
- Add production ownership, analytics events, and acceptance checks before
  promoting these screens from draft to approved.

## Canonical member profile comparison

- Source visual truth:
  `/Users/richardlee/.codex/generated_images/019f4aba-feb8-72f1-99e9-c7b614db0524/exec-777d989a-bf1e-42a9-a096-170e8a639dda.png`
- Implementation: `people-profile-overlay.html`
- Implementation screenshot:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-mockups/profile-overlay-v2-final-1280x720.png`
- Full-view comparison:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-mockups/profile-v2-qa-comparison.png`
- Focused header comparison:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-mockups/profile-v2-qa-header-comparison.png`
- Long-description states:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/profile-long-copy-mobile-preview-qa/01-descriptions-collapsed.jpg`
  and
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/profile-long-copy-mobile-preview-qa/02-description-expanded.jpg`
- Mobile inline-preview state:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/profile-long-copy-mobile-preview-qa/03-mobile-inline-preview.jpg`
- Viewport and state: 1280 × 720, Maya Chen profile open over People results.
  Responsive captures were also inspected at 768 × 720 and 390 × 720.

### Findings

No actionable P0, P1, or P2 findings remain.

- [P3] “Can speak to” begins below the 720px desktop fold.
  - Evidence: the source concept compresses all sections into a scaled visual,
  while the canonical profile preserves the BridgeCircle 12px minimum and
  13–14px reading text.
  - Impact: the profile requires a short, clearly indicated sheet scroll; the
    member identity, actions, About, Career, Education, and relationship
    context remain visible first.
  - Follow-up: if above-the-fold topic discovery becomes more important than
    reading comfort, test a compact topic summary directly under About.

### Required fidelity surfaces

- Fonts and typography: Pretendard and the BridgeCircle type roles are used;
  the profile render intentionally stays larger than the scaled concept so member
  text remains comfortably readable.
- Spacing and layout rhythm: the selected concept's continuous white surface,
  two-column structure, dividers, large identity block, and narrow context
  rail are preserved. BridgeCircle's 22px elevated-sheet radius replaces the
  concept's generic panel finish.
- Colors and tokens: the implementation uses `--wash-page`, the tokenized
  avatar palette, `--gradient-primary-btn`, green only for “Open to help,”
  blue relationship chips, and design-system hairlines. No unlogged hue was
  introduced.
- Image quality and asset fidelity: this profile is initials-led by design;
  no raster photography or decorative imagery is required. Existing shell
  source icons are reused, with no placeholder asset.
- Copy and content: each member carries distinct identity, career, education,
  shared context, links, and Ask/Connect copy. Career history includes longer
  LinkedIn-style bullet descriptions without turning the collapsed profile
  into an unbounded wall of text.
- Interaction states: Ask opens a contextual composer and reaches a visible
  sent state; Connect opens its relationship-aware introduction sheet without
  dismissing the profile. Imported career descriptions expose Show more/less
  controls with synchronized `aria-expanded` state. Browser checks passed for
  the expansion round trip and both relationship paths.
- Responsiveness: at 768px the profile becomes a full right sheet beside the
  72px rail. At 390px, selecting a People row or its name opens the full-screen
  profile directly. The narrow state has no horizontal overflow
  (`scrollWidth = 390`).
- Console: no warnings or errors were present after desktop and mobile checks.

### Comparison history

#### Pass 1 — blocked

- [P2] The initial fixed 960px sheet became too narrow relative to the selected
  hybrid on a wide desktop and made the main/rail balance feel more like the
  current card-heavy overlay than the intended v2.

Fix:

- Changed the profile to a fluid sheet capped at 1120px and constrained by the visible
  People context, while retaining dedicated tablet and mobile compositions.

#### Pass 2 — passed

- The full-view comparison preserves the hybrid's editorial profile anatomy.
- The focused header comparison confirms BridgeCircle's stronger avatar,
  primary-button finish, relationship chips, and elevated sheet treatment.
- Ask, Ask success, Connect, tablet, and mobile checks passed in the browser.

#### Pass 3 — passed

Historical note: the preview-specific checks below were valid for that pass and
were superseded by the direct-profile routing cleanup.

- Two long imported bullets render for every career entry; the collapsed state
  measured 44px against 76px of content and the expanded state revealed the
  full 76px before returning cleanly to collapsed.
- At 390px, Jordan's preview was visibly inserted directly after Jordan's row,
  closed without leaving a selected state, and linked to Jordan's full profile.
- Member-name navigation remained available as the independent direct path to
  the full profile, with no browser console warnings or errors.

final result: passed

## Canonical-profile cleanup pass

Status: the single canonical profile remains current; the preview restoration
behavior recorded in this historical pass was superseded by direct routing.

- Evidence:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/canonical-profile-cleanup-qa/01-canonical-profile-desktop.png`
  and
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/canonical-profile-cleanup-qa/02-restored-preview-mobile.png`
- Removed the superseded card-heavy member-profile artifact.
- Promoted the section-led design to `people-profile-overlay.html` and removed
  “v2” from gallery labels, document titles, accessible names, and handoff docs.
- Routed People names, preview links, tablet row navigation, and the Connect
  review state through the single canonical profile.
- Made the profile close action return to the originating member. Desktop
  restores the docked preview, mobile restores the inline preview beneath the
  same row, and tablet restores the selected row.
- Retained internal `profile-v2-*` CSS class names as implementation selectors;
  they are not user-visible and renaming them would add churn without changing
  the engineering contract.
- Automated browser checks passed at 1280 × 720 and 390 × 720 with no console
  warnings, page errors, horizontal overflow, or failed interaction assertions.

Final result: passed.

## Direct-profile routing cleanup

- Evidence:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-direct-profile-qa/01-desktop-directory.png`,
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-direct-profile-qa/02-mobile-directory.png`,
  and
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-direct-profile-qa/03-jordan-full-profile.png`.
- Removed the docked/inline profile preview, its close path, and all 50 preview
  chevrons. No preview DOM or preview event handler remains.
- A row-body click and the member-name link now open the same full-profile
  route on desktop, tablet, and mobile. Message / Connect / Pending buttons do
  not trigger profile navigation.
- The profile close link carries the active query, scope, results page, and
  member key. Returning restores the matching page and scroll position, with a
  short non-blocking highlight on the source row.
- Desktop checks passed for 20 visible rows, direct Jordan routing, independent
  Connect behavior, and the Mei Lin page-2 / Open-to-help round trip.
- The 390px frame passed with 20 visible rows, zero horizontal overflow, direct
  Jordan routing, and the 20 → 40 → 50 load-more labels. The 768px frame keeps
  numbered pagination and contains no preview or chevron controls.
- Direct People and profile routes produced no console warnings or errors. The
  Browser review harness still emits its known MutationObserver error when the
  iframe width changes; no MutationObserver exists in the handoff source.

Final result: passed.

## Search-result cap and pagination pass

- Evidence:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-results-density-qa/01-desktop-20-members.png`
  and
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-results-density-qa/02-mobile-density.png`
- Broad People searches now expose a maximum of 50 ranked matches, paginated
  as 20 / 20 / 10 across three pages.
- The mock dataset contains 50 distinct members with varied names, roles,
  companies, locations, topics, relationship states, and avatar treatments.
- The result summary names both the cap and current page. A footer explains why
  the cap exists and invites the member to refine the query or filters.
- Page-number selection updates `aria-current`; Previous and Next disable at
  the first and last pages respectively. Submitting a new query resets to page
  1, while clearing search returns to uncapped directory-order copy.
- Browser interaction checks confirmed 20 visible rows on pages 1 and 2, 10
  on page 3, and a disabled Next control on the last page.
- Added-member navigation passed with Mei Lin: result row → matching full
  profile → close back to page 2 with Mei restored.
- The direct People page produced no console warnings or errors. The Browser
  gallery harness emitted its own MutationObserver attachment error when the
  iframe width changed; no MutationObserver exists in the handoff source and
  the rendered mobile artifact remained functional.

Final result: passed.

## Relationship, safety, and system-state pass

Status: relationship, safety, and system-state work remains current; the
preview interaction recorded in this historical pass was superseded by the
direct-profile routing cleanup.

- Evidence:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-state-completeness-qa/01-chevron-preview.png`,
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-state-completeness-qa/02-connect-pending.png`,
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-state-completeness-qa/03-disconnect-confirmation.png`,
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-state-completeness-qa/04-people-no-results.jpg`,
  and
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/people-profile-state-completeness-qa/05-profile-permission.png`.
- Member names remain full-profile links. The chevron and preview behavior from
  this pass were subsequently removed to eliminate competing navigation rules.
- Other-member profiles now derive Message, Connect, Pending, helping topics,
  contact visibility, privacy copy, and Disconnect availability from the
  member’s relationship state.
- Connection submission reaches a visible success state and updates the
  profile to Requested / Pending without dismissing context.
- Report, Block, and Disconnect use named dialogs. Destructive actions require
  confirmation; every path reaches a calm completion state and Escape closes
  an open dialog.
- New People states cover no results, loading skeletons, and failed-load retry.
  New profile states cover gone, permission-denied, and blocked outcomes.
- Desktop checks, the historical 390px preview check, all six gallery entries, and
  direct-page console checks passed with no relevant warnings or errors.

Final result: passed.

## Mobile load-more pass

- Evidence:
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/mobile-load-more-qa/01-mobile-load-20-crop.png`
  and
  `/Users/richardlee/.codex/visualizations/2026/07/10/019f4aba-feb8-72f1-99e9-c7b614db0524/mobile-load-more-qa/02-mobile-load-40-crop.png`
- At 620px and below, numbered pagination is replaced by a continuous Load
  more control. Desktop and tablet retain the three numbered pages.
- Mobile renders 20 members initially, 40 after Load 20 more, and all 50 after
  Load 10 more. The control then becomes a disabled “All 50 loaded” state.
- Loading another batch appends results without replacing or resetting the
  current list.
- A CSS specificity issue that allowed semantically hidden rows to paint was
  caught during screenshot QA and fixed with `.person-row[hidden]`.
- Direct-page console checks remained clean after the responsive split.

Final result: passed.
