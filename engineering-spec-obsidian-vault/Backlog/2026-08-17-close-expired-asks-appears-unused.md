---
type: cleanup
area: help
severity: low
found_during: writing the asks tech spec
date: 2026-08-17
---

# `private.close_expired_asks` looks dead — expiry is handled inline elsewhere

## What I saw

`app/supabase/migrations/20260713231344_v2_init.sql:7009`

```sql
create function private.close_expired_asks(p_limit integer default 100)
```

Searching the repo for the name returns the definition and exactly one other
hit — `app/supabase/tests/database/004_foundation_security.test.sql:132`,
asserting `authenticated` does **not** hold execute on it. No SQL function, no
worker, no route calls it.

Expiry is actually done inline by `private.run_help_maintenance`
(`:7506`–`:7520`), which selects `waiting`/`open` asks past `expires_at` and
closes them. That path is live — the Railway worker calls
`api.run_help_maintenance` every 60s.

## Why it might matter

Mostly a reading hazard rather than a runtime one. Someone tracing "how do asks
expire?" finds a plausibly-named function, reads it, and believes they have
found the mechanism — while the code that actually runs is 500 lines further
down. I did exactly that while writing the tech spec, and only caught it by
grepping for callers.

A dead `security definer` function is also a small standing surface: it stays
grantable, and the test proving it is not granted implies it is part of the
design.

I have **not** ruled out that it is intentionally kept for manual operator use.
If so it deserves a comment saying so, which would resolve this entry just as
well as deleting it.

## Not doing it now because

Found while writing the `Production/asks` tech spec. Dropping a function is a
migration, and forward-only migration discipline means it should ride with a
change that has a reason to touch this area.

## Possible fix

Confirm no operator runbook depends on it, then drop it in the next migration
that touches help — or keep it and add a comment naming it an operator-only
manual tool, so the next reader is not misled.
