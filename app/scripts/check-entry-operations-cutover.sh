#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Entry and Operations cutover checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
owned_paths=(
  "$root_dir/src/app/(auth)"
  "$root_dir/src/app/onboarding"
  "$root_dir/src/app/select-circle"
  "$root_dir/src/app/reactivate"
  "$root_dir/src/app/cancel-delete"
  "$root_dir/src/app/(member)/notifications"
  "$root_dir/src/app/(member)/admin/invite"
  "$root_dir/src/app/(member)/admin/approvals"
  "$root_dir/src/lib/account"
  "$root_dir/src/lib/admin/contracts.ts"
  "$root_dir/src/lib/admin/decideMembership.ts"
  "$root_dir/src/lib/invite"
  "$root_dir/src/lib/membership"
  "$root_dir/src/lib/notifications"
  "$root_dir/src/lib/onboarding"
)

retired_schema_pattern='base_profiles|public\.audit_log|\.from\(['"'"']audit_log['"'"']\)'
direct_protected_pattern="\.from\(['\"](invites|organization_memberships|notification_preferences|notifications|member_blocks|admin_role_assignments|profile_import_requests|profile_change_proposals|profile_enrichment_runs)['\"]\)"
token_sink_pattern='console\.(log|info|warn|error).*token|Sentry.*token'

if rg -n "$retired_schema_pattern" "${owned_paths[@]}"; then
  echo "Retired profile or audit schema remains in Entry and Operations code" >&2
  exit 1
fi

if rg -n "$direct_protected_pattern" "${owned_paths[@]}"; then
  echo "Direct protected-table access remains after the Entry and Operations cutover" >&2
  exit 1
fi

if rg -n "$token_sink_pattern" "${owned_paths[@]}"; then
  echo "Potential invite or authentication token logging remains" >&2
  exit 1
fi

if test ! -f "$root_dir/src/app/pending/page.tsx"; then
  echo "The canonical pending-approval route is missing" >&2
  exit 1
fi

if test ! -f "$root_dir/src/app/(member)/settings/page.tsx"; then
  echo "The canonical Settings route is missing" >&2
  exit 1
fi

retired_paths=(
  "$root_dir/src/app/(member)/admin/members"
  "$root_dir/src/app/(member)/admin/analytics"
  "$root_dir/src/app/proposals"
  "$root_dir/src/app/api/cron/enrichment-sweep-start"
  "$root_dir/src/app/api/cron/enrichment-sweep-poll"
  "$root_dir/src/lib/search"
)

for retired_path in "${retired_paths[@]}"; do
  if test -e "$retired_path"; then
    echo "Retired pre-v2 path remains: $retired_path" >&2
    exit 1
  fi
done

echo "Entry, onboarding, Settings, notifications, account lifecycle, and minimal admin are cut over"
