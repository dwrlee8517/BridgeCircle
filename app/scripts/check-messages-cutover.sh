#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Messages cutover checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture="$(mktemp "${TMPDIR:-/tmp}/bridgecircle-messages-cutover.XXXXXX")"
trap 'rm -f "$fixture"' EXIT

retired_paths=(
  "src/app/(member)/inbox"
  "src/app/(member)/ask/thread"
  "src/lib/dm"
)

for path in "${retired_paths[@]}"; do
  if [[ -e "$root_dir/$path" ]]; then
    echo "Retired Messages path still exists: $path" >&2
    exit 1
  fi
done

legacy_url_pattern="['\"\x60]/(inbox|ask/thread)(/|[?'\"\x60])"
legacy_encoded_url_pattern='%2F(inbox|ask%2Fthread)(%2F|[^[:alnum:]_]|$)'
legacy_import_pattern="@/lib/(dm|friendship)(/|['\"])"
legacy_identifier_pattern='\b(ask_threads|direct_threads|ask_messages|direct_messages|thread_id|threadId)\b'
raw_table_pattern="\\.from\\(['\"](conversations|messages|conversation_reads|connection_requests|connections)['\"]\\)"
content_payload_pattern="(body|intro|question|display_name|email)[[:space:]]*:"
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'
specimen_pattern='messages-data\\.js'

printf '%s\n' "href='/inbox'" >"$fixture"
if ! rg -q "$legacy_url_pattern" "$fixture"; then
  echo "Messages URL detector failed its deliberate violation fixture" >&2
  exit 1
fi
printf '%s\n' "import x from '@/lib/friendship/legacy'" >"$fixture"
if ! rg -q "$legacy_import_pattern" "$fixture"; then
  echo "Messages import detector failed its deliberate violation fixture" >&2
  exit 1
fi
printf '%s\n' "const payload = { body: 'private' }" >"$fixture"
if ! rg -q "$content_payload_pattern" "$fixture"; then
  echo "Messages payload detector failed its deliberate violation fixture" >&2
  exit 1
fi

if rg -n "$legacy_url_pattern|$legacy_encoded_url_pattern" "$root_dir/src" "$root_dir/tests"; then
  echo "Application or E2E code still links to a retired Messages URL" >&2
  exit 1
fi

messages_paths=(
  "$root_dir/src/app/(member)/messages"
  "$root_dir/src/app/api/messages"
  "$root_dir/src/app/api/connections"
  "$root_dir/src/app/api/conversations"
  "$root_dir/src/app/api/members"
  "$root_dir/src/lib/messages"
  "$root_dir/src/lib/connections"
  "$root_dir/src/lib/safety"
  "$root_dir/src/db/repositories/messages.ts"
  "$root_dir/src/db/repositories/connections.ts"
  "$root_dir/src/db/repositories/safety.ts"
)

if rg -n "$legacy_import_pattern" "${messages_paths[@]}"; then
  echo "Messages still imports a retired friendship or DM implementation" >&2
  exit 1
fi
if rg -n "$legacy_identifier_pattern" "${messages_paths[@]}"; then
  echo "Messages still names a retired thread schema or identifier" >&2
  exit 1
fi
if rg -n "$raw_table_pattern" \
  "$root_dir/src/db/repositories/messages.ts" \
  "$root_dir/src/db/repositories/connections.ts" \
  "$root_dir/src/db/repositories/safety.ts" \
  "$root_dir/src/app/api/messages" \
  "$root_dir/src/app/api/connections" \
  "$root_dir/src/app/api/conversations" \
  "$root_dir/src/app/api/members"; then
  echo "Messages member paths still access a protected table directly" >&2
  exit 1
fi
if rg -n "$suppression_pattern" "${messages_paths[@]}"; then
  echo "Messages still contains a TypeScript suppression or compatibility cast" >&2
  exit 1
fi
if rg -n "$specimen_pattern" "$root_dir/src"; then
  echo "Production source still imports specimen Messages data" >&2
  exit 1
fi
if rg -n "$content_payload_pattern" "$root_dir/src/db/realtime/member-channel.ts"; then
  echo "The member control topic may contain identifiers only" >&2
  exit 1
fi
if rg -n "redirects[[:space:]]*\(" "$root_dir/next.config.ts"; then
  echo "Pre-launch cutover must not preserve legacy URL redirects" >&2
  exit 1
fi

owner_channel_callers="$(rg -l 'openMemberRealtime' "$root_dir/src" --glob '*.ts' --glob '*.tsx' | sort || true)"
owner_channel_allowed="$root_dir/src/app/(member)/user-control-provider.tsx
$root_dir/src/db/realtime/member-channel.test.ts
$root_dir/src/db/realtime/member-channel.ts"
if [[ "$owner_channel_callers" != "$owner_channel_allowed" ]]; then
  echo "The member shell provider must remain the sole user control channel owner" >&2
  exit 1
fi

echo "Messages URLs, imports, data access, and Realtime ownership are fully cut over"
