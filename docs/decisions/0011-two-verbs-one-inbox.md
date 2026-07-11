# 0011 — Two verbs, one inbox: Connect / Ask over a single Messages surface

- **Status:** proposed
- **Date:** 2026-07-02
- **Decider:** Richard

## Context

[0010](0010-horizontal-help-warm-data-flywheel.md) reframed help as horizontal
but kept a visible taxonomy: commitment tiers (quick ↔ ongoing) with pace
cards, screening steps, peer lanes, and per-type thread chrome. A mockup review
on 2026-07-02 (`docs/experience/explorations/help-relationship-types-2026-07-02.html`)
surfaced Richard's verdict: **too many relationship types for members to hold.**
The approved direction is the simplified model in
`docs/experience/explorations/simple-connect-ask-2026-07-02.html` and its
Toss-skinned v2 (`simple-connect-ask-toss-2026-07-02.html`).

What exists today (verified against code):

- `asks` is polymorphic over `ask_type` enum (`advice` | `mentorship`), with
  mentorship-only `commitment` (+ check constraint), `screening_answer`,
  plus the buffer fields (`decline_reason`, `reminder_sent_at`, `status`,
  `responded_at`).
- `helper_preferences` carries per-type opt-ins (`open_to_advice`,
  `open_to_mentorship`), `topics`, `screening_prompt`, caps
  (`max_active_mentees`, `max_pending_requests`), `paused_at`, `paused_until`.
- Messaging is already half-unified: one `messages` table polymorphic over
  `thread_type` (`ask` | `direct`), but two thread tables (`ask_threads`,
  `direct_message_threads`) and **two thread UIs** (`/ask/thread/[id]` vs
  `/messages/[id]`), with the conversation list on `/inbox`.
- The composer is type-split: `ask/new/advice-flow.tsx` (2 steps),
  `mentorship-flow.tsx` (5 steps), shared `flow-ui.tsx`, plain form via
  `?skip=1` (`request-form.tsx`), drafts from `/api/asks/draft` →
  `lib/asks/draftAsk.ts`.
- `open_asks` + `open_ask_matches` exist (14-day TTL, nightly
  `scripts/sweep-open-asks.ts`, count-only asker notifications); match rows are
  service-role-only. `/help` exists as the supply-side surface.
- `friend_requests` already has a `message` column; `friendships` is the
  canonical pair table; DMs gate on mutual friendship.
- ~96 files under `app/src` mention "mentor"; emails include
  `mentorship-request-email.tsx` and `mentorship-accepted-email.tsx`.

## Decision

Collapse the member-facing model to **two verbs and one room**:

> A member can do two things to another member: **Connect** or **Ask**. If you
> don't know who to ask, **ask the circle**. Every accepted intro becomes an
> ordinary conversation in Messages. The AI's job is the first message; after
> that the product gets out of the way.

- **D1 — One ask type.** No advice/mentorship distinction anywhere: no tiers,
  pace cards, screening steps, or caps in the interface. An ask is one
  AI-assisted first message + helper accept/quiet pass.
- **D2 — Connect with two intro modes.** Basic one-tap hello (people who know
  each other) or conversational AI intro (strangers). Mutual accept, then DM.
  The [0003](0003-friendship-mentorship-split.md) gating split is **preserved
  as plumbing**: asks stay one-sided (helper opt-in), connect stays two-sided.
- **D3 — Ask the circle.** `open_asks` becomes a first-class front door:
  helpers describe what they can speak to on `/help`, AI suggests matching
  open asks, an offer notifies the asker, and **the asker holds the accept**.
- **D4 — One Messages surface.** All conversations render identically in one
  inbox and one thread view. In-thread and in-list recognition is a **class
  year on every name** plus the **circle mark** (two overlapping circles,
  from `circles-motif`) shown only for connected members. Origin appears as a
  quiet system line, never as a different interface.
- **D5 — The buffer goes invisible, not away.** Quiet pass (`decline_reason`
  never facing the asker), pause (`paused_until`, inactivity auto-pause), and
  ask expiry/reminders all survive as plumbing.

This supersedes 0010's D1 mechanics (visible commitment axis, screening,
reverse/peer *lanes* — direction-neutral matching now falls out of the single
type for free). 0010's D2–D4 (operator console, comms instrumentation, data
flywheel) are untouched.

## Implementation plan

Expand/contract for all schema work ([0008](0008-deploy-ordering-expand-contract.md));
business logic stays in `/lib` ([0007](0007-lib-discipline.md)); every phase
ends with `pnpm biome check . && pnpm lint && pnpm tsc --noEmit` + vitest;
migrations get `migration-reviewer`, RLS changes get `rls-auditor`.

### Phase 1 — Language and naming (copy-only, no schema, reversible)

