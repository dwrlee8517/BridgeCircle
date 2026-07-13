# Doppler

## Purpose

Doppler is the secrets manager for BridgeCircle. Every environment variable the app needs — Supabase URLs and keys, Sentry token, Resend API key, Anthropic API key, `NODE_ENV` — lives in Doppler, not in `.env.local` files on disk and not in `app/.env*` checked into git. At runtime, `doppler run -- <command>` injects the right secrets into the process's environment.

This is the single source of truth for env vars. If a secret you need isn't there, that's where to add it; not in a local file and not as a hardcoded constant.

This document covers how the project is structured in Doppler, how to wire up your local repo, what secrets are currently provisioned, and the few gotchas that have bitten us.

## Project And Config Structure

There is one Doppler project for the application: **`bridgecircle`** (renamed from `bridgecircle-dev` on 2026-07-11). It owns all environments (dev, staging, prod).

The project has these configs, all under the `dev` environment except staging and prod:

- **`dev`** — root config. The team-shared dev secret values. Whenever a new shared dev secret is added (e.g. a new third-party API key for local development), it goes here. Real Supabase (cloud dev project) and real third-party keys. This is the config the CI/CD pipeline reads for the dev stage.
- **`dev_personal`** — branch off `dev`. Each developer overrides values here for personal local development without affecting the team's `dev`. Talks to the **real** dev Supabase and real services. This is the config your repo binding should point to for `doppler run -- pnpm dev`.
- **`dev_local`** — branch off `dev`. Points Supabase at the **local** stack (`supabase start`, 127.0.0.1) and **dummies out** outbound services (`RESEND_API_KEY=e2e-dummy`, empty `ANTHROPIC_API_KEY`, `ASK_MATCHING_PIPELINE=legacy`) so runs are offline and deterministic. Used by `pnpm dev:local`, the hermetic E2E suite, and CI (via the `DOPPLER_TOKEN_LOCAL` service token). See [e2e-testing.md](e2e-testing.md).
- **`dev_local_live`** — branch off `dev`. Local Supabase like `dev_local`, but **real** Anthropic/Voyage so you can develop AI features against a wipeable local DB. Used by `pnpm dev:local:live`. See "Local dev against real services" below. Not read by CI or the pipeline.
- **`stg`** — staging. Root config. Used by the staging deploy.
- **`prd`** — production. Root config. Used by the production deploy on Railway.

Branched configs inherit from their root. So the `dev_*` branches automatically pick up everything from `dev`, and you only override the keys where your local setup diverges from the team default.

## One-Time CLI Setup

Install the Doppler CLI and log in:

```bash
brew install dopplerhq/cli/doppler
doppler login              # opens a browser, follow the auth flow
```

Verify the login took:

```bash
doppler me
```

You should see a row showing your machine name connected to the BridgeCircle workplace.

## Binding The Repo To A Config

Run this once inside `app/`:

```bash
cd app
doppler setup --project bridgecircle --config dev_personal
```

This writes a small file (`~/.doppler/.doppler.yaml` in your home directory) that records `app/` → `bridgecircle` / `dev_personal`. After this, every `doppler run -- ...` invocation inside `app/` knows which secrets to inject without you naming the project or config explicitly.

To verify the binding:

```bash
doppler configure
```

The output should show `project = bridgecircle` and `config = dev_personal` scoped to your `app/` directory.

## Running Commands With Secrets

Anything that needs the application's env vars goes through `doppler run`:

```bash
doppler run -- pnpm dev               # Next.js dev server
doppler run -- pnpm build             # production build with prod-style env
doppler run -- pnpm exec tsx scripts/seed-dev.ts   # ad-hoc scripts
doppler run -- pnpm test:e2e          # E2E tests against the dev DB
```

Without `doppler run`, the process inherits whatever your shell happens to have, which on a fresh terminal is nothing. You'll see `next dev` come up but every Supabase / Resend / Sentry call will fail because the keys are missing.

## Secrets Currently Provisioned

The following keys are set in `dev_personal` (and inherited from `dev` where shared):

