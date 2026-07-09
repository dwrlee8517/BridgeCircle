# 0010 — Horizontal help and the warm-data flywheel

- **Status:** proposed
- **Date:** 2026-06-20
- **Decider:** Richard

## Context

BridgeCircle has grown three surfaces that read like separate products: a member
**ask/help** flow, **school communications** (events + announcements), and
**admin / member-data** tooling. A reframing review on 2026-06-20 (grounded in a
read of the current code and docs) found they are actually one system, and that
two framings are quietly working against the brand.

**1. Vertical help.** The ask flow is built around `advice` and `mentorship` —
both cast one person as the more-senior helper and the other as the recipient.
That raises the barrier exactly where the north star ("remove the barrier to
asking") wants it lowest:

- among same-cohort peers, where neither is the expert;
- for casual or reciprocal exchanges, where roles flip;
- for the high-value "a senior asks a junior about their specialty" direction
  (AI tooling, new-grad recruiting, campus culture) that no incumbent supports.

The verticality lives in **copy, matching signals, and settings** — not in the
schema, which is already role-neutral: `asks.helper_id` / `asks.asker_id`, plus
an existing `commitment` field (`few_exchanges` | `monthly_semester` |
`ongoing`).

**2. "Better than a CRM."** The admin goal — search people, keep data current,
ease migration from an existing CRM — pulls toward CRM feature-parity, which
(a) is unwinnable for a single engineer against Blackbaud / Salesforce, and
(b) violates the locked stance that BridgeCircle must not become "alumni
management software" or "a CRM" ([AGENTS.md](../../AGENTS.md),
[brand-strategy.md](../product/brand-strategy.md)).

**What already exists (assets, not gaps):**

- A role-neutral ask schema with a working two-sided buffer: de-personalized
  decline reasons (`at_capacity` / `not_my_area` / `not_now`), helper pause
  (`paused_at` / `paused_until`), and count-only standing asks (`open_asks`, one
  per member per org, 14-day TTL).
- Hybrid Ask matching ([0009](0009-hybrid-ask-matching.md)).
- A **self-maintaining enrichment engine** — LinkdAPI (onboarding/manual) +
  Bright Data monthly sweep + PDL fallback, with fingerprints, change proposals,
  freshness settings, and an audit trail (`profile_enrichment_settings`,
  `profile_enrichment_runs`). This is the moat, and it is largely built.
- Events (RSVP + waitlist), announcements (fan-out), and a home "school pulse"
  feed (`lib/home/getHomeFeed.ts`).

**What is missing or miscast:**

- **Help:** vertical copy/signals/settings; no helper-initiated "offer to help";
  no reverse/peer matching; the `commitment` axis is buried inside mentorship
  instead of being the primary distinction.
- **Admin:** no member search at all (`/admin/members` is a ~500-row dump); no
  freshness visibility despite the data existing; no roster import/export or CRM
  connector; no audited admin-correction path.
- **Comms:** zero engagement instrumentation (no reads, attendance, reminders) —
  a broadcast tower with no feedback loop.

## Decision

Treat BridgeCircle as **one member-first flywheel** and reframe the three
surfaces around it:

> School communications bring alumni back → engagement keeps profiles fresh
> (self-update + enrichment) → fresh data makes help-matching work → a good help
> moment deepens belonging → alumni stay engaged and open the next note. **The
> admin operates the flywheel; the member experiences it.**

The single, specific problem this solves, stated for both sides:

> A school's warm network is real but inert — the data rots, the alumni drift,
> and even when the right person is right there, asking feels too awkward to do.
> BridgeCircle keeps the circle alive and makes asking and helping effortless on
> both sides.

Four sub-decisions follow.

### D1 — Horizontal help: mentorship becomes a commitment tier, not an identity

- The primary axis is **commitment (quick ↔ ongoing)** — direction-neutral, not
  seniority. Surface the existing `commitment` field as that axis; `advice` /
  `mentorship` map to quick / ongoing during the transition.
- **Roles attach to a single exchange, never to a person.** No member is labeled
  "mentor" or "mentee" in product copy or on a profile.
- Add the **reverse and lateral** directions: matching must let a junior surface
  for a senior's ask (topic relevance beats seniority), and same-cohort "compare
  notes" must read as symmetric, not as help-from-above.
- Add a **helper-initiated "offer to help"** path — the supply side of the same
  object.
- **Preserve the buffer and the gating split from [0003](0003-friendship-mentorship-split.md):**
  friendship/DM stay two-sided (mutual accept); asks stay one-sided (helper
  opt-in). Capacity caps and pause survive — attached to the **ongoing** tier,
  for anyone, regardless of seniority.

