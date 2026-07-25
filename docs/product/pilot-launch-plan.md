# Pilot Launch Plan — Everything Between Here and the Chadwick Pilot

The single working list of what must be done before BridgeCircle opens to real
Chadwick members. It covers product readiness, instrumentation and success
measurement, legal and trust groundwork, the Chadwick relationship, marketing
materials, tutorials, seeding, cost analysis, and pilot operations.

There is no fixed launch date — the gate is quality, not the calendar
([AGENTS.md](../../AGENTS.md)). So this plan is sequenced by **gates and
dependencies**, not weeks: each phase has entry conditions and verifiable exit
criteria. Work the phases in order; workstreams inside a phase run in parallel.

Status legend: `[ ]` open · `[x]` done · `(founder)` unless another owner is
named. External dependencies (Chadwick, counsel) are marked.

---

## Where we actually are (verified against code, 2026-07-25)

The app is much further along than the Phase 1 spec docs suggest. The database
v2 rebuild (ADR 0015) landed every product domain locally as a verified
vertical slice:

- **Built and tested in mainline:** auth + invite-token entry, seven-step
  onboarding with LinkedIn/résumé Fast Fill, profiles with field-level
  visibility, People directory + connections with AI-drafted notes, the full
  Help loop (circle asks, direct asks, offers, AI drafting, Voyage semantic
  matching), messaging with the waiting-room buffer, School (events with
  RSVP/waitlist/ICS, announcements, newsletters), notification tray and
  preferences, admin console (health overview, members, approvals, invites,
  announcements, report queue), safety (block/report), account lifecycle
  (export, scheduled deletion), and 19 transactional emails through the outbox
  worker. 82 unit test files, 23 pgTAP suites, 16 Playwright specs, layered CI.
- **Not live:** production is frozen mid-cutover. The v2 production cutover
  runbook ([production-v2-cutover](../runbooks/production-v2-cutover.md)) is
  prepared but **not yet authorized or executed**. Until it runs, nothing else
  on this list can reach real members.
- **Deliberately stubbed:** product analytics.
  `app/src/lib/analytics/track.ts` drops every event in production, so today
  we cannot measure the pilot at all except through Sentry and raw SQL.
- **Entirely missing (non-code):** privacy policy, terms of service, any
  Chadwick agreement, member/admin tutorials, an ambassador brief, a
  school-facing pitch, Chadwick-specific landing copy, a consolidated pilot
  budget, and the launch-checklist content gates (seeded profiles, verified
  Resend domain, a real event).

**Spec drift flagged (fix as tasks A10 below, code wins):**
`launch-cut.md` and `spec.md` still describe the legacy mentorship data model
and defer features that have since shipped (admin analytics, notification
tray, field-level privacy UI, profile import);
`database-v2-contract.md` still says later domains are "not live" locally.
The launch checklist has been refreshed to match the shipped product in the
same change as this plan.

---

## Phase 0 — Decide and unblock

*Entry: now. Exit: every decision below is written down and the cutover is
scheduled. Nothing here writes code; everything here unblocks someone else.*

- [ ] **D1. Authorize the production v2 cutover.** Review
  [production-v2-cutover.md](../runbooks/production-v2-cutover.md) and the
  [production cutover plan](../architecture/database-v2-production-cutover-plan.md),
  pick the execution window, and record the go decision. This is the gating
  dependency for Phases 1–5.
- [ ] **D2. Adopt one pilot scorecard.** Three overlapping metric sets exist
  ([spec.md §Analytics](../../product-spec-obsidian-vault/Production/phase-1/spec.md),
  [feature-roadmap §Success metrics](feature-roadmap.md),
  [market-analysis §Pilot success metrics](market-analysis.md) — the only one
  with numeric targets). Reconcile them into the single scorecard in
  Workstream B and mark the other sets as inputs, not gates.
