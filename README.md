# BridgeCircle

A verified alumni and community network focused on referrals, mentorship, recruiting, and local connection. First pilot: Chadwick School (Palos Verdes) and Chadwick International (Songdo). Hard demo deadline: 2026-05-25.

## Repository Layout

```
app/                Next.js application (the product)
  src/              source — see app/CLAUDE.md for the /lib discipline
  supabase/         Postgres migrations
  scripts/          dev seeding + RLS verification scripts
docs/               product specs and runbooks
```

## Documentation

Start here depending on what you need:

| Goal | Read |
| --- | --- |
| Product thesis, MVP scope, market framing | [project-summary.md](project-summary.md) |
| What ships in Phase 1 | [docs/phase-1-launch-spec.md](docs/phase-1-launch-spec.md) |
| Why the schema is shaped the way it is | [docs/data-model.md](docs/data-model.md) |
| Where dev/prod live and how schema changes flow | [docs/environments.md](docs/environments.md) |
| Secrets management with Doppler | [docs/doppler.md](docs/doppler.md) |
| Resetting and seeding the dev database | [docs/seed-dev.md](docs/seed-dev.md) |
| Running and writing E2E tests with Playwright | [docs/e2e-testing.md](docs/e2e-testing.md) |
| Conventions for working in `app/` | [app/CLAUDE.md](app/CLAUDE.md) |

## Development

Local dev runs against `bridgecircle-dev`, a separate Supabase project from prod. See [docs/environments.md](docs/environments.md) for the why and how.

```bash
cd app
pnpm install
pnpm dev   # http://localhost:3000
```

The dev project is seeded with 9 hand-curated personas covering the main user roles. Sign in with any of them to test specific flows:

| Persona role | Sign in as | Password |
| --- | --- | --- |
| Super admin | `admin-amy@example.com` | `devseed-password-1` |
| Open mentor | `mentor-mark@example.com` | `devseed-password-2` |
| Mentee | `student-sam@example.com` | `devseed-password-6` |

Full list of all 9 personas (capacity-full mentor, paused mentor, incomplete profile, etc.) with credentials and what each one is meant to test: [docs/seed-dev.md → Test accounts](docs/seed-dev.md#test-accounts).

Re-run the seed after a schema change or when you want a clean slate:

```bash
SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts
```

These dev credentials are intentionally checked into the repo. They only work against `bridgecircle-dev`; prod has no test users. See [docs/environments.md](docs/environments.md) for the dev/prod isolation model.

## Production

Deploys to [bridgecircle.org](https://bridgecircle.org) via Railway on every push to `main`. See [docs/environments.md](docs/environments.md) for env vars, schema-change rules, and the difference between additive and destructive migrations.
