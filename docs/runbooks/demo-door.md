# The demo door (hosted dev only)

A time-boxed, no-onboarding way to show BridgeCircle to someone who has no
account: an operator arms a window from `/demo/arm`, shares the one-time link
it mints, and anyone holding that link enters `dev.bridgecircle.org` as the
seeded demo persona — a real Supabase session, scoped by RLS to the synthetic
demo organization like any other member. Outside an armed window, `/demo` is a
404 and behaves as if it does not exist.

## Why it is safe to have

- **Fail-closed gate** (`app/src/lib/demo/gate.ts`): the door requires
  `DEMO_LOGIN_ENABLED=1` **and** `APP_ENV=dev` **and** the exact
  `https://dev.bridgecircle.org` origin (or `APP_ENV=local` + localhost for
  development of the door itself). Production never sets the flag; if it ever
  did, the env and origin assertions still refuse — loudly, in the log.
- **No auth is weakened, and no standing credential exists.** The persona's
  password is random, unrecorded, and rotated on every reseed — nobody can
  sign in as it through `/sign-in`, ever. The door mints a one-time entry
  token via the auth admin API and consumes it immediately, issuing a normal
  low-privilege session. Every guard and every RLS policy runs unchanged.
- **The door verifies its own persona.** After sign-in it asserts the account's
  selected membership is in the org with slug `demo`; a mispointed
  `DEMO_USER_EMAIL` refuses entry (404 + sign-out) instead of admitting
  visitors into a real account.
- **Tokens are never stored** — `public.demo_access_windows` holds sha256
  hashes only, and each arming revokes all previous windows, so an escaped old
  link is dead forever.
- **Sessions get bounded.** Arming or closing calls
  `api.demo_revoke_sessions()`, which deletes auth sessions only for users
  whose active memberships are *exclusively* in the org with slug `demo` — a
  real person who also joined the demo org is never signed out. App requests
  cut off on the next `getUser()` check; an already-open Realtime websocket can
  linger up to the access-token TTL (~1 h) on synthetic data.
- **Operators are allowlisted.** `/demo/arm` requires a real signed-in session
  whose email is in `DEMO_ARM_EMAILS`; everyone else sees a 404.

The accepted residual risk: while a window is open, everyone with the current
link shares the demo identity and can mutate demo-org data (messages, RSVPs,
AI composer calls on our API budget). Reseeding erases it. This design stops
being appropriate the day the dev database holds real member data — revisit it
then.

## Environment (Doppler `bridgecircle/dev` only — never `prd`)

| Var | Meaning |
|---|---|
| `DEMO_LOGIN_ENABLED` | `1` to let the door exist on this deployment |
| `DEMO_USER_EMAIL` | demo persona email (seed default `demo-member@example.com`) — no password exists |
| `DEMO_ARM_EMAILS` | comma-separated operator emails allowed to arm/close |
| `NEXT_PUBLIC_APP_URL` | must be set explicitly when the flag is on — the gate refuses header-derived origins |

Doppler→Railway sync does not auto-redeploy: after changing these, redeploy
the dev service for them to take effect.

## Seeding the demo organization

```bash
cd app
pnpm seed:demo-org                    # local stack
```

Against hosted dev (deliberate, guarded):

```bash
DEMO_ALLOW_REMOTE=1 SUPABASE_DB_URL=<dev pooler url> pnpm seed:demo-org
```

Creates the `demo` org (fixed id, auto-join), the sign-in-able persona
Jamie Rowe, curated School content, and then chains `seed-scale.sh` to generate
a realistic population (default 1200; `DEMO_ORG_MEMBERS=0` skips). Rerun any
time to reset the org to pristine — visitor leftovers are erased.

**Caveat:** the generated population tier maintains ONE `dddddddd-` population
per database. Chaining it here moves that population into the demo org; if
`seed:scale` had previously populated Chadwick International on that database,
those generated members migrate. Tier 1 personas are untouched.

## Operating it

1. Sign in on dev with an allowlisted account, open `/demo/arm`.
2. Pick a duration (30 min / 2 h / 8 h) and arm. Copy the link — it is shown
   once and never recoverable; arm again for a fresh one.
3. Share the link. Visitors land on Home as the persona; deep-link with
   `/demo?k=…&next=/people` if needed.
4. Optional: reseed before arming so every demo starts clean.
5. "Close now" ends the window early and signs out anyone inside (within the
   access-token TTL). Expiry needs no action.

## Surfaces

- `GET /demo?k=<token>` — the door ([route.ts](../../app/src/app/demo/route.ts))
- `/demo/arm` — operator page ([page.tsx](../../app/src/app/demo/arm/page.tsx))
- `app/src/lib/demo/` — gate, tokens, window logic (unit-tested)
- `app/supabase/migrations/20260814183216_demo_access_windows.sql` — table + RPC
- `app/scripts/seed-demo-org.sh` — data
- e2e: `app/tests/e2e/demo/door.spec.ts` (fail-closed assertions, both suite modes)
