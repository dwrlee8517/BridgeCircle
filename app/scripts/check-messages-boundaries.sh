#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Messages boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
messages_lib=()
messages_db=()
messages_routes=()

collect_files() {
  local relative_path="$1"
  local target_name="$2"
  local file
  [[ -e "$root_dir/$relative_path" ]] || return 0
  while IFS= read -r file; do
    case "$target_name" in
      lib) messages_lib+=("$root_dir/$file") ;;
      db) messages_db+=("$root_dir/$file") ;;
      routes) messages_routes+=("$root_dir/$file") ;;
    esac
  done < <(cd "$root_dir" && rg --files "$relative_path" | sort)
}

collect_files src/lib/messages lib
collect_files src/lib/connections lib
collect_files src/lib/safety lib
collect_files src/db/repositories/messages.ts db
collect_files src/db/repositories/messages.test.ts db
collect_files src/db/repositories/connections.ts db
collect_files src/db/repositories/connections.test.ts db
collect_files src/db/repositories/safety.ts db
collect_files src/db/repositories/safety.test.ts db
collect_files src/db/realtime/member-channel.ts db
collect_files src/db/realtime/member-channel.test.ts db
collect_files src/app/api/messages routes
collect_files src/app/api/connections routes
collect_files 'src/app/api/members/[userId]/block/route.ts' routes
collect_files 'src/app/api/conversations/[conversationId]/messages/[messageId]/report/route.ts' routes

framework_pattern="@supabase|from ['\"]next|@/db|server-only|process\\.env"
legacy_pattern='\b(ask_threads|direct_threads|ask_messages|direct_messages|thread_id|threadId)\b'
service_pattern='createAdminClient|service[_-]?role|SUPABASE_SECRET_KEY|adminClient'
raw_table_pattern="\\.from\\(['\"](asks|blocks|connections|conversations|conversation_reads|messages)['\"]\\)"
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'
route_rpc_pattern="\.rpc\(|\.from\("
cross_domain_pattern='@/db/repositories/help|@/lib/help'
owner_channel_pattern='openMemberRealtime'
legacy_owner_channel_pattern='openHelpRealtime|help-channel'

fixture="$(mktemp "${TMPDIR:-/tmp}/bridgecircle-messages-boundary.XXXXXX")"
trap 'rm -f "$fixture"' EXIT
printf '%s\n' "import type { SupabaseClient } from '@supabase/supabase-js'" >"$fixture"
if ! rg -q "$framework_pattern" "$fixture"; then
  echo "Messages boundary detector failed its deliberate violation fixture" >&2
  exit 1
fi

if (( ${#messages_lib[@]} > 0 )) && rg -q "$framework_pattern" "${messages_lib[@]}"; then
  echo "Messages domain modules must stay framework and infrastructure independent" >&2
  exit 1
fi
if (( ${#messages_lib[@]} + ${#messages_db[@]} > 0 )) &&
  rg -q "$legacy_pattern" "${messages_lib[@]}" "${messages_db[@]}"; then
  echo "Messages v2 modules must not name legacy thread tables or identifiers" >&2
  exit 1
fi
if (( ${#messages_routes[@]} > 0 )) && rg -q "$route_rpc_pattern" "${messages_routes[@]}"; then
  echo "Messages routes must call domain operations, not database transports" >&2
  exit 1
fi
if (( ${#messages_routes[@]} > 0 )) && rg -q "$cross_domain_pattern" "${messages_routes[@]}"; then
  echo "Messages routes must not depend on the Help domain" >&2
  exit 1
fi
owner_channel_callers="$(rg -l "$owner_channel_pattern" "$root_dir/src" --glob '*.ts' --glob '*.tsx' | sort || true)"
owner_channel_allowed="$root_dir/src/app/(member)/user-control-provider.tsx
$root_dir/src/db/realtime/member-channel.test.ts
$root_dir/src/db/realtime/member-channel.ts"
if [[ "$owner_channel_callers" != "$owner_channel_allowed" ]]; then
  echo "The member shell provider must own the sole user control channel" >&2
  exit 1
fi
if rg -q "$legacy_owner_channel_pattern" "$root_dir/src"; then
  echo "Legacy Help owner-channel code must not return" >&2
  exit 1
fi
if rg -q 'channel\(`user:' "$root_dir/src/db/realtime/conversation-channel.ts"; then
  echo "Conversation Realtime must own only its content topic" >&2
  exit 1
fi
if (( ${#messages_lib[@]} + ${#messages_db[@]} > 0 )) &&
  rg -q "$service_pattern" "${messages_lib[@]}" "${messages_db[@]}"; then
  echo "Messages member paths must not use service-role clients" >&2
  exit 1
fi
if (( ${#messages_db[@]} > 0 )) && rg -q "$raw_table_pattern" "${messages_db[@]}"; then
  echo "Messages repositories must use fixed API functions, not raw tables" >&2
  exit 1
fi
if (( ${#messages_lib[@]} + ${#messages_db[@]} > 0 )) &&
  rg -q "$suppression_pattern" "${messages_lib[@]}" "${messages_db[@]}"; then
  echo "Messages v2 modules must not use TypeScript suppressions or compatibility casts" >&2
  exit 1
fi

echo "Messages compiler scope and future domain boundaries are explicit"
