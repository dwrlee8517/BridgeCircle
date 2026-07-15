#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Help boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
help_lib=()
outbox_lib=()
integration_files=()
worker_files=()
member_db=(
  "$root_dir/src/db/repositories/help.ts"
  "$root_dir/src/db/repositories/help.test.ts"
  "$root_dir/src/db/realtime/help-channel.ts"
  "$root_dir/src/db/realtime/help-channel.test.ts"
)

collect_files() {
  local relative_dir="$1"
  local target_name="$2"
  local file
  [[ -d "$root_dir/$relative_dir" ]] || return 0
  while IFS= read -r file; do
    case "$target_name" in
      help) help_lib+=("$root_dir/$file") ;;
      outbox) outbox_lib+=("$root_dir/$file") ;;
      integration) integration_files+=("$root_dir/$file") ;;
      worker) worker_files+=("$root_dir/$file") ;;
    esac
  done < <(cd "$root_dir" && rg --files "$relative_dir" | sort)
}

collect_files src/lib/help help
collect_files src/lib/outbox outbox
collect_files src/integrations/ai integration
collect_files src/workers/outbox worker

if (( ${#help_lib[@]} == 0 )); then
  echo "Help v2 domain modules are missing" >&2
  exit 1
fi
if (( ${#outbox_lib[@]} == 0 )); then
  echo "Outbox domain modules are missing" >&2
  exit 1
fi

for file in "${member_db[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Help database boundary is missing: $file" >&2
    exit 1
  fi
done
if (( ${#integration_files[@]} == 0 || ${#worker_files[@]} == 0 )); then
  echo "Help provider or worker infrastructure boundary is missing" >&2
  exit 1
fi

framework_pattern="@supabase|from ['\"]next|from ['\"]resend|@anthropic-ai|server-only|process\.env|@/db|@/notify|@/integrations"
legacy_pattern='\b(ask_threads|ask_messages|open_asks|open_ask_matches|mentorship_requests|thread_id|threadId|open_to_mentorship|open_to_advice)\b'
service_pattern='createAdminClient|service[_-]?role|SUPABASE_SECRET_KEY|adminClient'
raw_table_pattern="\.from\(['\"](asks|ask_offers|helper_preferences|helper_topics|notifications|profile_embedding_chunks|outbox_jobs)['\"]\)"
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'

fixture="$(mktemp "${TMPDIR:-/tmp}/bridgecircle-help-boundary.XXXXXX")"
trap 'rm -f "$fixture"' EXIT
printf '%s\n' "import type { SupabaseClient } from '@supabase/supabase-js'" >"$fixture"
if ! rg -q "$framework_pattern" "$fixture"; then
  echo "Help boundary detector failed its deliberate violation fixture" >&2
  exit 1
fi

if rg -q "$framework_pattern" "${help_lib[@]}" "${outbox_lib[@]}"; then
  echo "Help and outbox domain modules must stay framework and infrastructure independent" >&2
  exit 1
fi
if rg -q "$legacy_pattern" "${help_lib[@]}" "${outbox_lib[@]}" "${member_db[@]}" "${integration_files[@]}" "${worker_files[@]}"; then
  echo "Help v2 modules must not name legacy Ask/thread identifiers" >&2
  exit 1
fi
if rg -q "$service_pattern" "${help_lib[@]}" "${member_db[@]}"; then
  echo "Help member paths must not use service-role clients" >&2
  exit 1
fi
if rg -q "$raw_table_pattern" "$root_dir/src/db/repositories/help.ts"; then
  echo "Help member repository must use fixed API functions, not raw tables" >&2
  exit 1
fi
if rg -q "$suppression_pattern" "${help_lib[@]}" "${outbox_lib[@]}" "${member_db[@]}" "${integration_files[@]}" "${worker_files[@]}"; then
  echo "Help v2 modules must not use TypeScript suppressions or compatibility casts" >&2
  exit 1
fi

echo "Help domain, repository, provider, worker, and Realtime boundaries are explicit"
