---
type: risk
area: e2e
severity: medium
found_during: merging the engineering-spec vault (PR #183, a docs-only change)
date: 2026-08-12
---

# A blanket console-error assertion fails the Foundation e2e on unrelated network noise

## What I saw

`app/tests/e2e/foundation/foundation-flow.spec.ts:38`

```ts
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), "browser console and page errors").toEqual([]);
});
```

`browserErrors` collects **every** `console.error` and `pageerror` on the page
(lines 29–34). The `afterEach` then asserts the list is exactly empty, so any
console error at all fails the test — including ones that have nothing to do
with the behavior under test.

That fired on PR #183:

```
1) foundation-flow.spec.ts:41:7 › database v2 Foundation
   › invite → password signup → onboarding → redesigned shell
+   "console: Failed to load resource: the server responded with a status of 429 (Too Many Requests)"
```

45 passed, 1 failed. PR #183 was **docs-only** — it changed no application
code, so it could not have caused a 429. The rate limit came from CI volume
against the shared dev Supabase auth endpoint (that branch alone triggered four
full runs, alongside other PRs).

Two aggravating details:

- `retries: process.env.CI ? 1 : 0` (`app/playwright.config.ts:35`) is already
  on, and the failure **survived the retry** — the rate-limit window is longer
  than the immediate re-run.
- The describe block is `mode: "serial"`
  (`foundation-flow.spec.ts:26`), so one victim can cascade to the tests after it.

## Why it might matter

The assertion cannot distinguish "the app logged an error because our code is
broken" from "a third-party request was throttled or timed out." So a green/red
signal that should track *our* correctness partly tracks *shared-infrastructure
weather* instead.

The cost is not just the lost run. A test that fails for reasons unrelated to
the diff teaches everyone to re-run rather than read it, and that habit is what
lets a real regression through. This failed on a change that touched only
markdown, which is about as clear a false positive as exists.

Worth confirming before acting: how often this fires when CI is *not* being
hammered. If it is rare, the assertion is doing more good than harm and only
needs an allowlist. I did not measure the base rate.

## Not doing it now because

Found while merging a docs-only PR. Changing an unrelated e2e spec to dodge a
rate limit would have been papering over infrastructure with a code change, and
would have grown a markdown-only diff into one touching test behavior. The
correct move at the time was to re-run, which passed.

## Possible fix

Filter the collected errors rather than asserting the raw list is empty: ignore
transient network/throttle noise (HTTP 429 and 5xx `Failed to load resource`,
Sentry ingest failures) while still failing on application errors. An explicit
allowlist keeps the assertion honest about what it is actually protecting.

If the 429s prove common, the deeper fix is upstream — the signup path in this
spec hits real Supabase auth, so per-run isolation or a seeded session would
remove the shared rate-limit dependency entirely.

---

## Update — 2026-08-17: why CI was hammered in the first place

The rate-limit exhaustion that triggered this was not ambient CI load. PR #183
added four empty `.gitkeep` files, which fell outside the docs-only filter's
allowlist and made a markdown-only PR run the full e2e suite four times. See
the correction in [[pr-merge-race-strict-branch-plus-slow-ci]]; the filter is
now fixed.

That removes the *cause of this instance* but not the finding. The assertion
still cannot distinguish an application error from throttled third-party noise,
so any future load spike — a busy afternoon, a genuinely code-touching PR
series — reproduces it. The base rate remains unmeasured.

Distinct from [[2026-08-14-ci-image-pulls-share-anonymous-rate-limits]], which
is registry pull throttling at container start; this is Supabase **auth**
throttling mid-test.