- [ ] **D3. Decide pilot shape with numbers.** Which cohorts at Chadwick
  School go first, whether Chadwick International launches simultaneously or
  as a fast follow, invite-wave sizes, and pilot length (the market-analysis
  offer is a 60–90-day activation sprint). Write it into Workstream D's
  pilot proposal.
- [ ] **D4. Engage counsel for the legal minimum.** Privacy policy, terms of
  service, and the school data agreement (Workstream C). Start now — external
  turnaround is the longest lead time in this plan. *(external)*
- [ ] **D5. Map Chadwick stakeholders.** Who signs (head of school /
  advancement / alumni office), who supplies the roster, who is the named
  school-side contact during the pilot, and which alumni are ambassador
  candidates. *(external)*
- [ ] **D6. Scope decision: no-invite landing.** Decide whether
  [no-invite-landing](../../product-spec-obsidian-vault/Prototype/no-invite-landing.md)
  (stay-signed-in landing + invite-request queue) ships before the pilot or
  stays post-launch. It directly affects word-of-mouth signups during the
  pilot; everything else in `Prototype/` (ask mediator, conditional RSVP)
  stays explicitly out of pilot scope.

---

## Phase 1 — Production-ready platform (Workstream A)

*Entry: D1 decided. Exit: the shipped app is live on production
infrastructure, observable, and a stranger can be invited end-to-end with
real email. Runs in parallel with Phase 2.*

### Cutover and deploy pipeline

- [ ] **A1. Execute the production v2 cutover** per the runbook: exact-SHA
  snapshot, guarded reset, postflight schema checks, bootstrap, web + worker
  promotion, owner grants. Verify `/api/health` reports the promoted SHA.
- [ ] **A2. Close the CD leftovers.** Disable Railway auto-deploy so deploys
  stop being doubled, and remove the `codex/ui-ux-iteration-2` manual-dispatch
  branch from `cd.yml` — promotion should run from `main` only.
- [ ] **A3. Re-enable the frozen pipeline** (CD workflow, Supabase GitHub
  integration posture per ADR 0014) and update
  [environments.md](../architecture/environments.md) to drop the freeze
  notice once lifted.

### Email

- [ ] **A4. Verify the Resend production sender domain** (SPF/DKIM aligned),
  send test invites to Gmail/Outlook/iCloud accounts, and confirm none land
  in spam. This blocks every real invite.
- [ ] **A5. Confirm the prod email guard posture.** `EMAIL_DEV_REDIRECT` /
  `EMAIL_DEV_ALLOWLIST` must be unset in production Doppler config; verify a
  real address receives a real invite.

### Observability and safety nets

- [ ] **A6. Split Sentry environments.** The DSN is hardcoded in all three
  Sentry config files, so dev and prod errors share one stream. Read the DSN
  (or at minimum the environment tag) from env so prod noise is isolatable
  during launch week.
- [ ] **A7. Add `SENTRY_AUTH_TOKEN` to CD's asserted variable list** (it
  asserts `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` today but
  not Sentry) so source-map upload can't degrade silently and leave prod
  stack traces minified.
- [ ] **A8. Put the database suites in CI.** The 23 pgTAP suites and the
  concurrency/query-plan gates are manual-only today; a migration that breaks
  an RLS invariant would not be caught by automation. Add `pnpm db:test` to
  the workflow that already boots local Supabase (`e2e.yml`).
- [ ] **A9. Decide worker resilience for pilot scale.** All email and
  notification delivery flows through a single Railway worker replica with
  `restartPolicyMaxRetries: 3`. For the pilot, at minimum: an alert when
  outbox jobs sit unclaimed past a threshold (the monitoring module exists in
  `app/src/workers/outbox/`), plus a written restart procedure in a runbook.

### Hygiene (small, do alongside)

- [ ] **A10. Fix the flagged spec drift.** Add shipped-status notices to
  `launch-cut.md`/`spec.md` deferral lists, correct the "not live" line in
  `database-v2-contract.md`, and remove the vestigial
  `ASK_MATCHING_PIPELINE` / `ASK_MATCHING_EXPLANATIONS` flags from
  `app/.env.local.example`.
