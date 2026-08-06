# 0014 — GraphQL as the data plane (code-first, RLS-preserving)

- **Status:** accepted (phased — ROI gate after Phase 1)
- **Date:** 2026-08-05
- **Decider:** Daniel

## Context

Reads are RSC calling `/lib`; writes are Server Actions calling `/lib`. Both hit
the Supabase query builder directly (~331 `.from()` sites across ~76 modules),
with ~127 hand-written domain types and a `{ ok, error }` result convention.
There is **no pagination anywhere** — the one "paged" surface slices an
in-memory array. Cross-entity reads are stitched by hand with in-memory `Map`
joins. This is the "no automatic relation traversal" cost flagged in
[0001](0001-supabase-not-prisma.md), now large enough to act on.

The driver is **internal DX**: one typed graph, entity models, and cursor
pagination to replace the bespoke stitching. There is no external/mobile client
yet. The target is for GraphQL to become the **main data plane** (reads and
writes), with Next.js as the render tier consuming it. This revisits the tRPC
deferral in [0007](0007-lib-discipline.md) ("defer until there's demand").

## Decision

Adopt a **code-first GraphQL layer (Pothos + GraphQL Yoga)**, served from a Next
Route Handler at `/api/graphql`, resolvers delegating to the existing `/lib`
functions. Not Supabase `pg_graphql`: it reflects raw tables (no entity classes)
and bypasses the `/lib` discipline.

Binding constraints:

- **Entity classes + Relay connections.** Entities are the domain model; join
  tables (`organization_memberships`, `event_rsvps`, `friendships`,
  `open_ask_matches`) become connection **edges** carrying their metadata.
- **RLS is preserved in every resolver.** Context is built per request from the
  **user-scoped** Supabase client (`db/server`), never the service-role admin
  client. This is the whole security model — a stray admin client in a resolver
  silently defeats row security across the graph.
- **Co-located, not a separate service.** One Next deployment. Server Components
  read via **in-process execution** (`@/graphql/execute`, no HTTP hop); client
  components use the HTTP endpoint. Extract to a standalone service only when a
  second consumer (mobile/partner) actually appears — that is when a physically
  separate data plane earns its keep.
- **Not an ORM.** Resolvers still use `@supabase/supabase-js` typed by
  `pnpm db:types`. This is compatible with [0001](0001-supabase-not-prisma.md);
  it adds an API/data-plane layer, not a data-access framework.

Phased, with a hard checkpoint:

- **Phase 0** — foundations: schema builder, RLS context, DataLoader, one
  `Member` entity end-to-end, the route handler, in-process executor.
- **Phase 1** — core read graph (Member, Organization, Ask, OpenAsk, Event,
  Thread/Message) + connections + keyset indexes. **ROI gate:** ship one real
  screen on GraphQL, measure DX vs. the RSC baseline, then commit to (or stop
  before) full cutover.
- **Phase 2** — mutations (normalize `{ ok, error }` into payload types + a
  shared error union; reuse the ~43 Zod input schemas).
- **Phase 3** — client cutover + real pagination UI.
- **Phase 4** — harden (depth/complexity limits, persisted queries, N+1 audit)
  and decommission bespoke stitching.

## Consequences

- **+** One typed graph; relationship resolvers + DataLoader delete the manual
  in-memory join stitching.
- **+** Relay cursor connections give stable pagination the app lacks today.
- **+** RSC stops being a half-data-layer; clean render-vs-data separation.
- **+** `/lib` stays the behavior layer — resolvers are thin, tests unchanged.
- **−** A large migration (~3–4.5 months to full replace) against a data layer
  that already works; hence the Phase-1 ROI gate.
- **−** New dependencies (Pothos, Yoga, graphql) — pinned to graphql 16 for peer
  compatibility with Yoga.
- **−** RLS-in-context is a sharp edge; needs a lint rule + denial tests so no
  resolver reaches for the admin client.

## Alternatives considered

- **Supabase `pg_graphql`** — connections for free, but raw-table reflection, no
  entity classes, and it bypasses `/lib`. Useful as a reference, not the target.
- **tRPC** — typed RPC, but no schema/connection model and it couples client and
  server types; the [0007](0007-lib-discipline.md) deferral stands for it.
- **Keep RSC + Server Actions, add only a keyset-pagination util + entity mapper
  classes** — the 80/20. Captures much of the DX win without a query language.
  Explicitly the fallback if the Phase-1 gate doesn't justify full cutover.
