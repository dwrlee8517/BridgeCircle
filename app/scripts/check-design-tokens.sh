#!/usr/bin/env bash
# Design-token ratchet: arbitrary Tailwind literals may only go DOWN.
#
# The Civic Editorial scale has named utilities for every sanctioned value
# (text-kicker/caption/body-*/h1/display-*, tracking-label/kicker, the
# `detail:` breakpoint, the 4px spacing scale). New code should use those;
# this script counts the banned literal patterns in src/ and fails when the
# count rises above the checked-in baseline. When you remove literals,
# lower the baseline in the same commit.
#
# Run: pnpm check:tokens        Update baseline: pnpm check:tokens --update
set -euo pipefail
cd "$(dirname "$0")/.."

BASELINE_FILE="scripts/design-tokens-baseline.txt"

# Pattern key:value — each is a category we ratchet independently.
PATTERNS=(
  "font-size:text-\[[0-9]"
  "tracking:tracking-\["
  "padding:p[xy]\?-\[[0-9]"
  "breakpoint:\(min\|max\)-\[[0-9][0-9]*px\]"
)

count_pattern() {
  # Zero matches makes grep exit 1, which pipefail would turn into a script
  # death — a clean category must count as 0, not as failure.
  { grep -ro "$1" src --include='*.tsx' --include='*.ts' 2>/dev/null || true; } | wc -l | tr -d ' '
}

declare -a RESULTS
fail=0
update="${1:-}"

{
  for entry in "${PATTERNS[@]}"; do
    name="${entry%%:*}"
    pattern="${entry#*:}"
    count="$(count_pattern "$pattern")"
    RESULTS+=("$name=$count")
  done
}

if [[ "$update" == "--update" ]]; then
  printf '%s\n' "${RESULTS[@]}" > "$BASELINE_FILE"
  echo "Baseline updated:"
  cat "$BASELINE_FILE"
  exit 0
fi

if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "Missing $BASELINE_FILE — run: pnpm check:tokens --update" >&2
  exit 1
fi

for result in "${RESULTS[@]}"; do
  name="${result%%=*}"
  count="${result#*=}"
  allowed="$(grep "^$name=" "$BASELINE_FILE" | cut -d= -f2)"
  if [[ -z "$allowed" ]]; then
    echo "FAIL: no baseline entry for '$name' — run pnpm check:tokens --update" >&2
    fail=1
  elif (( count > allowed )); then
    echo "FAIL: $name arbitrary literals rose to $count (baseline $allowed)." >&2
    echo "      Use the named scale (text-caption, tracking-label, detail:, px-N)" >&2
    echo "      or, if a literal is genuinely deliberate, raise the baseline" >&2
    echo "      consciously in $BASELINE_FILE." >&2
    fail=1
  elif (( count < allowed )); then
    echo "note: $name improved to $count (baseline $allowed) — ratchet down with: pnpm check:tokens --update"
  else
    echo "ok:   $name=$count"
  fi
done

exit $fail
