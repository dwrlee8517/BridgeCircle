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

| Secret | Used by | Status (2026-07-11) |
|---|---|---|
| `DOPPLER_TOKEN` | existing CI + integ | present — confirm it is a service token scoped to the dev config only |
| `RAILWAY_TOKEN_DEV` | `railway up` → dev | present (repo-level) |
| `RAILWAY_TOKEN_PRD` | `railway up` → prod | present but repo-level — **move into the GitHub `production` environment** so the required-reviewer gate protects it |
| `SUPABASE_ACCESS_TOKEN` | `supabase db push` | Phase 4; environment secret on `production` |
| `SUPABASE_PROD_DB_PASSWORD` | prod `db push` | Phase 4; environment secret on `production` |

Note: GitHub already shows `BridgeCircle / dev` and `BridgeCircle / production`
environments — those are **Railway-created deployment records**, not gates.
The approval gate is a separate GitHub environment named `production`
(Settings → Environments) with a required reviewer.

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

- [ ] **[R]** `bridgecircle/dev` (Doppler) has
  `NEXT_PUBLIC_APP_URL=https://bridgecircle.org` — must be
  `https://dev.bridgecircle.org`, or dev-generated links/redirects point at
  prod.
- [ ] **[R/C]** `NODE_ENV=development` syncs into the Railway **dev** deploy,
  so `next start` runs a production build in development mode. Needed for
  the *local* dev server (see doppler.md "NODE_ENV Gotcha") but wrong for a
  deployed env. Resolve in Phase 5 alongside `APP_ENV` (e.g. drop NODE_ENV
  from the synced root config; keep it in `dev_personal` for local).
- [ ] **[R]** `RAILWAY_TOKEN` lives in the synced Doppler configs, so a
  deploy-capable token sits in the running app's env in both environments.
  Move Railway tokens out of the synced configs (GitHub secrets already
  hold them) or into a non-synced `ci` config.
- [x] **[C]** Doppler rename fallout: `.claude/launch.json` + runbooks
  updated to `-p bridgecircle`. **[R]** Re-run
  `doppler setup --project bridgecircle --config dev_personal` in `app/`
  (both checkouts) — the old directory scope still pins `bridgecircle-dev`.

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