| Task | Touchpoints |
|---|---|
| Purge mentor/mentee/advice/mentorship from user-facing strings; single vocabulary: ask, help, connect | `app/src/app/(member)/**` (~50 files), `app/src/notify/emails/**`, onboarding `step-help.tsx` |
| Rename email templates + subjects | `mentorship-request-email.tsx` → `ask-request-email.tsx`, `mentorship-accepted-email.tsx` → `ask-accepted-email.tsx`; "Connect" copy in `friend-request-*-email.tsx` |
| Nav label Inbox → Messages | `nav-links.ts` (route stays `/inbox` for now) |
| Retire the mentorship URL | Move the settings page to `/help/settings` (the form itself folds into `/help` in Phase 2); 308 `/mentorship/settings` → `/help/settings`, per the `next.config.ts` legacy-redirect pattern |

**Verify:** brand-voice pass on changed strings; grep gate — zero user-facing
"mentor|mentee|mentorship" in `(member)/**` and `notify/emails/**`.

### Phase 2 — Single ask type + conversational composer

| Task | Touchpoints |
|---|---|
| Drop type/commitment/screening from the ask contract (keep `draftVariantSchema` tone lenses) | `lib/asks/schemas.ts` (delete `askTypeSchema`, `askCommitmentSchema`, `COMMITMENT_OPTIONS`, screening fields), `createAsk.ts` (stop writing `ask_type`/`commitment`/`screening_answer`) |
| One availability state: "open to helping" + pause; caps and screening leave the UI | `lib/asks/preferences.ts`, settings form (folded into `/help`), `respondToAsk.ts` |
| Replace the type-split wizard with one conversational drafter (chat-style, per the mockup); keep `?skip=1` plain form | delete `advice-flow.tsx`/`mentorship-flow.tsx`/`flow-ui.tsx`; new drafter component in `ask/new/`; `draftAsk.ts` prompt drops commitment/genre inputs |
| Direction-neutral matching: topic relevance must not be gated by per-type flags | `lib/asks/signals.ts`, rerank per [0009](0009-hybrid-ask-matching.md) |

No migration yet: `ask_type` default `'advice'` absorbs writes; unused columns
sit idle until Phase 6.

