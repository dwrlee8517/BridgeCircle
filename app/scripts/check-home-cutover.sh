#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Home cutover checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
home_routes=(
  "$root_dir/src/app/(member)/page.tsx"
  "$root_dir/src/app/(member)/home-dashboard.tsx"
  "$root_dir/src/app/(member)/home-spotlight.tsx"
  "$root_dir/src/app/(member)/home-waiting.tsx"
)
placeholder_pattern='will land here|profile and circle access are ready|each v2 domain is connected'
private_query_pattern='[?&](q|question|ask|draft)='
raw_home_pattern="\\.from\\(['\"](ask_outcome_shares|asks|organization_memberships|connections|events|announcements)['\"]\\)"

if rg -n "$placeholder_pattern" "${home_routes[@]}"; then
  echo "Home placeholder copy remains after the vertical-slice cutover" >&2
  exit 1
fi
if rg -n "$private_query_pattern" "${home_routes[@]}"; then
  echo "Home still puts private question text into a URL" >&2
  exit 1
fi
if rg -n "$raw_home_pattern" "${home_routes[@]}" "$root_dir/src/db/repositories/home.ts"; then
  echo "Home still accesses protected tables directly" >&2
  exit 1
fi

echo "Home composition, private handoff, and native projection are fully cut over"
