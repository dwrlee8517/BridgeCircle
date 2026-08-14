---
type: risk
area: ci
severity: high
found_during: Node 20 action updates — trying to verify a cd.yml change and finding nothing could run
date: 2026-08-14
---

# An un-actioned production approval silently stops every future deploy

## What I saw

`.github/workflows/cd.yml:36` — workflow-level concurrency:

```yaml
concurrency:
  group: cd-main
  cancel-in-progress: false
```

The `promote` job is gated on the GitHub `production` environment, so it waits for
a human. A run parked at that gate is still **in progress**, so it holds
`cd-main` — and every later push queues behind it, with GitHub cancelling the
older pending run each time a newer one arrives.

That is not hypothetical. Run
[31276790199](https://github.com/dwrlee8517/BridgeCircle/actions/runs/31276790199)
(2026-08-08, `0c58f6e`) sat at the gate for **six days**. Measured over that
window:

```
CD runs since the jam:  7
  cancelled:            6
  completed:            0
```

So the scripted pipeline deployed nothing at all for six days. Cancelling the
stale run cleared the lane immediately: the queued run for `3d5cbbc` went from
`pending` to `in_progress` within seconds, and its dev deploy and integ tests
both passed — proving the pipeline itself is healthy. It then parked at the gate
and started holding the lane again, which is the whole problem.

## Why it matters

Three reasons this is worse than a stuck run:

1. **It is silent.** Nothing reports "CD has not run since Aug 8." The runs show
   as `cancelled`, which reads like someone cancelled them on purpose.
2. **A safety net is hiding it, and that net is scheduled for removal.** Per this
   workflow's own header, Railway auto-deploy still deploys both environments, so
   dev stayed current and nothing looked wrong. Phase 3 of
   `docs/architecture/dev-stage-cd-rollout.md` switches that off — after which
   the same jam stops dev deploys outright, with no fallback.
3. **It blocks its own rollout.** Phase 3 is gated on "this pipeline's first
   green run". A pipeline that cannot complete a run cannot produce one.

It also blocks ordinary work: a `cd.yml` change cannot be verified by any PR
check (CD triggers only on push to main and workflow_dispatch), and the intended
workaround — dispatching the workflow from a branch — joins the same concurrency
group and gets cancelled too. That is how this was found; see PR #192.

## Not doing it now because

Splitting a deploy pipeline is a change to the thing that ships code, and it
wants doing deliberately rather than as a side effect of a version bump. The
immediate jam is cleared, so nothing is on fire.

## Possible fix

The minimal correct change is to stop letting one waiting job hold the whole
pipeline's lane. Options, cheapest first:

1. **Move concurrency from the workflow to the jobs.** Drop the workflow-level
   `concurrency` block and give each job its own group — `cd-dev` for
   deploy-dev/integ, `cd-promote` for promote. Job-level groups are independent,
   so a promotion awaiting a decision no longer blocks dev deploys.
2. **Split promote into its own workflow**, triggered by `workflow_run` or a
   dispatch carrying the candidate SHA. Cleaner separation, more moving parts.

Either way, add an expiry habit for the gate: an approval nobody intends to give
should be cancelled the same day, not left pending. Worth a line in the rollout
doc, since the current design makes "leave it for later" quietly expensive.
