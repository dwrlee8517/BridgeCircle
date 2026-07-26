# 0003 — Friendship and mentorship are separate tracks

- **Status:** accepted in principle — **vocabulary and relationship model superseded by [0011](0011-two-verbs-one-inbox.md)**; amended by [0010](0010-horizontal-help-warm-data-flywheel.md) D1
- **Date:** 2026-04-23
- **Decider:** Richard

> **What survives, what does not (recorded 2026-07-25).** The *principle* here is
> still load-bearing: relationship types have distinct gates, and collapsing them
> loses signal. What is retired is this ADR's vocabulary and data model.
> "Friendship" is now **Connect** (`connections`, `connection_requests`, mutual);
> the separate mentorship track with its own capacity, screening, and inactivity
> rules is gone, replaced by one **Ask/Help** lifecycle that is one-sided until
> accepted. There are no `friendships` or `mentorship_requests` tables in either
> remote. Read [ADR 0011](0011-two-verbs-one-inbox.md) for the current model and
> [`../architecture/database-v2-contract.md`](../architecture/database-v2-contract.md)
> for the schema; everything below is the original 2026-04 reasoning.

## Context

Most alumni networks (and LinkedIn) collapse "connection" into a single bidirectional graph. BridgeCircle's thesis is a **member-first warm-network platform** where members opt into specific kinds of interaction. Conflating "friend" and "mentor" loses signal: a mentor relationship has explicit capacity, screening, and inactivity rules that don't apply to peer friendship.

## Decision

Two separate relationship tracks in the data model and UX:

| Track | Gating | What unlocks |
|---|---|---|
| **Friendship** | Mutual accept | Direct messaging (DM) |
| **Mentorship** | Mentor accepts request from mentee | Mentorship-thread chat (separate from DM) |

Friendship and mentorship state live in different tables. The UI presents them as separate inbox sections. A user can be a friend AND a mentor of the same person, but the two states are independent.

Mentor-specific concepts (open/closed toggle, max active mentees, max pending requests, screening prompt, 14-day inactivity auto-pause) apply only to the mentorship track.

## Consequences

- **+** Mentor inactivity auto-pause has clean semantics — it only affects the mentorship track, not friendships.
- **+** Field-level privacy can treat "friends-only" and "org-visible" as distinct rules without leaking mentorship state.
- **+** Search ranking can boost open-to-mentor independently from friendship signals.
- **−** Two flows in the inbox (more UI surface).
- **−** More state to track in the data model and reason about in `/lib`.

## Alternatives considered

- **Unified "connection"** (LinkedIn pattern) — simpler but loses the mentorship semantics.
- **Mentor-only, no friendship** — too narrow; alumni want peer connections too.
- **Friendship implicit from mentorship** (mentor automatically friend) — couples the two in ways that break privacy expectations.
