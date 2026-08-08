# Feature parity — web ↔ mobile

This directory keeps the Next.js app (`app/`) and the Expo app (`mobile/`) honest
about each other. It exists so that shipping a web surface *forces* the mobile
question to be answered — even if the answer is "not yet" or "never."

> **Not to be confused with the GraphQL parity harness.** `app/src/graphql/parity/manifest.ts`
> and [`docs/architecture/graphql-parity.md`](../docs/architecture/graphql-parity.md)
> are about a different axis: proving the v2 GraphQL data plane matches the `/lib`
> path it replaces. That's *capability* parity within web. This directory is
> *surface* parity across platforms. Two manifests, two questions.

Run it from anywhere:

```bash
node parity/check-parity.mjs
```

Or `pnpm check:parity` from either `app/` or `mobile/`.

## What counts as failure

This is the design decision everything else follows from. Mobile is a boots-only
shell and will trail web by months — [ADR 0016](../docs/decisions/0016-native-mobile-via-expo.md)
authorizes the Expo shell and its build pipeline, **not parity**. A check that
failed on "mobile is behind" would be red permanently and get switched off inside
two weeks.

So failure means **undeclared drift or regression**, never incompleteness:

| Condition | Policy |
|---|---|
| A `page.tsx` exists that no feature claims | 🔴 hard fail |
| A feature claims a route with no `page.tsx` (stale manifest) | 🔴 hard fail |
| `wont-do` without a `reason` **and** a `decision` link | 🔴 hard fail |
| `gated` without a `decision` link | 🔴 hard fail |
| A `decision` link that no longer resolves on disk | 🔴 hard fail |
| Tagged coverage exists for a platform declared `wont-do` | 🔴 hard fail |
| A test tagged with an unknown feature id | 🔴 hard fail |
| `shipped` on a platform with no test tagged there | 🟠 gap — ratchet |
| Mobile at 0 of 23 in-scope surfaces | 🟡 report only |

Everything red means *your diff did something you didn't declare*. Everything
yellow is the known gap, which gets reported and trended but never blocks.

## Pieces

| File | Role |
|---|---|
| `features.json` | The manifest — every user-facing feature, the routes it owns, and a **status per platform**. |
| `check-parity.mjs` | The enforcer. Node builtins only, no dependencies. |
| `parity-baseline.txt` | Known gaps — the ratchet, same shape as `app/scripts/design-tokens-baseline.txt`. |
| `report.mjs` | The soft half: a delta against the merge base, written to the job summary and a sticky PR comment. Never fails. |
| `window-classes.json` | The shared breakpoint contract: `compact` (<761), `medium` (761–1023), `expanded` (≥1024). |

CI wiring lives in [`.github/workflows/parity.yml`](../.github/workflows/parity.yml).
It has no `paths-ignore` on purpose: `features.json` cites decision documents by
path, so a docs-only PR that renames one is exactly the diff that breaks a link,
and exactly the diff `ci.yml`'s docs-only gate would skip.

## Statuses

Every feature declares one per platform. The point of having four is that
**deliberate non-parity is a correct answer** — a "must match" rule can't say
that, so it gets gamed instead.

| Status | Meaning | Required alongside |
|---|---|---|
| `shipped` | Built and wired | tagged test coverage, or the gap is baselined |
| `planned` | Decided, not built | nothing; counts against the coverage ratio |
| `gated` | Deliberately **undecided** — deferred, not owed | `decision` |
| `wont-do` | Deliberate non-parity | `reason` **and** `decision` |

`gated` is the one doing the heavy lifting right now: it's what ADR 0016's
"feature work on mobile stays gated" looks like as data. It keeps 23 surfaces out
of the debt column without pretending they're finished, and without claiming a
decision was made that wasn't.

`wont-do` is currently the admin console (7 surfaces) — desktop-primary by
decision, per `app/CLAUDE.md`: "Admin tables can be desktop-primary."

You can always mark something `wont-do`. You just can't do it without writing
down why and linking a decision — which is the friction that stops "mark it
`wont-do`" from being the cheapest route to green.

## How coverage is counted

- **Web** — a Playwright spec under `app/tests/e2e/` tagged `@feature:<id>`.
- **Mobile** — a Maestro flow under `mobile/e2e/flows/` tagged `feature:<id>`.

Tags are currently header comments (`// Parity coverage (see parity/README.md): @feature:x`).
That makes them greppable but not executable — a comment can drift from what the
spec actually does. Upgrading them to real Playwright `tag:` arrays, so
`--grep @feature:help.hub` runs exactly that coverage, is worth doing and hasn't
been done yet.

Coverage claims here were verified against what each spec actually navigates to.
Two claims inherited from the earlier draft of this system did not survive that
check: `help-give.spec.ts` never exercises an offer, and `durability.spec.ts`
only hits a not-found event page. Both are now honest gaps in the baseline rather
than fictional coverage.

## Layout coverage

`features.json` declares which window classes each feature owes, and
`check-parity.mjs` can enforce it — but `enforce.layouts` is `false`, because the
runners aren't there yet: web needs the `chromium-compact` / `chromium-medium`
Playwright viewport projects, and mobile needs a tablet runner. Declaring debt we
have no way to pay is how a ratchet earns a reputation for crying wolf.

Flipping `enforce.layouts` to `true` is the commit that ports those runners.

## The loop for a new feature

1. Build the web surface. The new route fails `check:parity` until `features.json`
   claims it — that's the hook that makes this impossible to forget.
2. Declare a status for **both** platforms. For mobile that's almost always
   `gated` today, pointing at ADR 0016.
3. Write the web spec, tagged `@feature:<id>`.
4. If the surface ships without coverage, record it:
   `node parity/check-parity.mjs --update`. The baseline diff is the visible,
   reviewable IOU.

When mobile does pick up a surface, flip its status to `shipped` and add the
Maestro flow. Closing a gap prints a "ratchet down" note — re-run with `--update`
in that PR so the baseline only ever shrinks.

## Not covered here

This is surface-level parity: does the screen exist, and is it exercised. Three
other kinds of parity need different mechanisms, and none of them live here yet:

- **Business-rule parity** — structural, via a shared package. Blocked on the
  `apps/` + `packages/` restructure (see ADR 0016).
- **Capability parity** — diff the generated GraphQL SDL and each client's
  operation manifest, off the v2 Pothos/Yoga data plane.
- **Flow parity** — assert that a flow emits the same ordered analytics events on
  both platforms, against a shared collector stub.
- **Visual parity** — one token source generating both the web `@theme` block and
  an RN theme object.