- [ ] **A11. Replace `app/README.md`** — still `create-next-app` boilerplate
  pointing at port 3000 and Vercel; point it at the real run/deploy story
  (Doppler, Railway, root README).
- [ ] **A12. Decide the enrichment sweep.** The Bright Data monthly-sweep
  provider is built but nothing schedules it (no cron, no outbox job type).
  Either wire a scheduled job before launch or explicitly defer freshness
  sweeps past the pilot and note it in
  [profile-enrichment.md](../architecture/profile-enrichment.md). Also add
  `LINKDAPI_API_KEY` / `BRIGHTDATA_API_KEY` / `PDL_API_KEY` to the CD worker
  variable assertions if imports are pilot-scoped.

**Exit test for Phase 1:** from a clean browser, a real (non-team) email
address gets invited from the admin console, signs up, completes onboarding
with a LinkedIn import, posts an ask, receives an offer from a second
account, accepts, and exchanges messages — on production, with every email
delivered to a real inbox and every error visible in the prod Sentry stream.

---

## Phase 1½ — Instrumentation and success measurement (Workstream B)

*Runs inside Phase 1 (it's code) but listed separately because the pilot is
unmeasurable without it. Exit: every scorecard number below is computable
from production data without guesswork.*

- [ ] **B1. Write the pilot scorecard doc** (`docs/product/pilot-scorecard.md`)
  from decision D2. Starting targets, adapted from market-analysis to the
  shipped Help/connection model:
  - 200–500 alumni invited (per D3 wave plan)
  - 40–60% invite email open/click rate
  - 25–35% invited → activated (completed onboarding)
  - 70% profile completion among activated members
  - 25+ members opted in as helpers (helper preferences set)
  - 30+ directory searches / people-discovery sessions
  - 15+ asks or connection requests sent
  - 50%+ of asks receive a response within 7 days ← **the wedge metric**
    (differentiation.md: a Chadwick student asks, an alum responds inside 7 days)
  - 1–2 real events listed with RSVPs
  - ≥1 member-shared outcome story (bilateral consent flow already shipped)
  - board-ready engagement report at pilot end (B6)
  - North star to report directionally: useful connections created per active
    member (feature-roadmap definition).
- [ ] **B2. Make `track()` real.** Replace the production no-op in
  `app/src/lib/analytics/track.ts` with a persistent sink — the
  `analytics_events` table proposed in
  [differentiation.md](differentiation.md) §4 is enough (no third-party
  analytics vendor for the pilot; keep the trust posture).
- [ ] **B3. Instrument the funnel events end-to-end:** `invite_sent`,
  `invite_clicked`, `signup_completed`, `onboarding_completed`,
  `profile_minimum_completed`, `first_action_taken` (first ask, offer,
  connection request, or RSVP), plus ask lifecycle events (created,
  offer received, response, resolved). Today only three onboarding events
  are wired.
- [ ] **B4. Instrument the 60–90-second promise.** differentiation.md
  commits to "invite → first useful action in under a minute" with a
  p90 ≤ 90s gate — compute it from B3 events and check it during the dry run
  (Phase 4), not after launch.
- [ ] **B5. Build the scorecard query pack.** One SQL view or checked-in
  query per scorecard line (`scripts/` or a `docs/runbooks/pilot-metrics.md`
  with the queries inline), so the weekly pilot readout is one command — the
  admin overview board covers health, not funnel metrics. A dashboard UI is
  explicitly post-pilot.
- [ ] **B6. Draft the board-ready report template now** (one page: invited,
  activated, asks, response rate, stories, quotes) so the pilot collects
  exactly what the report needs from day one.
- [ ] **B7. Turn on LLM cost observability** for Anthropic + Voyage usage
  (currently deferred in the post-launch backlog; the AI budget RPCs already
  meter usage — surface the numbers). Needed for H3's real-burn check.

---

## Phase 2 — Pilot materials (Workstreams C, E, F, H)

*Runs in parallel with Phase 1. Exit: everything a Chadwick stakeholder,
ambassador, or invited member touches exists and passes the voice
guidelines.*

### Workstream C — Legal and trust *(longest external lead time — started at D4)*

Nothing in this section exists today; the repo has no privacy policy, no
terms, and no compliance analysis.

- [ ] **C1. Privacy policy** — drafted with counsel, published as an app route
  and linked from signup and onboarding. Must accurately reflect what the
  product actually does: LinkedIn/résumé import with review-first consent,
  field-level visibility defaults, AI drafting (Anthropic) and semantic
  matching (Voyage) as processors, Resend for email, Sentry with PII off,
  data export and scheduled deletion (all already implemented — the policy
  describes real behavior, which is a strength).
- [ ] **C2. Terms of service** — same treatment; includes community/safety
  rules consistent with the shipped block/report/moderation queue.
- [ ] **C3. Compliance questions for counsel, answered in writing:** FERPA
  posture for a K-12-affiliated alumni network and any roster data received
  from the school; minimum-age line (recent grads can be 17 — do we require
  18+ at signup?); COPPA n/a confirmation; **Korean PIPA** for Chadwick
  International (Songdo) members — consent language, cross-border transfer,
  data residency; GDPR only if EU-resident alumni are in scope.
- [ ] **C4. School data agreement** — a short data-sharing/roster agreement
  covering what Chadwick provides (name, email, grad year), what we do with
  it, retention, and deletion. Pairs with the pilot MOU (D-workstream).
  *(external)*
- [ ] **C5. Wire consent into the product:** ToS/privacy acceptance at
  signup, links in the footer and invite emails, and record acceptance.
  Small code task; blocked on C1/C2 text.

### Workstream E — Marketing materials

Strategy and voice are strong ([brand-strategy](brand-strategy.md),
[voice-guidelines](voice-guidelines.md), [differentiation](differentiation.md));
sendable assets are near-zero. Every item below follows the voice guidelines
and the two-sided buffer framing — no generic SaaS pitch.

- [ ] **E1. Chadwick-specific landing copy** — why BridgeCircle exists for
  Chadwick specifically (launch-cut names this as required parallel work).
  Where it lives depends on D6: the no-invite landing page if built, else a
  simple public page at `/`.
- [ ] **E2. School-facing pitch deck** — the existing
  [investor deck](../presentations/investor-mvp-pitch.html) is
  investor-framed; the school buyer needs a different story:
  member outcomes, trust/safety posture, what we don't do (no data selling,
  no ads, no donor-CRM framing), the pilot offer, and what the school gets
  at pilot end (the B6 report). Anchor on differentiation.md §8 ("First
  Pitch As A Strategic Statement") including what it must *not* show.
- [ ] **E3. One-page pilot offer** (PDF/print) — the 60–90-day activation
  sprint framed per market-analysis: what we seed, what we measure, what it
  costs ($0 pilot per differentiation.md pricing), what we ask of the school.
- [ ] **E4. Finalize the invite email** — start from the cookbook draft in
  voice-guidelines §12.1 (explicitly not paste-verbatim), name a real sender,
  and A/B the subject line across invite waves (subject line drives the 40–60%
  open target).
- [ ] **E5. Launch announcement kit for Chadwick channels** — short copy the
  alumni office can drop into their existing newsletter/social channels, so
  the school amplifies the invite waves. *(external send)*
- [ ] **E6. Pricing page draft (do not ship)** and the **"what we don't
  build" page** — both named as open items in differentiation.md §10; the
  pricing page stays unpublished until the first paid conversation.

### Workstream F — Tutorials and onboarding support

Nothing user-facing exists; product flow specs are not tutorials.

- [ ] **F1. Member quickstart** — one page or a 2-minute walkthrough:
  accept invite → onboard (use Fast Fill) → set helper topics → post your
  first ask / browse People. Written for an alum with 5 spare minutes.
- [ ] **F2. Ask-well guide** — a short "how to ask so people respond" note
  surfaced near the composer; doubles as the AI-draft framing. (The composer
  already assists; this is the human-readable companion.)
- [ ] **F3. Admin operator guide** — for the school-side admin: invite via
  CSV, approve from the queue, handle a report, create an event, publish an
  announcement, read the overview board. Screenshot-level detail; this is
  also the founder's own launch-week reference.
- [ ] **F4. Ambassador brief** — the launch-cut deliverable: what to say to
  classmates, how to onboard a class in 5 minutes, plus 3 ready-to-send
  personal messages (email/text/WhatsApp) in ambassador voice.
- [ ] **F5. Support process** — a named support email address, expected
  response time, an FAQ seeded from dry-run questions, and a simple triage
  habit (Sentry issue vs. member confusion vs. feature ask).

### Workstream H — Cost analysis

Enrichment and LLM costs are well-modeled
([profile-enrichment §Cost Model](../architecture/profile-enrichment.md):
~$50/yr steady state; Haiku extraction <$2/mo); platform infra has no dollar
figures anywhere.

- [ ] **H1. Compile the pilot monthly burn** (`docs/product/pilot-budget.md`):
  Supabase (Pro tier), Railway (web + worker + dev stage), Resend tier at
  pilot email volume (invite waves + transactional), Sentry tier, Anthropic
  (drafting + résumé extraction), Voyage (embeddings + rerank), LinkdAPI /
  Bright Data / PDL per the enrichment model, domains/DNS. One table, one
  total, a per-member-at-500 figure.
- [ ] **H2. Sanity-check pricing against burn** — confirm the published
  pricing intent ($0 pilot / $4,800 / $12,000 / $24,000+ in
  differentiation.md) clears pilot-scale costs with real margin, and note
  the break-even member count.
- [ ] **H3. Set spend alerts** where the provider allows (Anthropic, Supabase,
  Railway) and reconcile actual pilot burn against H1 monthly; B7 feeds this.

---

## Phase 3 — Chadwick agreement and seeding (Workstreams D, G)

*Entry: E2/E3 exist (something to pitch with), C1–C4 in motion. Exit: signed
pilot, roster in hand, supply seeded.*

### Workstream D — The Chadwick relationship *(external throughout)*

- [ ] **D7. Pitch meeting(s)** with the D5 stakeholders using E2/E3; walk the
  live product, not slides alone.
- [ ] **D8. Pilot MOU signed** — scope (which org(s) per D3), duration, the
  $0 pilot price with the paid tiers visible, success criteria (the B1
  scorecard, agreed with the school), the school's commitments (roster,
  channel amplification per E5, a named contact), our commitments (support,
  the B6 report), and the C4 data agreement attached.
