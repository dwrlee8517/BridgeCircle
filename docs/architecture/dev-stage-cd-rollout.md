# Dev stage + scripted CD — rollout plan

Working plan for [ADR 0014](../decisions/0014-scripted-cd-pipeline.md).
Executed on branch `dev-stage-cd`. Check items off as they land; delete this
doc (or archive it) when Phase 6 folds the durable parts into
[`environments.md`](environments.md) and
[`../runbooks/migration-workflow.md`](../runbooks/migration-workflow.md).

Owner tags: **[R]** = Richard (dashboards, DNS, tokens — things only a human
with the accounts should touch). **[C]** = Claude (repo files, verification).

## Coordinates

| Thing | Value |
|---|---|
| Railway project | `BridgeCircle` · `07bf44ac-b1e9-4eb0-bbf7-6e61d9626fa1` |
| Railway service | `BridgeCircle` · `70333670-3490-45f5-b87a-9e5be862ab1c` |
| Railway prod env | `production` · `f4d76a24-6718-4801-932e-d676aef653d7` |
| Railway dev env | *created in Phase 1* |
| Supabase dev | `bridgecircle-dev` · `ojpvahiuafdcynbdbmri` |
| Supabase prod | `bridgecircle` · `edumxwzilfgvamzarwvo` |
| Dev URL | `https://dev.bridgecircle.org` (Cloudflare DNS) |
| Decisions | PRs into `main` stay (branch protection); manual approval before prod: **yes** |

## Secrets ledger (GitHub → Settings → Secrets and variables → Actions)

| Secret | Used by | Scope |
|---|---|---|
| `DOPPLER_TOKEN` | existing CI + integ | already present |
| `RAILWAY_DEV_TOKEN` | `railway up` → dev | project token scoped to the **dev** environment |
| `RAILWAY_PROD_TOKEN` | `railway up` → prod | project token scoped to **production**; store as an **environment secret** on the GitHub `production` environment |
| `SUPABASE_ACCESS_TOKEN` | `supabase db push` | personal access token |
| `SUPABASE_PROD_DB_PASSWORD` | prod `db push` | prod DB password; environment secret, same as above |

Never in Doppler dev configs, never in `.env*`, never echoed in workflow logs.

---

## Phase 1 — dev environment + dev.bridgecircle.org

- [ ] **[R]** Railway dashboard → BridgeCircle project → Environments → **New
  environment** → duplicate `production`, name it `dev`.
- [ ] **[R]** In the `dev` env's service variables: point every Supabase var
  at the dev stack (`NEXT_PUBLIC_SUPABASE_URL=https://ojpvahiuafdcynbdbmri.supabase.co`,
  dev publishable + secret keys), keep the rest (Resend/Anthropic/…) as-is for
  now. If prod injects via Doppler, mirror with a Doppler service token for
  the dev config instead.
- [ ] **[R]** Scaffolding only: leave the dev env's auto-deploy from `main`
  **on** for now (Phase 3 turns it off when the pipeline takes over).
- [ ] **[R]** Dev env service → Settings → Networking → **Custom domain** →
  `dev.bridgecircle.org`. Railway shows a CNAME target (`….up.railway.app`).
- [ ] **[R]** Cloudflare dashboard → bridgecircle.org → DNS → add
  `CNAME  dev  <railway-target>` — start **DNS-only** (grey cloud) so
  Railway can issue its cert; flipping the proxy on later requires
  SSL/TLS mode **Full (strict)**.
- [ ] **[R]** Supabase **dev** project → Authentication → URL Configuration →
  Site URL `https://dev.bridgecircle.org`, add
  `https://dev.bridgecircle.org/**` to redirect URLs.
- [ ] **[C+R]** Verify: push to `main` → dev env builds → sign in at
  `dev.bridgecircle.org` → confirm the data is `bridgecircle-dev`.

## Phase 2 — version endpoint + integ suite (observe-only)

- [ ] **[C]** `app/src/app/api/version/route.ts` returning the running
  commit SHA (done in this branch).
- [ ] **[C]** `cd.yml` with `deploy-dev` (initially: wait-for-live via
  `/api/version`) and `integ` (Playwright, `PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org`,
  no local `webServer`) — **not gating anything yet**.
- [ ] **[C]** Integ data hygiene: seeded `test_`-prefixed users via the
  existing admin-client pattern; suite cleans up after itself.
- [ ] **[R]** Add `RAILWAY_DEV_TOKEN` secret (Railway → project → Settings →
  Tokens → scope: dev environment).
- [ ] Let it run green on a few merges before Phase 3.

## Phase 3 — pipeline owns dev + prod code deploys

- [ ] **[R]** GitHub repo → Settings → Environments → create `production` →
  required reviewer: you. Add `RAILWAY_PROD_TOKEN` +
  `SUPABASE_PROD_DB_PASSWORD` as environment secrets there.
- [ ] **[C]** `deploy-dev` switches to `supabase db push` (dev, idempotent) +
  `railway up --environment dev` (blocking); `promote` job added
  (`needs: integ`, environment `production`): `railway up` → prod.
- [ ] **[R]** Railway: turn **off** auto-deploy in **both** envs (service →
  Settings → Source/Deploy triggers) once the first scripted run is green.
- [ ] **[C+R]** Verify both directions: a good merge promotes after approval;
  a deliberately broken integ test leaves prod untouched.

## Phase 4 — pipeline owns prod migrations (last, highest blast radius)

- [ ] **[R]** Add `SUPABASE_ACCESS_TOKEN` secret.
- [ ] **[C]** `promote` gains `supabase db push` → prod **before**
  `railway up`, non-interactive, with the password from environment secrets.
- [ ] **[C+R]** Dry-run: a no-op migration through the full path first.
- [ ] **[R]** Supabase dashboard → prod project → Integrations → **disconnect
  the GitHub integration** (this also ends preview branches — see ADR 0014).
- [ ] **[C+R]** Verify: one real additive migration end-to-end.

## Phase 5 — guardrails

- [ ] **[C]** `APP_ENV=dev` in the dev env; gate on it: Sentry
  `environment`, `X-Robots-Tag: noindex` on dev, cron/sweep no-ops for paid
  enrichment APIs (BrightData/PDL) outside prod.
- [ ] **[R]** Decide dev email posture: dev Resend sender or recipient
  allowlist — a dev test must never email a real member.

## Phase 6 — docs settle

- [ ] **[C]** Update `migration-workflow.md` (drop "the integration owns
  prod"; describe the pipeline; fix the stale "Free project" + pre-Doppler
  wording), `environments.md`, `app/CLAUDE.md`, `INDEX.md`; archive this doc.

## Sequencing rules

1. Never disable an automation before its scripted replacement has run green.
2. Phase 4 is last: it is the only phase that removes a safety net
   (preview-branch validation).
3. The `cd.yml` PR merges only after the Phase-1 dashboard work exists,
   otherwise every push to `main` fails the workflow.

## Known wrinkles

- `railway up` builds CI-uploaded source, so `RAILWAY_GIT_COMMIT_SHA` may be
  absent in scripted deploys. The workflow stamps the SHA itself (env var set
  via `railway variables --set GIT_SHA=$GITHUB_SHA` before `up`, or a
  generated `version.json`); `/api/version` reads the stamp first and falls
  back to Railway's var so the endpoint works in both the scaffolding and
  scripted eras.
- Playwright's `webServer` must be skipped when `PLAYWRIGHT_BASE_URL` points
  at a remote host — config change in Phase 2.
- Second always-on service ≈ double compute; enable app sleeping on dev if
  cost matters.
