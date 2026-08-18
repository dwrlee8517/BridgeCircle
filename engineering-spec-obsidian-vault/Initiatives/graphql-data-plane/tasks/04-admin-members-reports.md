---
id: graphql-data-plane/04-admin-members-reports
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: ready
depends_on: [03]
pr:
---

# 04 — Admin members + report queue

## Cold start

The remaining admin console surfaces: member management
(`app/src/db/repositories/admin-members.ts` — `list_admin_members`,
`decide_membership[_with_reason]`, role grant/revoke), the moderation queue
(`app/src/db/repositories/admin-moderation.ts` — `list_admin_reports`,
`decide_admin_report`), invites (`app/src/db/repositories/invites.ts` —
`issue_invite`, `list_invites`, `accept_invite` is member-side), and the
overview (`admin-overview.ts`). Read each repository's contract before
modeling; do not guess result unions.

This is the largest remaining slice — if reading the contracts shows it can't
land as one reviewable PR, split it in `plan.md` first (members+invites vs
moderation+overview is the natural cut).

## Scope

**In:**
- Admin member list/decide/roles, report queue list/decide, invite issue/list,
  overview read — all as thin delegates with verbatim result enums.

**Out:**
- Member-side `accept_invite` (already part of the join flow, not the graph's
  concern yet).

## Files

| Path | What changes |
|---|---|
| `app/src/graphql/entities/admin.ts` (split if needed) | new |
| `app/src/graphql/schema.ts` | register |
| `app/src/graphql/parity/manifest.ts` | entries |
| `app/src/graphql/schema.test.ts` | assertions |

## Verification

```bash
cd app && pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest run
```

- Manifest notes: run as admin; assert non-admin denial per command.

## Done when

- [ ] Admin members/reports/invites/overview on the graph (or split recorded
      in plan.md)
- [ ] Manifest + drift guard updated
- [ ] PR(s) opened, CI green, merged

## Handoff notes

*Filled in by the session that does this task.*
