# 0003 — Friendship and mentorship are separate tracks

- **Status:** accepted — amendment proposed in [0010](0010-horizontal-help-warm-data-flywheel.md) (mentorship reframed as a commitment tier within a horizontal help model; the friendship/asks gating split defined here is preserved)
- **Date:** 2026-04-23
- **Decider:** Richard

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
