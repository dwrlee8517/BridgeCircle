# 0015 — Replace the pre-launch application schema with a v2 baseline

- **Status:** accepted
- **Date:** 2026-07-13
- **Decider:** Richard
- **Contract:** [Database v2 contract](../architecture/database-v2-contract.md)
- **Implementation:** local Foundation and Conversation Primitive schema/app boundaries verified 2026-07-14; later domain ports and remote cutovers pending

## Context

BridgeCircle is still pre-launch. The local, development, and production
databases contain no real member data, and Richard explicitly approved a
destructive reset, including a complete rebuild of application-owned database
objects, if that produces a cleaner and more robust foundation.

The current schema was built around the earlier mentorship model and then
extended incrementally. It now carries several persistence shapes that no
longer match the approved product:

- direct `asks` and `open_asks` model one member action in separate tables;
- `ask_threads` and `direct_message_threads` split a single Messages product;
- `messages.thread_id` is polymorphic and cannot have a real thread foreign
  key;
- Ask type, commitment, and screening fields preserve retired product
  concepts;
- helper topics remain embedded arrays rather than first-class, ordered data;
- friendship names persist even though the member-facing product uses
  Connection and Circle language;
- broad default grants make new public objects reachable more widely than the
  target least-privilege posture;
- privileged RLS helpers live in the exposed `public` schema;
- anonymous Ask safety, offer acceptance, the five-active-Ask cap, blocking,
  and reliable notification delivery need database-level invariants rather
  than scattered application conventions.

Ordinarily, [ADR 0008](0008-deploy-ordering-expand-contract.md) requires
expand/contract for destructive schema work and migration history remains
forward-only. Those rules protect real users and mixed application versions.
Here there is no member data to preserve, so carrying legacy structures,
compatibility aliases, and dual writes would add risk without protecting
anyone.

## Decision

### 1. Adopt a one-time clean application-schema reset

Replace BridgeCircle-owned tables, views, policies, functions, triggers,
indexes, grants, publications, and seed data with the v2 model defined in the
[database contract](../architecture/database-v2-contract.md).

Preserve the existing Supabase projects and Supabase-managed infrastructure:

- `auth` and `storage` schemas;
- project references and API keys;
- OAuth providers, redirect URLs, custom-domain settings, and email settings;
- Railway, Doppler, Resend, and Sentry configuration.

Do not recreate the Supabase projects unless a later audit proves their
configuration is cheaper and safer to reproduce than to preserve.

### 2. Replace active migration history with one reviewed v2 baseline

Archive the current migration files outside `app/supabase/migrations/`, with a
README, the final legacy commit SHA, and a schema dump. The active migration
history will begin with a CLI-generated timestamped `v2_init` migration.

Development may use multiple temporary logical layers while the schema is
being designed and tested. Before the development cutover, consolidate them
into the single reviewed baseline and manually restore data-backed database
configuration that migration squashing omits, including Storage bucket rows.

For each retained remote project, a separately approved cutover runbook will:

1. prove that no real member data exists;
2. take and restore-test an encrypted database snapshot;
3. inventory and separately export Storage objects;
4. pause deployments, workers, and scheduled jobs;
5. remove only BridgeCircle-owned objects;
6. repair the old remote migration records to `reverted`;
7. dry-run and apply the v2 baseline;
8. deploy the exact application SHA already proven in development;
9. verify signup, RLS, Storage, Realtime, background jobs, and core flows.

The reset is a manual one-time operation. It must not be embedded in an
ordinary repeatable deployment job.

### 3. Use three application schema roles

- `public` contains RLS-protected application tables that are safe for direct
  relational access when their grants and policies allow it.
- `api` contains only explicitly exposed views and RPC wrappers, especially
  for anonymity-sensitive Help reads and transactional commands.
- `private` contains privileged RLS helpers, matching data, embeddings,
  enrichment internals, moderation evidence, outbox jobs, and audit events.

Security-definer implementations live in `private`, use an empty search path,
fully qualify every relation, and receive narrow grants. Exposed `api`
wrappers have fixed return types and delegate to those implementations.

### 4. Unify Help and Messages at the data layer

- One `asks` table represents direct and circle asks.
- Per-kind CHECK constraints make illegal union states impossible.
- `ask_offers` models the complete offer lifecycle.
- `asks.accepted_offer_id` does not exist; a partial unique index makes the
  accepted offer authoritative, and a deferred consistency trigger validates
  the Ask/offer relationship at commit.
- One `conversations` table represents direct and Ask conversations.
- Direct conversation uniqueness is scoped to `kind = 'direct'`; the same
  pair may have multiple Ask conversations.
- `messages.conversation_id` is a real foreign key.
- `conversation_reads` replaces mutable `messages.read_at` state.

This supersedes ADR 0011's decision to defer merging thread tables and to keep
friendship names indefinitely. ADR 0011's product gates remain: Ask acceptance
is one-sided, Connection acceptance is mutual, and every accepted interaction
lands in Messages.

### 5. Make identity scope explicit

Organization-scoped activity uses membership IDs and stores
`organization_id`: asks, offers, helper settings, organization profiles,
events, RSVPs, and admin roles.

