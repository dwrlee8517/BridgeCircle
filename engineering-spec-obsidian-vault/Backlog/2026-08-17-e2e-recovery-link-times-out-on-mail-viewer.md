---
type: flake
area: entry-operations
severity: medium
found_during: adding e2e coverage for the GraphQL endpoint
date: 2026-08-17
---

# The recovery-link e2e times out reading the local mail viewer

## What I saw

`app/tests/e2e/entry-operations/durability.spec.ts:47` — *"a recovery link works
once and a reused link cannot reopen password update"* — fails locally on every
run, at `waitForRecoveryLink`:

```
app/tests/e2e/entry-operations/durability.spec.ts:266
const response = await fetch(`http://127.0.0.1:54324/view/latest.html?query=${query}`)
```

Port 54324 is the local Supabase mail viewer. The helper polls it for the
password-recovery email and never finds one, so the test times out after 16s.

Verified pre-existing and unrelated to the change in hand: it fails identically
with the working tree stashed, on a freshly `db reset` database, both in a
full-suite run and when the file runs alone. Every other spec in that file
passes.

## Why it might matter

It is the only automated proof that a recovery link is single-use — the
"reused link cannot reopen password update" half is the security-relevant
assertion, and it currently never executes. A permanently red test also trains
people to read the suite as "1 known failure", which is how the second failure
gets missed.

Unknown whether this reproduces in CI. If CI is green, the cause is local
(mail-viewer container not serving `/view/latest.html`, or the recovery mail
never being delivered locally) and the fix is environmental. If CI is red too,
the test has been non-functional for longer than that.

## Not doing it now because

Found while adding `tests/e2e/api/graphql-endpoint.spec.ts`. Diagnosing local
mail delivery is its own thread and would have grown that diff without making
it any more correct.

## Possible fix

Start by checking the e2e job's history for this spec to place the blame local
vs. CI. If local: confirm what the mail container serves on 54324 (the API
shape may have moved) and prefer polling its JSON API over scraping
`view/latest.html`. If CI: the recovery mail is not being sent, which is a
product-side question about the reset flow, not a test-harness one.
