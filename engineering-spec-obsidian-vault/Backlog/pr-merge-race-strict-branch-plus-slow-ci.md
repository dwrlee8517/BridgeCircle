---
type: risk
area: ci
severity: medium
found_during: merging the engineering-spec vault (PR #183)
date: 2026-08-12
---

# Strict up-to-date branches plus ~8min CI makes merging a race that busy days can lose

## What I saw

`.github/workflows/e2e.yml` · repo merge settings

Three settings interact badly:

1. `main` requires a PR branch be **up to date with the base** before merging.
2. Updating the branch restarts CI, and the pole is Playwright at **~8 minutes**
   (`workers: 1`, `app/playwright.config.ts:27`).
3. Repo **auto-merge is disabled** — `gh pr merge --auto` fails with
   `Auto merge is not allowed for this repository (enablePullRequestAutoMerge)`.

So the sequence is: update branch → wait ~8 min → try to merge → if `main`
moved during that window, the branch is stale again → repeat.

On 2026-08-12, `main` was taking a merge roughly every 5–15 minutes from
parallel sessions. PR #183 lost this race **three times in a row** with all
checks green each time; it landed only after a fourth cycle. Every lost cycle
also re-ran the full e2e suite, which is what exhausted the auth rate limit
behind [[e2e-console-assertion-fails-on-transient-429]].

## Why it might matter

The failure mode is self-reinforcing: the busier the repo, the more merge
cycles are lost, and each lost cycle burns another full CI run that makes the
shared dev tier flakier for everyone. It also scales the wrong way — it gets
worse precisely when parallel work is highest.

Today the cost is wasted minutes and CI spend, not incorrectness. Worth naming
now because the obvious escape hatch is `--admin`, and a team that gets used to
bypassing required checks to beat a race has quietly turned the checks off.

## Not doing it now because

Noticed while merging a docs-only PR. Repo merge settings are a
maintainer-level decision, not something to change inside an unrelated change.

## Possible fix

Cheapest first:

- **Enable auto-merge on the repo** (Settings → General → Allow auto-merge).
  Then `gh pr merge --auto` queues once and GitHub lands it when conditions are
  met — the race disappears without weakening any gate. This is almost
  certainly the right fix.
- Consider whether the **up-to-date requirement** needs to apply to every PR, or
  only to those touching `app/`. A docs-only PR cannot be broken by a
  concurrent `main` merge, and `.github/workflows` already detects docs-only
  PRs (the "Detect docs-only PRs" job).
- Longer term, shard Playwright to cut the ~8 min pole. `workers: 1` is
  deliberate (cold-compile timeouts, see the comment at
  `app/playwright.config.ts:29`), so this is not a free change.
