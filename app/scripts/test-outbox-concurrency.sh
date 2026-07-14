#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local concurrency contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

cleanup() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
delete from private.outbox_jobs
where dedupe_key like 'foundation:parallel-worker:%';
SQL
}

cleanup
trap cleanup EXIT

psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
insert into private.outbox_jobs (
  id, job_type, payload, dedupe_key, status, attempts, max_attempts,
  available_at
) overriding system value
select
  980100 + item,
  'index_profile',
  jsonb_build_object('fixture', item),
  'foundation:parallel-worker:' || item::text,
  'pending', 0, 8, now() - interval '1 minute'
from generate_series(1, 6) item;
SQL

claim_and_hold() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
begin;
set local role service_role;
select * from api.claim_outbox_jobs('parallel-worker-a', 3);
select pg_sleep(1);
commit;
SQL
}

claim_while_locked() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
begin;
set local role service_role;
select * from api.claim_outbox_jobs('parallel-worker-b', 3);
commit;
SQL
}

claim_and_hold &
first_pid=$!
sleep 0.2
claim_while_locked &
second_pid=$!

first_status=0
second_status=0
wait "$first_pid" || first_status=$?
wait "$second_pid" || second_status=$?
if (( first_status != 0 || second_status != 0 )); then
  echo "parallel outbox workers did not both complete successfully" >&2
  exit 1
fi

psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
do $$
begin
  if (
    select count(*)
    from private.outbox_jobs
    where dedupe_key like 'foundation:parallel-worker:%'
      and status = 'processing'
      and attempts = 1
  ) <> 6 then
    raise exception 'expected all six jobs to be claimed exactly once';
  end if;

  if (
    select count(*)
    from private.outbox_jobs
    where dedupe_key like 'foundation:parallel-worker:%'
      and locked_by = 'parallel-worker-a'
  ) <> 3 then
    raise exception 'expected worker A to own three jobs';
  end if;

  if (
    select count(*)
    from private.outbox_jobs
    where dedupe_key like 'foundation:parallel-worker:%'
      and locked_by = 'parallel-worker-b'
  ) <> 3 then
    raise exception 'expected worker B to own three disjoint jobs';
  end if;
end;
$$;
SQL

echo "Parallel outbox workers claimed disjoint jobs"
