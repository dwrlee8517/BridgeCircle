# Dev stage + scripted CD — rollout plan

> **Database-v2 update (2026-07-17):** every application domain has cut over to
> the v2 development database and the private dev outbox worker is running. The
> former development hold is spent. Production database reset, worker
> provisioning, and deployment remain blocked on their own explicit cutover
> approval; nothing in this older rollout plan authorizes them.

Working plan for [ADR 0014](../decisions/0014-scripted-cd-pipeline.md).
Executed on branch `dev-stage-cd`. Check items off as they land; delete this
doc (or archive it) when Phase 6 folds the durable parts into
[`environments.md`](environments.md) and
[`../runbooks/migration-workflow.md`](../runbooks/migration-workflow.md).

Owner tags: **[R]** = Richard (dashboards, DNS, tokens — things only a human
with the accounts should touch). **[C]** = Claude (repo files, verification).

**Reconciled 2026-07-11 with the parallel "CI/CD migration" effort** that had
been landing on main (its Phase 2, `/api/health`, arrived via PR #127 with a
7-phase plan of its own: railway.json healthcheck, post-deploy smoke.yml,
Actions-owned deploy.yml, auto-rollback). ADR 0014's pipeline subsumes it:
`/api/health` + `COMMIT_SHA` are the shared probe contract, cd.yml's
deploy-dev/promote replace its planned deploy.yml, and the integ gate covers
its smoke.yml intent (a prod-side post-promote smoke remains a candidate
enhancement). PR #127 also flagged separately: the proxy matcher 307s
`POST /api/cron/*` before bearer-token auth runs — pre-existing, tracked
outside this effort.

## Coordinates

| Thing | Value |
|---|---|
| Railway project | `BridgeCircle` · `07bf44ac-b1e9-4eb0-bbf7-6e61d9626fa1` |
| Railway service | `BridgeCircle` · `70333670-3490-45f5-b87a-9e5be862ab1c` |
| Railway dev worker | `BridgeCircle Worker` · `f39ee7fd-1ecc-4071-9794-f0c399b216b2` |
| Railway prod env | `production` · `f4d76a24-6718-4801-932e-d676aef653d7` |
| Railway dev env | *created in Phase 1* |
| Supabase dev | `bridgecircle-dev` · `ojpvahiuafdcynbdbmri` |
| Supabase prod | `bridgecircle` · `edumxwzilfgvamzarwvo` |
| Dev URL | `https://dev.bridgecircle.org` (Cloudflare DNS) |
| Decisions | PRs into `main` stay (branch protection); manual approval before prod: **yes** |

## Secrets ledger (GitHub → Settings → Secrets and variables → Actions)

Doppler is the secrets plane (decided Richard 2026-07-11): each CD job runs
under a **config-scoped Doppler service token** and pulls everything else —
including `RAILWAY_TOKEN` — from that config via `doppler run`. GitHub holds
only the two Doppler tokens.

