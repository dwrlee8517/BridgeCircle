-- Profile enrichment: settings, runs, change proposals, sweep jobs.
--
-- See docs/architecture/profile-enrichment.md for the full design. Summary:
--   - settings    per-user freshness config + last-seen state (fingerprint, etc.)
--   - runs        audit log of every provider call (onboarding, manual, sweep,
--                 fallback). One row per provider hit, even failures.
--   - proposals   pending change diffs the user can confirm/edit/decline.
--                 Created by the monthly sweep and by the manual refresh button
--                 when a diff is detected. Carry a one-time review token so the
--                 email link works without a logged-in session.
--   - sweep_jobs  state for the Bright Data Dataset Filter API async flow.
--                 POST returns snapshot_id; a separate poll cron drains the
--                 snapshot when it's ready. Stored here so the poll job knows
--                 what to look for between runs.
--
-- All four tables hold per-user state. RLS scopes user reads to their own
-- rows; writes flow through service_role from the Edge Functions and the
-- /lib enrichment code. proposals are the only table users mutate directly
-- (review actions write status via signed-token routes).
--
-- No GIN indexes today — query patterns are by user_id and by status. Add
-- when JSONB filtering shows up in a query plan.

-- =============================================================================
-- profile_enrichment_settings
-- =============================================================================
-- One row per user with a known LinkedIn URL. Created lazily on first
-- successful onboarding import or manual refresh. linkedin_url duplicates
-- base_profiles.linkedin_url at write time because the enrichment table is
-- the authoritative state for the freshness loop and we don't want a join
-- on every sweep query. base_profiles.linkedin_url stays the display field.

create table profile_enrichment_settings (
  user_id                   uuid primary key references users(id) on delete cascade,
  linkedin_url              text,
  linkedin_username         text,
  primary_provider_name     text check (primary_provider_name in ('linkdapi','brightdata','pdl')),
  primary_provider_id       text,
  refresh_policy            text not null default 'review_before_update'
                              check (refresh_policy in ('manual_only','review_before_update','auto_apply_and_notify')),
  refresh_interval          text not null default 'monthly'
                              check (refresh_interval in ('monthly','quarterly')),
  consented_at              timestamptz,
  last_checked_at           timestamptz,
  last_enriched_at          timestamptz,
  last_profile_fingerprint  text,
  consecutive_sweep_misses  int not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index profile_enrichment_settings_sweep_lookup_idx
  on profile_enrichment_settings (refresh_policy, last_checked_at)
  where linkedin_url is not null;

comment on table profile_enrichment_settings is
  'Per-user freshness config and last-seen fingerprint. Authoritative source for sweep targeting; base_profiles.linkedin_url stays the display field.';

-- =============================================================================
-- profile_enrichment_runs
-- =============================================================================
-- Audit log. Every provider call writes one row, including silent rejects.
-- Used for: per-user cost accounting, the 3-consecutive-miss escalation rule,
-- and debugging when a sweep proposes nothing for a user we know changed jobs.

create table profile_enrichment_runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  provider     text not null check (provider in ('linkdapi','brightdata','pdl')),
  purpose      text not null check (purpose in (
                 'onboarding_import',
                 'manual_refresh',
                 'scheduled_sweep',
                 'sweep_miss_fallback',
                 'fallback_verification'
               )),
  status       text not null check (status in (
                 'succeeded','no_match','failed','skipped_cap','skipped_unchanged'
               )),
  cost_units   int,
  fingerprint  text,
  error        text,
  fetched_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index profile_enrichment_runs_user_idx
  on profile_enrichment_runs (user_id, created_at desc);

create index profile_enrichment_runs_provider_idx
  on profile_enrichment_runs (provider, created_at desc);

comment on table profile_enrichment_runs is
  'One row per provider call. Powers per-user audit, the 3-miss escalation rule, and provider cost telemetry.';

-- =============================================================================
-- profile_change_proposals
-- =============================================================================
-- A diff between what the user has stored and what the provider returned.
-- Created by the sweep and by the manual button (when a fingerprint differs).
-- review_token is the one-time-use string in email links (mirrors invites).
-- proposed_snapshot stores the full ExtractedProfile shape so the review UI
-- can dual-seed against current_snapshot without re-fetching the provider.

create table profile_change_proposals (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  source             text not null check (source in (
                       'linkdapi','brightdata','pdl','resume','manual'
                     )),
  status             text not null default 'pending'
                       check (status in (
                         'pending','accepted','edited','declined','auto_applied','superseded','expired'
                       )),
  current_snapshot   jsonb not null,
  proposed_snapshot  jsonb not null,
  diff               jsonb,
  source_run_id      uuid references profile_enrichment_runs(id) on delete set null,
  confidence         numeric(4,3),
  review_token       text not null unique,
  expires_at         timestamptz not null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now()
);

create index profile_change_proposals_user_pending_idx
  on profile_change_proposals (user_id, created_at desc)
  where status = 'pending';

comment on table profile_change_proposals is
  'A user-visible diff between stored profile and provider-fetched profile. Confirmed/edited via session UI on the profile page; the same review UI is reachable via signed-token email link.';

-- =============================================================================
-- enrichment_sweep_jobs
-- =============================================================================
-- One row per Bright Data Dataset Filter API call. Tracks the async snapshot
-- lifecycle (pending → ready → downloaded → failed) so the 5-minute poll cron
-- knows which snapshots are still in flight. member_count helps cost
-- reconciliation; the actual records arrive in profile_change_proposals.

create table enrichment_sweep_jobs (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null check (provider in ('brightdata','linkdapi','pdl')),
  snapshot_id   text,
  status        text not null default 'pending'
                  check (status in ('pending','ready','downloaded','failed')),
  member_count  int not null,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  error         text
);

create index enrichment_sweep_jobs_pending_idx
  on enrichment_sweep_jobs (status, started_at)
  where status in ('pending','ready');

comment on table enrichment_sweep_jobs is
  'Snapshot lifecycle for async sweep providers (Bright Data is async; LinkdAPI/PDL fallback rows are immediately downloaded).';

-- =============================================================================
-- Row-Level Security
-- =============================================================================
-- settings + proposals are owner-readable. runs are owner-readable for the
-- user's own audit screen (read-only on the client). sweep_jobs are
-- service-role only — no per-user attribution at the job level.
--
-- All writes go through service_role (Edge Functions + server actions using
-- the admin client). The only client-side write surface is proposal review,
-- handled by signed-token routes that escalate to service_role after token
-- verification — mirroring the invite-accept flow.

alter table profile_enrichment_settings  enable row level security;
alter table profile_enrichment_runs      enable row level security;
alter table profile_change_proposals     enable row level security;
alter table enrichment_sweep_jobs        enable row level security;

create policy "users read own enrichment_settings" on profile_enrichment_settings
  for select to authenticated
  using (user_id = auth.uid());

create policy "users read own enrichment_runs" on profile_enrichment_runs
  for select to authenticated
  using (user_id = auth.uid());

create policy "users read own change_proposals" on profile_change_proposals
  for select to authenticated
  using (user_id = auth.uid());

-- sweep_jobs intentionally has no client policy: only service_role reads/writes.
