---
type: risk
area: ci
severity: high
found_during: design-system org migration (PR #187) — checking why E2E looked unreliable
date: 2026-08-14
---

# E2E pulls Supabase images from Docker Hub unauthenticated, and has already hit the rate limit

## What I saw

`.github/workflows/e2e.yml:94` — `pnpm exec supabase start -x studio,imgproxy,vector,logflare`

That command pulls the local Supabase stack's images (Postgres, Kong, auth, realtime, storage…)
from Docker Hub. There is **no `docker/login-action` step anywhere in the workflow**, so the pull
is anonymous.

It has already failed in a real run. [Run 31662794821](https://github.com/dwrlee8517/BridgeCircle/actions/runs/31662794821),
`Playwright vs local stack (chromium)`:

```
failed to pull docker image: Error response from daemon: toomanyrequests: Rate exceeded
failed to display json stream: toomanyrequests: Rate exceeded
```

That run recovered and went on to pass (52 tests, 49 passed, 3 skipped, 3.9m), so nobody noticed.

## Why it might matter

GitHub-hosted runners share NAT egress IPs, so anonymous Docker Hub pulls draw on a shared limit
that is regularly exhausted — the failure is time-of-day dependent, not code dependent. When the
retry doesn't save it, `E2E gate` goes red on a PR whose diff is irrelevant to the failure.

`E2E gate` is a **required** status check on `main` with `strict: true`, so this doesn't just add
noise: an exhausted limit blocks merges outright, and the natural response ("re-run it") teaches
everyone to re-run red E2E, which is exactly the habit that hides a genuine regression later.

## Not doing it now because

PR #187 is docs-only (the Playwright job legitimately skips on it), and touching a workflow file
would make it a code PR and pull the whole suite into an unrelated review.

## Possible fix

Add `docker/login-action@v3` before the `supabase start` step, authenticated with a Docker Hub
account — even the free authenticated tier raises the limit well clear of this. Store the PAT as a
repo secret. Alternatively (or additionally) cache the image layers between runs, or mirror the
handful of Supabase images to GHCR, which has no comparable anonymous limit for this use.