- [ ] **D9. Receive and clean the roster** — name, email, grad year; dedupe,
  fix formats, segment into the D3 invite waves. Verify against the CSV
  invite path's expectations.
- [ ] **D10. Recruit 3–5 ambassadors** from D5 candidates; brief them with F4
  before the first invite wave.
- [ ] **D11. Chadwick International decision executed** per D3 — if it's a
  fast follow, set the trigger condition (e.g., School #1 hits activation
  target) rather than a date.

### Workstream G — Content and supply seeding

The cold-start rule: **supply before demand** — helpers and content exist
before the first big invite wave lands.

- [ ] **G1. 20–50 real alumni profiles** seeded through personal outreach
  (hand-invited, not bulk) — the launch-checklist gate.
- [ ] **G2. 10+ (target 25+) members opted in as helpers** with helper topics
  set — the shipped equivalent of "open to mentor," and the supply side of
  the wedge metric.
- [ ] **G3. At least one real event** listed with a real date — ideally a
  pilot kickoff gathering, which also gives ambassadors something concrete
  to point to.
- [ ] **G4. Seed School content** — a welcome announcement and, if ready, a
  first newsletter issue, so day-one members don't land in an empty School tab.
- [ ] **G5. First-week ask seeding** — line up 3–5 genuine asks from the
  seeded members to post in week one, so early browsers see the loop working
  (real asks from real people; never fabricated).

