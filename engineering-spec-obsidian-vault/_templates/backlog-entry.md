---
type: oddity           # oddity | debt | bug | cleanup | question | risk
area: <module>         # asks, auth, search, db, ci, enrichment, …
severity: low          # low | medium | high — how bad if left alone
found_during: <what you were doing when you hit this>
date: YYYY-MM-DD
---

# <Short title — the finding, not the fix>

## What I saw

`app/src/lib/<module>/<file>.ts:<line>`

What is actually there, stated plainly. Include the path and line — the
expensive part of acting on a backlog entry is finding the thing again.

## Why it might matter

The consequence if left alone. If you are not sure it matters, say that — a
logged "this looks wrong and I did not have time to confirm" is more useful than
silence and cheaper than a wrong confident claim.

## Not doing it now because

The task in hand, and why this is out of its scope.

## Possible fix

One or two sentences, if you have a view. Optional — a finding without a
proposed fix is still worth logging.