Person-to-person relationships use user IDs and may outlive a membership:
connections, blocks, conversations, messages, and notification recipients.

Composite foreign keys guarantee that an organization-scoped membership
belongs to the same organization as the parent record.

### 6. Enforce safety and lifecycle rules centrally

- All surfaces call one `private.is_blocked(user_a, user_b)` helper.
- Direct and circle Ask states have separate allowed-state constraints.
- Published Ask audience and content are immutable.
- The five-active-Ask cap is enforced transactionally with an advisory lock.
- Offer acceptance locks rows in stable order and creates the accepted offer,
  Ask state, conversation, first message, notifications, and outbox jobs in
  one short transaction.
- External AI, enrichment, and email calls never occur while database locks
  are held.
- Anonymous Ask identity is withheld by the database contract, not merely by
  UI omission.
- Every exposed table has RLS; every exposed view uses `security_invoker`.
- Grants are explicit and least-privilege; broad public-schema defaults are
  revoked.

### 7. Build and verify locally before any remote reset

The backend and database must be compatible locally before development or
production is reset. The implementation order is:

1. identity, organizations, profiles, grants, and RLS helpers;
2. conversations, messages, reads, blocking, audit, and outbox primitives;
3. Help end-to-end;
4. Messages;
5. People, Profile, Connections, and Search;
6. School, administration, enrichment, and analytics.

The redesigned app shell and token work are orthogonal and may merge before
or during this effort.

**Implementation-topology amendment (2026-07-14):** Richard removed the other
uncommitted worktree and explicitly consolidated the surviving app-shell and
database-v2 work on the long-lived `codex/redesign-v2` integration branch.
This replaces physical worktree separation, not the isolation rule: `main`
remains untouched and no partially ported v2 application may merge or deploy.

### 8. Reinstate normal migration discipline at the first real signup

This ADR authorizes one pre-launch supersession of active migration history.
After the first real member is admitted:

- migrations are forward-only;
- destructive changes use expand/contract;
- no migration file already applied to a shared database is edited;
- production changes continue through the tested development stage and the
  ADR 0014 manual production gate.

### 9. Retain shared history through a pseudonymized account tombstone

Account deletion removes Supabase Auth credentials, profile PII, active
authored requests/offers, notifications, preferences, and connection edges.
Private-file deletion is durably queued through the Supabase Storage API,
rather than deleting Storage metadata directly. Memberships are revoked
immediately. The application
retains a non-PII `public.users` tombstone plus accepted Ask, conversation,
message, audit, and moderation history so deletion does not erase a
counterpart member's shared history or safety evidence.

The tombstone UUID intentionally survives deletion from `auth.users`; it is
rendered only as “Deleted member.” An idempotent private cleanup routine and
Auth-delete trigger enforce the same result for application-driven and
administrative deletion paths. Richard approved this retention choice on
2026-07-13.

## Scope of this approval

This ADR approves the target architecture and the preparation of local schema
and backend changes. It does **not** itself authorize:

- wiping development or production;
- repairing remote migration history;
- changing production project configuration;
- deploying an application that is incompatible with the current schema.

Each remote cutover requires a separate explicit approval after local and
development verification is complete.

## Consequences

- **+** Product vocabulary and database vocabulary converge around Help,
  Connections, and Messages.
- **+** Critical state, tenant, privacy, and concurrency invariants become
  database-enforced.
- **+** The new active migration history describes the system that actually
  exists instead of replaying retired product experiments.
- **+** Anonymous Ask and block safety have one auditable implementation.
- **+** Reliable outbox processing separates state commits from email and AI
  availability.
- **−** Most database-facing code, seeds, workers, and E2E fixtures must be
  rewritten.
- **−** Until the cutover completes, two documented models exist: the current
  live schema and the approved v2 target. Every document must label which one
  it describes.
- **−** Remote migration-history replacement is operationally unusual and
  must be performed from a written, reviewed runbook.
- **~** Existing Supabase projects remain; this is an application-schema
  replacement, not an infrastructure-vendor change.

## Alternatives considered

### Preserve legacy tables through expand/contract

Rejected for this one reset. There is no real data or live member traffic to
protect, while dual writes and compatibility views would make the new backend
more complex and easier to get wrong.

### Keep direct and circle asks separate

Rejected. They share one member concept, one five-slot limit, one status
surface, and one downstream conversation model. Separate tables duplicate
policy and lifecycle logic.

### Keep split conversation tables and unify only the UI

Rejected. The earlier reason was destructive migration cost, not a useful
domain distinction. A single conversation foreign key removes polymorphic
message integrity and simplifies Realtime, read state, reporting, and the
Messages UI.

### Create brand-new Supabase projects

Rejected as the default. It produces a clean database but also requires
recreating OAuth, redirects, keys, domains, environment wiring, Storage, and
deployment configuration. Retaining the empty projects and replacing only
application-owned objects has a smaller infrastructure blast radius.

### Put all application data in `public`

Rejected. RLS remains mandatory, but an unexposed `private` schema and a
narrow `api` surface reduce accidental exposure of matching, moderation,
embedding, outbox, and privileged helper objects.
