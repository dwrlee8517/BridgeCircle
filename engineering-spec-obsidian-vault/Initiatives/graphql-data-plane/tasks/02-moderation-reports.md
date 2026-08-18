---
id: graphql-data-plane/02-moderation-reports
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: ready
depends_on: [01]
pr:
---

# 02 — Moderation: reportAsk / reportOffer

## Cold start

The Help repository (`app/src/db/repositories/help.ts`) already exposes
`reportAsk({ askId, reason, note })` and `reportOffer({ offerId, reason,
note })`, both returning `{ reportId: string }` — they were deliberately left
out of the Help commands slice (PR #174) to keep moderation separate. Reasons
come from `HelpReportReason` in `app/src/lib/help/contracts.ts` — read it for
the exact vocabulary.

## Scope

**In:**
- `reportAsk` / `reportOffer` mutations (likely in
  `entities/help-mutations.ts`, or a small `entities/moderation.ts` if that
  file is getting long), a `HelpReportReason` enum, payload `{ reportId }`.
- Manifest entries; the harness should assert an `admin_reports` row lands
  (read that table name from the repo before writing the note).

**Out:**
- The admin review of reports — task 04.

## Files

| Path | What changes |
|---|---|
| `app/src/graphql/entities/help-mutations.ts` (or new moderation.ts) | the two commands |
| `app/src/graphql/parity/manifest.ts` | entries |
| `app/src/graphql/schema.test.ts` | assertions |

## Steps

1. Read `HelpReportReason` + the two repo methods. → exact enum values known.
2. Implement, following the established status/payload conventions
   (these return an id, not a status union — expose `reportId: ID!`).
3. Manifest + tests. → drift guard green.

## Verification

```bash
cd app && pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest run
```

## Done when

- [ ] Both report commands on the graph
- [ ] Manifest + drift guard updated
- [ ] PR opened, CI green, merged

## Handoff notes

*Filled in by the session that does this task.*
