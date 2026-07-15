#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for People/Profile cutover checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture="$(mktemp "${TMPDIR:-/tmp}/bridgecircle-people-profile-cutover.XXXXXX")"
trap 'rm -f "$fixture"' EXIT

retired_paths=(
  "src/app/(member)/profile/edit"
  "src/app/(member)/profile/import"
  "src/app/(member)/profile/proposals"
  "src/lib/friendship"
)

legacy_identifier_pattern='\b(base_profiles|friendships|friend_requests|search_profile_embeddings|profile_privacy_settings)\b'
legacy_url_pattern="['\"\x60]/profile/(edit|import|proposals)(/|[?'\"\x60])"
legacy_import_pattern="@/lib/(friendship|search)(/|['\"])"
service_pattern='createAdminClient|service[_-]?role|SUPABASE_SECRET_KEY|adminClient'
raw_table_pattern="\\.from\\(['\"](profiles|organization_profiles|profile_experiences|profile_education|profile_skills|profile_field_visibility|profile_contact_links|profile_embedding_chunks)['\"]\\)"
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'

printf '%s\n' "const table = 'base_profiles'" >"$fixture"
if ! rg -q "$legacy_identifier_pattern" "$fixture"; then
  echo "People/Profile legacy identifier detector failed its deliberate violation fixture" >&2
  exit 1
fi
printf '%s\n' "href='/profile/edit'" >"$fixture"
if ! rg -q "$legacy_url_pattern" "$fixture"; then
  echo "People/Profile legacy URL detector failed its deliberate violation fixture" >&2
  exit 1
fi

for path in "${retired_paths[@]}"; do
  if [[ -e "$root_dir/$path" ]]; then
    echo "Retired People/Profile path still exists: $path" >&2
    exit 1
  fi
done

owned_paths=(
  "$root_dir/src/app/(member)/people"
  "$root_dir/src/app/(member)/profile"
  "$root_dir/src/app/api/people"
  "$root_dir/src/lib/people"
  "$root_dir/src/lib/profile"
  "$root_dir/src/db/repositories/people.ts"
  "$root_dir/src/db/repositories/profiles.ts"
)

existing_paths=()
for path in "${owned_paths[@]}"; do
  [[ -e "$path" ]] && existing_paths+=("$path")
done

if (( ${#existing_paths[@]} > 0 )) &&
  rg -n "$legacy_identifier_pattern|$legacy_import_pattern|$service_pattern|$suppression_pattern" "${existing_paths[@]}"; then
  echo "People/Profile still contains a retired schema, import, service client, or suppression" >&2
  exit 1
fi
if rg -n "$legacy_url_pattern" "$root_dir/src" "$root_dir/tests"; then
  echo "Application or E2E code still links to a retired Profile URL" >&2
  exit 1
fi
if [[ -d "$root_dir/src/app/api/people" ]] &&
  rg -n "$raw_table_pattern" "$root_dir/src/app/api/people"; then
  echo "People/Profile routes still access protected profile tables directly" >&2
  exit 1
fi

echo "People/Profile URLs, imports, data access, and legacy paths are fully cut over"
