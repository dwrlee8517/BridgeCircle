#!/usr/bin/env bash
set -euo pipefail

# Scene overlays for the demo school — staged mid-story starting states for
# demo recordings, applied on top of a fresh `pnpm seed:demo-org`.
#
# Each scene is one SQL file in scripts/scenes/, rerunnable (it deletes its
# own namespace first) and composable with the others. See
# scripts/scenes/README.md for the contract and the scene registry.
#
# Usage, from app/:
#   pnpm seed:scene help-inbox                    # one scene
#   pnpm seed:scene help-inbox thread             # compose several
#   DEMO_ALLOW_REMOTE=1 SUPABASE_DB_URL=... pnpm seed:scene thread   # hosted dev
#
# Scenes are cleared whenever the demo org's crowd regenerates
# (seed:demo-org / seed:scale) — re-apply them afterwards, or pass
# DEMO_SCENE=a,b to seed:demo-org to chain them automatically.

org_id="99999999-9999-4999-8999-999999999999"
jamie_user="99999999-0000-4000-8000-000000000001"
jamie_membership="99999999-1111-4000-8000-000000000001"

db_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
scenes_dir="$script_dir/scenes"

source "$script_dir/lib/seed-guard.sh"
seed_guard "seed-scene" "$db_url"

list_scenes() {
  find "$scenes_dir" -name '*.sql' -exec basename {} .sql \; | sort
}

if [[ $# -lt 1 ]]; then
  echo "seed-scene: no scene named. Available scenes:" >&2
  list_scenes >&2
  exit 1
fi

psql_base=(psql "$db_url" -v ON_ERROR_STOP=1 -X -q)

demo_ready="$("${psql_base[@]}" -t -A -c \
  "select count(*) from public.organization_memberships
   where id = '${jamie_membership}' and organization_id = '${org_id}' and status = 'active'")"

if [[ "$demo_ready" != "1" ]]; then
  echo "seed-scene: the demo organization or its persona is missing. Run 'pnpm seed:demo-org' first." >&2
  exit 1
fi

for name in "$@"; do
  if [[ ! "$name" =~ ^[a-z0-9-]+$ ]]; then
    echo "seed-scene: invalid scene name '${name}'" >&2
    exit 1
  fi
  scene_file="$scenes_dir/$name.sql"
  if [[ ! -f "$scene_file" ]]; then
    echo "seed-scene: unknown scene '${name}'. Available scenes:" >&2
    list_scenes >&2
    exit 1
  fi
  echo "seed-scene: applying '${name}'"
  "${psql_base[@]}" \
    -v org_id="$org_id" \
    -v jamie_user="$jamie_user" \
    -v jamie_membership="$jamie_membership" \
    -f "$scene_file"
done

echo "seed-scene: done."
