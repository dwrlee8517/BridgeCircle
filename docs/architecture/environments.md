# BridgeCircle Environments And Workflow

## Purpose

This document explains the current BridgeCircle environment setup, how to develop against it day-to-day, and the rules that keep production safe. Read this before pushing any change that touches infrastructure, env vars, or the database.

## The Two Supabase Projects

BridgeCircle uses two completely independent Supabase cloud projects.

### `bridgecircle` (production)

- The original Supabase project, created on Day 0.
- Holds real alumni data once the pilot launches.
- Connected to **Railway** via env vars in Railway's Variables tab.
- Google OAuth callback URL registered with Google Cloud.
- Treated as untouchable from day-to-day development.

### `bridgecircle-dev` (development)

- A second Supabase project created specifically for development.
- Holds throwaway test data only — fake users, fake mentorship requests, fake events.
- Connected to **your laptop** via env vars in `app/.env.local`.
- The same Google OAuth client knows about both projects' callback URLs.
- Safe to reset, truncate, or experiment against.

The two projects share nothing at runtime. Data created in one never appears in the other. The only thing they have in common is the schema — kept identical by applying the same migration files to both.

## What Talks To What

```
                                Supabase cloud
                                ──────────────
                                 bridgecircle-dev    ◀── Your laptop (pnpm dev)
                                 (test data)               reads .env.local

                                 bridgecircle (prod) ◀── Railway production
                                 (real alumni)             reads Railway Variables

Other shared services (one of each, used by both):
  - Google OAuth client (same client, two redirect URIs)
  - Resend (one account, optionally separate "From" senders)
  - Sentry (one project, environments tagged dev / production)
```

Local development never touches the production database. Production never touches the dev database. Both can talk to Resend and Sentry, but each tags its own activity so you can filter.

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

**What you do NOT need to do** for the custom domain: add `bridgecircle.org` to the Google Cloud OAuth client's authorized redirect URIs. Google only redirects to the Supabase callback (`<supabase-ref>.supabase.co/auth/v1/callback`), never directly to the app — so the Google client only needs the two Supabase URLs (one per project), which it already has.

Source-of-truth note: exact DKIM public key, Resend DNS values, and Railway verify token live in the Resend / Railway dashboards. **Don't paste them into this doc** — they change on rotation and the dashboards are authoritative.

### Railway environment variables

Set in **Railway → BridgeCircle service → Variables tab**. Production secrets live here (and only here outside your password manager).

| Variable | Purpose | Example value (NOT actual) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Prod Supabase project URL | `https://<prod-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Prod publishable key (browser-safe) | `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | Prod service-role key (server-only, RLS bypass) | `sb_secret_…` |
| `RESEND_API_KEY` | Resend API key | `re_…` |
| `RESEND_FROM` | Sender address used by every Resend send. Set 2026-04-29 to `BridgeCircle <noreply@bridgecircle.org>`. Defaults to `BridgeCircle <invites@bridgecircle.org>` if unset. | `BridgeCircle <noreply@bridgecircle.org>` |
| `ANTHROPIC_API_KEY` | Claude Haiku key for resume extraction + NL search entity extraction | `sk-ant-…` |
| `NEXT_PUBLIC_APP_URL` | Public origin used for absolute URLs in emails (e.g. `${origin}/events/${id}`). Should match the prod domain. | `https://bridgecircle.org` |
| `SENTRY_AUTH_TOKEN` | Build-time only — Sentry source map upload during `next build`. | `sntrys_…` |

