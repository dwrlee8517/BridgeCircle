#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Help worker contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

cleanup() {
  "${psql_base[@]}" <<'SQL' >/dev/null 2>&1 || true
delete from private.outbox_jobs where dedupe_key like 'help:worker-baseline:%';
SQL
}
trap cleanup EXIT
cleanup

if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('api.claim_outbox_jobs(text,integer,text[])') is not null")" != "t" ]]; then
  echo "Help worker claim API does not yet filter supported job types" >&2
  exit 1
fi

"${psql_base[@]}" <<'SQL' >/dev/null
insert into private.outbox_jobs (job_type, payload, dedupe_key, available_at) values
  ('create_notification', '{"fixture":1}', 'help:worker-baseline:supported-1', now() - interval '1 minute'),
  ('run_ask_matching', '{"fixture":2}', 'help:worker-baseline:supported-2', now() - interval '1 minute'),
  ('process_account_deletion', '{"fixture":3}', 'help:worker-baseline:unsupported-1', now() - interval '1 minute'),
  ('delete_storage_objects', '{"fixture":4}', 'help:worker-baseline:unsupported-2', now() - interval '1 minute');

begin;
set local role service_role;
select * from api.claim_outbox_jobs(
  'help-worker-baseline', 10,
  array['create_notification', 'run_ask_matching']::text[]
);
commit;

do $$
begin
  if (
    select count(*) from private.outbox_jobs
    where dedupe_key like 'help:worker-baseline:supported-%'
      and status = 'processing' and locked_by = 'help-worker-baseline'
  ) <> 2 then
    raise exception 'expected exactly two supported jobs to be claimed';
  end if;
  if (
    select count(*) from private.outbox_jobs
    where dedupe_key like 'help:worker-baseline:unsupported-%'
      and status = 'pending' and locked_by is null
  ) <> 2 then
    raise exception 'unsupported jobs must remain pending and unclaimed';
  end if;
end;
$$;
SQL

echo "Help worker claims only implemented job types"
