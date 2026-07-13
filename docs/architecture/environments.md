# BridgeCircle Environments And Workflow

## Purpose

This document explains the current BridgeCircle environment setup, how to develop against it day-to-day, and the rules that keep production safe. Read this before pushing any change that touches infrastructure, env vars, or the database.

> **Status (2026-07) — two shifts postdate parts of this doc; read these first:**
>
> 1. **Secrets moved to Doppler.** [`../runbooks/doppler.md`](../runbooks/doppler.md) is now the source of truth for every env var. The `.env.local` references throughout this doc are **legacy** — local dev pulls env from Doppler (`doppler run -- pnpm dev` against the real dev DB, or `pnpm dev:local` against a local Docker stack). Prod/dev env vars are edited in the Doppler `prd`/`dev` configs and **synced to Railway**, not hand-typed into Railway's Variables tab.
> 2. **There is now a Railway `dev` stage.** [ADR 0014](../decisions/0014-scripted-cd-pipeline.md) added a deployed dev environment at **`https://dev.bridgecircle.org`** plus a scripted CD pipeline (`.github/workflows/cd.yml`: deploy-dev → integ tests → **manual prod gate** → promote). It currently runs *alongside* Railway's built-in auto-deploy (both fire on merge to `main` — harmless, same commit) until rollout **Phase 3** turns auto-deploy off; prod DB migrations still auto-apply via the Supabase GitHub integration until pipeline **Phase 4**. Canonical: [`dev-stage-cd-rollout.md`](dev-stage-cd-rollout.md).
>
> So the current topology is **three runtime contexts** — your laptop, the Railway `dev` stage, and Railway `production` — with **no staging tier**. The sections below are being reconciled; where they say "`.env.local`" read "Doppler", and where they imply only prod is on Railway, add the `dev` stage.

## The Two Supabase Projects

BridgeCircle uses two Supabase cloud projects, both under the **`bridgecircle` organization (Pro plan)**. Supabase billing is per-organization, not per-project — so the Pro plan applies to both projects.

| Project | Ref | Role | Created |
|---|---|---|---|
| `bridgecircle` | `edumxwzilfgvamzarwvo` | production | 2026-04-24 |
| `bridgecircle-dev` | `ojpvahiuafdcynbdbmri` | development | 2026-04-26 |

Both live in `us-west-1` on Postgres 17. Confirm at any time via `list_projects` / `get_organization` on the Supabase MCP.

### `bridgecircle` (production)

- The original Supabase project, created on Day 0.
- Holds real alumni data once the pilot launches.
- Connected to **Railway** via env vars in Railway's Variables tab.
- Google OAuth callback URL registered with Google Cloud.
- Treated as untouchable from day-to-day development.
- Has the **Supabase + GitHub branching integration** enabled — this is what makes the Pro plan load-bearing.

### `bridgecircle-dev` (development)

- A second Supabase project created specifically for development.
- Holds throwaway test data only — fake users, fake mentorship requests, fake events.
- Two runtime contexts read it: **your laptop** (via Doppler `dev_personal` — `doppler run -- pnpm dev`) and the **Railway `dev` stage** at `dev.bridgecircle.org` (via Doppler `dev`). (Your laptop can also skip it entirely and run against a local Docker Supabase — `pnpm dev:local:live` for daily dev, `pnpm dev:local` for the deterministic E2E config.)
- The same Google OAuth client knows about both projects' callback URLs.
- Safe to reset, truncate, or experiment against.
- Sits in the same Pro org as prod (so it inherits Pro features), but is otherwise runtime-isolated.

The two projects share nothing at runtime. Data created in one never appears in the other. The only thing they have in common is the schema — kept identical by applying the same migration files to both — and the org-level billing plan.

## What Talks To What

```
  Runtime context              →  Supabase project        Env source (Doppler)
  ───────────────────────────────────────────────────────────────────────────
  Your laptop (pnpm dev:local) →  local Docker stack       dev_local  (E2E/CI; services dummied)
  Your laptop (dev:local:live) →  local Docker stack       dev_local_live  (daily dev; real AI+email)
  Your laptop (…-- pnpm dev)   →  bridgecircle-dev (cloud) dev_personal
  Railway "dev" stage          →  bridgecircle-dev (cloud) dev
    dev.bridgecircle.org
  Railway "production"         →  bridgecircle (prod)      prd
    bridgecircle.org

Other shared services (one of each, used by all tiers):
  - Google OAuth client (same client, two redirect URIs)
  - Resend (one account; non-prod sends are caught by the email guard — see doppler.md)
  - Sentry (one project, environments tagged by APP_ENV)
  - Anthropic + Voyage (shared keys; dummied in dev_local, real elsewhere
    incl. dev_local_live)
```

