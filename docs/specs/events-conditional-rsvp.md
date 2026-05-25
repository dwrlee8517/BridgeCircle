# Conditional RSVP — "I'll go if…"

**Status:** v1 draft · 2026-05-24
**Author:** _TBD_
**Maps to:** [feature-roadmap.md](../product/feature-roadmap.md) Phase 2 ("Make the circle feel alive")
**Brand fit:** [voice-guidelines.md §3](../product/voice-guidelines.md) — the embarrassed asker
**Companion specs:** [phase-1/spec.md](./phase-1/spec.md) (event RSVP base)

---

## Purpose

Members often skip events not because they aren't interested but because they don't know who will be there. "I won't know anyone" is the single largest silent decliner for alumni events.

"I'll go if…" lets a member RSVP with a private condition. The system matches conditions in the background. When a match exists, both members are notified and offered a chance to lock in their RSVP.

**Brand-fit thesis:** every product decision should lower the bar for the embarrassed asker. This feature operationalizes that promise for the moment between "interested in this event" and "I'll commit."

## North star

> Increase attendance by removing the social uncertainty that blocks RSVPs — not by pressure, public commitments, or surveillance, but by quietly noticing when the conditions a member named are already true.

## Decisions (locked in feature-design conversation, 2026-05-24)

| Decision | Choice |
| --- | --- |
| Default visibility | **Private.** Per-RSVP toggle to make public. |
| Match flow | **Notify and ask.** No auto-flip from conditional → going. |
| Match types in scope | **All three, sequenced:** v1.0 peer, v1.1 profile-filter, v1.2 help-need. |
| Input shape | **Free text + LLM extraction with confirm.** Member types naturally; system parses to structured condition; member confirms before save. |
| Deadlock handling | **Notify both together.** When mutual conditional dependency is detected, single joint notification. Either confirms → other auto-unblocked with a follow-up notification. |

---

## Match types (sequenced rollout)

### v1.0 — Peer / symmetric match

> "I'll go if my classmates are there."

Matches when another member writes a condition referring to the same peer dimension *and* the writer satisfies the other's condition.

Peer dimensions in scope for v1.0:

- class year (most common)
- school (for cross-circle events, later phases)
- current city
- friend graph (already-connected friends)

