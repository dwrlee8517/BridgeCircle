#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for People/Profile boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
domain_files=()
repository_files=()
route_files=()

collect_files() {
  local relative_path="$1"
  local target_name="$2"
  local file
  [[ -e "$root_dir/$relative_path" ]] || return 0
  while IFS= read -r file; do
    case "$target_name" in
      domain) domain_files+=("$root_dir/$file") ;;
      repository) repository_files+=("$root_dir/$file") ;;
      route) route_files+=("$root_dir/$file") ;;
    esac
  done < <(cd "$root_dir" && rg --files "$relative_path" | sort)
}

collect_files src/lib/people domain
collect_files src/db/repositories/people.ts repository
collect_files src/db/repositories/people.test.ts repository
collect_files src/app/api/people route
collect_files src/app/api/members/'[userId]'/report/route.ts route

framework_pattern="@supabase|from ['\"]next|@/db|server-only|process\\.env|@/integrations"
service_pattern='createAdminClient|service[_-]?role|SUPABASE_SECRET_KEY|adminClient'
raw_table_pattern="\\.from\\(['\"](profiles|organization_profiles|profile_experiences|profile_education|profile_skills|profile_field_visibility|profile_contact_links|helper_preferences|helper_topics|connection_requests|connections|member_blocks|profile_embedding_chunks)['\"]\\)"
route_transport_pattern="\\.rpc\\(|\\.from\\("
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'

fixture="$(mktemp "${TMPDIR:-/tmp}/bridgecircle-people-profile-boundary.XXXXXX")"
trap 'rm -f "$fixture"' EXIT
printf '%s\n' "import type { SupabaseClient } from '@supabase/supabase-js'" >"$fixture"
if ! rg -q "$framework_pattern" "$fixture"; then
  echo "People/Profile boundary detector failed its deliberate violation fixture" >&2
  exit 1
fi

if (( ${#domain_files[@]} > 0 )) && rg -q "$framework_pattern" "${domain_files[@]}"; then
  echo "People/Profile domain modules must stay framework and infrastructure independent" >&2
  exit 1
fi
if (( ${#domain_files[@]} + ${#repository_files[@]} > 0 )) &&
  rg -q "$service_pattern" "${domain_files[@]}" "${repository_files[@]}"; then
  echo "People/Profile member paths must not use service-role clients" >&2
  exit 1
fi
if (( ${#repository_files[@]} > 0 )) && rg -q "$raw_table_pattern" "${repository_files[@]}"; then
  echo "People/Profile repositories must use fixed API functions, not raw tables" >&2
  exit 1
fi
if (( ${#route_files[@]} > 0 )) && rg -q "$route_transport_pattern" "${route_files[@]}"; then
  echo "People/Profile routes must call domain operations, not database transports" >&2
  exit 1
fi
if (( ${#domain_files[@]} + ${#repository_files[@]} > 0 )) &&
  rg -q "$suppression_pattern" "${domain_files[@]}" "${repository_files[@]}"; then
  echo "People/Profile v2 modules must not use TypeScript suppressions or compatibility casts" >&2
  exit 1
fi

echo "People/Profile future domain, repository, and route boundaries are explicit"
