#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Supabase boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
config_file="$root_dir/supabase/config.toml"
migration_file="$root_dir/supabase/migrations/20260713231344_v2_init.sql"
types_file="$root_dir/src/db/database.types.ts"
package_file="$root_dir/package.json"
foundation_business=(
  "$root_dir/src/lib/invite/accept.ts"
  "$root_dir/src/lib/invite/verify.ts"
  "$root_dir/src/lib/profile/savePartialProfile.ts"
  "$root_dir/src/lib/profile/uploadAvatar.ts"
  "$root_dir/src/lib/admin/decideMembership.ts"
)
foundation_context=(
  "$root_dir/src/app/(member)/layout.tsx"
  "$root_dir/src/app/onboarding/page.tsx"
  "$root_dir/src/app/onboarding/actions.ts"
  "$root_dir/src/app/select-circle/page.tsx"
  "$root_dir/src/app/select-circle/actions.ts"
  "$root_dir/src/app/auth/callback/route.ts"
)

api_schemas="$({
  awk '
    /^\[api\]$/ { in_api = 1; next }
    /^\[/ { in_api = 0 }
    in_api && /^schemas = / { print; exit }
  ' "$config_file"
})"

if [[ "$api_schemas" != *'"public"'* || "$api_schemas" != *'"api"'* ]]; then
  echo "Data API must expose public and api schemas" >&2
  exit 1
fi

if [[ "$api_schemas" == *'"private"'* ]]; then
  echo "private schema must not be exposed through the Data API" >&2
  exit 1
fi

if rg -q '^  private:' "$types_file"; then
  echo "generated client types must not include the private schema" >&2
  exit 1
fi

if ! rg -q '^  api:' "$types_file" || ! rg -q '^  public:' "$types_file"; then
  echo "generated client types must include public and api schemas" >&2
  exit 1
fi

if ! rg -q -- '--schema public,api' "$package_file"; then
  echo "local and linked type generation must stay scoped to public,api" >&2
  exit 1
fi

if rg -q 'grant execute on all functions in schema api to authenticated' "$migration_file"; then
  echo "authenticated API functions must use an explicit allowlist" >&2
  exit 1
fi

if rg -q 'grant usage, select on all sequences in schema public to authenticated' "$migration_file"; then
  echo "authenticated must not receive blanket public sequence access" >&2
  exit 1
fi

if rg -q '@supabase|next/|@/db|createAdminClient|@/notify' "${foundation_business[@]}"; then
  echo "Foundation business operations must stay framework and infrastructure independent" >&2
  exit 1
fi

if rg -q '\.limit\(1\)' "${foundation_context[@]}"; then
  echo "Foundation context selection must not choose an arbitrary first membership" >&2
  exit 1
fi

if rg -q "\.from\('(profiles|organization_profiles|profile_education|profile_experiences|profile_skills|helper_preferences|helper_topics|organization_memberships|admin_role_assignments|notifications)'\).*(insert|update|upsert|delete)" \
  "${foundation_business[@]}" "${foundation_context[@]}"; then
  echo "Foundation member writes must go through typed API-command repositories" >&2
  exit 1
fi

echo "Supabase schema and grant boundaries are explicit"
