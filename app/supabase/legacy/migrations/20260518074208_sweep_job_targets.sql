-- Persist sweep targets across cron invocations.
--
-- Bright Data's snapshot lifecycle is async: POST URLs → snapshot_id, then a
-- separate cron run drains the snapshot when it's ready. Bright Data returns
-- records keyed by url, but we need to map each record back to the BridgeCircle
-- user_id that owned the URL when the snapshot was started. Memory won't survive
-- across cron invocations (different process), so the user_id ↔ url mapping
-- has to live on the row itself.
--
-- Shape: jsonb array of { userId: uuid, url: text }. Could also be a child
-- table but at expected pilot scale (1k members, 1 row per monthly sweep)
-- the JSONB is cheaper to read/write.

alter table enrichment_sweep_jobs
  add column targets jsonb not null default '[]'::jsonb;

comment on column enrichment_sweep_jobs.targets is
  'Frozen target list at snapshot start: [{ userId, url }, ...]. Used by the poll cron to map Bright Data records (url-keyed) back to user_ids.';