### D2 — Admin is the flywheel's operator console, not a CRM; BridgeCircle is never the system of record

- Position as the warm, member-facing **activation layer on top of** the
  school's existing system of record. Pull the roster in (import / CRM
  connector), give members a reason to engage, and write fresh, consented data
  back. The school never rips out Raiser's Edge / Salesforce — **near-zero
  switching cost is the adoption wedge.**
- **"Better than a CRM" is redefined** as *living, consented, self-maintaining
  data + member-first warmth* — not feature parity. We win the one axis
  incumbents structurally cannot: their data rots because no member wants to be
  in it; ours stays fresh because members want to be in it.
- Member sovereignty (**import → suggest → confirm, never silent overwrite**) is
  preserved. Admin corrections are allowed only as *suggestions* or as *audited
  edits with member notification* — never silent.

### D3 — School communications are the return engine, and must be instrumented

- Add engagement signals (announcement reads, event reminders + attendance) so
  the loop has feedback and the admin can see what actually pulls alumni back.
- Surface the already-computed career/location moves as a consented "what's new
  with your circle" — living alumni news from data we already derive, **not a new
  CMS.**

### D4 — The defensible core is the data flywheel, not any single feature

Sequence work to protect the loop: nail **horizontal help fed by fresh data**
first; comms instrumentation and CRM import are accelerants, not the spine.

## Implementation plan

All schema work follows expand/contract ([0008](0008-deploy-ordering-expand-contract.md));
all business logic stays in `/lib` ([0007](0007-lib-discipline.md)); every new
peer interaction is checked for two-sided buffer symmetry; all new copy follows
[voice-guidelines.md](../product/voice-guidelines.md).

### Phase 0 — Language reframe (no schema; fully reversible) — *the brand spine*

| Task | Touchpoints |
|---|---|
| Purge "mentor/mentee" as role nouns in product copy + emails; keep the buffer copy verbatim | grep `mentor`/`mentee` across `app/src/app/(member)/**`, `app/src/notify/emails/**` (~600 hits, mostly mechanical) |
| Reframe helper opt-in from identity → state: "Open to quick questions" / "Open to ongoing help" | `app/src/app/(member)/mentorship/settings/settings-form.tsx`; redirect `/mentorship/settings` → `/help/settings` (308, per `next.config.ts` legacy-redirect pattern) |
| Lane-aware result headings: keep "who can help" for vertical; add symmetric "who's figuring out the same thing" for peer | `app/src/app/(member)/ask/page.tsx`, `ask-home.tsx` |
| Dual-sided profile presentation: "Can help with" + opt-in "Curious about" (soften, not "needs help with") | profile read/edit surfaces |

**Verify:** brand-voice pass on changed strings; `pnpm biome check . && pnpm lint && pnpm tsc --noEmit`. No migration.

### Phase 1 — Horizontal help mechanics (schema-light)

