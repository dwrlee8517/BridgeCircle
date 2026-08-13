# BridgeCircle — Functions And User Experience

A one-page map of what BridgeCircle does and where each behavior is canonically documented. Use this file as a router into the active specs, architecture, and experience docs — not as a second source of truth.

If this file disagrees with anything it links to, the linked doc wins.

**For project status, the launch plan, and product decisions, this repo is not the source of truth** — the shared memory vault is: `~/Library/Mobile Documents/com~apple~CloudDocs/BridgeCircle Sync/` (`memory/projects/`, `memory/decisions/`). See `AGENTS.md` → "Which source wins."

---

## What BridgeCircle is

A **verified warm-network platform** for trusted communities — currently alumni networks for private schools. The product helps members feel safe asking for help, proud to offer help, and more connected to the circles that shaped them. Not a CRM, not an alumni-management database, not a generic social network.

Positioning and brand thesis: [`docs/product/brand-strategy.md`](docs/product/brand-strategy.md).

## Roles

Five role surfaces share one product. A member can play several at once; capabilities gate independently.

| Role | What they do |
|---|---|
| **Member** | Verified alumnus or student of a participating organization |
| **Asker** | A member sending a Help request — `direct` to one person, or `circle` to a bounded reach |
| **Helper** | A member with `open_to_help` set, receiving Help requests on their chosen topics |
| **Connection** | Two members who have mutually accepted a Connect request — gates direct messaging |
| **Admin** | Staff who invite, approve, moderate, and run programming for one organization |

Two parallel ask types run on the same data model: **Advice** (one-off, low-friction) and **Mentorship** (ongoing, capacity-capped).

## Where each behavior is documented

| Surface | Canonical doc |
|---|---|
| Information architecture, routes, navigation, legacy redirects | [`docs/architecture/information-architecture.md`](docs/architecture/information-architecture.md) |
| Data model, RLS posture, table relations | [`docs/architecture/database-v2-contract.md`](docs/architecture/database-v2-contract.md) |
| Why the schema is shaped that way | [`docs/architecture/schema-rationale.md`](docs/architecture/schema-rationale.md) |
| Full Phase 1 product spec (auth, onboarding, people, profiles, Connect, Help, Messages, events, announcements, notifications, admin) — **predates the v2 rebuild in places; verify against code** | [`product-spec-obsidian-vault/Production/phase-1/spec.md`](product-spec-obsidian-vault/Production/phase-1/spec.md) |
| What ships in the launch cut | [`product-spec-obsidian-vault/Production/phase-1/launch-cut.md`](product-spec-obsidian-vault/Production/phase-1/launch-cut.md) |
| Week 3–4 additive features | [`product-spec-obsidian-vault/Production/phase-1/week-3-4.md`](product-spec-obsidian-vault/Production/phase-1/week-3-4.md) |
| User flows (state diagrams for Help asks, Connect, messaging) — **predates the v2 rebuild in places; verify against code** | [`product-spec-obsidian-vault/Production/phase-1/user-flows.md`](product-spec-obsidian-vault/Production/phase-1/user-flows.md) |
| Phase 2 drafts — conditional RSVP, ask mediator | [`product-spec-obsidian-vault/Prototype/events-conditional-rsvp.md`](product-spec-obsidian-vault/Prototype/events-conditional-rsvp.md), [`product-spec-obsidian-vault/Prototype/ask-mediator.md`](product-spec-obsidian-vault/Prototype/ask-mediator.md) |
| Screen-level bridge between behavior and UI | [`docs/experience/screens/phase-1-screen-map.md`](docs/experience/screens/phase-1-screen-map.md) |
| Active visual system | [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/) |
| Profile enrichment provider chain | [`docs/architecture/profile-enrichment.md`](docs/architecture/profile-enrichment.md) |
| Phasing, pricing, out-of-scope guardrails | [`docs/product/feature-roadmap.md`](docs/product/feature-roadmap.md) |
| Voice and copy rules | [`docs/product/voice-guidelines.md`](docs/product/voice-guidelines.md) |
| How a subsystem is built (tech specs), large changes in flight, and logged oddities | [`engineering-spec-obsidian-vault/`](engineering-spec-obsidian-vault/CLAUDE.md) — read in tandem with the product vault above |

## Locked workflow invariants

These are the cross-cutting rules that any redesign must preserve. They are stated in full in the specs above; reproduced here so they're hard to miss.

- **Connect and Help have distinct gates, even though accepted interactions share one surface.** They share the `conversations` / `messages` primitives and surface in `/messages`, but gate differently: a Connect is **mutual** (`connections`, `connection_requests`); a Help ask is **one-sided** until the recipient accepts or the asker accepts an offer. Do not collapse the gating. (ADR [0011](docs/decisions/0011-two-verbs-one-inbox.md) supersedes ADR 0003's friendship/mentorship-track framing; the distinct-gates *principle* is what survived.)
- **Asks split by reach, not by commitment type.** One `asks` table keyed on `direct` vs `circle`. There is no `ask_type` / `advice` / `mentorship` enum — that model is retired. Availability is a single state (`helper_preferences.open_to_help` plus pause metadata and normalized `helper_topics`), and pending capacity is enforced transactionally by the v2 command functions rather than per-type in the UI.
- **Two-sided buffer.** Any peer-to-peer mediation feature (asks, declines, RSVPs) is framed on both sides — symmetric psychological-barrier reduction is the brand mechanism.
- **Verified-community trust.** Only invited / approved members access the directory. Field-level privacy controls are member-owned.