- `NEXT_PUBLIC_SUPABASE_URL` — dev Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — anon key for client-side Supabase calls
- `SUPABASE_SECRET_KEY` — service-role key for server-side Supabase calls (RLS-bypassing)
- `ANTHROPIC_API_KEY` — for the AI-powered features
- `VOYAGE_API_KEY` — for Voyage Ask matching embeddings and reranking when `ASK_MATCHING_PIPELINE=voyage_hybrid`
- `ASK_MATCHING_PIPELINE` — Ask matching mode; defaults to `legacy` until the Voyage hybrid path is verified
- `ASK_MATCHING_EXPLANATIONS` — Ask explanation mode; defaults to `templated`
- `RESEND_API_KEY` — for transactional email
- `SENTRY_AUTH_TOKEN` — for source-map upload during build
- `NODE_ENV` / `APP_ENV` — see "The NODE_ENV Gotcha" and "APP_ENV" below

If you add a new secret, add it to `dev` first (so the whole team gets it on next run) and only override in `dev_personal` if your value needs to differ from the team's.

## The NODE_ENV Gotcha

`NODE_ENV` is a **build-mode flag owned by the tools, not an environment selector** — environment identity is `APP_ENV` (below). Since 2026-07-11 the `package.json` scripts pin it structurally:

- `pnpm dev` → `NODE_ENV=development next dev`
- `pnpm build` / `pnpm start` → `NODE_ENV=production next ...`

The inline assignment beats whatever a Doppler config injects, so no config value can put a deployed stage into development mode (the first dev-stage redeploy failed exactly that way — `next build` under `development` breaks React prerendering) or a laptop dev server into production mode.

Background: Doppler also *infers* a `NODE_ENV` from the config slug (`dev` → `development`, `prd` → `production`, unrecognized slugs like `dev_personal` → `production`) and syncs it to Railway. With the scripts pinned this only affects non-Next processes (`tsx` scripts, etc.); the configs carry explicit values matching their tier (`dev` → `production` because it feeds the deployed stage, `dev_personal` → `development`) so those processes see the truth too.

## APP_ENV — the environment identity

`APP_ENV` says *which tier* the process belongs to; code branches on it for Sentry environment, robots/noindex, and cron gating. Set explicitly in every config (2026-07-11):

| Config | `APP_ENV` | Tier |
|---|---|---|
| `dev_personal` | `local` | laptop dev server → real dev Supabase |
| `dev_local` | `local` | laptop / CI → local Supabase, services dummied |
| `dev_local_live` | `local` | laptop → local Supabase, real Anthropic/Voyage |
| `dev` | `dev` | Railway dev stage (production build), dev Supabase |
| `prd` | `prod` | Railway production |

Never branch on `NODE_ENV` for environment identity — the dev stage and production are both `NODE_ENV=production` on purpose.

> **No email allowlist yet.** Despite what you might expect, nothing gates
> outbound email by tier — [`src/notify/resend.ts`](../../app/src/notify/resend.ts)
> sends to whatever address it's given whenever `RESEND_API_KEY` is set (it's
> only faked when the key is *absent*). So any config with a real Resend key
> sends real email. Keep `RESEND_API_KEY` dummied outside `dev`/`prd` until a
> non-prod `to`-allowlist (or `delivered@resend.dev` redirect for
> `APP_ENV !== 'prod'`) is added. Tracked as a follow-up.

### Why `--preserve-env` Is A Trap Here

`doppler run --preserve-env` tells Doppler not to overwrite env vars that are already present in the parent shell. This sounds useful but bites in environments where the parent process inherits `NODE_ENV=production` from somewhere (Node-based MCP servers, some CI runners, and parent processes that hardcode `NODE_ENV` for their own reasons).

When the parent has `NODE_ENV=production`, `--preserve-env` keeps that value and silently ignores the config's. The package.json script pins make this harmless for Next.js itself, but ad-hoc `doppler run` invocations of other tools can still be surprised — avoid `--preserve-env` unless you need it for a specific variable.

## Local Dev Against Real Services (`dev_local_live`)

`dev_local` fakes the outbound services so tests stay deterministic — which means you can't exercise AI features (resume extraction, Ask matching, explanation polish) locally against it. When you need real Anthropic/Voyage output while keeping a wipeable local database, use the **`dev_local_live`** config and `pnpm dev:local:live`.

It does **not** affect CI or the pipeline — nothing there references it, and `dev_local` (the config CI reads) is untouched, so the hermetic suite stays deterministic.

**One-time setup** (branch it off `dev` so the real Anthropic/Voyage keys inherit automatically — you never copy a raw secret):