- Make **commitment** the visible axis. Asker picks quick vs ongoing lightly;
  the helper's availability state is the capacity gate. The composer split
  (advice 2-step / mentorship 5-step, #109) is **relabeled** quick/ongoing, not
  rebuilt. Touch: `app/src/app/(member)/ask/new/*-flow.tsx`,
  `app/src/lib/asks/schemas.ts`.
- **Reverse + peer matching:** topic relevance must outrank seniority so a junior
  surfaces for a senior's ask; add a "shared problem space" signal for lateral
  asks. Touch: `app/src/lib/asks/signals.ts`, retrieval/scoring per 0009.
- **"Offer to help" path:** surface open asks to candidate helpers and a
  lightweight "I can help with this" reach-out (the supply side / `/help`
  surface). Touch: `app/src/lib/asks/openAskSweep.ts`, new `/help` work.
- Keep caps + pause on the **ongoing** tier only.
- *(Expand/contract, later:)* rename `ask_type` enum values away from
  advice/mentorship once copy + matching have moved.

**Verify:** vitest on `signals.ts` and `createAsk` (reverse-direction fixtures);
matching eval fixtures show a junior surfacing for a senior ask.

### Phase 2 — Admin operator console

- **Member search + filter** on `/admin/members` (the blocking gap): server-side
  search over base/org profiles, reusing 0009's lower-level retrieval helpers;
  filter by name/employer/city/year/freshness; sort by completeness/staleness.
  New `lib/admin/searchMembers.ts`.
- **Freshness dashboard:** surface data that already exists
  (`profile_enrichment_settings.last_checked_at` / `last_enriched_at` /
  `consecutive_sweep_misses`, pending `profile_change_proposals`) — per-member
  drill-down + cohort health. New `lib/admin/freshnessReport.ts`.
- **Audited admin corrections:** admin suggests or edits with `audit_log` +
  member notification; never silent. Respects import → suggest → confirm.
- **Bulk freshness actions:** trigger a manual refresh on a cohort.

**Verify:** lib tests for member search + freshness report; `rls-auditor` pass
(admin-only); confirm no field-level privacy leak in admin reads.

### Phase 3 — Comms engagement loop (the flywheel's nutrient)

- **Event reminders** (T-24h / T-1h) to "going" RSVPs — Railway worker job.
- **Announcement read tracking** (`announcement_reads` table) + admin read-rate
  visibility.
- **Living alumni news:** surface the career/location moves `getHomeFeed`
  already computes as a consented "what's new with your circle" rail + digest.
- *(Optional, defer:)* announcement categories / pinning / scheduling.

**Verify:** worker-job tests; read-tracking lib tests; migration-reviewer +
rls-auditor on the new table.

### Phase 4 — CRM import / MCP wedge (when piloting a school that has an existing system)

- **Roster import** (CSV → full profile, not just invite) mapped to base/org
  profiles via import → suggest → confirm.
- **CRM connector / MCP:** read roster from Blackbaud / Salesforce NPSP /
  HubSpot; write fresh consented fields back. "Sit on top," system-of-record
  stays external. Provider-slot pattern mirrors `lib/enrichment/`.
- **Export** (data portability — trust table-stakes).

**Verify:** import-mapping tests with a dry-run mode; no silent overwrite.

### Cross-cutting / Not now

- **Cross-cutting:** expand/contract migrations; `/lib` discipline; RLS audits on
  every admin surface; brand voice on all copy; two-sided buffer on every new
  peer interaction.
- **Not now (costume, not spine):** Salesforce feature-parity, rich-media
  announcement CMS, engagement heatmaps, native mobile.

## Consequences

- **+** One coherent product story ("keep the circle alive; asking and helping
  are effortless"), replacing three feature piles.
- **+** Resolves the anti-CRM vs better-than-CRM contradiction permanently:
  we're the activation layer, not the system of record.
- **+** Unlocks reverse/peer help (senior↔junior, same-cohort) that no incumbent
  offers — a real differentiator.
- **+** Most of Phase 0–1 is copy and signal work over a schema that's already
  role-neutral; the enrichment moat is already built.
- **−** A real copy/migration surface: ~600 "mentor" references, an `ask_type`
  enum rename (deferred via expand/contract), and route redirects.
- **−** Partially reframes recently shipped work (the #109 composer split, the
  mentorship-named settings/route) — relabel, not rebuild, but still churn.
- **−** Admin tooling that looks CRM-ish (search, bulk actions, import/export)
  must be disciplined against scope creep by the "activation layer, not CRM"
  guardrail, or it drifts into the loss condition.
- **−** CRM connectors (Phase 4) add external-integration and auth surface.

## Alternatives considered

- **Keep vertical mentorship as the core identity.** Rejected — it raises the
  asking barrier for the majority of real interactions (peer, casual, reverse)
  and blocks the senior-asks-junior direction.
- **Become a better CRM (out-feature the incumbents).** Rejected — unwinnable
  for one engineer and it is the documented loss condition. We win on living
  data + warmth, not feature count.
- **Replace the school's system of record.** Rejected — high switching cost,
  scares buyers, and forces the CRM identity. Sitting on top is the lower-friction
  wedge.
- **Collapse asks, friendship, and DMs into one "connection."** Rejected — keeps
  [0003](0003-friendship-mentorship-split.md)'s gating split; the differentiated
  gates (one-sided ask opt-in vs two-sided friendship) are load-bearing for the
  buffer.
- **Build all three pillars to depth in parallel.** Rejected — single-engineer
  reality; protect the core loop first (D4).

## Companion doc updates required on acceptance

When this flips to `accepted`, keep docs in sync in the same change:

- [brand-strategy.md](../product/brand-strategy.md) — add admin-tier language
  (operator console ≠ CRM; "on top of the system of record"; "better than a CRM =
  living data, not feature parity").
- [feature-roadmap.md](../product/feature-roadmap.md) — demote mentorship to a
  commitment tier within help; add the flywheel framing and the phase sequence.
- [0003](0003-friendship-mentorship-split.md) — already annotated: amendment
  proposed here (mentorship → commitment tier; gating split preserved).
- [voice-guidelines.md](../product/voice-guidelines.md) — refresh the
  avoid/prefer table for the de-identified role language.