Neither the laptop nor the `dev` stage ever touches the production database; production never touches the dev database. All tiers can talk to Resend/Sentry, but each tags its own activity — and outside prod (`APP_ENV ≠ prod`) the email guard redirects sends to a sink so dev never mails real people.

## Manual Production Configuration

Everything in this section was set up by hand outside the codebase. None of it is reproducible from `git clone` alone — losing this knowledge means re-discovering it under pressure. Update the relevant subsection whenever you change one of these.

### DNS records on `bridgecircle.org`

Hosted at **Cloudflare** (registrar / nameservers). All records run in "DNS only" mode (gray cloud) — Cloudflare proxying is not enabled. For the Railway CNAME this is required because Railway terminates its own TLS; toggling proxying on would break the cert handshake.

**For email (Resend):**

| Type | Name | Purpose | Status |
|---|---|---|---|
| TXT | `resend._domainkey.bridgecircle.org` | DKIM public key — proves emails are signed by us | Verified (added 2026-04-29) |
| MX | `send.bridgecircle.org` | Return path for bounces (points at `feedback-smtp.*.amazonses.com`, priority 10) | Verified |
| TXT | `send.bridgecircle.org` | SPF — authorizes Resend/SES to send from our domain (`v=spf1 include:amazonses.com ~all`) | Verified |
| TXT | `_dmarc.bridgecircle.org` | DMARC monitor-only policy (`v=DMARC1; p=none;`) | Active (added 2026-04-29) |

DMARC is currently in monitor-only mode (`p=none`) — failures are *not* rejected, but no reports are collected because there's no `rua=` reporting address. To start receiving daily auth reports, change the value to `v=DMARC1; p=none; rua=mailto:<your-monitoring-address>`. Tighten to `p=quarantine` or `p=reject` later once you've confirmed all legitimate sending paths pass.

**For the app (Railway):**

| Type | Name | Purpose | Status |
|---|---|---|---|
| CNAME | `bridgecircle.org` (apex) | Points the root domain at Railway's app hostname (`<service>.up.railway.app`). Cloudflare's CNAME flattening makes this work at the apex. | DNS only |
| TXT | `_railway-verify.bridgecircle.org` | Railway's proof-of-domain-ownership token | Active |

**Railway custom-domain checklist** (the CNAME alone is not enough — these are the additional touches for `https://bridgecircle.org` to fully work end-to-end):

- [ ] Add `bridgecircle.org` under **Railway → service → Settings → Networking → Custom Domain**. Without this, Railway responds 404 to traffic arriving at the hostname.
- [ ] Set `NEXT_PUBLIC_APP_URL=https://bridgecircle.org` in Railway Variables. The code in `src/lib/auth/app-url.ts` reads this env var to build absolute URLs in outbound emails (e.g. the "View on BridgeCircle" button in announcement emails) and OAuth `redirectTo` URLs. If it still points at `*.up.railway.app`, members see Railway URLs in their inbox.
- [ ] In **Supabase Dashboard → Authentication → URL Configuration**: set **Site URL** to `https://bridgecircle.org` and add `https://bridgecircle.org/auth/callback` to **Additional Redirect URLs**. Supabase rejects any post-auth redirect not in this allowlist; without it, sign-in succeeds but the redirect back to the app fails.

**What you do NOT need to do** for the custom domain: add `bridgecircle.org` to the Google Cloud OAuth client's authorized redirect URIs. Google only redirects to the Supabase callback (`<supabase-ref>.supabase.co/auth/v1/callback`), never directly to the app — so the Google client only needs the Supabase callback URLs (one per project today, plus the custom-domain callback once the checklist below is executed).

### Supabase custom domain — `auth.bridgecircle.org` (planned, not yet executed)

The Google OAuth consent screen currently says "Sign in to `edumxwzilfgvamzarwvo.supabase.co`" because Google displays the domain of the redirect URI, which is Supabase's callback on the raw project domain. The fix is the Supabase **custom domain add-on** ($10/mo, prod project only) fronting the prod API at `auth.bridgecircle.org`. Full click-through procedure, ordering constraints, and rollback: [`../runbooks/supabase-custom-domain.md`](../runbooks/supabase-custom-domain.md). Every step is a manual dashboard/DNS action.

DNS records this will add (values come from the Supabase Custom Domains page at execution time):

| Type | Name | Purpose | Status |
|---|---|---|---|
| CNAME | `auth.bridgecircle.org` | Points at `edumxwzilfgvamzarwvo.supabase.co`. **DNS only (gray cloud)** — Supabase terminates its own TLS; proxying breaks cert issuance and Realtime websockets. | Planned |
| TXT | `_acme-challenge.auth.bridgecircle.org` | Domain-ownership / SSL challenge issued by Supabase during setup | Planned |

Cutover checklist (tick as executed; order matters — Google client before activation):