Local `.env.local` values point at `bridgecircle-dev` for the Supabase keys and use the same Resend/Anthropic/Sentry keys as prod (they're cheap and the activity is environment-tagged on the provider side). **Don't set `RESEND_FROM` locally** — leave the default so dev emails come from `invites@` and you can tell at a glance whether an email was sent from your laptop or from prod.

### Third-party services

**Supabase**
- `bridgecircle` (production) — **Pro plan** (~$25/mo). Required for the GitHub branching integration that runs migrations on PR preview branches.
- `bridgecircle-dev` (development) — Free plan. Used for daily local dev only.
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
- Two authorized redirect URIs: one for `bridgecircle-dev`, one for `bridgecircle` (prod). Both use Supabase's standard `<project-ref>.supabase.co/auth/v1/callback` pattern.
- If you ever rotate the Google client secret, you must update **both** Supabase projects' Auth → Google provider settings.

**Anthropic**
- Single API key shared by dev and prod (low-volume usage).
- Used for resume extraction (1 call per resume import) and NL search (2 calls per query: extract filters + rerank candidates).
- No usage caps configured today — see "post-launch backlog" in `app/CLAUDE.md` for cost monitoring.

### GitHub repository

- **Default branch**: `main`. Pushes here trigger Railway auto-deploy + Supabase prod migration auto-apply.
- **Branching integration**: Supabase's GitHub app installed and pointed at this repo with working directory `app/`. Runs migrations on PR preview branches; merging to `main` auto-applies them to the prod Supabase project.
- **Required status checks**: "Supabase Preview" should be required on `main`. **Currently "Not enforced"** because that requires GitHub Pro ($4/mo) on a personal-account private repo. Treat the green check as advisory until Pro is enabled or the repo moves to an org plan.
- **CI**: GitHub Actions wired at `.github/workflows/`. Two workflows trigger on every PR to `main`:
  - `ci.yml` — `Lint & test` (biome + vitest) and `Build (validates types vs. migrations)` jobs. The build job is the load-bearing migration-safety check: `next build` type-checks the whole codebase against `src/db/database.types.ts`, so a migration that drops a column app code still references fails the PR before merge.
  - `e2e.yml` — `Playwright (chromium)` runs against `bridgecircle-dev` via the Doppler `DOPPLER_TOKEN` secret. Skippable via the `skip-e2e` PR label.
  - Both Doppler-using jobs require a `DOPPLER_TOKEN` repo secret (service token from the Doppler dashboard). See [e2e-testing.md](../runbooks/e2e-testing.md) "Required GitHub secret".

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
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | prod origin (`https://bridgecircle.org`) |
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
pnpm dev
```

Open http://localhost:3000. The dev server reads `.env.local`, which points at `bridgecircle-dev`. Any signup, profile edit, or other write goes to the dev project.

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

### Order of operations is handled for you

The branching integration takes care of the additive-vs-destructive ordering: the migration runs in lockstep with the code merge, so both go live together. The "always-superset" rule from the pre-cutover days no longer applies — you don't have to interleave code and SQL deploys by hand.

If a migration ever needs to be rolled back: write a forward-only "revert" migration. There is no destructive rollback in this setup.

### Env var changes

If you add or change an env var:

1. Update `.env.local` (your laptop).
2. Update **Railway → Variables** (production).
3. Restart `pnpm dev` locally — env vars are read at startup.
4. Trigger a redeploy on Railway — its container also reads env vars only at startup. (Railway has a "Redeploy" button for this; otherwise the next push to `main` picks up the new value.)

Env var drift between laptop and Railway is the #1 source of "works locally, fails in prod" surprises.

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

- **No staging environment.** Just dev (laptop) and prod (Railway). Add a third tier only when production has real users and a regression has real cost — likely after the alumni board meeting.
- **CI checks on PRs are now wired** (was previously listed as out-of-scope). `.github/workflows/ci.yml` runs biome, vitest, and `next build` on every PR. `.github/workflows/e2e.yml` runs Playwright. The Supabase Preview check still validates the migration itself on a real preview branch — together this gives three layers of migration safety: schema replay (Supabase), type compatibility (build), runtime behavior (E2E).
- **Branch protection on `main` is configured but "Not enforced".** A classic branch protection rule exists requiring the "Supabase Preview" check, but enforcement requires GitHub Pro ($4/mo) on a personal-account private repo. Treat the green check as advisory. Either upgrade to Pro, move the repo to an org, or accept the soft enforcement until launch.
- **No PR preview environments on Railway.** Each PR doesn't get its own app URL. Supabase preview branches handle DB schema validation; for app preview you'd enable Railway's PR preview feature in the service settings.
- **No persistent dev branch on the prod Supabase project.** We use `bridgecircle-dev` (separate Free project) for daily development instead. Costs $0 vs. ~$10/mo for a persistent dev branch but adds the manual `pnpm dlx supabase db push` step. See `app/CLAUDE.md` post-launch backlog for the trade-off.
- **DMARC reporting not configured.** A `_dmarc` record exists in monitor-only mode (`p=none`) but has no `rua=` reporting address, so no daily auth reports are collected. Add a reporting mailbox + tighten the policy post-launch.
- **No cost monitoring on Anthropic API.** Resume extraction + NL search both call Claude Haiku. Low volume during pilot but no observability today. Sentry breadcrumbs or a counter row would suffice; see `app/CLAUDE.md` post-launch backlog.

These are all good upgrades to make incrementally. None are urgent for the launch demo.

## Quick Reference

| Question | Answer |
|---|---|
| Which database does `pnpm dev` write to? | `bridgecircle-dev` (via `.env.local`) |
| Which database does the live site write to? | `bridgecircle` (via Railway Variables) |
| What triggers a production deploy? | Push or merge to `main` |
| What triggers a production migration? | Merge to `main` — Supabase auto-applies via the GitHub integration |
| Where are env vars set for prod? | Railway dashboard → Variables tab |
| Where are env vars set for local dev? | `app/.env.local` (gitignored) |
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