**Verify:** vitest on `schemas`/`createAsk`/`signals` incl. a reverse-direction
fixture (junior surfaces for a senior's ask); manual ask e2e per
`docs/runbooks/e2e-testing.md`.

### Phase 3 — One Messages surface (UI unification; keep the data layer)

Keep `ask_threads` + `direct_message_threads` + polymorphic `messages` —
[0003](0003-friendship-mentorship-split.md)'s gates live there and nothing
about the simplification requires a destructive merge. Unify at the UI layer.

| Task | Touchpoints |
|---|---|
| One conversation list merging ask threads, DM threads, pending asks, and connect requests | new `lib/messages/listConversations.ts` (composes `lib/dm/listThreads` + ask-thread reads + `lib/friendship/listPendingRequests`); `/inbox` renders it |
| One thread view for both thread types | `/messages/[id]` `live-thread.tsx` generalized; `/ask/thread/[id]` 308 → `/messages/[id]`-style URL; delete `goal-tracker.tsx` chrome |
| Class year + circle mark | new `components/ui/circle-mark.tsx`; year from `organization_profiles`; friendship state via `lib/friendship/friendshipState.ts` |
| Origin as a quiet system line ("Jane accepted your ask", "You connected"), derived from thread type + request row — no new table | thread view |

**Verify:** vitest on `listConversations` (merge, ordering, pending-first);
Realtime still streams both thread types; `rls-auditor` on the merged reads.

### Phase 4 — Connect intro modes

| Task | Touchpoints |
|---|---|
| Quick-hello chips + conversational AI intro (drafts into `friend_requests.message`, which already exists) | profile `[id]` CTA area; new `lib/friendship/draftIntro.ts` + `POST /api/connect/draft` (parse/auth/call/respond only) |
| Profile front door: exactly two buttons — Ask for help, Connect — plus circle-state line | `profile/[id]/page.tsx` |
| Accept → DM thread + system line; emails renamed to connect vocabulary | `respondToFriendRequest.ts` → `lib/dm/getOrCreateThread.ts`; `friend-request-*-email.tsx` |
| "Add to your circle" nudge: after an ask conversation is underway (helper accepted, both sides have written), offer one-tap Connect in the thread — quiet, once per pair, two-sided (either side may tap; the other still accepts). Copy needs a voice pass | thread view; `lib/friendship/friendshipState.ts` guard so it never shows for existing connections or pending requests |

**Verify:** vitest on `draftIntro` + `sendFriendRequest` with intro; e2e
connect → accept → message.

### Phase 5 — Ask the circle (supply side on `/help`)

The RLS-sensitive phase: `open_ask_matches` is service-role-only today, and
surfacing asks to helpers changes who can read what.

| Task | Touchpoints |
|---|---|
| `/help` rework: "What would you like to help with?" input → matched open asks (reuse 0009 retrieval) | `help/help-client.tsx`, `lib/asks/openAsks.ts` |
| RLS-safe read path: a matched helper may read the open ask's text + asker preview, nothing more | migration + policies; **`rls-auditor` mandatory** |
| Offer lifecycle: new `open_ask_offers` table (`open_ask_id`, `helper_id`, `message`, `status`, `responded_at`); offer → asker notification/email; asker accept → accepted ask + thread; asker quiet pass mirrors helper decline dignity | migration; new `lib/asks/offerToHelp.ts`; reuse `askLifecycle.ts`; new `offer-received` email on the CivicEmail kit |
| Sweep: keep count-only notifications for askers; add helper-side match notifications | `lib/asks/openAskSweep.ts`, `scripts/sweep-open-asks.ts` |

This lifts the standing-ask scope fence in `app/CLAUDE.md` ("helper-side /help
surfacing … still needs explicit approval") — approved by this ADR.

**Verify:** `migration-reviewer` + `rls-auditor`; vitest on offer lifecycle
(offer → accept → thread; offer → pass → nothing leaks); sweep test.

### Phase 6 — Contract migrations + doc sync

Each destructive step split expand → contract across deploys per 0008:

- Drop `asks.ask_type` + the `ask_type` enum; drop `asks.commitment` (+ check)
  and `asks.screening_answer`.
- `helper_preferences`: rename `open_to_advice` → `open_to_help`
  (expand/contract); drop `open_to_mentorship`, `screening_prompt`,
  `max_active_mentees`. **Keep `max_pending_requests`** as an invisible abuse
  valve (decided 2026-07-02) — enforced in `createAsk`, never surfaced in the
  UI. Keep `paused_at`/`paused_until`.
- Delete `/mentorship` route directory (redirects remain), dead composer
  files, `commitmentLabel` and friends; `pnpm db:types` regenerate.
- Docs in the same change: 0010 → "superseded in part by 0011"; 0003 annotated
  (gates preserved, vocabulary retired); `app/CLAUDE.md` route table +
  "Asks are polymorphic" bullet + scope-fence line;
  `docs/architecture/information-architecture.md`;
  `docs/product/feature-roadmap.md`; voice-guidelines avoid/prefer row for
  mentor/mentee and friend→connect; `product-spec-obsidian-vault/Production/phase-1/spec.md` drift flag.

**Verify:** grep gate — zero `ask_type|open_to_mentorship|screening_prompt`
identifiers outside migrations; full pre-PR stack (`/ship`); e2e smoke.

### Sequencing note

Phases 1–2 are independent of 3–5 and can ship first (they're the visible
simplification). Phase 3 before 4 and 5 (both land conversations in the
unified surface). Phase 6 last, after pilot-stable.

## Consequences

- **+** The member model shrinks to two verbs; every conversation converges on
  one surface — matches the approved UX exploration exactly.
- **+** No destructive messaging migration: the polymorphic `messages` table
  and split thread tables already support UI-level unification.
- **+** Reverse/peer help needs no feature — with one ask type it falls out of
  matching relevance alone.
- **+** The buffer (quiet pass, pause, expiry dignity) survives untouched as
  plumbing — the brand mechanism is preserved.
- **−** Partially reframes shipped work again: the #109 type-split composer is
  deleted (not relabeled as 0010 planned); `asks.commitment` and the screening
  wiring shipped in #109 are dropped.
- **−** Two thread URLs collapse to one; old `/ask/thread/*` links depend on
  redirects indefinitely.
- **−** Surfacing open asks to helpers widens the RLS read surface — the one
  genuinely security-sensitive change (Phase 5 gates on `rls-auditor`).
- **−** Losing the commitment field loses future analytics on ask depth;
  acceptable, it was written for less than a month.

## Alternatives considered

- **Keep 0010's visible commitment tiers.** Rejected — Richard's explicit
  simplicity call after seeing both mockups side by side.
- **Merge thread tables into one `conversations` table now.** Deferred — the
  product requirement ("all conversations in Messages") is a UI property; the
  data merge adds a destructive multi-deploy migration for no member-visible
  gain. Revisit only if the polymorphic reads hurt.
- **Collapse ask and connect gates into one request type.** Rejected again
  (as in 0010) — one-sided ask vs two-sided connect is load-bearing for the
  buffer.
- **Rename `friend_*` tables/`lib/friendship` to `connect*` in code.**
  Deferred to never-unless-painful — copy-level "Connect" is what members see;
  a schema rename is churn without user value.

## Resolved questions (Richard, 2026-07-02)

1. **Caps:** keep `max_pending_requests` as an invisible abuse valve; drop
   `max_active_mentees`. (Folded into Phase 6.)
2. **Post-ask connect nudge:** yes — one-tap "Add to your circle" in the ask
   thread. (Folded into Phase 4.)
3. **Screening data:** no archiving; drop `screening_prompt`/`screening_answer`
   outright in Phase 6.
