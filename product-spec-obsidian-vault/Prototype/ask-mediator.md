# Ask Mediator — "Let BridgeCircle ask for you"

**Status:** v1 draft · 2026-05-24
**Author:** _TBD_
**Maps to:** [feature-roadmap.md](../../docs/product/feature-roadmap.md) Capability B (AI-assisted request writing) — mediator mode extends Capability B with a non-direct send path
**Brand fit:** [voice-guidelines.md §3](../../docs/product/voice-guidelines.md) — the embarrassed asker; [voice-guidelines.md §10](../../docs/product/voice-guidelines.md) — AI voice rules
**Companion specs:** [phase-1/spec.md](../Production/phase-1/spec.md) (ask base), [events-conditional-rsvp.md](./events-conditional-rsvp.md) (sibling Phase 2 feature)

---

## Purpose

The existing /ask guided composer ([composer.tsx](<../../app/src/app/(member)/ask/new/composer.tsx>) / [chat-composer.tsx](<../../app/src/app/(member)/ask/new/chat-composer.tsx>)) helps a member organize their thoughts and drafts a message to a chosen helper. Today the only send path is direct — the member edits and sends the draft themselves.

The mediator mode adds a second send path: **"Let BridgeCircle ask for you."** When chosen, BridgeCircle reaches out on the member's behalf, in the coordinator's institutional voice, to a sequence of potential helpers. Helpers accept or decline. When one accepts, the member is notified and the conversation begins.

**Why this matters — both sides:** the mediator lowers the psychological barrier on *both* ends of the ask, and that symmetry is the point.

- **For the asker.** The existing direct-send path leaves the member as the one facing a non-response or rejection. For the embarrassed asker — the priority reader — the moment of clicking Send is often the moment they back out. Letting BridgeCircle be the one to ask removes that exact moment.
- **For the helper.** Declining a direct peer message carries social weight ("am I being rude?"). Declining a BridgeCircle-mediated approach does not — it goes to the coordinator, not to the asker. Lower-cost declines mean helpers stay *open* to being approached, instead of quietly avoiding the inbox to dodge guilt.

The mediator isn't just an asker-side buffer. It's a two-sided one. BridgeCircle absorbs the awkward moment for both, which is how the network gets to stay a network — instead of a stack of asks no one wanted to send and declines no one wanted to write.

## North star

> Lower the psychological barrier on both sides. The asker is buffered from rejection; the helper is buffered from the guilt of saying no to a peer. BridgeCircle holds the awkward moment for both — and the network stays warm because of it.

## Decisions (locked in feature-design conversation, 2026-05-24)

| Decision | Choice |
| --- | --- |
| AI identity | **Unnamed.** Surface label is "Ask BridgeCircle." No persona name, no character. Preserves [brand-strategy.md](../../docs/product/brand-strategy.md) "AI as quiet helper, not main character." |
| Mediator voice | **BridgeCircle coordinator voice.** The institutional narrator from [voice-guidelines.md §2](../../docs/product/voice-guidelines.md) is the sender. Mentor knows it's mediated. Member is clearly named. |
| Disclosure | **Always disclose, with a small badge.** Every AI-touched send carries a visible "Sent with BridgeCircle" or "AI-assisted draft, reviewed by Maren" line. Matches [voice-guidelines.md §10.1](../../docs/product/voice-guidelines.md). |
| Surface scope | **Extend existing /ask guided composer.** The draft step adds a third send option ("Let BridgeCircle ask for you") alongside the existing direct-send. Reuses all existing thought-organization + drafting logic. |

---

## User flow

### The mediator path

1. Member completes the guided flow up through the draft step.
2. At the bottom of Compose, the member sees three buttons:
   - **Send directly** (current default — sends the draft now)
   - **Let BridgeCircle ask for you** (new — mediator mode)
   - **Save as draft**
