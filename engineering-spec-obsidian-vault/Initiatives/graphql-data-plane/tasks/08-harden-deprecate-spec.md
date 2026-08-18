---
id: graphql-data-plane/08-harden-deprecate-spec
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: blocked
depends_on: [06]
pr:
---

# 08 — Harden, deprecate, write the tech spec

## Cold start

The closing task. By now the graph either is the primary data plane (07 tasks
done) or the external surface beside Server Actions (06 said stop). Either
way three things remain: production hardening of the endpoint, deprecation of
whatever the cutover made redundant, and the durable tech spec this initiative
owes the vault.

## Scope

**In:**
- Hardening: query depth/complexity limits on the Yoga endpoint (Pothos
  complexity plugin or yoga plugins), disable GraphiQL + introspection in
  production, confirm error masking doesn't leak repository internals.
- Deprecation: remove Server-Action read/write paths that the cutover made
  redundant — only those whose parity entry is green and whose last caller is
  migrated (the deprecation gate in `docs/architecture/graphql-parity.md`).
- Tech spec: write `Prototype/graphql-data-plane.md` from
  `_templates/tech-spec.md` describing the END STATE (context/auth model,
  entity↔repository map, pagination inventory, idempotency conventions,
  hardening posture) and graduate it to `Production/` in the same change.
  Close the initiative: `plan.md` `status: done`, `closed:` date.

**Out:**
- New features on the graph.

## Verification

```bash
cd app && pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest run && pnpm build
```

- A deep/hostile query (e.g. 10-level nesting, 1000-item first) is rejected
  with a clear error against the local stack.
- Production build serves no GraphiQL.

## Done when

- [ ] Depth/complexity limits + prod introspection posture shipped
- [ ] Redundant legacy paths removed per the deprecation gate
- [ ] Tech spec in `Production/`, initiative closed
- [ ] PR opened, CI green, merged

## Handoff notes

*Filled in by the session that does this task.*