```bash
# 1. create the branch config (Doppler dashboard: bridgecircle → dev → branch "dev_local_live",
#    or CLI if your Doppler version supports `doppler configs create`)

# 2. get the local stack's values (these are non-secret local-dev constants)
cd app
pnpm dlx supabase status

# 3. override ONLY the local-diverging keys; everything else inherits from dev
doppler secrets set -p bridgecircle -c dev_local_live \
  NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<Publishable key from supabase status>" \
  SUPABASE_SECRET_KEY="<Secret key from supabase status>" \
  APP_ENV="local" \
  NODE_ENV="development" \
  RESEND_API_KEY="local-live-dummy"
```

That last override is the safety line: **keep `RESEND_API_KEY` dummied** here (see the "No email allowlist yet" note above) so a triggered email flow can't send real mail from your laptop. Real Anthropic/Voyage flow in from `dev` untouched. If you specifically need to test an email, flip `RESEND_API_KEY` to the real value **temporarily** and only exercise flows addressed to your own inbox.

Then run it:

```bash
pnpm db:start && pnpm db:reset   # fresh local DB
pnpm dev:local:live              # app at :3001, local DB + real AI
```

## Adding A New Secret

For a secret that all developers should have:

```bash
cd app
doppler secrets set MY_NEW_KEY=value --config dev
```

Then re-run any `doppler run` commands you have open; they pick up the new secret on the next invocation. Branched configs (`dev_personal`) inherit it automatically.

For a secret that only your local environment should have differently:

```bash
doppler secrets set MY_NEW_KEY=my-personal-value --config dev_personal
```

This overrides whatever `dev` has for that key, but only in your bound config.

For staging or production, add via the Doppler dashboard (or CLI with `--config stg` / `--config prd`) and confirm with whoever owns the deploy.

## Rotating A Secret

Update the value in the relevant config:

```bash
doppler secrets set SUPABASE_SECRET_KEY=new-value --config dev
```

For prod and staging, do this through the dashboard so there's an audit trail.

After rotation, restart any running processes that read the secret. Doppler doesn't push updates into a running process — `doppler run` reads the current values once at process start.

## CI / CD

CI and CD are wired (see [`.github/workflows/`](../../.github/workflows/) and [environments.md](../architecture/environments.md)). GitHub holds **only Doppler service tokens** as repo/environment secrets; everything else is injected at runtime via `doppler run`. Each token is scoped to exactly one config:

| GitHub secret | Doppler config | Used by |
|---|---|---|
| `DOPPLER_TOKEN` | `dev` | `ci.yml` (build), `cd.yml` deploy-dev + integ |
| `DOPPLER_TOKEN_LOCAL` | `dev_local` | `e2e.yml` (PR hermetic suite) — local-stack + dummy values only, never real secrets |
| `DOPPLER_TOKEN_PRD` | `prd` | `cd.yml` promote job (only that job, gated behind the `production` environment) |

Jobs run `doppler run -- <command>` exactly as you do locally; the token in the env authenticates non-interactively. The `DOPPLER_TOKEN_LOCAL` scoping is deliberate — the E2E runner can read local-stack values and dummies but **never** real dev/prod secrets. Rotate any token through the Doppler dashboard and update the matching GitHub secret in the same step.

## Troubleshooting

**"Doppler Error: You must specify a project"**

Your current directory isn't bound to a config. Run `doppler setup --project bridgecircle --config dev_personal` from `app/`.

**`zsh: command not found: doppler`**

CLI isn't installed or isn't on PATH. `brew install dopplerhq/cli/doppler` and ensure `/opt/homebrew/bin` is in your PATH (Apple Silicon) or `/usr/local/bin` (Intel).

**The dev server warns about non-standard `NODE_ENV`**

Either the explicit `NODE_ENV=development` secret was removed from your `dev_personal` config, or you're running with `--preserve-env` and your parent shell has `NODE_ENV=production`. See "The NODE_ENV Gotcha" above.

**Secrets I added in the dashboard aren't appearing locally**

`doppler run` reads secrets at process start. Stop and restart the process. If still missing, run `doppler secrets` to confirm the secret actually landed in the config you're bound to (not a sibling config).

## Related Documentation

- [Environments and dev/prod separation](../architecture/environments.md) — which Supabase project each Doppler config talks to and the rules around prod safety.
- [Dev seeding](seed-dev.md) — the seed script reads its env vars via `doppler run` too.
- [E2E testing](e2e-testing.md) — Playwright runs the dev server through Doppler.
