---
id: event-composer-v2/05-announce-to-audience
initiative: "[[Initiatives/event-composer-v2/plan|Event composer v2]]"
status: ready
depends_on: [03]
pr:
---

# 05 — Announce: faceted audience + capped invites

## Cold start

Publishing an event notifies **nobody** today — the only event notification
kinds are `event_changed` / `event_cancelled` / `event_reminder` /
`event_waitlist_spot_opened` (`app/src/lib/notifications/types.ts`), all
scoped to existing RSVPs. This task adds the announce path: after publish, an
admin composes an audience from facets (everyone / class-year range / city /
helper topic) with a **live recipient count**, optionally adds up to 10
specific members ("invite"), and sends once. Non-obvious parts: fan-out must go
through the existing outbox pattern (`app/src/db/repositories/outbox.ts`,
`run-outbox-worker.ts`) so a 1,200-member send doesn't run in a request; a new
notification kind means touching the in-app feed renderer AND the email
templates under `app/src/notify/emails/`; and recipient counting must reuse the
same predicate as the send (one SQL function, two callers) or the count will
lie. Voice: the invite variant is a socially warm moment — write copy against
`voice-guidelines.md` and frame it two-sided ("Amy thought this might be
relevant", easy to ignore, no read receipts), not "you were selected."

## Scope

**In:**
- Migration: `event_announcements` table (event_id, audience jsonb, sent_by,
  sent_at, recipient_count; unique on event_id — once per event), a
  `count_event_audience_v2` + `announce_event_v2` RPC pair sharing one
  predicate; notification kinds `event_announced` and `event_invited`.
- Outbox fan-out job honoring notification preferences (check
  `help-preferences-form.tsx` / settings for the existing preference shape;
  add an events channel toggle if none fits).
- Admin UI: an Announce panel on the event edit page (published, not yet
  announced): facet pickers, live count (debounced server call), capped
  member-search invite list, confirm dialog stating the count.
- In-app notification rendering + one email template each for announce/invite.
- Emails follow the existing Resend + outbox delivery path.

**Out:**
- Re-announce / follow-up sends (unique constraint enforces once; revisit on
  real demand).
- Reminder-scheduling changes (`event_reminder` exists; untouched).
- Per-member mute of a single event.

## Files

| Path | What changes |
|---|---|
| `app/supabase/migrations/<ts>_event_announce.sql` | table + RPCs + kinds |
| `app/src/lib/notifications/types.ts` | two new kinds |
| `app/src/lib/school/announce.ts` (+ test) | audience schema, cap, gating |
| `app/src/db/repositories/school.ts` or new repo | count/announce calls |
| `app/src/app/(admin)/admin/events/[id]/edit/` | Announce panel + action |
| `app/src/notify/emails/event-announced-email.tsx` | new |
| `app/src/notify/emails/event-invited-email.tsx` | new |
| outbox worker registration | fan-out job |

## Steps

1. Migration: table + shared-predicate count/announce RPCs → db test: count ==
   rows the announce actually writes, preferences respected.
2. Lib layer: audience zod (facets, invite cap 10, published-only,
   not-yet-announced) → unit tests for every gate.
3. Announce panel with live count → count changes as facets change; confirm
   dialog shows the number that will be sent.
4. Outbox fan-out + email templates → local worker run delivers both variants;
   copy passes the voice read.
5. e2e: announce to a class-year slice in the seeded 1,212-member org; assert
   count, in-app items for members in the slice, none outside it.

## Verification

```bash
pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest && pnpm build
```

- Second announce attempt on the same event is rejected at both UI and RPC.
- A member with events-email off gets the in-app item only.
- Invite list rejects an 11th member with a clear message.
- migration-reviewer + rls-auditor + lib-discipline agent passes.

## Done when

- [ ] Faceted announce with truthful live count works against the scale seed
- [ ] Capped invites deliver the warm variant; copy voice-checked
- [ ] Once-per-event enforced; preferences respected
- [ ] PR opened and CI green

## Handoff notes

- **What diverged from the plan:**
- **What the next task needs to know:**
- **Logged to `Backlog/`:**
