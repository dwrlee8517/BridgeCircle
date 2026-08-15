---
type: debt
area: auth
severity: low
found_during: lib-discipline review of the demo-door surfaces
date: 2026-08-14
---

# `lib/auth/app-url.ts` imports `next/headers` from inside `/lib`

## What I saw

`app/src/lib/auth/app-url.ts:2`

`getAppOrigin()` lives under `src/lib/` but imports `next/headers` (and
`server-only`), violating the /lib rule that lib modules must not import
Next.js. Callers across the app (sign-in actions, auth callback, the new demo
door) depend on it.

## Why it might matter

The /lib discipline exists so business logic stays portable (worker, mobile,
tests). This helper is pure edge plumbing — it can never run outside a Next
request — so its current home misstates what it is. New code copies the pattern
(this is how it was found: the demo-door review flagged it as the one
Next-coupled import reachable from lib).

## Not doing it now because

Found during the demo-door build; moving it touches every auth caller and is
out of that change's scope.

## Possible fix

Move it to `app/src/app/_lib/app-url.ts` next to `membership-cookie.ts` (the
sanctioned home for Next-coupled helpers) and update imports — mechanical,
~10 call sites.
