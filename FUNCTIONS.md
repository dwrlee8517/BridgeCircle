# BridgeCircle — Functions And User Experience

A one-page map of what BridgeCircle does and where each behavior is canonically documented. Use this file as a router into the active specs, architecture, and experience docs — not as a second source of truth.

If this file disagrees with anything it links to, the linked doc wins.

---

## What BridgeCircle is

A **verified warm-network platform** for trusted communities — currently alumni networks for private schools. The product helps members feel safe asking for help, proud to offer help, and more connected to the circles that shaped them. Not a CRM, not an alumni-management database, not a generic social network.

Positioning and brand thesis: [`docs/product/brand-strategy.md`](docs/product/brand-strategy.md).

## Roles

Five role surfaces share one product. A member can play several at once; capabilities gate independently.

| Role | What they do |
|---|---|
| **Member** | Verified alumnus or student of a participating organization |
| **Asker** | A member sending a request (advice or mentorship) |
| **Helper** | A member opted in to receive advice and/or mentorship requests |
| **Friend** | Two members who have mutually accepted a friend request — gates DMs |
| **Admin** | Staff who invite, approve, moderate, and run programming for one organization |

Two parallel ask types run on the same data model: **Advice** (one-off, low-friction) and **Mentorship** (ongoing, capacity-capped).

## Where each behavior is documented

| Surface | Canonical doc |
|---|---|
| Information architecture, routes, navigation, legacy redirects | [`docs/architecture/information-architecture.md`](docs/architecture/information-architecture.md) |
| Data model, RLS posture, table relations | [`docs/architecture/data-model.md`](docs/architecture/data-model.md) |
| Full Phase 1 product spec (auth, onboarding, people, profiles, friendship, asks, inbox, DMs, events, announcements, notifications, admin) | [`docs/specs/phase-1/spec.md`](docs/specs/phase-1/spec.md) |
| What ships in the launch cut | [`docs/specs/phase-1/launch-cut.md`](docs/specs/phase-1/launch-cut.md) |
| Week 3–4 additive features | [`docs/specs/phase-1/week-3-4.md`](docs/specs/phase-1/week-3-4.md) |
| User flows (state diagrams for asks, friendship, DMs) | [`docs/specs/phase-1/user-flows.md`](docs/specs/phase-1/user-flows.md) |
| Phase 2 drafts — conditional RSVP, ask mediator | [`docs/specs/events-conditional-rsvp.md`](docs/specs/events-conditional-rsvp.md), [`docs/specs/ask-mediator.md`](docs/specs/ask-mediator.md) |
| Screen-level bridge between behavior and UI | [`docs/experience/screens/phase-1-screen-map.md`](docs/experience/screens/phase-1-screen-map.md) |
| Active visual system | [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/) |
| Profile enrichment provider chain | [`docs/architecture/profile-enrichment.md`](docs/architecture/profile-enrichment.md) |
| Phasing, pricing, out-of-scope guardrails | [`docs/product/feature-roadmap.md`](docs/product/feature-roadmap.md) |
| Voice and copy rules | [`docs/product/voice-guidelines.md`](docs/product/voice-guidelines.md) |

## Locked workflow invariants

These are the cross-cutting rules that any redesign must preserve. They are stated in full in the specs above; reproduced here so they're hard to miss.

- **Friendship, asks, and DMs are separate tracks at the data layer.** They share the `/inbox` surface but gate differently: DMs require mutual friendship; asks require helper acceptance. Do not collapse the gating.
- **Asks are polymorphic.** One `asks` table, `ask_type` enum (`advice` | `mentorship`). Helper opt-in is per-type. Mentorship has the capacity cap and paused-at fields; advice is intentionally lower-friction.
- **Two-sided buffer.** Any peer-to-peer mediation feature (asks, declines, RSVPs) is framed on both sides — symmetric psychological-barrier reduction is the brand mechanism.
- **Verified-community trust.** Only invited / approved members access the directory. Field-level privacy controls are member-owned.
