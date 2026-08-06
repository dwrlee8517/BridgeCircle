#!/usr/bin/env bash
# Integration suite against LOCAL Supabase (the default target).
#
# Pulls connection env straight from `supabase status` and maps it to the var
# names the app reads, so there is no .env juggling and no chance of pointing
# at a remote DB by accident. Extra args pass through to vitest, e.g.
#   pnpm test:int tests/integration/auth/join.int.test.ts
set -euo pipefail
cd "$(dirname "$0")/../../.."   # -> app/

if ! docker info >/dev/null 2>&1; then
  echo "✖ Docker isn't running. Start Docker Desktop, then \`pnpm db:start\`." >&2
  exit 1
fi

# `pnpm exec` (not npx) so we use the supabase CLI version pinned in
# package.json — the same one migrations and the E2E job run against.
if ! pnpm exec supabase status >/dev/null 2>&1; then
  echo "✖ Local Supabase isn't up. Run: pnpm db:start" >&2
  exit 1
fi

# `supabase status -o env` prints KEY="value" lines (API_URL, ANON_KEY,
# SERVICE_ROLE_KEY, and on newer CLIs PUBLISHABLE_KEY / SECRET_KEY).
#
# Keep only assignment lines before eval'ing: pnpm writes notices such as its
# "Unsupported engine" warning to stdout, and that text contains parentheses
# that would otherwise be parsed as shell syntax.
set -a
eval "$(pnpm exec supabase status -o env 2>/dev/null | grep -E '^[A-Z_][A-Z0-9_]*=')"
set +a

export NEXT_PUBLIC_SUPABASE_URL="${API_URL:-http://127.0.0.1:54321}"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${PUBLISHABLE_KEY:-${ANON_KEY:-}}"
export SUPABASE_SECRET_KEY="${SECRET_KEY:-${SERVICE_ROLE_KEY:-}}"
# Local-only shared secret for the provisioning route. No real secret needed
# against a throwaway local DB.
export PROVISION_SECRET="${PROVISION_SECRET:-local-integration-provision-secret}"
# Purge any leftover it+/it- data at the end (belt-and-suspenders on top of
# per-file teardown).
export INTEGRATION_SWEEP=1

echo "▶ Integration tests against LOCAL Supabase ($NEXT_PUBLIC_SUPABASE_URL)"
exec pnpm exec vitest run --config vitest.integration.config.ts "$@"
