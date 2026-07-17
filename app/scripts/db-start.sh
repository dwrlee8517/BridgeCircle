#!/usr/bin/env bash
# Boot the local Supabase stack, ensuring Docker is running first.
#
# `pnpm db:start` runs this. The local stack lives in Docker containers, so
# the daemon has to be up before `supabase start`. This bakes in the
# start-Docker-Desktop-and-wait dance that otherwise fails with
# "Cannot connect to the Docker daemon". Idempotent: if Docker is already
# running, it skips straight to `supabase start`.
#
# macOS-only convenience (the pilot team is all Mac). On other platforms it
# just asks you to start your Docker daemon by hand.
set -euo pipefail

if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running — starting Docker Desktop…"

  if [[ "$(uname)" != "Darwin" ]]; then
    echo "Start your Docker daemon manually, then re-run 'pnpm db:start'." >&2
    exit 1
  fi

  if ! open -a Docker >/dev/null 2>&1; then
    echo "Docker Desktop doesn't appear to be installed. Install it with:" >&2
    echo "    brew install --cask docker" >&2
    echo "…launch it once to grant permissions, then re-run 'pnpm db:start'." >&2
    exit 1
  fi

  # Poll the daemon until it answers (Docker Desktop cold-starts in ~30–60s).
  printf "Waiting for the Docker daemon"
  for _ in $(seq 1 45); do
    if docker info >/dev/null 2>&1; then
      echo " ready."
      break
    fi
    printf "."
    sleep 2
  done

  if ! docker info >/dev/null 2>&1; then
    echo "" >&2
    echo "Docker didn't come up within ~90s. Open Docker Desktop, wait for the" >&2
    echo "whale icon in the menu bar to settle, then re-run 'pnpm db:start'." >&2
    exit 1
  fi
fi

pnpm exec supabase start
