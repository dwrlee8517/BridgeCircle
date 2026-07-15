# Doppler

## Purpose

Doppler is the secrets manager for BridgeCircle. Every environment variable the app needs — Supabase URLs and keys, Sentry token, Resend API key, Anthropic API key, `NODE_ENV` — lives in Doppler, not in `.env.local` files on disk and not in `app/.env*` checked into git. At runtime, `doppler run -- <command>` injects the right secrets into the process's environment.

This is the single source of truth for env vars. If a secret you need isn't there, that's where to add it; not in a local file and not as a hardcoded constant.

This document covers how the project is structured in Doppler, how to wire up your local repo, what secrets are currently provisioned, and the few gotchas that have bitten us.

## Project And Config Structure

There is one Doppler project for the application: **`bridgecircle`** (renamed from `bridgecircle-dev` on 2026-07-11). It owns the dev and prod configs (a `stg` config exists but is unused — there is no staging deploy; see [environments.md](../architecture/environments.md)).

The project has these configs, all under the `dev` environment except staging and prod:

- **`dev`** — root config. The team-shared dev secret values. Whenever a new shared dev secret is added (e.g. a new third-party API key for local development), it goes here. Real Supabase (cloud dev project) and real third-party keys. This is the config the CI/CD pipeline reads for the dev stage.
- **`dev_personal`** — branch off `dev`. Each developer overrides values here for personal local development without affecting the team's `dev`. Talks to the **real** dev Supabase and real services. This is the config your repo binding should point to for `doppler run -- pnpm dev`.
- **`dev_local`** — branch off `dev`. Points Supabase at the **local** stack (`supabase start`, 127.0.0.1) and **dummies out** outbound services (`RESEND_API_KEY=e2e-dummy`, empty `ANTHROPIC_API_KEY`, `ASK_MATCHING_PIPELINE=legacy`) so runs are offline and deterministic. Used by `pnpm dev:local`, the hermetic E2E suite, and CI (via the `DOPPLER_TOKEN_LOCAL` service token). See [e2e-testing.md](e2e-testing.md).
- **`dev_local_live`** — branch off `dev`. Local Supabase like `dev_local`, but **real** Anthropic/Voyage **and real Resend** (safe because the [non-prod email guard](#the-non-prod-email-guard) redirects everything not allowlisted to a sink) — so you can develop AI and email features against a wipeable local DB. Used by `pnpm dev:local:live`. See "Local dev against real services" below. Not read by CI or the pipeline.
- **`stg`** — staging. Root config, **currently unused** — there is no staging environment on Railway (the pipeline goes dev → prod). Kept as a placeholder for a future staging tier.
- **`prd`** — production. Root config. Syncs to the Railway `production` environment; read by the CD pipeline's promote job.

### Which config, when

| You want to… | Use | Command |
|---|---|---|
| Daily local dev — build features, incl. AI + email, against a throwaway DB | `dev_local_live` | `pnpm dev:local:live` |
| Run/write E2E tests, or anything that must be deterministic | `dev_local` | `pnpm test:e2e` / `pnpm dev:local` — **don't repurpose this config; CI reads it** |
| Reach the **shared cloud dev world** — reproduce a dev-stage bug, inspect data Daniel also sees, test against the DB the integ suite hits | `dev_personal` | `doppler run -- pnpm dev` |
| (machines only) Deployed dev stage + CI/CD jobs | `dev` | never bind your laptop to it — it carries `NODE_ENV=production` / `APP_ENV=dev` for the deployed production build, and edits ripple to `dev.bridgecircle.org` |

### How branch inheritance behaves

Branch configs inherit every root key they don't override. In the dashboard, an inherited secret shows a **"synced with dev"** badge — that's a **live link, not a snapshot**: change the value in `dev` (e.g. rotate a key) and every branch showing that badge follows automatically. Only **overridden** keys (the ones a branch sets itself — the local Supabase pointer, `APP_ENV`, `NODE_ENV`, dummied services) shadow the root and do *not* follow it.

Two gotchas, both learned the hard way:

- **`doppler secrets delete` on a branch does NOT "restore inheritance"** — it removes the key from that branch outright, masking the root value (`get` then errors with "Could not find requested secret"). To un-override a key, set it back to the root's value — Doppler recognizes the match and re-links it as inherited — or use the dashboard's revert on that secret.
- **`doppler secrets set` replaces, never appends.** Overwriting a list-valued secret (e.g. `EMAIL_DEV_ALLOWLIST`) with one new entry silently drops the others — always include the full list.

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
- `OUTBOX_BATCH_SIZE`, `OUTBOX_CONCURRENCY`, `OUTBOX_HANDLER_TIMEOUT_MS`, and
  `OUTBOX_IDLE_DELAY_MS` — optional bounded tuning for the v2 Help worker; code
  defaults are safe when these are absent
- `NODE_ENV` / `APP_ENV` — see "The NODE_ENV Gotcha" and "APP_ENV" below

If you add a new secret, add it to `dev` first (so the whole team gets it on next run) and only override in `dev_personal` if your value needs to differ from the team's.

## The NODE_ENV Gotcha

`NODE_ENV` is a **build-mode flag owned by the tools, not an environment selector** — environment identity is `APP_ENV` (below). Since 2026-07-11 the `package.json` scripts pin it structurally:

- `pnpm dev` → `NODE_ENV=development next dev`
- `pnpm build` / `pnpm start` → `NODE_ENV=production next ...`

The inline assignment beats whatever a Doppler config injects, so no config value can put a deployed stage into development mode (the first dev-stage redeploy failed exactly that way — `next build` under `development` breaks React prerendering) or a laptop dev server into production mode.

Background: Doppler also *infers* a `NODE_ENV` from the config slug (`dev` → `development`, `prd` → `production`, unrecognized slugs like `dev_personal` → `production`) and syncs it to Railway. With the scripts pinned this only affects non-Next processes (`tsx` scripts, etc.); the configs carry explicit values matching their tier (`dev` → `production` because it feeds the deployed stage, `dev_personal` → `development`) so those processes see the truth too.

## APP_ENV — the environment identity

`APP_ENV` says *which tier* the process belongs to; code branches on it for Sentry environment, robots/noindex, cron gating, and the non-prod email guard (below). Set explicitly in every config (2026-07-11):

| Config | `APP_ENV` | Tier |
|---|---|---|
| `dev_personal` | `local` | laptop dev server → real dev Supabase |
| `dev_local` | `local` | laptop / CI → local Supabase, services dummied |
| `dev_local_live` | `local` | laptop → local Supabase, real Anthropic/Voyage |
| `dev` | `dev` | Railway dev stage (production build), dev Supabase |
| `prd` | `prod` | Railway production |

Never branch on `NODE_ENV` for environment identity — the dev stage and production are both `NODE_ENV=production` on purpose.

### The non-prod email guard

There *is* now an email guard (this used to read "no allowlist yet"). It lives in [`app/src/notify/devGuard.ts`](../../app/src/notify/devGuard.ts) and runs inside `sendRenderedEmail` — the single Resend send choke point in `app/src/notify/resend.ts`.

Whenever `APP_ENV !== 'prod'`, a recipient is delivered as-is only if it is a known-safe address (a `@resend.dev` sink, or one you put on the dev allowlist); **everything else is redirected to a single safe sink** (`delivered@resend.dev`) before the send, and a content-free redirect event is logged without either email address. This exists because non-prod now runs against real Resend keys — the `dev_local_live` config and remote-dev both use a live key — so without the guard the dev seed's `@example.com` addresses would bounce (denting sender reputation) and any triggered flow would mail real people from a dev box.

Resolution order in non-prod:

- **`prod`** — no redirect; mail goes to the real recipient. Prod ignores the sink and allowlist entirely.
- **`@resend.dev` recipients pass through untouched** — the E2E factory ([`tests/e2e/helpers/factory.ts`](../../app/tests/e2e/helpers/factory.ts)) already routes to `delivered+<label>@resend.dev`, and the guard leaves the `+label` intact so integ specs can still assert per-recipient.
- **Allowlisted recipients pass through** to their real inbox (see `EMAIL_DEV_ALLOWLIST` below).
- **Everything else → the sink.** `dev`, `local`, and an *unset* `APP_ENV` all redirect; unset is treated as non-prod on purpose (fail safe), so only an explicit `prod` sends for real.

Two optional knobs, both set per Doppler config:

- **`EMAIL_DEV_REDIRECT`** — change the sink. Point it at your own inbox (e.g. `you@gmail.com`) to catch *all* non-allowlisted dev mail (including fake seed users) in one place. Unset → `delivered@resend.dev`.
- **`EMAIL_DEV_ALLOWLIST`** — comma-separated **exact** addresses that may receive their own mail in non-prod (e.g. `you@gmail.com,daniel@bridgecircle.org`). Matching is case-insensitive and whitespace-trimmed. Default empty → nothing is allowlisted, so the feature is inert until you opt in.

⚠️ The allowlist is a deliberate hole in "non-prod never mails a real address," so keep it curated: **exact addresses only — never a domain wildcard**, never a real member/alum address, and prune stale entries. It only changes *routing* — an allowlisted Gmail address still receives cold-domain mail that can land in spam, so it does not improve deliverability.

**Managing the allowlist.** It's set on the **`dev` root config** and inherited by `dev_personal`, so a single write covers the shared Railway dev stage *and* every laptop that binds to `dev_personal`. Add or remove a developer by rewriting the whole list (`set` replaces, it does not append):

```bash
doppler secrets set EMAIL_DEV_ALLOWLIST="rlee8517@gmail.com,dkoo.dev@gmail.com" --config dev
```

The `dev` config is the source of truth — check the current value with `doppler secrets get EMAIL_DEV_ALLOWLIST --config dev --plain` rather than trusting any list written into docs. As of first setup it holds the two maintainers' personal inboxes. `prd` intentionally has no value (prod ignores the allowlist). Because the Doppler → Railway sync does **not** auto-redeploy, a change to `dev` reaches the running dev stage only on its next deploy; a laptop picks it up on the next `doppler run -- pnpm dev`.

### Why `--preserve-env` Is A Trap Here

`doppler run --preserve-env` tells Doppler not to overwrite env vars that are already present in the parent shell. This sounds useful but bites in environments where the parent process inherits `NODE_ENV=production` from somewhere (Node-based MCP servers, some CI runners, and parent processes that hardcode `NODE_ENV` for their own reasons).

When the parent has `NODE_ENV=production`, `--preserve-env` keeps that value and silently ignores the config's. The package.json script pins make this harmless for Next.js itself, but ad-hoc `doppler run` invocations of other tools can still be surprised — avoid `--preserve-env` unless you need it for a specific variable.

## Local Dev Against Real Services (`dev_local_live`)

`dev_local` fakes the outbound services so tests stay deterministic — which means you can't exercise AI or email features (resume extraction, Ask matching, invite/notification emails) locally against it. When you need real service output while keeping a wipeable local database, use the **`dev_local_live`** config and `pnpm dev:local:live`.

It does **not** affect CI or the pipeline — nothing there references it, and `dev_local` (the config CI reads) is untouched, so the hermetic suite stays deterministic.

**Current shape** (created 2026-07-13; a branch off `dev`, so real service keys inherit as live links):

| Key | State |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + Supabase keys | **overridden** → local stack (`http://127.0.0.1:54321`) |
| `APP_ENV` / `NODE_ENV` | **overridden** → `local` / `development` |
| `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` | inherited (real) — AI features work for real |
| `RESEND_API_KEY` | inherited (real) — **safe because of the [non-prod email guard](#the-non-prod-email-guard)**: with `APP_ENV=local`, only `EMAIL_DEV_ALLOWLIST` addresses receive real mail; every other recipient (incl. all `@example.com` seed personas) is redirected to `delivered@resend.dev` and the redirect logged |
| everything else | inherited from `dev` |

Run it:

```bash
pnpm db:start && pnpm db:reset   # fresh local DB
pnpm dev:local:live              # app at :3000, local DB + real AI + guarded real email
```

**If the local Supabase keys drift** (a Supabase CLI upgrade can change the local stack's well-known keys): compare with `pnpm dlx supabase status` and re-set the two key overrides here, same as the `dev_local` procedure in [e2e-testing.md](e2e-testing.md).

**Recreating from scratch** (if the config is ever deleted): branch `dev_local_live` off `dev` in the dashboard, then override only the local-diverging keys:

```bash
cd app && pnpm dlx supabase status   # local values (non-secret dev constants)
doppler secrets set -p bridgecircle -c dev_local_live \
  NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<Publishable key from supabase status>" \
  SUPABASE_SECRET_KEY="<Secret key from supabase status>" \
  APP_ENV="local" \
  NODE_ENV="development"
```

Leave `RESEND_API_KEY` alone so it inherits the real key — the guard is what makes that safe, not a dummy. (History: the config originally dummied Resend because it predated the guard; that override was removed once #146 landed.)

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
