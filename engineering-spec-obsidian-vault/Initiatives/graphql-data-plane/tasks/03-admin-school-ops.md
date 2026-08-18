---
id: graphql-data-plane/03-admin-school-ops
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: ready
depends_on: [02]
pr:
---

# 03 — Admin school ops (events + announcements)

## Cold start

The member School surface is on the graph (PR #184); the admin half is not.
The same school repository (`app/src/db/repositories/school.ts`) carries the
admin methods: `getAdminEvents`, `saveAdminEvent` (create/update via
`save_admin_school_event_v2`; result codes include `past_start` and
`cancelled`), `cancelAdminEvent`, `deleteAdminEvent` (`has_responses` blocks
deletion), `getAdminAnnouncements`, `publishAdminAnnouncement`. Admin
authorization is enforced by the RPCs (membership roles), not by the resolver —
but read how the admin server actions guard today
(`app/src/app/(admin)/…/actions.ts`) and mirror any session-level gate.

`SaveAdminSchoolEventInput` is large (schedule items, facts, capacity,
waitlist…) — read `app/src/lib/school/contracts.ts` lines ~161–200 and
`admin-schemas.ts` before modeling the input type.

## Scope

**In:**
- Queries: `adminSchoolEvents`, `adminSchoolAnnouncements`.
- Mutations: `saveAdminSchoolEvent` (one command for create+update, as the
  repo models it), `cancelAdminSchoolEvent`, `deleteAdminSchoolEvent`,
  `publishAdminSchoolAnnouncement`.
- Result-code enums verbatim (`PAST_START`, `HAS_RESPONSES`… are first-class).

**Out:**
- Admin members/reports — task 04.
- Any new admin capability the RPCs don't already have.

## Files

| Path | What changes |
|---|---|
| `app/src/graphql/entities/admin-school.ts` | new |
| `app/src/graphql/schema.ts` | register |
| `app/src/graphql/parity/manifest.ts` | entries |
| `app/src/graphql/schema.test.ts` | assertions |

## Verification

```bash
cd app && pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest run
```

- Manifest notes must tell the harness to run these as an ADMIN member and
  assert a non-admin gets the not-available/denied terminal.

## Done when

- [ ] Admin school reads + commands on the graph
- [ ] Manifest + drift guard updated
- [ ] PR opened, CI green, merged

## Handoff notes

*Filled in by the session that does this task.*
