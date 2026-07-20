#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Home boundary checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
domain="$root_dir/src/lib/home"
repository="$root_dir/src/db/repositories/home.ts"
routes="$root_dir/src/app/(member)"

framework_pattern="@supabase|from ['\"]next|@/db|server-only|process\\.env|@/integrations"
service_pattern='createAdminClient|service[_-]?role|SUPABASE_SECRET_KEY|adminClient'
raw_table_pattern="\\.from\\(['\"](ask_outcome_shares|asks|organization_memberships|connections|events|announcements)['\"]\\)"
route_transport_pattern="\\.schema\\(['\"]api['\"]\\)|\\.rpc\\(|$raw_table_pattern"
suppression_pattern='@ts-ignore|@ts-expect-error|as unknown as'

if rg -q "$framework_pattern" "$domain"; then
  echo "Home domain modules must stay framework and infrastructure independent" >&2
  exit 1
fi
if rg -q "$service_pattern" "$domain" "$repository" "$routes/home-dashboard.tsx" "$routes/home-waiting.tsx"; then
  echo "Home member paths must not use a service-role client" >&2
  exit 1
fi
if rg -q "$raw_table_pattern" "$repository"; then
  echo "Home repository must use fixed API functions, not raw tables" >&2
  exit 1
fi
if rg -q "$route_transport_pattern" "$routes/home-dashboard.tsx" "$routes/home-spotlight.tsx" "$routes/home-waiting.tsx"; then
  echo "Home client components must not call database transports" >&2
  exit 1
fi
if rg -q "$suppression_pattern" "$domain" "$repository"; then
  echo "Home v2 modules must not use TypeScript suppressions or compatibility casts" >&2
  exit 1
fi

echo "Home composition, repository, and client boundaries are explicit"
