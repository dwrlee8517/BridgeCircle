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

## Where The Env Vars Live

| Variable | Local (`.env.local`) | Railway (Variables tab) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | dev project URL | prod project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | dev publishable key | prod publishable key |
| `SUPABASE_SECRET_KEY` | dev secret key | prod secret key |
| `RESEND_API_KEY` | (when added) Resend key | (when added) Resend key |
| `SENTRY_AUTH_TOKEN` | (build-time only) | set by Sentry wizard |

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

Schema is managed by **migration files** in `supabase/migrations/` (folder will be created when the first migration is written). Migrations are forward-only files that describe a schema change.

Workflow when adding a column or table:

1. Write a migration:
   ```bash
   pnpm dlx supabase migration new <descriptive_name>
   ```
2. Edit the generated SQL file under `supabase/migrations/`.
3. Apply to dev:
   ```bash
   pnpm dlx supabase db push   # while linked to bridgecircle-dev
   ```
4. Update the app code that depends on the new schema.
5. Test locally against the now-migrated dev database.
6. Commit migration + code together to a feature branch.
7. Merge to `main`. Railway redeploys the app.
8. Apply the same migration to production:
   ```bash
   pnpm dlx supabase db push   # while linked to bridgecircle (prod)
   ```

### Order of operations matters

For **additive** changes (new column, new table) — apply the migration to prod **before** the new code reaches users:

```
Apply migration to prod → push code to main / Railway deploy
```

For **destructive** changes (drop column, drop table) — push code first, then apply the migration:

```
Push code to main / Railway deploy → apply migration to prod
```

The rule of thumb: the database should always be a *superset* of what the running code expects. Add things to the database before code, remove things after code.

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

- **No staging environment.** Just dev (laptop) and prod (Railway). Add a third tier only when production has real users and a regression has real cost — likely after the May 25 alumni board meeting.
- **No CI checks on PRs.** Pushing a PR doesn't run tests automatically yet. Run `pnpm build` and tests locally before merging. Worth adding GitHub Actions later for `pnpm build` + `pnpm vitest` + `pnpm biome check` on every PR.
- **No branch protection on `main`.** Anyone with repo access can push directly. Worth turning on (Settings → Branches → Add rule → require PR) before launch.
- **No PR preview environments on Railway.** Each PR doesn't get its own URL. Can be enabled in Railway's service settings if needed for testing against real infra.

These are all good upgrades to make incrementally. None are urgent right now.

## Quick Reference

| Question | Answer |
|---|---|
| Which database does `pnpm dev` write to? | `bridgecircle-dev` (via `.env.local`) |
| Which database does the live site write to? | `bridgecircle` (via Railway Variables) |
| What triggers a production deploy? | Push or merge to `main` |
| Where are env vars set for prod? | Railway dashboard → Variables tab |
| Where are env vars set for local dev? | `app/.env.local` (gitignored) |
| What's the source of truth for schema? | `supabase/migrations/` files in the repo |
| Can I edit the schema in the Supabase dashboard? | No. Always write a migration. |
| Can I run SQL queries in the Supabase dashboard? | Reads yes, writes no — especially against prod. |
| What if I push a broken commit to `main`? | Build fails on Railway, prod keeps running the previous version. Fix on a new PR. |

## When This Doc Gets Outdated

Update this file whenever you:

- Add a new long-lived environment (staging, preview).
- Add a new third-party service to the stack.
- Change which branch Railway watches.
- Add CI / PR checks.
- Add branch protection rules.
- Add new env vars that other developers will need to know about.

Out-of-date workflow docs are worse than no workflow docs. If the file disagrees with reality, fix the file.
