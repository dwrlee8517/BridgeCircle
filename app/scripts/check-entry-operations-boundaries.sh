#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Entry and Operations boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
domain_dirs=(
  "$root_dir/src/lib/account"
  "$root_dir/src/lib/admin/contracts.ts"
  "$root_dir/src/lib/admin/decideMembership.ts"
  "$root_dir/src/lib/invite"
  "$root_dir/src/lib/membership"
  "$root_dir/src/lib/notifications"
  "$root_dir/src/lib/onboarding"
)
repository_files=(
  "$root_dir/src/db/repositories/blocks.ts"
  "$root_dir/src/db/repositories/admin-entry.ts"
  "$root_dir/src/db/repositories/invites.ts"
  "$root_dir/src/db/repositories/member-context.ts"
  "$root_dir/src/db/repositories/memberships.ts"
  "$root_dir/src/db/repositories/notifications.ts"
  "$root_dir/src/db/repositories/onboarding.ts"
  "$root_dir/src/db/repositories/profiles.ts"
  "$root_dir/src/db/repositories/profile-imports.ts"
  "$root_dir/src/db/repositories/settings.ts"
)
route_dirs=(
  "$root_dir/src/app/(auth)"
  "$root_dir/src/app/onboarding"
  "$root_dir/src/app/select-circle"
  "$root_dir/src/app/reactivate"
  "$root_dir/src/app/cancel-delete"
  "$root_dir/src/app/(member)/notifications"
  "$root_dir/src/app/(member)/admin/invite"
  "$root_dir/src/app/(member)/admin/approvals"
)

service_pattern='createAdminClient|service[_-]?role|SUPABASE_SECRET_KEY|adminClient'
raw_table_pattern="\.from\(['\"](invites|organization_memberships|notification_preferences|notifications|member_blocks|admin_role_assignments|account_export_requests|onboarding_drafts|profile_import_requests|profile_change_proposals|profile_enrichment_runs)['\"]\)"
route_transport_pattern="\.schema\(['\"]api['\"]\)|\.rpc\(|$raw_table_pattern"
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'

if rg -q "$service_pattern" "${domain_dirs[@]}" "${repository_files[@]}" "${route_dirs[@]}"; then
  echo "Member and administrator UI paths must not use a service-role client" >&2
  exit 1
fi

if rg -q "$raw_table_pattern" "${repository_files[@]}"; then
  echo "Entry and Operations repositories must use fixed API functions, not raw protected tables" >&2
  exit 1
fi

if rg -q "$route_transport_pattern" "${route_dirs[@]}"; then
  echo "Entry and Operations route components must not call database transports directly" >&2
  exit 1
fi

if rg -q "$suppression_pattern" "${domain_dirs[@]}" "${repository_files[@]}"; then
  echo "Entry and Operations modules must not use TypeScript suppressions or compatibility casts" >&2
  exit 1
fi

echo "Entry and Operations domain, repository, route, and privilege boundaries are explicit"
