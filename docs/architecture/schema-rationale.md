# Schema rationale — why v2 is shaped this way

**Status:** current · 2026-07-25
**Canonical schema:** [database v2 contract](database-v2-contract.md) — tables, columns, constraints, RLS matrix, function contract
**Generated types:** `app/src/db/database.types.ts`
**Decision:** [ADR 0015 — pre-launch v2 database reset](../decisions/0015-prelaunch-v2-database-reset.md)

> **This document contains no table or column definitions, by design.** It
> explains the reasoning behind the shape; the v2 contract is the single source
> of truth for the shape itself. If you find a table definition here, delete it —
> a second place that describes the schema is a second place that goes stale.
> (That is exactly what happened to the doc this one replaces, archived at
> [`_archive/architecture-2026-07/data-model.md`](../_archive/architecture-2026-07/data-model.md).)

Each section below traces to a numbered invariant in the contract's
**Non-negotiable invariants** section. Read that list for the precise rule; read
this for why the rule is worth keeping.

## Identity is user-scoped; activity is membership-scoped

*Invariants 1–2.*

A person is one `user` across the whole product. What they do inside a community
is keyed to a membership in that community.

The split matters because the two have different lifetimes. A membership can end
— someone leaves an organization, a pilot school winds down — while the human
relationships formed there should not silently vanish. So connections, blocks,
conversations, messages, and notifications key on user IDs and outlive
membership, while asks, help availability, events, and announcements key on
membership and disappear with it.

The practical rule when writing code: **never substitute a user ID for a
membership ID.** They are both UUIDs and the compiler cannot catch the mistake.
Getting it wrong either leaks activity across organizations or orphans a
relationship that should have survived.

## Direct and circle asks are one concept, not two tables

*Invariants 3–4, 6.*

An Ask sent to one named person and an Ask offered to a matched circle are the
same lifecycle at different reach. Modeling them as one thing with per-kind CHECK
constraints — rather than two parallel tables, or one unconstrained state bag —
means the lifecycle, notifications, expiry, and history are written once.

Published asks are immutable: question, message, recipient, reach, and anonymity
cannot change after insert. This is a trust property, not a storage convenience.
A helper who agreed to one request must never discover they agreed to a
different one. Changing your mind means a new Ask, which costs a slot.

## The five-slot cap is a two-sided mechanism

*Invariant 5.*

`waiting`, `open`, and `accepted` asks consume one of five slots; resolved,
declined, retracted, and closed asks do not.

Read only from the asker's side this looks like a limit. It is really a mutual
protection, and both halves are load-bearing:

- **For the circle:** it bounds how much collective attention one member can
  hold at once. Without a cap, the highest-volume asker sets everyone else's
  experience of the product, and helpers learn to ignore asks.
- **For the asker:** scarcity makes asking deliberate, which makes each ask
  better and easier to say yes to. A bounded ask is a smaller favor than an
  open-ended one.

The cap is enforced transactionally inside the command functions, not in the UI,
because a client-side check is a race condition with a friendly face.

## One room per pair of people

*Invariants 8–9.*

Every unordered pair of users has at most one conversation, and any number of
accepted asks can point into that room. Every message carries a real conversation
foreign key — there is no polymorphic parent that could point at an ask, a
connection, or an event depending on a type column.

Two payoffs. Members get continuous history with a person instead of a thread
graveyard fragmented by whichever feature introduced them. And the query path
stays sane: unread counts, read cursors, and Realtime subscriptions have exactly
one shape to reason about.

## Anonymity is a database property

*Invariant 11.*

When an ask is anonymous, an unmatched or unaccepted helper cannot obtain the
author's identity through a table, view, RPC, Realtime payload, or error message.
Not "the UI does not render it" — the data is unreachable.

This is the invariant most easily broken by an innocent change: a convenient join
in a projection, a debug field on an error, a Realtime channel scoped one level
too wide. It needs a test, not care.

## Nothing external happens inside a transaction

*Invariant 12.*

AI drafting, Resend email, and profile enrichment are queued as durable outbox
jobs only after state is committed. No transaction waits on a third party.

This keeps a provider outage from turning into a database problem, makes retries
safe, and means a slow model call cannot hold a row lock. The cost is that
delivery is eventually consistent, and copy has to be honest about that (see
[voice guidelines](../product/voice-guidelines.md) §12.10).

## Nothing is reachable unless explicitly granted

*Invariant 14.*

There are no broad grants. An object is unreachable unless its exact role grant
*and* an RLS policy allow it. Private schemas hold matching internals,
moderation, outbox, audit, and embedding data with no anonymous or member-facing
grant at all.

The default-deny posture is why the production postflight can assert things like
"no `public` table without RLS" and "no anonymous EXECUTE on import routines" as
booleans. Those assertions only stay meaningful while the default holds — a
single convenience grant makes the whole check theater. New tables start with no
grants and earn them.

## Idempotent by request key

*Invariant 13.*

Ask, offer, connection, and message creation all take a caller-scoped request
key. A double-tapped button, a retried fetch, or a resumed mobile session cannot
produce two asks. This is cheaper than reconciling duplicates later, and
duplicate asks are especially costly because they consume a real helper's
attention twice.

## Related reading

- [Database v2 contract](database-v2-contract.md) — the schema itself
- [Production cutover record](database-v2-production-cutover-plan.md#execution-record) — how v2 reached production
- [Migration workflow](../runbooks/migration-workflow.md) — forward-only discipline and expand/contract ordering
- [ADR 0008 — deploy ordering](../decisions/0008-deploy-ordering-expand-contract.md)
- [ADR 0011 — two verbs, one inbox](../decisions/0011-two-verbs-one-inbox.md) · [ADR 0015 — pre-launch v2 reset](../decisions/0015-prelaunch-v2-database-reset.md)
