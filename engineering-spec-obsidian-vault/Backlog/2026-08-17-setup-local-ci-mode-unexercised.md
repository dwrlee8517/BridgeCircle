---
type: debt
area: ci
severity: low
found_during: rebasing the one-command local setup (PR #155) onto main
date: 2026-08-17
---

# `setup-local.sh` has a CI mode nothing runs

## What I saw

`app/scripts/setup-local.sh:20` — the script branches on `$CI` throughout
(Doppler service-token auth instead of a login check, no directory scoping,
`-x studio,vector` on the stack, `playwright install --with-deps`).

Nothing exercises those branches. `.github/workflows/e2e.yml` does the same
work as discrete steps and never calls the script.

That was the deliberate resolution when PR #155 was rebased: the PR replaced
the workflow's setup steps with `pnpm run setup:local --e2e`, but `e2e.yml` has
since grown two pieces of hardening the script has no equivalent for — a
`continue-on-error` Docker Hub login (`e2e.yml:101`) and a bounded retry around
`supabase start` for anonymous-pull throttling (`e2e.yml:121`). Taking the PR's
side would have deleted both, so CI kept its own path.

## Why it might matter

Low, but it decays. Untested branches are wrong by default eventually, and this
one carries the CI Doppler auth path — the thing most likely to be edited by
someone who cannot easily test it. The comment block at the top of the script
now says CI does *not* call it, so no one is actively misled; the risk is that
the branches quietly rot until the consolidation below is more expensive than
it looks today.

## Not doing it now because

The task was rebasing a two-week-stale PR, not redesigning the E2E workflow.
Porting the retry into the script means bringing GitHub Actions concerns
(`::warning::` annotations, attempt backoff) into a script developers run on
their laptops — a design question, not a merge conflict.

## Possible fix

Either consolidate — move the retry and a no-op-locally Docker-login step into
`setup-local.sh`, then reduce `e2e.yml` to one call — or delete the `$CI`
branches and let the script be honestly local-only. Both are defensible; the
current middle state is the one that rots.

Related: [[2026-08-14-ci-image-pulls-share-anonymous-rate-limits]].
