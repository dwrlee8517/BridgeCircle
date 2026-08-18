---
id: graphql-data-plane/06-cutover-pilot
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: blocked
depends_on: [05]
pr:
---

# 06 — Cutover pilot: one screen reads via the graph (ROI gate)

## Cold start

This is the decision task of the whole initiative. Everything so far is
additive — no page actually consumes the graph. Pick ONE real screen (the
notifications page `/notifications` is the best candidate: self-contained,
already a keyset connection, low blast radius) and convert its server-side
reads from direct repository calls to **in-process GraphQL execution** via
`app/src/graphql/execute.ts` (`executeGraphQL` — same process, no self-HTTP).

The point is evidence, not migration: does reading through the graph beat the
current Server-Component-calls-repository pattern on code clarity, type flow,
and latency? The user decided "GraphQL as the main data plane" contingent on
this proving out (ADR 0017's phased gate).

## Scope

**In:**
- Convert the pilot screen's reads to `executeGraphQL`; keep commands as-is.
- Measure: lines/complexity before/after, and server render latency (dev-mode
  numbers with the repository path vs the graph path).
- Write the verdict in Handoff notes AND amend `plan.md`: either write the
  07-per-surface-cutover tasks, or record stopping at "graph = external
  surface only".

**Out:**
- Converting any other screen; changing the commands path.

## Verification

```bash
cd app && pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest run && pnpm build
```

- The pilot screen renders identically against the local stack (drive it,
  don't infer).
- `pnpm build` required — this touches app routes.

## Done when

- [ ] Pilot screen reads through the graph in-process
- [ ] Before/after comparison written into Handoff notes
- [ ] `plan.md` amended with the go/no-go and (if go) the 07 task list
- [ ] PR opened, CI green, merged

## Handoff notes

*Filled in by the session that does this task.*
