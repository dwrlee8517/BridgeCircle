#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$script_dir/test-invite-concurrency.sh"
bash "$script_dir/test-profile-history-concurrency.sh"
bash "$script_dir/test-outbox-concurrency.sh"
