# Database v2 School vertical-slice test inventory

> **Status (2026-07-16): locally complete.** The approved School slice and its
> transactional email fan-out are implemented and verified against the
> disposable local stack. Remote reset, delivery proof, and deployment remain
> out of scope.

## Pre-School checkpoint

- commit: `8442dfb feat: complete people profile UX and unify message rooms`
- local reset: green;
- pgTAP: 13 files / 525 assertions green;
- Vitest: 61 files / 264 tests green;
- focused Foundation, Conversation, Help, Messages, People/Profile TypeScript:
  green;
- People + Messages Playwright: 5 roads green after a clean reset.

## Contract matrix

| Surface | Required evidence | Status |
|---|---|---|
| schema/lifecycle | event details, offer timestamp checks, announcement reads, newsletter ordering | green — School pgTAP contract |
| privileges | no raw School member table grants; no authenticated private School EXECUTE | green — grant allowlist + School pgTAP |
| tenant isolation | active selected membership only; wrong-org and inactive rejection | green — School pgTAP |
| event projection | published/cancelled visibility, draft hiding, time/campus, join gating | green — pgTAP + browser road |
| attendee privacy | blocked/deleted/inactive hidden; Profile-compatible identities; safe aggregate | green — School pgTAP |
| RSVP transaction | final seat, waitlist order, held offer, accept/pass/expiry, idempotence | green — pgTAP + contention + browser road |
| announcement flow | pinned/filter ordering, unread/read persistence, unavailable convergence | green — pgTAP + browser road |
| newsletter flow | published reverse chronology, ordered sections, safe optional links | green — pgTAP + browser road |
| admin seam | authorized event/announcement writes and notifications | green — fixed APIs, admin port, pgTAP |
| maintenance | expired offers and reminders are idempotent and resumable | green — maintenance harness |
| transactional email | reminder/change/cancellation/waitlist/announcement jobs honor per-type preferences and deep-link safely | green — outbox pgTAP + worker tests |
| query plans | hub, attendee, waitlist, announcement, newsletter hot paths | green — representative plan harness |
| application contracts | strict repository parsers and framework-free domain operations | green — focused TypeScript + Vitest |
| responsive UI | hub and all readers at desktop/tablet/mobile without overflow | green — Playwright + in-app visual pass |
| accessibility | axe, keyboard, focus return, dialogs, landmarks, reduced motion | green — School browser suite |
| destructive cutover | old routes/modules/callers absent | green — boundary and cutover checks |
| prior slices | full pgTAP, focused TypeScript, Vitest, lint, format remain green | green — combined regression |

## Durable browser roads

1. School hub: attending selection, event cover, RSVP, canonical navigation.
2. Full event: second member waitlists, first member leaves, second receives a
   held offer, accepts explicitly, calendar remains private-safe.
3. Announcement: tag filter, pinned ordering, unread marker, detail arrival,
   read persistence.
4. Newsletter: archive to issue, ordered section reading, no action modules.
5. Event states: changed, cancelled, past, online join gating, not-found.
6. Mobile: hub, detail dialog/controls, archive, and readers have no horizontal
   overflow and retain reachable navigation.

## Deferred intentionally

- recommendation and personalization ranking beyond deterministic next event;
- remote environment evidence;
- newsletter authoring UI;
- external Resend delivery proof in the shared development environment.

These deferrals do not weaken the database invariants, member privacy, or the
visual/interaction acceptance criteria in this slice.

## Final local evidence

- destructive reset: the baseline, all ten follow-up migrations, and the
  canonical seed apply cleanly;
- pgTAP: 19 files / 698 assertions green, including the original 64 School
  assertions and 15 transactional-email assertions;
- School reliability: capacity contention, offer-expiry maintenance, and
  representative query-plan harnesses green;
- TypeScript: all eight focused vertical-slice projects and repository-wide
  TypeScript green;
- Vitest: 59 files / 270 tests green;
- ESLint and Biome: green;
- Playwright: all 41 current E2E tests green from one clean reset; the School
  suite contributes three roads and includes responsive and accessibility
  checks;
- generated Supabase types reproduced twice from the verified local schema with
  identical SHA-256 output;
- database lint is clean and the migration shadow diff is empty;
- the production build, including its route manifest, is green;
- final local database restored to the canonical seed.
