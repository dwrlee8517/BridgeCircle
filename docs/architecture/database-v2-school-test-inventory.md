# Database v2 School vertical-slice test inventory

> **Status (2026-07-15): locally complete.** The approved School slice is
> implemented and verified against the disposable local stack. Remote reset and
> deployment remain out of scope.

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
- external email/provider delivery proof.

These deferrals do not weaken the database invariants, member privacy, or the
visual/interaction acceptance criteria in this slice.

## Final local evidence

- destructive reset: all five v2 migrations and the canonical seed apply cleanly;
- pgTAP: 14 files / 589 assertions green, including 64 School assertions;
- School reliability: capacity contention, offer-expiry maintenance, and
  representative query-plan harnesses green;
- TypeScript: Foundation, Conversations, Help, Messages, People/Profile, and
  School focused projects green;
- Vitest: 62 files / 264 tests green;
- ESLint and Biome: green;
- Playwright: 8 combined People, Messages, and School roads green from one clean
  reset; the School suite contributes three roads and includes axe checks;
- generated Supabase types regenerated from the verified local schema;
- final local database restored to the canonical seed.

The repository-wide production build reaches application TypeScript and then
stops in the already-deferred search pipeline at
`scripts/check-profile-embedding-index.ts`, which still names the superseded
public embedding tables. School's focused compiler project is green; repairing
that search-operations script belongs to the later search-pipeline slice rather
than hiding the mismatch with a cast or compatibility view.
