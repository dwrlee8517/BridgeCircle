---
type: debt
area: graphql
severity: high
found_during: closing the parity fixture's blind spots (Phase 0)
date: 2026-08-17
---

# The graph serves a different organization than the page for multi-org members

## What I saw

Pages resolve the viewer's organization from a cookie:

```ts
// app/src/app/_lib/load-member-context.ts
const preferredMembershipId = await readMembershipPreference()
return { client, context: await getMemberContext(client, preferredMembershipId) }
```

Resolvers do not. Every membership-scoped resolver calls
`getMemberContext(ctx.supabase)` with **no preference** — see
`app/src/graphql/entities/member.ts`, `help.ts`, `people.ts`, `school.ts`,
`account.ts`, `connections.ts`, and `loaders.ts`. `GraphQLContext`
(`app/src/graphql/context.ts`) carries `supabase`, `session` and `loaders`; the
membership preference is not among them.

`private.get_my_member_context` only auto-selects when the member has exactly
one active membership (`v2_init.sql:2124`). With two, `selected_membership_id`
stays null and `requires_circle_choice` is set — so the resolvers' shared
fallback, `... ?? context.memberships[0]`, silently picks whichever
organization sorts first by `order by o.name, m.id`.

Measured against a real database with a member in two organizations, after
choosing the second the way `/select-circle` does:

```
selected(no pref) = null   requiresCircleChoice = true
chosen            = 7542a792-…      (what the member picked)
page resolves     = 7542a792-…      ✓
graph resolves    = 01521e46-…      ✗  the other organization
```

## Why it might matter

It is a **cutover blocker, not a bug in flight** — nothing consumes the graph
yet, so no member is affected today. But the moment any surface is flipped to
the graph, a member of two organizations sees the wrong one: wrong Help home,
wrong people directory, wrong school feed, wrong asks. Silently — every field
resolves, nothing errors, the data is simply someone else's circle.

`requires_circle_choice` exists precisely because the product knows this member
must choose. The graph never asks and never reads the answer.

Two organizations is not hypothetical: it is the Chadwick School / Chadwick
International shape the pilot is built around, and `/select-circle` is a
shipped surface.

The parity harness cannot catch this on its own. It diffs the graph against the
repository *called the way a resolver calls it* — both sides omit the
preference, so both agree. What diverges is graph vs. **page**, which is the
comparison the cutover actually depends on. Worth remembering when reading a
green parity run: it proves resolver-vs-repository, not graph-vs-today's-app.

## Not doing it now because

The fix is a design decision about `GraphQLContext`, not a patch. Options, in
rough order of how much they change:

1. Read the cookie in `buildContext` (via `readMembershipPreference`) and put
   the selected membership on the context. Simple, but couples the graph to a
   Next cookie — awkward for the bearer/mobile path, which has no cookie.
2. Accept an explicit membership argument on membership-scoped operations, with
   the caller supplying it. Honest and transport-neutral; touches every
   signature and re-opens "never accept membership from the client", so it
   needs the server to validate ownership (`private.owns_membership` already
   does exactly that).
3. A hybrid: cookie for the in-process path, explicit argument for bearer.

Task 06 (the cutover pilot) is the right place to settle it, since it is the
first task where a real surface reads through the graph.

## Possible fix

Whichever option wins, the regression test is the one written to find this:
give a member two active memberships, choose the second, and assert the graph
resolves the same membership the page resolves. It lives naturally beside the
`resolver argument defaults` block in
`app/tests/integration/graphql/parity.int.test.ts`, and the fixture already
builds the two-organization member (`world.multiOrgMember`).