---

## Phase 4 — Dry run and launch

*Entry: Phase 1 exit test passed; C1/C2 published; F1–F5 exist; G1–G4 done.
Exit: invite waves are out.*

- [ ] **L1. Internal dry run** — 5–10 friendly alumni (can overlap with G1)
  run the full journey on production from personal devices. Measure the B4
  p90 invite→first-action time; collect confusion points into the F5 FAQ.
  Fix blockers before any wave.
- [ ] **L2. Launch-week runbook** (`docs/runbooks/pilot-launch-week.md`) —
  wave schedule, who's watching Sentry and the outbox monitor and when, the
  worker restart procedure (A9), support triage (F5), rollback/pause criteria
  (e.g., invite emails landing in spam → pause waves), and the daily metric
  check (B5).
- [ ] **L3. Wave 1** — ambassadors' own classes plus seeded members' warm
  contacts (the smallest, warmest cohort). Watch activation and email
  deliverability for several days before proceeding.
- [ ] **L4. Waves 2+** — remaining roster per D3, with E4 subject-line
  variants; school amplification via E5 timed to the waves.

---

## Phase 5 — Pilot operation and measurement

*Runs for the 60–90-day pilot window (D3). Exit: the B6 report is delivered
and the paid conversation is scheduled.*

- [ ] **P1. Weekly scorecard readout** from B5 — track against B1 targets;
  share a short version with the school contact per the MOU.