**Example:** Maren ('22, NYC) writes "I'll go if classmates are there." Iris ('22, NYC) writes the same. They match on `peer_dimension=class_year, peer_value=2022`.

### v1.1 — Profile-filter match

> "I'll go if there are people in software engineering."

Matches when another RSVPed member (conditional or confirmed) satisfies the filter, parsed from the member's profile fields.

Profile dimensions in scope for v1.1:

- profession (current_title, current_employer)
- industry (extracted from employer)
- university
- major
- city (overlap with peer)

**Example:** Maren writes "I'll go if there are people in software engineering." When Sam (current_title: "Staff Engineer at Stripe") RSVPs, Maren is notified.

### v1.2 — Help-need match

> "I'll go if there are people who want to learn software engineering."

Matches when another member RSVPs *and* declares they want help on the topic the writer can teach (or the reverse — a learner writes the condition and a helper RSVPs).

This is the most distinct type because both sides need to declare intent. Help-need conditions ride on top of the existing asks system: the topic vocabulary is the same as `helper_preferences.topics` and `asks.help_needed`.

**Example:** Maren writes "I'll go if there are people who want to learn software engineering — I'd love to help them." When Jordan ('25) RSVPs and has an open ask on `software-engineering`, Maren is notified.

---

## User flow (v1.0 peer-match)

1. Member opens an event detail page.
2. RSVP control shows four states: **Going · Maybe · I'll go if… · Skip**.
3. Member selects "I'll go if…"
4. Inline input appears, labeled: **What would make this a yes for you?**
5. Member types: *"I'll go if classmates are there"*
6. LLM extracts: `condition_type = peer`, `peer_dimension = class_year`, `peer_value = 2022`.
7. Confirm card appears:

   > **Got it.** We'll let you know if anyone else from the Class of 2022 says the same thing.
   >
   > ☐ Show your condition publicly on the RSVP list. (default: off)
   >
   > [Save] [Edit] [Cancel]

8. Member saves. RSVP status = `conditional`.
9. Later, a second member submits a matching condition.
10. Both receive an in-app + email notification (see §Notifications).
11. Either member opens the notification, sees the match, and confirms or declines.
12. Confirmation flips both RSVPs to `going` (each confirms their own).
13. If one declines, the other receives a calm follow-up: *"Iris decided not to go after all. Your RSVP is still conditional — we'll keep watching."*

## User flow (mutual deadlock)

Special case of v1.0. If Maren writes "I'll go if Iris is there" and Iris writes "I'll go if Maren is there" — neither condition can resolve without the other being committed first.

When the system detects this, both receive a single joint notification:

> **You're each waiting on the other.**
>
> You both said you'd go if the other was. Want to lock it in together?
>
> [I'm in] [Not this time]

Either tapping "I'm in" flips their own RSVP to `going` and triggers a follow-up to the other: *"Maren just confirmed she's going. Your turn — are you in?"*

This is also the resolution path when one side names a specific person and the other side's condition matches them implicitly (e.g., "I'll go if Iris is there" + "I'll go if classmates are there" from Iris).

---

## Notifications (voice-aligned)

All copy below complies with [voice-guidelines.md §9](../product/voice-guidelines.md) — reason-first, never demand, length ceilings respected, narrator = thoughtful alumni coordinator.

Per voice §10.2: even though there is matching logic underneath, the *condition* is the member's own statement, so the notification names what the member wrote, not what the algorithm decided. This is the cleanest possible transparency.

| Trigger | In-app title | Body |
| --- | --- | --- |
| Peer match found | A classmate just said the same. | Iris from the Class of 2022 said she'd go if classmates were there. So did you. Want to lock it in? |
| Profile-filter match found | A software engineer just RSVPed. | Sam works as a staff engineer at Stripe — the kind of person your condition was waiting on. |
| Help-need match found | Someone who wants to learn software engineering just RSVPed. | Jordan ('25) is hoping to learn — and you offered to help. They'd love to meet you there. |
| Mutual deadlock | You're each waiting on the other. | You both said you'd go if the other was. Want to lock it in together? |
| Confirmation (you confirmed) | You're in. | We let Iris know you confirmed. |
| Confirmation (other confirmed) | Iris is in. | She just confirmed. Your condition was met — want to lock in your RSVP? |
| Match withdrawn | Iris stepped back. | She decided not to go after all. Your RSVP is still conditional — we'll keep watching. |
| Condition unmatched, event approaching | Your condition wasn't met for the Class of '22 dinner. | No one else has matched yet. Want to go anyway, or skip? — fires 24h before event start. |

Email versions of each follow the existing Civic email templates ([app/src/notify/emails/](../../app/src/notify/emails/)) and respect the same voice ceilings (subject ≤50 chars, body 3–5 sentences).

---

## AI extraction (free-text → structured)

Reuse the existing `/lib/asks` LLM infrastructure ([app/src/lib/asks/](../../app/src/lib/asks/)). Add a new module: `/lib/events/extractCondition.ts`.

**Input:**
- Raw text from the member
- Member profile snapshot (class_year, current_city, current_title, current_employer, university, major)
- Event metadata (date, location, host org)

**Output:**
```ts
type ExtractedCondition = {
  condition_type: 'peer' | 'profile_filter' | 'help_need'
  peer?: { dimension: 'class_year' | 'school' | 'city' | 'friends'; value: string | number }
  profile?: { field: 'profession' | 'industry' | 'university' | 'major' | 'city'; value: string }
  help?: { topic: string; direction: 'offering' | 'seeking' }
  raw_text: string
  llm_confidence: number // 0..1
}
```

**Confirmation policy:**
- `llm_confidence ≥ 0.9` → show structured form preselected, member can edit
- `llm_confidence < 0.9` → show structured form blank with the LLM's guess as a draft suggestion ("Did you mean…?")
- Never save without explicit member confirm, regardless of confidence — matches the brand's "import, suggest, confirm" rule from [feature-roadmap.md Capability C](../product/feature-roadmap.md)

**AI voice disclosure** (per voice-guidelines.md §10.1): the confirm step shows the extracted condition clearly and labels it as the system's interpretation — e.g., *"We read this as: classmates from the Class of 2022."*

---

## Visibility model

- **Private (default).** Only the member and any matched members see the condition, and only inside the match notification. Never shown on the event page, RSVP list, or admin dashboard except in aggregate.
- **Public.** Member opts in per RSVP. Condition shows on the public RSVP list in **structured form only** — never the raw text. Example: "Going if classmates from '22 are there" — but **not** verbatim user input.
- Visibility is a per-RSVP setting, not a per-member setting. A member can be private on one event and public on another.

**Why structured-only for public display:** the raw free-text can be revealing or expose social discomfort the member didn't intend to share publicly. Sanitizing through the structured representation removes that risk.

---

## Schema (additive — does not break existing events tables)

```sql
-- new enum value
alter type event_rsvp_status add value 'conditional';

create table event_rsvp_conditions (
  id uuid primary key default gen_random_uuid(),
  event_rsvp_id uuid not null references event_rsvps(id) on delete cascade,
  raw_text text not null,
  condition_type text not null check (condition_type in ('peer', 'profile_filter', 'help_need')),
  structured_condition jsonb not null,
  llm_confidence numeric(3,2),
  is_public boolean not null default false,
  status text not null default 'unmatched' check (status in ('unmatched', 'matched', 'confirmed', 'withdrawn', 'expired')),
  created_at timestamptz not null default now(),
  matched_at timestamptz,
  resolved_at timestamptz,
  unique (event_rsvp_id)  -- one condition per RSVP
);

create table event_rsvp_condition_matches (
  id uuid primary key default gen_random_uuid(),
  condition_a_id uuid not null references event_rsvp_conditions(id) on delete cascade,
  condition_b_id uuid not null references event_rsvp_conditions(id) on delete cascade,
  match_type text not null check (match_type in ('peer', 'profile_filter', 'help_need', 'mutual_deadlock')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  check (condition_a_id < condition_b_id)  -- canonicalize pair direction
);

create index on event_rsvp_conditions (event_rsvp_id);
create index on event_rsvp_conditions (status);
create index on event_rsvp_condition_matches (condition_a_id);
create index on event_rsvp_condition_matches (condition_b_id);
```

RLS policies follow the existing event_rsvps pattern: a member can read/write their own conditions; admins for the event's org can read aggregate stats; matched-pair counterparts can read the matched condition's structured form (not raw text) for notification rendering.

---

## Matching engine

Two trigger paths, both running through `/lib/events/matchConditions.ts`:

1. **On-RSVP trigger.** When a new condition is saved, immediately scan unmatched conditions on the same event for compatibility. Sub-100ms target.
2. **Post-RSVP trigger.** When any RSVP (conditional or confirmed) is added to an event, scan existing conditional RSVPs whose conditions the new RSVP might satisfy. e.g., a confirmed Sam-the-SWE RSVP triggers a scan for profile_filter conditions wanting SWEs.

Matching logic stays bounded — no embeddings, no LLM-at-match-time. Structured-to-structured comparison only. This is consistent with the [feature-roadmap.md maintainability principles](../product/feature-roadmap.md): "structured profile data, explicit permission checks, bounded recommendation types."

---

## Edge cases

| Case | Handling |
| --- | --- |
| Member changes their condition | Re-run extraction; recompute matches. Old match notifications stand if already sent. |
| Member changes their RSVP to "Not going" | Condition status → `withdrawn`. Notify any matched counterparts: *"Maren stepped back."* |
| Event is cancelled | All conditions → `expired`. No match notifications fire. |
| Multiple conditions per RSVP | **v1: not supported.** One condition per RSVP. Future v2 question. |
| Negative conditions ("I'll go if it's *not* crowded") | **v1: not supported.** LLM extractor flags as out-of-scope and asks for a positive rephrase. |
| Member tries to set conditional after event start | RSVP form hides the option once event has started. |
| Same condition resubmitted (spam attempt) | Unique constraint on `event_rsvp_id` prevents duplicates per member per event. |
| Help-need direction confusion (offering vs seeking) | LLM extracts direction; confirm step makes it explicit ("You're offering to help with software engineering — yes?"). |
| Condition expires unmatched | 24h before event start, send the unmatched-but-event-approaching notification. After event start, status → `expired`. |
| Match found, both notified, neither confirms | Both stay conditional. If another match appears, both get a new notification. Inertia is acceptable. |
| Member confirms, counterpart is offline | Counterpart sees match notification next session. Their RSVP stays conditional until they confirm. |
| Profile-filter match: multiple SWEs RSVP | Single batched notification, daily digest at most. Avoid spam: *"3 software engineers are now RSVPed."* |

---

## Out of scope (v1)

- Multiple simultaneous conditions per RSVP
- Negative / limiting conditions
- Cross-event matching (a SWE RSVP on event A satisfies a condition on event B)
- Inviting non-attendees who would satisfy outstanding conditions
- Admin nudges based on condition aggregates ("send invite to alumni who'd unlock 5 conditional RSVPs")
- Sponsored boost on conditional RSVPs

These are recorded for the post-launch backlog; do not let them creep into v1.

---

## Success metrics

| Metric | Definition |
| --- | --- |
| **Conditional RSVP rate** | Conditional RSVPs / total RSVPs per event. Target: ≥15% in pilot. |
| **Match rate** | Conditional RSVPs that find a match before event start / total conditional RSVPs. Target: ≥40% v1.0, ≥60% with v1.1 profile-filter. |
| **Confirmation rate** | Matched conditional RSVPs that flip to `going` / total matched. Target: ≥70%. |
| **Attendance lift** | Attendance rate of members who used conditional RSVP vs members who RSVPed `going` directly. Hypothesis: equal or better. |
| **Public opt-in rate** | Conditional RSVPs marked public / total conditional. Diagnostic only — informs whether the public option is useful. |
| **LLM extraction accuracy** | Member-confirmed extractions / total extractions. Target: ≥85%. |
| **Time to match** | Median minutes from condition save → first match notification. Diagnostic. |
| **Withdrawal cascade rate** | When one match withdraws, % of counterparts who also withdraw. High rate = the social anchor is real; low rate = inertia. Diagnostic. |

---

## Risks

1. **LLM misextraction.** Member writes one thing, system saves another, member gets the wrong notification. *Mitigation:* visible structured form on confirm; never auto-save below 0.9 confidence; allow free re-edit.
2. **Surveillance feel.** "We noticed you'd go if classmates were there" lands as creepy. *Mitigation:* notification is voiced as a peer event ("Iris just said the same"), not an algorithm event ("your condition matched"). Per voice §10.2.
3. **Disappointment.** Condition never matches; member sees the unmatched-but-event-approaching notification as a downer. *Mitigation:* phrase warmly with a soft alternative; don't repeat — single notice 24h out.
4. **Deadlock-of-deadlocks.** 5 members each waiting on one of the others. *Mitigation:* matching engine recognizes connected components in the wait graph; sends a single "you're all waiting on each other — want to lock it in together?" notification to the whole cluster.
5. **Privacy leakage on public conditions.** Raw text might be revealing. *Mitigation:* public display always shows the structured form, never raw text.
6. **Spam / abuse.** Member creates many fake events or RSVPs to harvest contact patterns. *Mitigation:* unique constraint, rate limit on extractions per member per day, requires verified membership (already gated).

---

## Implementation cut for v1.0 (peer-match only)

| Layer | Work |
| --- | --- |
| Schema | One migration: new enum value, two tables, RLS policies. ~80 lines SQL. |
| LLM | `lib/events/extractCondition.ts` with prompt template + zod schema. Reuse Haiku. |
| Matching | `lib/events/matchConditions.ts` — pure function, structured-to-structured, no LLM. |
| API | Two new server actions: `submitConditionAction`, `confirmMatchAction`. Wired through existing event RSVP route. |
| Background | Post-RSVP trigger via existing Railway worker pattern. |
| Notifications | Extend `lib/notifications/` with `condition_match` and `condition_unmatched_expiring` types. |
| Emails | Four templates: `condition-match`, `mutual-deadlock`, `match-withdrawn`, `condition-expiring`. Civic style. |
| UI | RSVP control gains 4th option ("I'll go if…"); confirm card; per-RSVP visibility toggle; match notification card in `/inbox`; event-detail badge for public conditions. |
| Tests | Unit tests for extraction, matching, deadlock detection. Vitest. |

**Effort estimate:** ~2 weeks for one engineer, including the migration safety pass and pilot copy review.

---

## Open questions

- Who owns the LLM prompt — product + engineering shared, or engineering alone with a copy review?
- Anti-abuse: require N completed RSVPs before unlocking conditional? Or trust verified membership and skip the gate?
- Notification cadence: when multiple matches accumulate fast (profile-filter on a high-density event), digest daily or send each? v1.0 peer-match probably one notification per match; v1.1 needs digesting.
- Help-need topic vocabulary: reuse `helper_preferences.topics` verbatim, or expand?
- Cross-org events (Bridge Programs, [feature-roadmap.md §G](../product/feature-roadmap.md)): does conditional RSVP work across circles, or stay within the host circle?
- Mobile timing: this is a notification-heavy feature; does it accelerate native mobile (currently out of scope for Phase 1)?

---

## Changelog

- **2026-05-24 — v1 draft.** Locked decisions from feature-design conversation. Sequenced v1.0 peer / v1.1 profile-filter / v1.2 help-need rollout. Schema, matching engine, notifications, edge cases, and success metrics defined. v1.0 implementation cut estimated at 2 weeks.
