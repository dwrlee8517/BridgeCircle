#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Conversation boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
conversation_lib=()
conversation_db=(
  "$root_dir/src/db/repositories/conversations.ts"
  "$root_dir/src/db/repositories/conversations.test.ts"
  "$root_dir/src/db/realtime/conversation-channel.ts"
  "$root_dir/src/db/realtime/conversation-channel.test.ts"
)

while IFS= read -r file; do
  conversation_lib+=("$root_dir/$file")
done < <(cd "$root_dir" && rg --files src/lib/conversations | sort)

if (( ${#conversation_lib[@]} == 0 )); then
  echo "Conversation domain modules are missing" >&2
  exit 1
fi

for file in "${conversation_db[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Conversation database boundary is missing: $file" >&2
    exit 1
  fi
done

framework_pattern="@supabase|from ['\"]next|@/db|server-only|process\.env"
legacy_pattern='\b(ask_threads|direct_threads|ask_messages|direct_messages|thread_id|threadId)\b'
service_pattern='createAdminClient|service[_-]?role|SUPABASE_SECRET_KEY|adminClient'
raw_table_pattern="\.from\(['\"](conversations|messages|conversation_reads)['\"]\)"
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'

fixture="$(mktemp "${TMPDIR:-/tmp}/bridgecircle-conversation-boundary.XXXXXX")"
trap 'rm -f "$fixture"' EXIT
printf '%s\n' "import type { SupabaseClient } from '@supabase/supabase-js'" >"$fixture"
if ! rg -q "$framework_pattern" "$fixture"; then
  echo "Conversation boundary detector failed its deliberate violation fixture" >&2
  exit 1
fi

if rg -q "$framework_pattern" "${conversation_lib[@]}"; then
  echo "Conversation domain modules must stay framework and infrastructure independent" >&2
  exit 1
fi

if rg -q "$legacy_pattern" "${conversation_lib[@]}" "${conversation_db[@]}"; then
  echo "Conversation v2 modules must not name legacy thread tables or identifiers" >&2
  exit 1
fi

if rg -q "$service_pattern" "${conversation_lib[@]}" "${conversation_db[@]}"; then
  echo "Conversation member paths must not use service-role clients" >&2
  exit 1
fi

if rg -q "$raw_table_pattern" "${conversation_db[@]}"; then
  echo "Conversation repositories must use fixed API functions, not raw conversation tables" >&2
  exit 1
fi

if rg -q "$suppression_pattern" "${conversation_lib[@]}" "${conversation_db[@]}"; then
  echo "Conversation v2 modules must not use TypeScript suppressions or compatibility casts" >&2
  exit 1
fi

echo "Conversation domain, repository, and Realtime boundaries are explicit"