- [ ] **P2. Weekly feedback loop** — talk to 2–3 members and one ambassador
  each week; log asks-that-got-no-response for manual rescue (personally
  nudge a likely helper — the concierge version of the unbuilt ask mediator).
- [ ] **P3. Mid-pilot checkpoint** with the school contact — course-correct
  invite waves, events, or ambassador focus against the scorecard.
- [ ] **P4. Collect outcome stories** through the shipped bilateral-consent
  outcome-share flow — these are the heart of the B6 report and the E2 deck
  for schools #2–#10.
- [ ] **P5. Deliver the board-ready report** (B6) and open the conversion
  conversation per differentiation.md pricing; capture the Chadwick
  International trigger (D11) if not yet fired.
- [ ] **P6. Post-pilot retro** — what the scorecard says, what members said,
  and the reprioritized backlog (post-launch backlog + deferred items A9/A12
  + Prototype specs) for the next phase.

---

## Dependency spine (the critical path)

```
D1 authorize cutover ──► A1 cutover ──► A4 Resend domain ──► Phase 1 exit test ─┐
D4 engage counsel ──► C1/C2 policy+terms ──► C5 consent wiring ─────────────────┤
D5 stakeholders ──► E2/E3 pitch ──► D7 meetings ──► D8 MOU ──► D9 roster ───────┼──► L1 dry run ──► L3 wave 1
B2/B3 instrumentation ──► B4 p90 check ──► B5 query pack ───────────────────────┤
G1 profiles ──► G2 helpers ──► G3 event ────────────────────────────────────────┘
```

Longest external lead times: counsel (C1–C4) and the Chadwick signature
(D7–D8). Both start in Phase 0 precisely because everything technical can
otherwise finish first and sit waiting.

---

## What is explicitly *not* pre-pilot work

- Ask mediator, conditional RSVP (Prototype specs — Phase 2 features)
- Admin analytics dashboard UI (the B5 query pack is the pilot's dashboard)
- Native mobile, social feed, fundraising, CRM features (roadmap guardrails)
- Publishing the pricing page (drafted in E6, shipped only when a paid
  conversation needs it)
- Enrichment monthly sweep, if A12 lands on "defer"
