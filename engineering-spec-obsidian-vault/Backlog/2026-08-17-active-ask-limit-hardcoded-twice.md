---
type: debt
area: help
severity: medium
found_during: writing the asks tech spec
date: 2026-08-17
---

# The five-active-ask limit is hard-coded in two places that nothing keeps in sync

## What I saw

`app/supabase/migrations/20260713231344_v2_init.sql:4333` — enforcement:

```sql
if v_active_count >= 5 then
  return query select 'active_limit_reached'::text, null::uuid, v_active_count, false;
```

`app/supabase/migrations/20260713231344_v2_init.sql:8450` — what the UI is told,
inside `api.get_help_home`, as a bare positional literal:

```sql
    5,
    coalesce(hp.open_to_help, true),
```

That second `5` becomes `HelpHome.activeAskLimit` and is what the member sees.
Two independent literals, no shared constant, no test asserting they agree.

Worth contrasting with the neighbouring cap: the per-helper inbox limit is
`helper_preferences.max_pending_requests`, a real column with a default and a
range check. The asker-side limit got a magic number instead.

## Why it might matter

Change one and the product lies. Raise enforcement to 8 and the UI still says
5, so members are told they are at the cap while the system would accept more.
Raise the displayed limit instead and they get a refusal the interface said
would not happen — the worse direction, because the failure lands at the moment
someone is asking for help, which is exactly where this product cannot afford
to feel arbitrary.

It is latent rather than live: both values currently read 5, so nothing is
broken today. The cost is that the next person to tune the limit has no way to
discover the second site except by reading the whole 10k-line migration.

## Not doing it now because

Found while writing the `Production/asks` tech spec. Changing a limit's
representation is a schema decision with a migration attached, not a note-taking
side effect.

## Possible fix

Give the limit one home and derive both readings from it. Cheapest is a
`private` constant function (`private.active_ask_limit()`) called from both
sites. If per-organization tuning is ever wanted, the honest version is a column
on the organization, mirroring how `max_pending_requests` already works for the
helper side.

Either way it wants a pgTAP assertion that the enforced limit and the reported
limit are equal, since that is the invariant actually at risk.
