#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for School cutover checks" >&2
  exit 127
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
retired_paths=(
  "src/app/(member)/events"
  "src/app/(member)/announcements"
  "src/lib/events"
  "src/lib/announcements"
)
retired_url_pattern="['\"\x60]/(events|announcements)(/|[?'\"\x60])"
legacy_promotion_pattern="status = ['\"]going['\"].*waitlist|promotes? .*waitlist.*going|oldest-waitlisted"
raw_school_pattern="\\.from\\(['\"](events|event_rsvps|event_schedule_items|event_facts|announcements|announcement_reads|newsletter_issues|newsletter_sections)['\"]\\)"

for path in "${retired_paths[@]}"; do
  if [[ -e "$root_dir/$path" ]]; then
    echo "Retired School path still exists: $path" >&2
    exit 1
  fi
done
if rg -n "$retired_url_pattern" "$root_dir/src" "$root_dir/tests"; then
  echo "Application or E2E code still links to a retired School URL" >&2
  exit 1
fi
if rg -n "$raw_school_pattern" "$root_dir/src/app/(member)/school" "$root_dir/src/db/repositories/school.ts"; then
  echo "School member code still accesses protected tables directly" >&2
  exit 1
fi
if rg -n "$legacy_promotion_pattern" "$root_dir/src" "$root_dir/tests"; then
  echo "Automatic waitlist promotion semantics still appear in application code or tests" >&2
  exit 1
fi

echo "School routes, data access, and held-offer semantics are fully cut over"
