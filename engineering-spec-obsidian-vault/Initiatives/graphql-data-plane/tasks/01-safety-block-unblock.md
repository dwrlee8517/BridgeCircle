---
id: graphql-data-plane/01-safety-block-unblock
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: ready
depends_on: [00]
pr:
---

# 01 — Safety: block/unblock commands

## Cold start

The graph exposes `blockedMembers` (read, via the settings repository) but no
way to block or unblock. v2's safety operations live in
`app/src/db/repositories/safety.ts` (RPC `block_member`, plus whatever
unblock/inverse it exposes — read that file first; there is also
`app/src/lib/safety/` if operations wrap it). Blocking affects conversations,
people search, and Help visibility downstream, all enforced by the RPCs — the
resolver only delegates.

## Scope

**In:**
- `blockMember` / `unblockMember` mutations in a new
  `app/src/graphql/entities/safety.ts`, delegating to the safety repository.
- Status enums verbatim per house convention (uppercased result codes).
- Parity manifest entries + schema-test coverage.

**Out:**
- reportAsk/reportOffer — that is task 02 (moderation ≠ safety in v2).
- Any change to how blocking affects other surfaces — the RPCs own that.

## Files

| Path | What changes |
|---|---|
| `app/src/graphql/entities/safety.ts` | new — the two commands |
| `app/src/graphql/schema.ts` | register the entity import |
| `app/src/graphql/parity/manifest.ts` | manifest entries |
| `app/src/graphql/schema.test.ts` | slice assertions |

## Steps

1. Read `app/src/db/repositories/safety.ts` and its contracts — get the exact
   result unions. → you can name every status value.
2. Write the entity following `entities/connections.ts` as the pattern
   (session guard → repository call → uppercased status payload).
3. Manifest entries with cross-checks (after block: conversation goes
   read-only `ACCOUNT_UNAVAILABLE`? verify actual behavior; blockedMembers
   gains the row). → drift-guard test passes.

## Verification

```bash
cd app && pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest run
```

- Schema test asserts both mutations and their payload types exist.
- No `db/admin` import under `app/src/graphql/`.

## Done when

- [ ] Both commands on the graph, delegating to the safety repository
- [ ] Manifest + drift guard updated
- [ ] PR opened, CI green, merged (merge-as-we-go)

## Handoff notes

*Filled in by the session that does this task.*
