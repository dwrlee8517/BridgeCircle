# BridgeCircle

A verified alumni and community network focused on referrals, mentorship, recruiting, and local connection. First pilot: Chadwick School (Palos Verdes) and Chadwick International (Songdo).

## Repository Layout

```
app/                Next.js application (the product)
  src/              source — see app/CLAUDE.md for the /lib discipline
  supabase/         Postgres migrations
  scripts/          dev seeding + RLS verification scripts
mobile/             Expo + Expo Router native shell (boots-only scaffold; see mobile/README.md)
docs/               product specs, runbooks, architecture, and experience docs
```

`app/` and `mobile/` install independently, each with its own lockfile. There is no root
pnpm workspace — see [mobile/README.md](mobile/README.md) for why, and the
[post-launch backlog](product-spec-obsidian-vault/Prototype/phase-1/post-launch-backlog.md)
for the `apps/` restructure that changes it.

## Documentation

Start here depending on what you need:

| Goal | Read |
| --- | --- |
| Product thesis, MVP scope, market framing | [project-summary.md](project-summary.md) |
| Experience docs and active design system | [docs/experience/README.md](docs/experience/README.md) |
| What ships in Phase 1 | [product-spec-obsidian-vault/Production/phase-1/launch-cut.md](product-spec-obsidian-vault/Production/phase-1/launch-cut.md) |
| Why the schema is shaped the way it is | [docs/architecture/schema-rationale.md](docs/architecture/schema-rationale.md) |
| Where dev/prod live and how schema changes flow | [docs/architecture/environments.md](docs/architecture/environments.md) |
| Secrets management with Doppler | [docs/runbooks/doppler.md](docs/runbooks/doppler.md) |
| Resetting and seeding the dev database | [docs/runbooks/seed-dev.md](docs/runbooks/seed-dev.md) |
| Running and writing E2E tests with Playwright | [docs/runbooks/e2e-testing.md](docs/runbooks/e2e-testing.md) |
| Full docs index | [docs/INDEX.md](docs/INDEX.md) |
| Conventions for working in `app/` | [app/CLAUDE.md](app/CLAUDE.md) |
| Conventions for working in `mobile/` | [mobile/CLAUDE.md](mobile/CLAUDE.md) |

## Development

Local dev runs against `bridgecircle-dev`, a separate Supabase project from prod. See [docs/architecture/environments.md](docs/architecture/environments.md) for the why and how.

```bash
cd app
pnpm install
pnpm dev   # http://localhost:3000
```

The seed covers membership, Connection, conversation, Help, Messages, matching, and School fixtures.

| Role | Sign in as | Password |
| --- | --- | --- |
| Primary member | `richard@example.com` | `devseed-password-richard` |
| Super admin | `admin-amy@example.com` | `devseed-password-amy` |

Other seeded members follow the same `devseed-password-<first-name>` pattern. `app/supabase/seeds/seed.sql` is canonical for the exact cast and credentials — read the seed rather than a prose table that can drift. Context on what each fixture exercises: [docs/runbooks/seed-dev.md](docs/runbooks/seed-dev.md).

Reset and re-seed the local stack after a schema change or for a clean slate:

```bash
pnpm db:reset
```

That applies migrations in order and then runs `seed.sql`. For the larger generated demo population, follow with `pnpm seed:demo`.

These dev credentials are intentionally checked into the repo. They only work against `bridgecircle-dev`; prod has no test users. See [docs/architecture/environments.md](docs/architecture/environments.md) for the dev/prod isolation model.

## Production

Deploys to [bridgecircle.org](https://bridgecircle.org) via Railway on every push to `main`. See [docs/architecture/environments.md](docs/architecture/environments.md) for env vars, schema-change rules, and the difference between additive and destructive migrations.
