---
id: graphql-data-plane/00-land-account-slice
initiative: "[[Initiatives/graphql-data-plane/plan|GraphQL data plane]]"
status: in-progress
depends_on: []
pr: https://github.com/dwrlee8517/BridgeCircle/pull/217
---

# 00 — Land the account-lifecycle slice

## Cold start

PR #217 is finished code (account deletion scheduling, data export, email
change on the graph — `app/src/graphql/entities/account.ts`) that was verified
green (tsc 0, 569 vitest, eslint/biome clean) but kept losing the
branch-up-to-date merge race against a busy main. Nothing needs writing; this
task is only: get it merged.

## Scope

**In:** merge PR #217; delete the branch after state reports MERGED.

**Out:** any code change. If CI is red for a real reason, that becomes a new
task.

## Steps

1. `gh pr view 217 --json mergeStateStatus` → if `BEHIND`:
   `git merge origin/main --no-edit && git push` on `claude/graphql-account`,
   wait for CI.
2. Tight-poll (~20s): merge the instant it is `CLEAN` —
   `gh pr merge 217 --merge`. Never `--admin` without asking Daniel on this PR.
3. Playwright failing with Docker `toomanyrequests` is infra, not code:
   `gh run rerun <run-id> --failed`.
4. Only after `state: MERGED`: `git push origin --delete claude/graphql-account`
   (deleting the head branch of an OPEN PR auto-closes it).

## Verification

```bash
gh pr view 217 --json state --jq .state   # MERGED
```

## Done when

- [ ] PR #217 state is MERGED
- [ ] `claude/graphql-account` deleted from origin

## Handoff notes

*Filled in by the session that does this task.*
