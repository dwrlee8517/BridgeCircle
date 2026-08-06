#!/usr/bin/env bash
# Integration suite against the shared DEV Supabase — opt-in, never automatic.
#
# The exact same tests as the local target, pointed at dev via Doppler. Because
# dev is shared, this runs create-AND-destroy against real data, so it is
# guarded twice: an explicit env acknowledgement, and the it+/it- namespacing +
# end-of-run sweep that only ever touches test-owned rows.
#
# Usage:
#   INTEGRATION_ALLOW_DEV=1 pnpm test:int:dev
set -euo pipefail
cd "$(dirname "$0")/../../.."   # -> app/

if [ "${INTEGRATION_ALLOW_DEV:-}" != "1" ]; then
  cat >&2 <<'EOF'
✖ Refusing to run integration tests against the shared DEV database without
  an explicit acknowledgement. This creates and destroys data in dev.

  Re-run with:  INTEGRATION_ALLOW_DEV=1 pnpm test:int:dev

  Requirements in the Doppler dev_personal config:
    - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SECRET_KEY  (already present for the app)
    - PROVISION_SECRET      (add this; it guards the provisioning route)
EOF
  exit 1
fi

# Fresh worktrees don't inherit a Doppler scope — pin it explicitly so config
# resolution can't silently fall back. (See the worktree Doppler-scope gotcha.)
export INTEGRATION_SWEEP=1

echo "▶ Integration tests against DEV Supabase (via Doppler dev_personal)"
exec doppler run -p bridgecircle -c dev_personal -- \
  pnpm exec vitest run --config vitest.integration.config.ts "$@"