| GitHub secret | Doppler scope | Used by |
|---|---|---|
| `DOPPLER_TOKEN` (repo-level, exists) | `bridgecircle/dev` — the "GitHub actions" service token, verified dev-scoped 2026-07-11 | quality · build · deploy-dev · integ |
| `DOPPLER_TOKEN_PRD` (**create**; environment secret on the gated `production` environment) | `bridgecircle/prd` — **no service token exists on `prd` yet** (CLI-verified; the dashboard's "github-actions-prd" token is not attached to this config — check its Manage pane) | promote only |

Everything with prod power lives in the `prd` config: `RAILWAY_TOKEN` (prod
scope, already there) and, in Phase 4, `SUPABASE_ACCESS_TOKEN` +
`SUPABASE_PROD_DB_PASSWORD`. Reading `prd` = prod deploy power, so
`DOPPLER_TOKEN_PRD` must only ever exist behind the reviewer gate.
The repo-level `RAILWAY_TOKEN_DEV` / `RAILWAY_TOKEN_PRD` GitHub secrets
(added 2026-07-11) are redundant under this design — delete them.

Note: GitHub already shows `BridgeCircle / dev` and `BridgeCircle / production`
environments — those are **Railway-created deployment records**, not gates.
Create a separate GitHub environment named `production`
(Settings → Environments) with a required reviewer; don't attach protection
rules to Railway's records.

Never in Doppler dev configs, never in `.env*`, never echoed in workflow logs.

---

## Phase 1 — dev environment + dev.bridgecircle.org

Done 2026-07-11 (verified by Claude the same day: dev env `85afea42-…`
auto-deploys from `main`; Doppler→Railway sync live in **both** envs —
`bridgecircle/dev` → dev env with the dev Supabase URL, `bridgecircle/prd` →
production with prod's; `dev.bridgecircle.org` CNAME → `w96fged0.up.railway.app`
serving with valid TLS; prod already on the `bridgecircle.org` apex).
The Doppler project was **renamed `bridgecircle-dev` → `bridgecircle`**
that day — the Supabase dev project keeps the `bridgecircle-dev` name.

- [x] **[R]** Railway `dev` environment (duplicate of `production`).
- [x] **[R]** Dev env variables via the Doppler sync (`bridgecircle/dev`).
- [x] **[R]** Auto-deploy from `main` on (scaffolding; Phase 3 turns it off).
- [x] **[R]** Custom domain `dev.bridgecircle.org` + Cloudflare CNAME.
- [ ] **[R]** Supabase **dev** project → Authentication → URL Configuration →
  Site URL `https://dev.bridgecircle.org`, add
  `https://dev.bridgecircle.org/**` to redirect URLs. **Unverified** —
  confirm by signing in at the dev URL.
- [ ] **[C+R]** Verify: sign in at `dev.bridgecircle.org` → confirm the data
  is the dev database.

### Issues found during Phase-1 verification (2026-07-11)

- [x] **[R]** `NEXT_PUBLIC_APP_URL` + `RESEND_FROM` added to both Doppler
  configs 2026-07-11; was a Railway-side unmanaged var inherited from
  production, now Doppler-managed. Dev sender is
  `BridgeCircle Dev <noreply-dev@bridgecircle.org>` — **shared verified
  domain, distinct local part** (a second Resend domain needs the Pro plan;
  decided against). Because dev sends from the real domain, the Phase-5
  dev recipient-allowlist guardrail is mandatory, not optional. Still open:
  - [x] **[C]** dev redeployed 2026-07-11 (after the NODE_ENV build fix);
    rendered deployment vars verified: `NODE_ENV=production`,
    `NEXT_PUBLIC_APP_URL=https://dev.bridgecircle.org`, dev `RESEND_FROM`;
    live URL serving (`/` 307 → `/sign-in` 200).
- [x] **[C]** `NODE_ENV=development` in the synced dev config — resolved
  2026-07-11 after it **failed the first dev redeploy** (`next build` in
  development mode breaks React prerendering). Root `dev` config now
  carries explicit `NODE_ENV=production`; `dev_personal` explicit
  `development` restored (it had been lost); Playwright webServer pins its
  own `development`; local repo bindings moved to `dev_personal` per the
  runbook. See doppler.md "The NODE_ENV Gotcha".
- [ ] **[R]** `RAILWAY_TOKEN` lives in the synced Doppler configs, so a
  deploy-capable token sits in the running app's env in both environments.
  Move Railway tokens out of the synced configs (GitHub secrets already
  hold them) or into a non-synced `ci` config.
- [x] **[C]** Doppler rename fallout: `.claude/launch.json` + runbooks
  updated to `-p bridgecircle`. **[R]** Re-run
  `doppler setup --project bridgecircle --config dev_personal` in `app/`
  (both checkouts) — the old directory scope still pins `bridgecircle-dev`.

## Phase 2 — version endpoint + integ suite (observe-only)

- [x] **[C]** Readiness probe: **`/api/health`** (landed on main via the
  parallel CI/CD effort, PR #127 — reconciled 2026-07-11). This branch's
  interim `/api/version` was dropped in its favor (health is
  dependency-free and matcher-excluded, so probes skip the Supabase
  session refresh); `env: APP_ENV` added to its payload so the CD poll
  asserts the tier it reached. `app/railway.json` sets
  `healthcheckPath: /api/health` (that plan's Phase 3).
- [x] **[C]** `cd.yml` written 2026-07-11 — full pipeline in one file
  (deploy-dev → integ → gated promote) rather than an observe-only interim:
  the promote job is inert until a human approves, so shipping it gated is
  the safer version of "observe-only". Watch items for the first run:
  - the Railway service's **root directory** setting must apply to
    `railway up` uploads (repo root is uploaded; the app lives in `app/`);
  - `railway variables --skip-deploys` + `railway up --ci` flag behavior.
- [x] **[C]** Integ data hygiene: the integ suite (`app/tests/e2e/`) seeds a
  per-run org + `test_`-prefixed users through the admin-client factory
  (`tests/e2e/helpers/factory.ts`), asserts against both the UI and the dev
  DB, and tears everything down in `afterAll` (auth-user deletes cascade;
  org delete sweeps events/invites/announcements). Notification emails go
  to `delivered+…@resend.dev` so nothing bounces against the real domain.
- [ ] **[R]** Add `RAILWAY_DEV_TOKEN` secret (Railway → project → Settings →
  Tokens → scope: dev environment).
- [ ] Let it run green on a few merges before Phase 3.

## Phase 3 — pipeline owns dev + prod code deploys

- [x] **[R]** GitHub `production` environment: `DOPPLER_TOKEN_PRD` +
  `RAILWAY_TOKEN_PRD` env secrets, required-reviewer rule enabled
  (all API-verified 2026-07-11). Repo-level Railway token copies deleted;
  only `DOPPLER_TOKEN` remains repo-level.
  - [ ] **[R]** reviewer list currently = `dkoodev` only — confirm an
    account that can approve promptly (e.g. the repo owner) is on it, or
    every promote waits on one person.
- [x] **[C]** `deploy-dev` (`railway up`, blocking, SHA-stamped) and
  `promote` (`needs: integ`, environment `production`) both live in
  `cd.yml`. The dev-side idempotent `supabase db push` joins in Phase 4
  with the prod one.
- [x] **[C]** Development now deploys the private outbox worker after the
  same-SHA web health check. `app/railway.worker.json` owns its start,
  restart, drain, and single-region replica contract; CD builds a clean
  app-root archive so the web and worker keep distinct Railway configs.
  Production worker deployment is intentionally absent until production-v2
  cutover approval and service provisioning.
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

- [x] **[C]** `APP_ENV` set in all three configs 2026-07-11
  (`dev_personal`→`local`, `dev`→`dev`, `prd`→`prod`) and NODE_ENV pinned
  in package.json scripts — the three-tier model is live (verified:
  local `/api/health` reports `env: local`). Still to build, gated on
  `APP_ENV`:
  - [ ] **[C]** Sentry `environment` tag
  - [ ] **[C]** `X-Robots-Tag: noindex` when `APP_ENV !== 'prod'`
  - [ ] **[C]** cron/sweep no-ops for paid enrichment APIs off-prod
  - [ ] **[C]** dev email recipient allowlist (mandatory — dev sends from
    the real domain)
- [ ] **[R]** Decide dev email posture: dev Resend sender or recipient
  allowlist — a dev test must never email a real member.

## Phase 6 — docs settle

- [ ] **[C]** Update `migration-workflow.md` (drop "the integration owns
  prod"; describe the pipeline; fix the stale "Free project" + pre-Doppler
  wording), `environments.md`, `app/CLAUDE.md`, `INDEX.md`; archive this doc.
- [x] **[C]** The v2 development cutover removed the hold above, documented
  the private worker topology in `environments.md`, and added same-SHA worker
  deployment to `cd.yml`. The broader production-pipeline documentation work
  remains pending with Phase 4.

## Sequencing rules

1. Never disable an automation before its scripted replacement has run green.
2. Phase 4 is last: it is the only phase that removes a safety net
   (preview-branch validation).
3. The `cd.yml` PR merges only after the Phase-1 dashboard work exists,
   otherwise every push to `main` fails the workflow.

## Known wrinkles

- `railway up` builds CI-uploaded source, so `RAILWAY_GIT_COMMIT_SHA` may be
  absent in scripted deploys. The workflow stamps the SHA itself (env var set
  via `railway variables --set COMMIT_SHA=$GITHUB_SHA` before `up`);
  `/api/health` reads Railway's var first and falls
  back to Railway's var so the endpoint works in both the scaffolding and
  scripted eras.
- Playwright's `webServer` must be skipped when `PLAYWRIGHT_BASE_URL` points
  at a remote host — config change in Phase 2.
- Second always-on service ≈ double compute; enable app sleeping on dev if
  cost matters.