- [ ] Enable the custom-domain add-on on the prod project and register `auth.bridgecircle.org` (Supabase dashboard → Settings → Custom Domains).
- [ ] Add the CNAME + TXT records above in Cloudflare (gray cloud) and verify; allow ~30 min for the certificate.
- [ ] Google Cloud Console: confirm `bridgecircle.org` is an **Authorized domain** on the OAuth consent screen, then **add** `https://auth.bridgecircle.org/auth/v1/callback` to the OAuth client's redirect URIs. Keep both existing raw-domain URIs.
- [ ] Activate the domain in Supabase. The raw `edumxwzilfgvamzarwvo.supabase.co` domain keeps working alongside it.
- [ ] Supabase Auth → URL Configuration: **no change** (Site URL and redirect allowlist point at the app, not at Supabase) — verify only.
- [ ] Railway Variables: set `NEXT_PUBLIC_SUPABASE_URL=https://auth.bridgecircle.org` and redeploy. Keys unchanged. **This signs every member out once** (the auth cookie name derives from the URL's first DNS label) — do it at a quiet hour.
- [ ] Verify in incognito: the Google consent screen now shows `auth.bridgecircle.org`, sign-in completes, avatars load.

The dev project (`ojpvahiuafdcynbdbmri`) deliberately stays on its raw domain — only maintainers ever see the dev consent screen, and a second add-on costs another $10/mo. Rationale and the repeat-if-needed recipe are in the runbook.

Source-of-truth note: exact DKIM public key, Resend DNS values, and Railway verify token live in the Resend / Railway dashboards. **Don't paste them into this doc** — they change on rotation and the dashboards are authoritative.

### Railway environment variables

**Source of truth is now Doppler**, not Railway's Variables tab. The Doppler `prd` config syncs to the Railway `production` environment and `dev` syncs to the Railway `dev` environment (native Doppler↔Railway sync, per-env). **Edit these values in Doppler**, not in Railway — a hand-edit in Railway's tab gets overwritten on the next sync. The variables below are the prod inventory (what ends up in Railway `production`); see [`../runbooks/doppler.md`](../runbooks/doppler.md) for the config structure.

| Variable | Purpose | Example value (NOT actual) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Prod Supabase project URL | `https://<prod-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Prod publishable key (browser-safe) | `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | Prod service-role key (server-only, RLS bypass) | `sb_secret_…` |
| `RESEND_API_KEY` | Resend API key | `re_…` |
| `RESEND_FROM` | Sender address used by every Resend send. Set 2026-04-29 to `BridgeCircle <noreply@bridgecircle.org>`. Defaults to `BridgeCircle <invites@bridgecircle.org>` if unset. | `BridgeCircle <noreply@bridgecircle.org>` |
| `ANTHROPIC_API_KEY` | Claude Haiku key for resume extraction + current NL search extraction/rerank | `sk-ant-…` |
| `VOYAGE_API_KEY` | Voyage key for Ask matching embeddings and reranking when `ASK_MATCHING_PIPELINE=voyage_hybrid` | `pa-…` |
| `ASK_MATCHING_PIPELINE` | Ask matching mode. Keep `legacy` until migration, backfill, and E2E verification pass; set `voyage_hybrid` for the new path. | `legacy` |
| `ASK_MATCHING_EXPLANATIONS` | Ask explanation mode. Use `templated` by default; `haiku_polish` only polishes final matches. | `templated` |
| `NEXT_PUBLIC_APP_URL` | Public origin used for absolute URLs in emails (e.g. `${origin}/events/${id}`). Should match the prod domain. | `https://bridgecircle.org` |
| `SENTRY_AUTH_TOKEN` | Build-time only — Sentry source map upload during `next build`. | `sntrys_…` |

Local dev env comes from **Doppler**, not `.env.local`: `dev_personal` points the Supabase keys at `bridgecircle-dev` and inherits the shared Resend/Anthropic/Voyage/Sentry keys from `dev` (they're cheap and activity is environment-tagged provider-side); `dev_local` instead points at the local Docker stack and dummies the outbound services. **Don't set `RESEND_FROM` locally** — leave the default so dev emails come from `invites@`. Note real dev sends can't reach real inboxes anyway: outside prod the email guard (`app/src/notify/devGuard.ts`) redirects to a sink unless the address is on `EMAIL_DEV_ALLOWLIST` (see [doppler.md](../runbooks/doppler.md)).

### Third-party services

**Supabase**
- Single org: `bridgecircle` (id `wvwbvvdxogbeipqrzbqs`) on the **Pro plan** (~$25/mo base + per-project compute + usage). The plan is org-level — both projects below inherit it.
- `bridgecircle` (production, ref `edumxwzilfgvamzarwvo`) — holds real alumni data. The Pro plan is required here for the GitHub branching integration that runs migrations on PR preview branches.
- `bridgecircle-dev` (development, ref `ojpvahiuafdcynbdbmri`) — throwaway dev data. Sits under the same Pro org (so it's no longer on Free as the original ADR 0005 assumed — see [decision 0005](../decisions/0005-hybrid-supabase-branching.md) "Current state" note). Pays second-project compute on the Pro plan; still cheaper and simpler than a persistent dev branch on the prod project.
- Both have Google OAuth provider enabled (Auth → Providers → Google), pointing at the same Google Cloud OAuth client with two registered redirect URIs (one per project).
- Prod has the **GitHub integration** turned on (Settings → Integrations → GitHub) with the working directory set to `app`. This is what triggers preview branches on PR + auto-deploy on merge.

**Resend**
- One workspace for both dev and prod.
- Sender domain `bridgecircle.org` verified (see DNS table above).
- `noreply@bridgecircle.org` is the prod sender (set via `RESEND_FROM`).
- `invites@bridgecircle.org` is the dev sender (default when `RESEND_FROM` unset).

**Sentry**
- One project, DSN hardcoded in `src/instrumentation-client.ts` (it's a public key, safe in source).
- Environment is auto-tagged via `NODE_ENV` so dev and prod errors filter separately in the Sentry UI.

**Google OAuth**
- One Google Cloud OAuth client.
- Two authorized redirect URIs: one for `bridgecircle-dev`, one for `bridgecircle` (prod). Both use Supabase's standard `<project-ref>.supabase.co/auth/v1/callback` pattern. A third (`https://auth.bridgecircle.org/auth/v1/callback`) gets added when the [Supabase custom domain](../runbooks/supabase-custom-domain.md) is set up — the raw-domain URIs stay registered alongside it.
- The consent screen shows the redirect URI's domain — today the raw prod Supabase ref, which is what the custom-domain plan fixes.
- If you ever rotate the Google client secret, you must update **both** Supabase projects' Auth → Google provider settings.

**Anthropic**
- Single API key shared by dev and prod (low-volume usage).
- Used for resume extraction (1 call per resume import) and current NL search
  (2 calls per query: extract filters + rerank candidates).
- The accepted Ask matching target is hybrid retrieval + warm-network scoring,
  Voyage reranking, and optional Haiku explanation polish
  ([ADR 0009](../decisions/0009-hybrid-ask-matching.md)).
- No usage caps configured today — see "post-launch backlog" in `app/CLAUDE.md` for cost monitoring.

**Voyage**
- Separate API key from Anthropic. Anthropic recommends Voyage for embeddings, but
  Voyage calls authenticate against Voyage with `VOYAGE_API_KEY`.
- Used by `ASK_MATCHING_PIPELINE=voyage_hybrid` for `voyage-4` embeddings and
  `rerank-2.5-lite`.
- Keep the production flag at `legacy` until the additive migration, profile
  embedding backfill, and Ask/People verification pass.

### GitHub repository

- **Default branch**: `main`. Pushes here trigger Railway auto-deploy + Supabase prod migration auto-apply.
- **Branching integration**: Supabase's GitHub app installed and pointed at this repo with working directory `app/`. Runs migrations on PR preview branches; merging to `main` auto-applies them to the prod Supabase project.
- **Required status checks**: "Supabase Preview" should be required on `main`. **Currently "Not enforced"** because that requires GitHub Pro ($4/mo) on a personal-account private repo. Treat the green check as advisory until Pro is enabled or the repo moves to an org plan.
- **CI**: GitHub Actions wired at `.github/workflows/`. Two workflows trigger on every PR to `main`:
  - `ci.yml` — `Lint & test` (biome + vitest) and `Build (validates types vs. migrations)` jobs. The build job is the load-bearing migration-safety check: `next build` type-checks the whole codebase against `src/db/database.types.ts`, so a migration that drops a column app code still references fails the PR before merge.
  - `e2e.yml` — Playwright against a **local Supabase stack booted on the runner** (migrations + `supabase/seeds/`). Env resolves from the Doppler `bridgecircle/dev_local` config via the `DOPPLER_TOKEN_LOCAL` repo secret (service token scoped to that config only — local values and dummies, no real secrets). The `E2E gate` job always reports (green on pass or on a legitimately-skipped docs-only PR) so it can be a required check. See [e2e-testing.md](../runbooks/e2e-testing.md).
  - The `ci.yml` build job still requires the `DOPPLER_TOKEN` repo secret (service token from the Doppler dashboard).

### Where to look when something breaks in prod

| Symptom | First place to look |
|---|---|
| Site won't load | Railway → Deployments tab (look for failed build) |
| Emails not arriving | Resend dashboard → Logs (per-message status, bounce reasons) |
| Errors in admin actions | Sentry dashboard → Issues (filtered to environment=production) |
| Database query failures | Supabase prod dashboard → Logs → Postgres |
| OAuth login failing | Supabase prod dashboard → Logs → Auth + Google Cloud → OAuth consent screen |
| Migration didn't apply on merge | Supabase prod dashboard → Database → Migrations + the GitHub PR's "Supabase Preview" check |

## Where The Env Vars Live

For the full prod inventory + descriptions, see **Manual Production Configuration → Railway environment variables** above. The summary split below is the laptop ↔ Railway pairing only.

| Variable | Local (`.env.local`) | Railway (Variables tab) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | dev project URL | prod project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | dev publishable key | prod publishable key |
| `SUPABASE_SECRET_KEY` | dev secret key | prod secret key |
| `RESEND_API_KEY` | Resend key (shared with prod) | Resend key |
| `RESEND_FROM` | (leave unset → defaults to `invites@`) | `BridgeCircle <noreply@bridgecircle.org>` |
| `ANTHROPIC_API_KEY` | Claude key (shared with prod) | Claude key |
| `VOYAGE_API_KEY` | Voyage key | Voyage key |
| `ASK_MATCHING_PIPELINE` | `legacy` or `voyage_hybrid` | `legacy` until verified |
| `ASK_MATCHING_EXPLANATIONS` | `templated` or `haiku_polish` | `templated` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | prod origin (`https://bridgecircle.org`) |
| `SENTRY_AUTH_TOKEN` | (build-time only, optional locally) | set by Sentry wizard |

`.env.local` is in `.gitignore` and must never be committed. Railway's Variables tab is the only place production secrets live in human-readable form — keep a backup copy in your password manager.

### Public vs secret keys

- Anything prefixed `NEXT_PUBLIC_` ships to the browser. Treat as public.
- `SUPABASE_SECRET_KEY` (no prefix) is server-only. Never import it from a `'use client'` file or any code that runs in the browser. Row-level security policies are what actually protect prod data — but the secret key bypasses them, which is why it must stay server-side.

The `src/db/` folder enforces this split:

- `src/db/client.ts` — uses the publishable key, runs in the browser.
- `src/db/server.ts` — runs only on the server, can read auth cookies.
- `src/db/admin.ts` — uses the secret key, only for privileged operations like invite verification.

## Day-To-Day Development Workflow

### Starting a session

```bash
cd app
pnpm db:start && pnpm db:reset   # boot + seed the local Docker Supabase
pnpm dev:local:live              # daily driver: local DB, real AI, guarded email
# or: doppler run -- pnpm dev    # real dev cloud DB (bridgecircle-dev), via dev_personal
# or: pnpm dev:local             # the deterministic E2E config (services dummied)
```

Open http://localhost:3001. Env comes from Doppler (not `.env.local`) — see [`../runbooks/doppler.md`](../runbooks/doppler.md) "Which config, when". With the local configs, writes go to your throwaway Docker stack; with `doppler run -- pnpm dev` they go to the shared `bridgecircle-dev` cloud project.

### Useful commands

```bash
pnpm dev                       # local dev server with hot reload
pnpm build                     # production build (validates that prod build still works)
pnpm start                     # serve a local production build (rare)
pnpm lint                      # eslint
pnpm biome format --write .    # format code
pnpm biome check .             # lint via biome
pnpm vitest                    # run tests
pnpm db:types                  # regenerate src/db/database.types.ts from the linked Supabase project
```

Always use pnpm (pinned to 10.33.2 in `package.json`). Do not use `npm` or `yarn`.

### Making a change

1. Create a feature branch off `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/short-description
   ```
2. Edit code. `pnpm dev` hot-reloads on save.
3. Verify the change works locally against `bridgecircle-dev`.
4. Run `pnpm build` once before merging — catches type errors that dev mode is forgiving about.
5. Commit, push, open a PR.
6. Merge to `main` when stable. Railway auto-deploys within ~1–4 minutes.

## How Changes Flow Through The System

### Code changes

```
feature branch (your laptop)
   │
   ▼
pull request (GitHub)
   │
   ▼
merge to main
   │
   ▼
Railway webhook fires
   │
   ▼
Railway runs pnpm install + pnpm build
   │
   ▼
Railway swaps the running container atomically
   │
   ▼
production URL serves new code
```

If the build fails, the previous version keeps serving — there's no downtime risk from a broken build. Watch the build log in Railway's **Deployments** tab.

### Schema (database) changes

> **This section was rewritten on 2026-04-29 when we cut over to Supabase + GitHub branching.** The pre-cutover process required a manual `supabase link --project-ref <prod>` + `db push` after merge. That step is gone — Supabase auto-applies on merge. See `branching-strategy.html` for the architecture decision and `../runbooks/migration-workflow.md` for the canonical step-by-step.

Schema is managed by **migration files** in `app/supabase/migrations/`. Forward-only — once applied to any DB, treat the file as immutable history.

Workflow when adding a column or table:

1. Write a migration:
   ```bash
   pnpm dlx supabase migration new <descriptive_name>
   ```
2. Edit the generated SQL file under `supabase/migrations/`.
3. Apply to dev:
   ```bash
   pnpm dlx supabase db push   # bridgecircle-dev (linked locally)
   ```
4. Regenerate typed schema and commit it:
   ```bash
   pnpm db:types               # writes src/db/database.types.ts
   ```
   Skipping this step works locally until your next `pnpm build` — at which point TypeScript fails on the missing tables/columns.
5. Update the app code that depends on the new schema.
6. Test locally against the now-migrated dev database.
7. Commit migration + regenerated types + code together to a feature branch.
8. Push the branch and open a PR. **Supabase's GitHub integration spins up a preview branch off the prod project and runs the migration on it.** A "Supabase Preview" check appears on the PR — wait for it to turn green before merging.
9. Merge the PR. Two things happen automatically:
   - Railway picks up the merge and redeploys the app.
   - Supabase auto-applies the migration to the prod project (`bridgecircle`).
10. The preview branch auto-deletes after merge.

**Do not** run `supabase db push` against prod manually anymore. The integration owns the prod side; manual pushes risk schema drift.

### Order of operations on merge — it's a race, not lockstep

When a PR is merged to `main`, two independent webhooks fire:

- **Supabase** applies the migration to the prod project (`bridgecircle`). Usually <30s.
- **Railway** runs `pnpm install` + `pnpm build` and swaps the container atomically. Usually 2–5 min.

Supabase almost always finishes first because Railway's build is the bottleneck. That creates a **deploy window** (2–5 min) where the prod database is on the new schema while the prod app is still running the old code:

- **Additive migration** (add column / table / index / nullable / NOT-NULL-with-default) — old code ignores the new schema. The window is harmless. Ship as one PR.
- **Destructive migration** (drop, rename, tighten CHECK, add FK to existing data, change type) — old code references things that no longer exist or violates new rules. 100% of traffic on the affected path errors until Railway catches up. **Do not ship as one PR — use the expand/contract pattern.**

The full discipline, including the worked rename example, lives in [`../runbooks/migration-workflow.md`](../runbooks/migration-workflow.md) "Expand/contract for destructive changes." Architectural rationale and rejected alternatives (Railway pre-deploy hook, blue-green, canary, switch platforms) are in [ADR 0008](../decisions/0008-deploy-ordering-expand-contract.md).

The CI build job (`Build (validates types vs. migrations)`) catches "code in `main` doesn't match the new schema in `main`" before merge — but CI only validates the *destination state*. It cannot enforce the *transition* between old code and new schema. Expand/contract is the only thing that makes the transition safe.

If a migration ever needs to be rolled back: write a forward-only "revert" migration. There is no destructive rollback in this setup.

### Env var changes

If you add or change an env var, do it in **Doppler** (not `.env.local`, not Railway's tab):

1. Add it to the **`dev`** config (`doppler secrets set KEY=value --config dev`) so the whole team + the dev stage get it; override in `dev_personal` only if your local value must differ. Add the prod value to the **`prd`** config.
2. Restart your local process — `doppler run` reads secrets once at startup.
3. Railway picks up the `dev`/`prd` change on the next sync + redeploy (env vars are read at container startup). Full procedure and the `set`-replaces-not-appends caveat are in [`../runbooks/doppler.md`](../runbooks/doppler.md).

Because Doppler is the single source of truth synced to every tier, the old "laptop `.env.local` vs Railway tab drift" failure mode is largely gone — but a value present in `dev` and missing from `prd` (or vice versa) still bites, so set both.

## Things To Be Careful About

### Never commit `.env.local`

`.env.local` is in `.gitignore`, but check `git status` after editing env files. If it ever appears in the staged changes, stop and verify the gitignore. Committed secrets are extremely hard to fully remove from history.

### Never modify the Supabase schema via the dashboard

The migration files in `supabase/migrations/` are the source of truth. If you add a column by clicking around in the dashboard:

- The migration files no longer describe the real schema.
- A future re-run of migrations from scratch will produce a different schema.
- You will eventually have a "works in one project, fails in the other" mystery.

If you need to test a schema idea, write it as a migration, apply it to dev, decide if you like it. Throw the migration away if you don't. Never click-edit production schema.

### Never run destructive SQL directly against prod

The Supabase SQL editor on the dashboard is fine for `select` queries to inspect data. Avoid `update`, `delete`, `drop`, `truncate` against `bridgecircle` (prod). All data changes should happen either through migration files or through app code with proper auth checks.

If you absolutely must run a one-off fix:

- Test the exact SQL on `bridgecircle-dev` first.
- Wrap it in a transaction (`begin; ... ; commit;`) so you can `rollback` if it does something unexpected.
- Have a recent backup ready (Supabase takes daily backups automatically).

### Verify which Supabase project you're connected to

Before applying migrations or running SQL, double-check the project ref in your CLI command or dashboard URL. The cost of "I thought I was on dev" is permanent on production.

A safe habit: before any potentially destructive command, glance at `.env.local` or Railway Variables to confirm where it points.

### Don't push to `main` directly

`main` is the production deploy trigger. Pushes to `main` reach real alumni in 1–4 minutes. Always go through a PR, even when you're the only reviewer. The PR view forces one moment of "do I really want this in front of users?" before the deploy fires.

If you set up branch protection on `main` (recommended), direct pushes are blocked and only PR merges are allowed.

### Don't mix up which keys go where

After `bridgecircle-dev` is set up, you have two complete sets of Supabase keys floating around. The most common mistake is pasting dev keys into Railway, or prod keys into `.env.local`. Symptoms:

- Dev keys in Railway: production starts writing to the dev database; real alumni create test users; dev environment fills with prod data; both projects become a mess.
- Prod keys in `.env.local`: any local experiment writes directly to production. Test users become permanent alumni records.

Audit Railway's Variables tab once after the dev project is created to confirm the values still point at `bridgecircle` (prod), not `bridgecircle-dev`.

### Don't rename or delete migration files

Once a migration has been applied to any database, treat the file as immutable history. To reverse a change, write a new migration that does the reversal. Editing or deleting an applied migration breaks the migration tool's tracking and causes `db push` to fail or — worse — silently apply the wrong things.

### Don't reuse OAuth state across environments carelessly

Both Supabase projects use the same Google OAuth client, but they have different callback URLs registered. If you ever rotate the Google client secret, you must update both Supabase projects (in their Auth → Google provider settings). Forgetting one breaks login on that environment.

### Keep the Supabase MCP pointed at dev, never prod

`app/.mcp.json` configures a Supabase MCP server with a hardcoded `project_ref`. **That ref must be the dev project.** The MCP exposes tools like `apply_migration` and `execute_sql` to any Claude Code session; if it's pointed at prod, an accidental call writes to real alumni data with no second confirmation.

Workflow rule: prod schema changes go through `pnpm dlx supabase link --project-ref <prod_ref>` + `pnpm dlx supabase db push` from your shell, where you explicitly type the prod ref. Never via MCP.

If you ever set up a second machine, audit `.mcp.json` after the initial clone — the file is committed so it'll be whatever the last contributor saved, which should be the dev ref but verify.

### `supabase db push` does not auto-grant table privileges

This one bit us on Day 1. When Supabase tables are created via the **dashboard SQL editor**, the platform auto-applies grants to the `service_role`, `authenticated`, and `anon` Postgrest roles. When the same tables are created via **`supabase db push`** from a CLI migration, those grants are not applied — and any insert/select via the `sb_secret_` key fails with `42501 permission denied for table <name>`.

The fix lives in `app/supabase/migrations/20260426214838_grant_public_schema.sql`: it grants the three roles on all current tables in `public` and uses `alter default privileges` so future tables inherit the same grants automatically. Future migrations that just `create table` in `public` are covered.

Edge cases where the issue can resurface:

- A new table created in a **custom schema** (anything other than `public`). Add a `grant ... on schema <name>` block in the same migration.
- A table created via raw SQL run as a non-`postgres` role. Default privileges only apply to objects created by the role they were set on.
- After a `supabase db reset --linked` against an environment that doesn't replay every migration in order — unlikely, but if you see `42501` after a reset, suspect grants first.

## Merging Workflow

A safe PR cycle for any change:

1. Branch off `main`. Name it descriptively (`feature/profile-edit`, `fix/invite-link-expiry`).
2. Make the change. Test locally (`pnpm dev`).
3. Run `pnpm build` to catch type errors.
4. Run `pnpm biome check .` to catch style/lint issues.
5. Commit with a clear message describing **why**, not just what.
6. Push the branch and open a PR.
7. Read your own diff in the PR view. Stop and reconsider anything that looks wrong.
8. Merge to `main`.
9. Watch Railway's **Deployments** tab for the build to go green.
10. Smoke-test the production URL — sign in, click around, confirm the change behaves as expected.

If the deploy fails:

- The previous production version is unaffected and still serving users.
- Read the build log in Railway. Most failures are missing env vars, type errors, or dependency issues.
- Fix on a new branch, PR, merge again. Don't push fixes directly to `main`.

If the deploy succeeds but a bug shows up:

- Either ship a forward fix (recommended — fix on a branch, PR, merge).
- Or revert the offending commit on a branch and merge the revert PR. The "revert" pattern keeps history clean and gets prod back to a known-good state quickly.

## What's Currently Out Of Scope

These exist as concepts in the broader docs but are **not** in the current setup:

- **No staging environment.** There are three runtime contexts — your **laptop**, the Railway **`dev` stage** (`dev.bridgecircle.org`, added by [ADR 0014](../decisions/0014-scripted-cd-pipeline.md)), and Railway **`production`** (`bridgecircle.org`) — but no separate *staging* tier between dev and prod. The scripted CD pipeline's integ gate runs against the `dev` stage before the manual prod promote, which covers the "catch it before prod" role a staging tier would play. Add a real staging tier only when production has real users and a regression has real cost.
- **CI checks on PRs are now wired** (was previously listed as out-of-scope). `.github/workflows/ci.yml` runs biome, vitest, and `next build` on every PR. `.github/workflows/e2e.yml` runs Playwright. The Supabase Preview check still validates the migration itself on a real preview branch — together this gives three layers of migration safety: schema replay (Supabase), type compatibility (build), runtime behavior (E2E).
- **Branch protection on `main` is configured but "Not enforced".** A classic branch protection rule exists requiring the "Supabase Preview" check, but enforcement requires GitHub Pro ($4/mo) on a personal-account private repo. Treat the green check as advisory. Either upgrade to Pro, move the repo to an org, or accept the soft enforcement until launch.
- **No PR preview environments on Railway.** Each PR doesn't get its own app URL. Supabase preview branches handle DB schema validation; for app preview you'd enable Railway's PR preview feature in the service settings.
- **No persistent dev branch on the prod Supabase project.** We use `bridgecircle-dev` (separate project under the same Pro org) for daily development instead. The cost rationale from ADR 0005 has shifted now that dev sits under Pro — see [decision 0005](../decisions/0005-hybrid-supabase-branching.md) "Current state" note and the post-launch backlog for the trade-off.
- **DMARC reporting not configured.** A `_dmarc` record exists in monitor-only mode (`p=none`) but has no `rua=` reporting address, so no daily auth reports are collected. Add a reporting mailbox + tighten the policy post-launch.
- **No cost monitoring on Anthropic API.** Resume extraction + NL search both call Claude Haiku. Low volume during pilot but no observability today. Sentry breadcrumbs or a counter row would suffice; see `app/CLAUDE.md` post-launch backlog.

These are all good upgrades to make incrementally. None are urgent for launch.

## Quick Reference

| Question | Answer |
|---|---|
| Which database does local dev write to? | Local Docker stack via `pnpm dev:local:live` (daily driver) or `pnpm dev:local` (E2E config); `bridgecircle-dev` via `doppler run -- pnpm dev` (`dev_personal`) when you need shared cloud data |
| Which database does `dev.bridgecircle.org` write to? | `bridgecircle-dev` (Railway `dev` stage, via Doppler `dev`) |
| Which database does the live site write to? | `bridgecircle` (Railway `production`, via Doppler `prd`) |
| What triggers a production deploy? | Push or merge to `main` |
| What triggers a production migration? | Merge to `main` — Supabase auto-applies via the GitHub integration |
| Where are env vars set for prod? | Doppler `prd` config (synced to Railway `production`) — edit in Doppler, not Railway |
| Where are env vars set for local dev? | Doppler `dev_personal` / `dev_local` — see [doppler.md](../runbooks/doppler.md) |
| What's the source of truth for schema? | `supabase/migrations/` files in the repo |
| What's the source of truth for prod env vars + DNS? | This file's "Manual Production Configuration" section |
| Can I edit the schema in the Supabase dashboard? | No. Always write a migration. |
| Can I run SQL queries in the Supabase dashboard? | Reads yes, writes no — especially against prod. |
| Can I run `supabase db push --linked` against prod? | No. The branching integration owns prod migrations now. |
| What if I push a broken commit to `main`? | Build fails on Railway, prod keeps running the previous version. Fix on a new PR. |
| Where does prod email come from? | `noreply@bridgecircle.org` (set via `RESEND_FROM` in Railway). Dev uses the default `invites@bridgecircle.org`. |

## When This Doc Gets Outdated

Update this file whenever you:

- Add a new long-lived environment (staging, preview).
- Add a new third-party service to the stack.
- Change which branch Railway watches.
- Add CI / PR checks.
- Change branch protection or required-status-check configuration.
- Add new env vars that anyone else will need to know about.
- Add, change, or remove a DNS record on `bridgecircle.org`.
- Change the Resend sender address (`RESEND_FROM`).
- Upgrade or downgrade a Supabase / Railway / Resend plan.
- Rotate any API key, secret, or OAuth credential.
- Change the GitHub integration config (working directory, branch, etc.).

The "Manual Production Configuration" section is the canonical inventory of every non-code change made to prod — keep it accurate. Out-of-date workflow docs are worse than no workflow docs. If the file disagrees with reality, fix the file.
