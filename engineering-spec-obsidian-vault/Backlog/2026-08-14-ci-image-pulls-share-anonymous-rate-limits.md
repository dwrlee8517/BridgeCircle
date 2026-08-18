---
type: risk
area: ci
severity: low
found_during: E2E audit during the design-system org migration, then corrected after two verification runs
date: 2026-08-14
---

# CI image pulls ride on shared anonymous rate limits at two registries

## What I saw

`.github/workflows/e2e.yml` and `.github/workflows/ci.yml` — both boot the local
Supabase stack, and `supabase start` pulls from **two** registries:

- `public.ecr.aws/supabase/*` — postgres, postgrest, realtime, storage-api,
  postgres-meta, mailpit (the bulk of the stack)
- `docker.io` — the remainder

Both throttle anonymous pulls **per source IP**, and GitHub-hosted runners share
those addresses with every other tenant, so the allowance empties at moments
unrelated to this repo. Observed twice, both times as
`toomanyrequests: Rate exceeded`: runs
[31662794821](https://github.com/dwrlee8517/BridgeCircle/actions/runs/31662794821)
and
[31827573332](https://github.com/dwrlee8517/BridgeCircle/actions/runs/31827573332).

## Why it might matter — and the honest measurement

**It has never failed a run.** Last 30 E2E runs: 28 success, 2 cancelled, 0
failed. Both observed throttles recovered on their own.

An earlier version of this entry claimed this was a confirmed cause of E2E
flakiness that blocked merges. That was inference from a frightening log line,
not measurement, and the measurement contradicts it. Corrected here so the next
reader doesn't inherit the overstatement.

The residual risk is real but small: if a throttle ever outlasts the retries,
`E2E gate` is a required check with `strict: true`, so it would block merges
until the limit refilled.

## What was already done

- **Docker Hub login in `e2e.yml`** (`docker/login-action`, `continue-on-error`).
  Covers the `docker.io` subset only — this was originally added believing Docker
  Hub was the whole story, which it is not. It still helps, so it stays.
  Deliberately **not** added to `ci.yml`'s integration job, because that job is
  designed to hold no secrets and therefore be unable to reach a remote database.
- **Bounded retry around `supabase start`** in both workflows: three attempts,
  `supabase stop` between them, backoff of 20s then 40s, with a distinguishable
  error if all three fail.

## Not doing more now because

Two heavier options exist and neither earns its cost at zero observed failures:

- **Caching the images** between runs. They total roughly 2 GB; saving and
  restoring that is likely slower than the pull it replaces, on every run, to
  avoid an event that has never broken anything.
- **Authenticating to `public.ecr.aws`**, which would cover the bulk of the
  stack. Needs an AWS account and an IAM user whose credentials then live in CI —
  real setup and a new secret to rotate.

## Possible fix, if it ever does start failing

Escalate in this order: raise the retry count first (cheapest, no new
dependencies); then authenticate to ECR Public; then cache images, measuring
save/restore against pull time before committing to it. If the failures cluster
by time of day rather than randomly, that points at the shared-IP theory and
authentication is the right lever.
