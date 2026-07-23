#!/usr/bin/env bash
# One-command local setup: deps + Doppler scope + local Supabase + seeded DB.
#
# `pnpm setup:local` runs this from app/. Idempotent — run it in any fresh
# worktree (or after a `git clean`) and you end with:
#   - node_modules installed
#   - this app/ directory Doppler-scoped to bridgecircle/dev_local, so a bare
#     `doppler run -- ...` here is hermetic-local by default. (Doppler scopes
#     are per-path in ~/.doppler; a fresh worktree is a new path and starts
#     blank — without this, bare `doppler run` fails with "You must specify
#     a project".)
#   - the local Supabase stack running (Docker booted first if needed)
#   - the database wiped, migrated, and seeded with the deterministic world
#     from supabase/seeds/seed.sql (8 sign-in-able users)
#
# Flags:
#   --dev   start the dev server (`pnpm dev:local`) once setup finishes
#   --e2e   also install the Playwright Chromium binary for `pnpm test:e2e`
#
# CI runs this too (e2e.yml, with --e2e). CI mode is detected via $CI and
# differs only where the environment does: Doppler auth comes from a
# DOPPLER_TOKEN service token (so no login check, no directory scoping —
# the token already pins project/config), the Docker daemon is a given,
# Studio and the log pipeline are excluded from the stack, and Playwright
# installs system deps. The dev-stage integ suite in cd.yml is out of scope
# on purpose: from the dev stage onward tests run against the dev database,
# never a local stack.
#
# The reset wipes local data by design — the local stack is disposable. All
# checkouts share ONE local stack (containers key off `project_id` in
# supabase/config.toml), so resetting here resets it for every worktree.
set -euo pipefail
cd "$(dirname "$0")/.."

RUN_DEV=0
RUN_E2E=0
for arg in "$@"; do
  case "$arg" in
    --dev) RUN_DEV=1 ;;
    --e2e) RUN_E2E=1 ;;
    *) echo "Unknown flag: $arg (known: --dev, --e2e)" >&2; exit 1 ;;
  esac
done

step() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

step "Checking prerequisites"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm isn't installed — install it with 'npm i -g pnpm', then re-run." >&2
  exit 1
fi
if ! command -v doppler >/dev/null 2>&1; then
  echo "The Doppler CLI isn't installed — 'brew install dopplerhq/cli/doppler', then re-run." >&2
  exit 1
fi
if [[ -z "${DOPPLER_TOKEN:-}" ]] && ! doppler me >/dev/null 2>&1; then
  echo "Doppler isn't authenticated on this machine — run 'doppler login' once" >&2
  echo "(the login is machine-wide and shared by every worktree), then re-run." >&2
  exit 1
fi

step "Installing dependencies"
pnpm install

if [[ -z "${DOPPLER_TOKEN:-}" ]]; then
  step "Scoping Doppler for this checkout (bridgecircle/dev_local)"
  doppler setup -p bridgecircle -c dev_local --no-interactive >/dev/null
  echo "Bare 'doppler run' inside $PWD now injects the local-stack config."
fi

step "Starting the local Supabase stack"
# Container env (e.g. PostgREST's exposed-schema list) is baked at creation
# from the config.toml of whichever checkout ran `supabase start`. A stack
# left over from another checkout can silently break this one ("Invalid
# schema: api"), so stop any running stack first and recreate it from THIS
# checkout's config. Data loss is fine — the reset below reseeds everything.
if docker info >/dev/null 2>&1; then
  pnpm exec supabase stop --no-backup >/dev/null 2>&1 || true
fi
if [[ -n "${CI:-}" ]]; then
  # Tests don't need Studio or the log pipeline; skip them on runners.
  # (Direct bash call: pnpm would try to parse the -x flag itself.)
  bash scripts/db-start.sh -x studio,imgproxy,vector,logflare
else
  pnpm run db:start
fi

step "Resetting and seeding the database"
# The reset's own exit code isn't trustworthy on a loaded machine: its final
# container-restart phase can flag a slow auxiliary service unhealthy after
# the seed already applied (or bail before seeding). The verification step
# below judges the actual outcome, so a reset failure here is a warning.
if ! pnpm run db:reset; then
  echo "db reset reported failure — verifying the actual database state before giving up."
fi

step "Verifying the seeded world"
# End-to-end proof, not exit-code trust: seed rows exist AND a real password
# grant succeeds. GoTrue applies its own schema migrations at container boot;
# if the reset restarted things out of order, sign-in fails with "Database
# error querying schema" until the auth container restarts — so after 30s of
# failures, kick it once and keep polling.
users=$(docker exec supabase_db_bridgecircle psql -U postgres -d postgres -tAc \
  "select count(*) from auth.users" 2>/dev/null || echo 0)
if [[ "${users}" -lt 1 ]]; then
  echo "Seed verification failed: auth.users is empty after reset." >&2
  echo "Re-run 'pnpm run db:reset' and check its output." >&2
  exit 1
fi
anon_key=$(pnpm exec supabase status -o env 2>/dev/null | sed -n 's/^ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')
printf "Checking seeded sign-in"
deadline=$((SECONDS + 90))
auth_kicked=0
kick_at=$((SECONDS + 30))
while ((SECONDS < deadline)); do
  if curl -s -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
    -H "apikey: ${anon_key}" -H "Content-Type: application/json" \
    -d '{"email":"richard@example.com","password":"devseed-password-richard"}' \
    | grep -q '"access_token"'; then
    echo " ok."
    break
  fi
  if ((auth_kicked == 0 && SECONDS >= kick_at)); then
    printf " (restarting auth container)"
    docker restart supabase_auth_bridgecircle >/dev/null 2>&1 || true
    auth_kicked=1
  fi
  printf "."
  sleep 3
done
if ((SECONDS >= deadline)); then
  echo "" >&2
  echo "Seeded sign-in never succeeded — the stack is up but auth is unhealthy." >&2
  echo "Check 'docker logs supabase_auth_bridgecircle'." >&2
  exit 1
fi

if [[ "$RUN_E2E" == 1 ]]; then
  step "Installing Playwright Chromium"
  if [[ -n "${CI:-}" ]]; then
    pnpm exec playwright install --with-deps chromium
  else
    pnpm exec playwright install chromium
  fi
fi

step "Done — local world ready"
cat <<'EOF'
  Supabase API   http://127.0.0.1:54321
  Postgres       postgresql://postgres:postgres@127.0.0.1:54322/postgres
  Studio         http://127.0.0.1:54323

  Seeded sign-ins (password pattern: devseed-password-<first name>):
    admin-amy@example.com    devseed-password-amy   (org admin)
    richard@example.com      devseed-password-richard
    mark@ / mei@ / sam@ / jordan@ / onboarding@ / taylor@example.com
  Full cast and relationships: supabase/seeds/seed.sql

  Start the app:  pnpm dev:local        (offline: Resend + AI dummied)
             or:  pnpm dev:local:live   (real AI, email behind the non-prod guard)
  Run E2E:        pnpm test:e2e
EOF

if [[ "$RUN_DEV" == 1 ]]; then
  step "Starting the dev server (pnpm dev:local)"
  exec pnpm run dev:local
fi
