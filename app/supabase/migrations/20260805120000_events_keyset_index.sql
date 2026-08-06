-- Keyset pagination index for the GraphQL `eventsConnection` (ADR 0014).
-- The connection pages upcoming published events per org ordered by
-- (starts_at, id) with an id tie-breaker for stable cursors. This composite
-- index serves both the org filter and that ordering so keyset paging stays a
-- range scan instead of a sort. Forward-only and idempotent.
create index if not exists events_org_starts_id_idx
  on public.events (organization_id, starts_at, id);