3. Member picks "Let BridgeCircle ask for you."
4. A confirmation card appears:

   > **BridgeCircle will reach out for you.**
   >
   > We'll start with Jane — she's the closest fit. If she's not available, we'll try the next person, one at a time. We'll let you know who replies.
   >
   > **What Jane will see:**
   >
   > > Hi Jane, BridgeCircle here. Maren ('22, Brooklyn) is looking for advice on moving from consulting into product. Would you be open to a 20-minute chat with her?
   >
   > Your full draft is saved. We'll show it to whoever accepts so you can edit before sending.
   >
   > [Yes, ask for me]   [Send it myself instead]

5. Member confirms. Ask status → `mediated_pending`. Helper #1 (Jane) is approached.
6. Jane receives an in-app + email notification (see §Notifications):
   > **A Class of '22 alum is hoping you can help.**
   >
   > Maren ('22, Brooklyn) is looking for advice on moving from consulting to product. Would you be open to a 20-minute chat?
   >
   > [I'm in] [Not this time] [Suggest someone else]
7. **If Jane says "I'm in":**
   - Maren is notified: *"Jane said yes — she's open to helping. Want to send your message?"*
   - Maren opens the notification; her draft is shown for final edit.
   - Maren sends. A conversation thread opens. Jane sees Maren's message in her inbox.
   - The thread carries a small persistent "BridgeCircle introduced you" badge so neither side is confused about how they connected.
8. **If Jane says "Not this time":**
   - Maren is **not** notified of Jane's decline (no shame propagation).
   - System silently moves to helper #2. The 48h clock resets.
9. **If Jane says "Suggest someone else":**
   - Optional small picker for Jane to name an alum she thinks would fit better.
   - The suggested alum is added to the candidate queue, but not skipped to the front (preserves ranking).
10. **If Jane doesn't respond within 48 hours:**
    - System silently moves to helper #2.
    - Jane is *not* sent a follow-up nudge for this specific ask (single notification, respect time).
11. **Member status updates during the search:**
    - Every 72h while still searching: *"We've reached out to a few people. Waiting to hear back."*
    - Never names who has been approached or who declined.
12. **If the first 3 candidates all decline or don't respond:**
    - Maren is notified: *"We've reached out to a few people without finding a match. Want to send directly to someone instead, or wait a few more days?"*
    - Falls back to direct-send mode if Maren prefers.

### Sequential vs parallel approach

**v1 default: sequential.** One helper at a time, 48-hour silent timeout, then next.

**Reasoning:**
- Avoids the "two mentors said yes" coordination problem (member would have to politely decline one — the exact awkwardness this feature is meant to remove)
- Respects mentor time — no mentor sees an ask another mentor is already considering
- Matches the brand's calmness — no race, no urgency
- Slower than parallel, but the member is kept informed and can fall back to direct-send any time

**Parallel mode considered for v1.1:** for high-density circles where sequential could leave the member waiting more than a week. Would require explicit "two said yes — pick one" UX, which is a different design problem.

---

## Helper experience in mediator mode

The helper notification (app + email) is **clearly mediated** — the sender is BridgeCircle, the asker is named, and the context is provided. The helper sees one of two framings, depending on whether they're already a confirmed open helper or being approached cold:

### For an open helper (`open_to_advice` or `open_to_mentorship` is true)

> **A Class of '22 alum is hoping you can help.**
>
> Maren ('22, Brooklyn) is looking for advice on moving from consulting to product. She specifically wanted to talk to someone who has done a similar move.
>
> Would you be open to a 20-minute chat with her?
>
> [I'm in]   [Not this time]   [Suggest someone else]

### For a member who hasn't opted in as a helper

> **A Class of '22 alum is hoping someone like you could help.**
>
> Maren ('22, Brooklyn) is looking for advice on moving from consulting to product. Your background looks like a fit. You're not currently listed as open to advising — would you like to help this one time?
>
> [Yes, this time] [Open up to advising] [Not for me]

**Why differentiate:** the non-helper version is a higher-friction ask (we're asking them to break their current setting). The voice acknowledges this so the member doesn't feel pressured into a permanent commitment.

### Helper protections

- Declining is **never surfaced to the asker.** Maren only ever hears about who said yes.
- Capacity caps on `helper_preferences` still apply. A mentor at capacity is not approached.
- A mentor who declines an ask is dampened for that asker (no future mediator approaches from the same member for 30 days).
- Repeated declines on a topic (≥3 in 90 days) prompt: *"Would you like to remove [topic] from your topics?"* — never silently.
- Mentor inactivity auto-pause (existing 14-day rule) applies — paused mentors are skipped.

---

## Notifications (voice-aligned)

All copy below complies with [voice-guidelines.md §9](../../docs/product/voice-guidelines.md). Length ceilings respected. Narrator = BridgeCircle coordinator. The mediator notifications are the strongest example of the coordinator's voice in the product — they should be drafted with care and treated as canonical examples for future writers.

| Trigger | Sender | Title | Body |
| --- | --- | --- | --- |
| Mediator approaches helper (open helper) | BridgeCircle | A Class of '22 alum is hoping you can help. | Maren ('22, Brooklyn) is looking for advice on moving from consulting to product. Would you be open to a 20-minute chat? |
| Mediator approaches helper (not yet a helper) | BridgeCircle | A Class of '22 alum is hoping someone like you could help. | Maren ('22, Brooklyn) is looking for advice on moving from consulting to product. Your background looks like a fit. Want to help this one time? |
| Helper accepts → notify asker | BridgeCircle | Jane said yes. | She's open to helping. Want to send your message? |
| Helper declines → asker silent (no notification) | — | — | — |
| Periodic asker update | BridgeCircle | Still looking for a match. | We've reached out to a few people. Waiting to hear back — we'll let you know. |
| Search exhausted | BridgeCircle | We didn't find a match this time. | A few people weren't available. Want to send directly to someone instead, or wait a few more days? |
| Asker sends → notify helper | Member (Maren) | New message from Maren. | (Standard ask body; thread carries the "BridgeCircle introduced you" badge.) |
| Mediator opened a draft for asker | BridgeCircle | Your draft is ready to send. | Jane is open to helping. We saved your draft from earlier — edit if you want, then send. |

Email versions follow the existing Civic email templates at [app/src/notify/emails/](../../app/src/notify/emails/) and respect the same length ceilings.

---

## The disclosure badge

Every surface where AI was involved carries a small, consistent disclosure label.

| Surface | Badge |
| --- | --- |
| Helper notification (mediator-sent) | `Sent with BridgeCircle on Maren's behalf` |
| Conversation thread, persistent | `BridgeCircle introduced you · May 24` |
| AI-drafted message in compose | `AI-assisted draft — review before sending` |
| Asker confirmation card | `BridgeCircle will reach out on your behalf` |

Badges are visual elements, not body copy — small, muted, persistent. Designed so neither side wonders later "wait, was this AI?" — the answer is always one glance away.

This applies to **direct-send** as well: any draft created by the AI carries the "AI-assisted draft" label until the member sends. After send, the label persists in the thread (so the helper knows the opening message had AI help, even if subsequent replies didn't).

---

## Schema (additive)

```sql
-- new enum values on the existing asks status
alter type ask_status add value 'mediated_pending';
alter type ask_status add value 'mediated_matched';
alter type ask_status add value 'mediated_failed';

-- existing asks table gets a send_mode column
alter table asks add column send_mode text not null default 'direct'
  check (send_mode in ('direct', 'mediated'));

-- track each mediator attempt
create table ask_mediator_attempts (
  id uuid primary key default gen_random_uuid(),
  ask_id uuid not null references asks(id) on delete cascade,
  approached_user_id uuid not null references users(id),
  approached_at timestamptz not null default now(),
  response text check (response in ('accepted', 'declined', 'suggested_other', 'timed_out')),
  responded_at timestamptz,
  suggested_user_id uuid references users(id),
  rank_in_queue integer not null,
  helper_was_open boolean not null  -- snapshot of helper_preferences at approach time
);

create index on ask_mediator_attempts (ask_id);
create index on ask_mediator_attempts (approached_user_id, responded_at);
create unique index on ask_mediator_attempts (ask_id, approached_user_id);
```

RLS:
- Member can read their own ask's mediator_attempts (aggregate only — no decline names surfaced to asker via API)
- Approached helper can read their own attempt row
- Admins for the org can read aggregate stats for analytics

---

## AI involvement (and where it is not)

Reusing existing infrastructure where possible. New work scoped tight.

| Step | AI? | Source |
| --- | --- | --- |
| Organize member's thoughts | Yes | Existing guided composer ([app/src/app/(member)/ask/new/](<../../app/src/app/(member)/ask/new/>)) |
| Find right helper | Yes | Existing ranking ([app/src/lib/asks/](../../app/src/lib/asks/)) |
| Draft outgoing message (for direct or mediated) | Yes | Existing `/api/asks/draft` |
| Generate mediator outreach copy | Yes (templated) | New: `/lib/asks/mediator/composeOutreach.ts` |
| Decide whether helper is good fit before approaching | No | Pure ranking + structured filters (capacity, opt-in, topic match) |
| Decide when to escalate (timeout, next candidate) | No | Pure timer + structured queue |
| Decide when to surface "search exhausted" | No | Configured threshold (3 declines or 7 days) |

**Bounded LLM use** matches [feature-roadmap.md Maintainability Principles](../../docs/product/feature-roadmap.md): the LLM writes copy, never makes routing decisions.

### Mediator outreach copy generation

The outreach copy template combines:

- Helper's name and (if known) one piece of relevant context ("you've helped a few people with this in the past")
- Member's first name, class year, current city
- Member's structured ask context (ask type + situation/goal summary, never the raw draft)
- A bounded request ("20-minute chat") — never open-ended

The LLM fills the template variables and tunes for the specific helper (e.g., adjusts formality based on helper's profile freshness signals). The structure is fixed; only the wording varies.

---

## Edge cases

| Case | Handling |
| --- | --- |
| Member withdraws the ask mid-flight | Status → `withdrawn`. Any in-flight helper approach is cancelled. If the helper had already accepted, they get a calm notification: *"Maren withdrew the request. Thanks for being open."* |
| Helper says yes but member doesn't respond within 7 days | Helper notified: *"Maren hasn't replied yet. We'll keep the introduction open for another 7 days, then close it."* After 14 days total, status → `mediated_failed`. |
| Helper says yes, member sends, helper goes silent | Standard ask-reply flow; mediator's job ends at introduction. Member can use existing nudge tooling. |
| Network has no candidates | Member notified immediately: *"We don't have a good match in your circle yet. Want to save the question for when more alumni join, or send directly to someone you've found?"* |
| Helper marked as paused (auto-pause from inactivity) | Skipped in queue. No notification to helper. |
| Helper marked at capacity | Skipped. Capacity is per-type (advice vs mentorship); a capacity-full mentor may still get an advice ask. |
| Member opens multiple mediated asks in parallel | Rate limit: 3 active mediated asks per member at once. Excess goes to direct-send only. |
| Two askers approach the same helper near-simultaneously | Both go through; helper sees two notifications, makes independent decisions. The mediator does not batch or hide. |
| Helper accepts; member's draft is now stale (sent days later) | Member sees a small note above the draft: *"This is your draft from May 24. Want to refresh it before sending?"* |
| Helper suggests someone else who doesn't exist on the platform | Out of scope for v1 (no off-platform invite via suggestion). The suggestion is logged for admin review. |
| Cross-circle mediator (Bridge Programs context) | Out of scope for v1. Mediator stays inside the asker's own org. |

---

## Out of scope (v1)

- Parallel approach (top 3 in parallel)
- Voice or audio mediator interface
- AI-drafted reply suggestions (after the conversation starts)
- Automated scheduling after acceptance
- Cross-circle mediator beyond own org
- Multi-helper group introductions
- Off-platform helper suggestions (helper recommending someone not on BridgeCircle)
- Mediator-initiated follow-ups (the conversation is the member's responsibility after introduction)

---

## Success metrics

| Metric | Definition | Target |
| --- | --- | --- |
| **Mediator opt-in rate** | Mediated asks / total asks initiated | 25-40% (diagnostic of "ask feels hard") |
| **Helper accept rate (mediated)** | Helpers accepting / helpers approached | ≥35% |
| **Helper accept rate (direct, comparison)** | Existing direct-ask helper response rate | Track for delta — mediator should match or beat |
| **Time to first match** | Median time from mediator initiation → helper accepts | ≤72h |
| **Search success rate** | Mediated asks reaching `mediated_matched` / total mediated | ≥60% |
| **Asker-to-helper message rate** | After match, members who send within 7 days | ≥80% |
| **Conversation continuation rate** | Threads with ≥3 back-and-forth messages | ≥40% |
| **Mediator → direct fallback rate** | Members who fall back to direct after exhausted search | Diagnostic — too high signals network density problem, not feature problem |
| **Helper sentiment** | Post-acceptance brief survey: "Did the framing feel respectful?" | ≥4.5/5 |
| **AI badge recognition** | User research check: do members and helpers know the AI was involved? | ≥90% recall |

---

## Risks

1. **AI-mediated outreach feels like spam to mentors.** A helper who gets several BridgeCircle-mediated notifications a week may start ignoring them. *Mitigation:* cap of one mediated approach per helper per 7 days; capacity caps respected; clear sender (institutional voice, not member-impersonating).

2. **Mentors distrust ALL asks once mediator exists.** Even direct-sent asks might be assumed AI-written. *Mitigation:* disclosure badge applies to direct AI-drafted sends too; mentors learn to trust the badge as honest signal.

   *Counter-effect to monitor:* the opposite outcome is also plausible and arguably more likely — mediated asks make declining low-cost, which keeps helpers *open* to being approached. The hypothesis is that helper-side engagement goes **up**, not down, because the guilt-to-decline drops. Track helper accept rate, helper opt-out rate, and helper-pause rate against the pre-mediator baseline. If helper engagement holds or improves, this risk has inverted into a strength.

3. **Members lean on mediator forever and never learn to ask directly.** The barrier is lowered too far. *Mitigation:* track per-member mediator rate; if a member uses mediator on >90% of asks over time, surface a soft nudge: *"You've used BridgeCircle to ask for the last several. Want to try sending one yourself this time?"*

4. **Member context leaks** — the LLM summary in the outreach exposes more than the member intended. *Mitigation:* the outreach copy uses only structured fields the member explicitly entered or confirmed; never the raw text. Member sees the exact outreach copy in the confirm step before approving.

5. **Helper accepts then ghosts.** Member feels stood up — *worse* than not getting a match in the first place. *Mitigation:* 7-day silent reminder to helper; if no reply, mediator silently re-engages search. Member is not told it was a ghost vs a withdrawal.

6. **Voice fragmentation across direct + mediated.** Two parallel send paths with different voices in the conversation could feel disjointed. *Mitigation:* once the introduction is made, the thread is single-voiced (member's voice); BridgeCircle's involvement is reduced to the persistent badge.

7. **Brand thesis drift toward "concierge service."** If mediator becomes the default path, BridgeCircle stops being a peer network and becomes a brokerage. *Mitigation:* direct-send stays the default; mediator is positioned as the alternative for harder asks. Monitor the mediator opt-in rate; flag if it exceeds 50%.

---

## Implementation cut for v1

| Layer | Work |
| --- | --- |
| Schema | One migration: enum extension, `send_mode` column on `asks`, `ask_mediator_attempts` table, RLS. ~60 lines SQL. |
| LLM | `lib/asks/mediator/composeOutreach.ts` — new template + prompt. Reuses Haiku. |
| Matching | Reuses existing helper-ranking from `lib/asks/`. New: queue manager (`lib/asks/mediator/queue.ts`) that walks ranked candidates with timeout + dampening logic. |
| API | Two new server actions: `initiateMediatedAskAction`, `respondToMediatorAction`. Both go through `/lib/asks/mediator/`. |
| Background | Existing Railway worker pattern; new job: `processMediatorTimeouts` (runs hourly, advances queues past 48h-stale approaches). |
| Notifications | Extend `lib/notifications/` with `mediator_approach`, `mediator_accepted`, `mediator_search_exhausted`, `mediator_periodic_update` types. |
| Emails | Five new templates: `mediator-approach-open-helper`, `mediator-approach-cold`, `mediator-accepted-to-asker`, `mediator-search-exhausted`, `mediator-helper-reminder`. Civic style. |
| UI | Wizard Compose step gains the three-button choice; new confirmation card; mediator-status card in `/inbox`; conversation-thread badge component (`<IntroducedBadge>`); reusable `<AIDraftBadge>` per audit recommendation. |
| Tests | Vitest for queue advancement, timeout, dampening, RLS on attempts table. |

**Effort estimate:** ~3 weeks for one engineer, including the migration safety pass, the new email templates, and pilot copy review with a real helper.

This is bigger than the conditional-RSVP spec (~2 weeks) because of: the queue manager, the helper-protection logic (capacity, dampening, cold-vs-open differentiation), and five email templates.

---

## Open questions

- **Helper notification fatigue threshold.** Currently capped at one mediated approach per helper per 7 days. Should this be lower (3 days) or higher (14 days)? Pilot data will tell.
- **"Suggest someone else" follow-through.** When a helper suggests another alum, do we approach that alum in the same mediated flow, or just log it as a hint for the next round? v1 defaults to log-only.
- **Confidence threshold for cold approaches.** Approaching a non-helper is a higher-friction ask. Should there be a confidence floor (e.g., ranking-score ≥ 0.85) before the system is willing to cold-approach? Pilot dependent.
- **Member-side fall-through opt-out.** When search is exhausted, currently we offer direct-send fallback. Should we also offer "extend search to other circles" once Bridge Programs lands?
- **Multi-language mediator copy.** Existing English-only copy; bilingual pilots (Korean) need the mediator outreach reviewed by a native co-writer before shipping. Same gate as [voice-guidelines.md §17 open questions](../../docs/product/voice-guidelines.md).
- **Conversation handoff.** After introduction, BridgeCircle's involvement ends — but should it offer a single "everything okay?" nudge to the member 7 days after the introduction, to surface ghosting or stalled conversations? v1: no, keep clean handoff.
- **AI persona naming (deferred, 2026-05-25).** Held at "unnamed / institutional voice" for now. Revisit triggers: a clear memorability gap in user feedback, members reporting the AI feels machine-y rather than human, or warmth complaints the institutional voice can't fix with copy alone. If revisited, the mediator's helper-side outreach should likely stay institutional regardless — name the composer's thought-organizing helper instead.

---

## Changelog

- **2026-05-24 — v1 draft.** Locked decisions from feature-design conversation. Mediator scoped as an extension of the existing /ask wizard with a third send option. Sequential approach with 48h silent timeout, fall-back to direct-send after 3 candidates exhausted. Schema additive (one migration). 3-week v1 implementation estimate.
