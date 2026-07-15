# Design QA — Help Ask history and status

## Comparison target

- Source visual truth:
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/help/AskHistory.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/help/AskStatus.dc.html`
- Source rendered captures:
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/source-ask-history-1440.png`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/source-ask-status-direct-1440.png`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/source-ask-status-circle-1440.png`
- Implementation routes:
  - `http://localhost:3000/help/asks`
  - `http://localhost:3000/help/asks/:askId`
- Primary comparison viewport: 1440 × 900.
- Responsive verification viewports: 768 × 900, 390 × 844, and 320 × 700.
- States compared: Ask history; direct Ask waiting; circle Ask open with two pending offers.

## Browser-rendered implementation evidence

- Ask history desktop: `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-history-1440.png`
- Direct Ask status desktop: `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-status-direct-1440.png`
- Circle Ask status desktop: `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-status-circle-1440.png`
- Ask history tablet: `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-history-768.png`
- Direct Ask status tablet: `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-status-direct-768.png`
- Ask history mobile: `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-history-390.png` and `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-history-320.png`
- Circle Ask status mobile: `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-status-circle-390.png` and `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-status-circle-320.png`

## Comparison evidence

- Full-view history comparison: the 1440 × 900 source and implementation captures above were opened together and compared for shell alignment, content width, section rhythm, row density, status pills, typography, and card geometry.
- Full-view direct-status comparison: the matched 1440 × 900 captures were opened together and compared for the summary card, recipient state card, vertical spacing, and waiting treatment.
- Full-view circle-status comparison: the matched 1440 × 900 captures were opened together and compared for the Ask summary, anonymity note, offer stack, and action hierarchy.
- Focused-region crops were not needed: every evaluated screen is already a single focused reading column, and all relevant regions remain legible in the matched 1440 × 900 captures.
- Responsive captures confirm that the existing shell collapses to icon rail at 768 px and fixed bottom navigation at 390/320 px. DOM-backed overflow checks found no element wider than its client box at 390 or 320 px.

## Comparison history and fixes

### Iteration 1

- P2 — the first implementation used a 680 px border-box container with internal padding, making the visible cards narrower than the 680 px source cards.
- P2 — the status/history pages initially used arbitrary font-size values that bypassed the active BridgeCircle typography tokens.
- P2 — history lacked the shell-level active-slot count, making the source's `3 of 5 open` context unavailable to the user.

Fixes made:

- The reading container is now 732 px including 26 px side padding, producing the source-aligned 680 px card width at desktop.
- All new typography uses named BridgeCircle text tokens; the design-token ratchets pass with no new arbitrary font sizes.
- The member shell header now supports optional metadata and the history route supplies the live active-slot count.

Post-fix evidence:

- `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-history-1440.png`
- `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-status-direct-1440.png`
- `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/app-ask-status-circle-1440.png`

No actionable P0, P1, or P2 mismatch remains after the post-fix comparison.

## Required fidelity surfaces

- Fonts and typography: passed; the implementation uses the active BridgeCircle Pretendard hierarchy and named type tokens.
- Spacing and layout rhythm: passed; desktop card width and vertical rhythm match the templates, with deliberate content-driven height changes for longer live notes.
- Colors and visual tokens: passed; page wash, elevated cards, status pills, buttons, focus rings, and dialog scrims use the existing design-system variables.
- Image and asset quality: passed; existing BridgeCircle branding, Lucide shell icons, and real avatar/fallback components are used. No placeholder or approximate visible asset was added.
- Copy and content: passed; the source voice is preserved while identity, school, timestamps, Ask counts, and notes come from authenticated local data.
- Interaction and accessibility: passed; history rows are links, dialogs are labelled and focus-managed, report reasons are semantic radios, buttons retain 44 px mobile targets, and status updates use a live region.

## Primary interactions tested

- Open Ask history and follow direct/circle Ask detail links.
- Open and cancel the retract confirmation without mutating the Ask.
- Open the decline flow, verify the cushioned default note, and cancel without declining.
- Open the private report flow, switch the reason from Harassment to Spam, and cancel without submitting.
- Verify pending-offer Accept, Decline, and Report controls are present and correctly scoped per offer.
- Verify tablet and mobile shell transitions, fixed bottom navigation, vertical reachability, and absence of horizontal overflow.
- Verify Realtime subscription wiring refreshes the affected Ask/history route through the existing Help channel contract.

## Runtime and verification

- Browser console: a fresh post-navigation checkpoint produced no application warnings or errors. Writing-assistant extension warnings and an older retained log from the superseded remote-environment attempt were excluded from the current local run.
- `pnpm exec biome check .` — 479 files passed.
- `pnpm typecheck:v2-help` — passed.
- `pnpm check:help-boundaries` — passed.
- `pnpm check:tokens` — all four design-token ratchets passed.
- `pnpm exec vitest run` — 51 files and 246 tests passed.
- `pnpm exec eslint .` — zero errors and three unrelated warnings in existing debug scripts.
- `git diff --check` — passed.

## Residual notes

- The source specimens use fixed demo identities and notes, while local QA uses authenticated seed data. The resulting line wrapping is expected data variance, not design drift.
- The two disposable local-only offers used to exercise the circle actions were removed after QA.

final result: passed
