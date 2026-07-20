#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for Help cutover checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

retired_paths=(
  "src/app/(member)/ask"
  "src/app/(member)/inbox"
  "src/app/api/asks"
  "src/lib/asks"
  "src/lib/dm"
)

for path in "${retired_paths[@]}"; do
  if [[ -e "$root_dir/$path" ]]; then
    echo "Retired Help path still exists: $path" >&2
    exit 1
  fi
done

legacy_url_pattern="['\"\x60]/(ask|inbox|search|discover|friends|mentorship)(/|[?'\"\x60])"
legacy_import_pattern="@/lib/(asks|dm)(/|['\"])"

if rg -n "$legacy_url_pattern" "$root_dir/src"; then
  echo "Production source still links to a retired Help URL" >&2
  exit 1
fi

if rg -n "$legacy_import_pattern" "$root_dir/src"; then
  echo "Production source still imports a retired Help module" >&2
  exit 1
fi

if rg -n "redirects[[:space:]]*\(" "$root_dir/next.config.ts"; then
  echo "Pre-launch cutover must not preserve legacy URL redirects" >&2
  exit 1
fi

echo "Help URLs and production callers are fully cut over"
