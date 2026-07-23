#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for development cutover boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_dir="$(cd "$root_dir/.." && pwd)"
preflight="$root_dir/scripts/dev-v2-cutover-preflight.ts"
target_guard="$root_dir/src/lib/cutover/dev-target.ts"
seed="$root_dir/supabase/seeds/seed.sql"

required_guard_markers=(
  "export const CUTOVER_BRANCH = 'codex/redesign-v2'"
  "export const DEV_PROJECT_REF = 'ojpvahiuafdcynbdbmri'"
  "export const PROD_PROJECT_REF = 'edumxwzilfgvamzarwvo'"
  "E2E_ALLOW_DEV_SEED=1 is restricted"
  "Hosted dev smoke requires the exact 40-character CUTOVER_SHA"
)

for marker in "${required_guard_markers[@]}"; do
  if ! rg -F -q "$marker" "$target_guard"; then
    echo "Development cutover target guard is missing: $marker" >&2
    exit 1
  fi
done

if rg -n 'db reset|db push|migration repair|drop schema|delete from|truncate table' "$preflight"; then
  echo "The development cutover preflight must remain read-only" >&2
  exit 1
fi

if ! head -n 4 "$seed" | rg -q 'explicitly authorized disposable hosted development'; then
  echo "The canonical seed is missing its disposable-dev authorization contract" >&2
  exit 1
fi

if ! head -n 4 "$seed" | rg -q 'Production use is forbidden'; then
  echo "The canonical seed must explicitly forbid production use" >&2
  exit 1
fi

executable_paths=("$root_dir/scripts" "$repo_dir/.github/workflows")
while IFS= read -r executable; do
  if rg -q '(edumxwzilfgvamzarwvo|https://bridgecircle\.org|APP_ENV=prod)' "$executable"; then
    echo "A production-targeted reset or seed command is forbidden: $executable" >&2
    exit 1
  fi
done < <(
  rg -l --glob '!check-dev-cutover-boundaries.sh' '(db reset --linked|seed\.sql)' "${executable_paths[@]}"
)

if ! rg -q 'cutover:preflight:dev' "$root_dir/package.json"; then
  echo "The checked-in dev preflight command is missing" >&2
  exit 1
fi

echo "Development cutover target, seed, smoke, and preflight boundaries are intact"
