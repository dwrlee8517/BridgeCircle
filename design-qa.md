# Design QA — Help vertical slice

## Comparison target

- Source visual truth:
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/help/AskHistory.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/help/AskStatus.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/help/GiveDirect.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/help/GiveOffer.dc.html`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/templates/messages/Messages.dc.html`
- Source rendered captures:
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/source-ask-history-1440.png`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/source-ask-status-direct-1440.png`
  - `/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project/screenshots/help/qa/source-ask-status-circle-1440.png`
- Implementation routes:
  - `http://localhost:3000/help/asks`
  - `http://localhost:3000/help/asks/:askId`
  - `http://localhost:3000/help/asks/:askId/offer`
  - `http://localhost:3000/messages/:conversationId`
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
- Direct helper source/implementation: `reference-give-direct-1512x772.png` and `implementation-give-direct-1512x772.png`, plus matched 768 × 900 and 390 × 844 captures.
- Circle offer source/implementation: `reference-give-offer-1512x772.png` and `implementation-give-offer-1512x772.png`, plus matched 768 × 900 and 390 × 844 captures.
- Accepted-Ask thread source/implementation: `reference-messages-ask-thread-1512x772.png` and `implementation-messages-ask-thread-1512x772.png`, plus matched 768 × 900 and 390 × 844 captures and an implementation-only 320 × 700 minimum-width check.

## Comparison evidence

- Full-view history comparison: the 1440 × 900 source and implementation captures above were opened together and compared for shell alignment, content width, section rhythm, row density, status pills, typography, and card geometry.
- Full-view direct-status comparison: the matched 1440 × 900 captures were opened together and compared for the summary card, recipient state card, vertical spacing, and waiting treatment.
- Full-view circle-status comparison: the matched 1440 × 900 captures were opened together and compared for the Ask summary, anonymity note, offer stack, and action hierarchy.
- Focused-region crops were not needed: every evaluated screen is already a single focused reading column, and all relevant regions remain legible in the matched 1440 × 900 captures.
- Responsive captures confirm that the existing shell collapses to icon rail at 768 px and fixed bottom navigation at 390/320 px. DOM-backed overflow checks found no element wider than its client box at 390 or 320 px.
- The helper-response and accepted-thread source/implementation pairs were opened together in the same visual comparison input after each final capture. Desktop pairs use the same 1512 × 772 viewport and state; tablet pairs use 768 × 900; mobile pairs use 390 × 844.
- The legacy source templates retain desktop-width overflow at 390 px (`GiveDirect` 419 px, `GiveOffer` 412 px, `Messages` 662 px). The implementation intentionally applies the approved responsive shell and stays exactly within 390 px; the accepted thread also stays within 320 px.

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

### Iteration 2 — helper responses and accepted-Ask thread

- Direct-response geometry, wash, Ask hierarchy, recipient identity, response card, report action, green commitment CTA, and route-specific shell title align with `GiveDirect.dc.html`; authenticated seed copy accounts for expected wrapping differences.
- Circle-offer geometry, anonymous member presentation, green matching treatment, two-column desktop workspace, assistant panel, private offer card, and CTA align with `GiveOffer.dc.html`.
- The accepted-Ask thread preserves the source conversation column, origin line, outgoing message treatment, composer, member context, Ask status, and resolve action. The approved Help plan includes only this minimal seam; the source's searchable conversation list, shared-media panel, and full inbox controls remain intentionally owned by the later Messages slice.
- Mobile implementation order is deliberate: helper composers become one readable column, the shell becomes bottom navigation, the accepted thread keeps the conversation primary, and the details panel is reached through the visible `Details` link. No action is clipped and no implementation viewport scrolls horizontally.

No actionable P0, P1, or P2 mismatch remains within the approved Help milestone scope.

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
- Accept a direct Ask with an opening note and verify the resulting conversation has one actor-aware origin line and one opening message.
- Submit a private offer to an anonymous matched Ask, verify the asker alone sees it, accept it, and verify the accepted helper identity appears in the new conversation.
- Send in both accepted conversation kinds, resolve the circle Ask, and send again after resolution to prove that resolution closes the Ask rather than the conversation.
- Verify Realtime outage copy is non-blocking, durable send remains available, and bounded reconnection retries stay active without an unhandled rejection.

## Runtime and verification

- Browser console: a fresh post-navigation checkpoint produced no application warnings or errors. Writing-assistant extension warnings and an older retained log from the superseded remote-environment attempt were excluded from the current local run.
- `pnpm exec biome check .` — 491 files passed.
- `pnpm typecheck:v2-help` — passed.
- `pnpm check:help-boundaries` — passed.
- `pnpm check:tokens` — all four design-token ratchets passed.
- `pnpm exec vitest run` — 52 files and 249 tests passed.
- `pnpm exec eslint .` — zero errors and three unrelated warnings in existing debug scripts.
- `supabase test db` — 10 files and 379 assertions passed.
- Foundation, Conversation, and Help concurrency; Help worker/maintenance/Realtime/query-plan; and Conversation Realtime/query-plan harnesses all passed serially.
- `supabase db lint --local --level warning --fail-on warning` — no schema warnings.
- `supabase db diff --local --schema public,api,private` — no schema drift.
- Global TypeScript remains a later-domain port inventory at 1,239 errors across 97 files; focused Help and the accepted-thread seam have zero owned errors.
- `git diff --check` — passed.

## Residual notes

- The source specimens use fixed demo identities and notes, while local QA uses authenticated seed data. The resulting line wrapping is expected data variance, not design drift.
- The two disposable local-only offers used to exercise the circle actions were removed after QA.
- The full three-column Messages inbox is not claimed as part of this Help milestone. Its source comparison was used to preserve the conversation/detail language and hierarchy while the approved minimal accepted-Ask seam was implemented; the inbox list and media/tools panel remain parked for the Messages vertical slice.

final result: passed
