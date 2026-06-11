-- Standing asks ("open asks"): when live matching finds no strong fit, the
-- member can leave the ask with us. Service code re-matches as the pool
-- changes (joins, opt-ins, unpauses, enrichment updates) and notifies the
-- asker on genuine fits. Asks expire on their own — the short TTL plus
-- explicit renewal is what keeps the surface honest and protects helper
-- goodwill from stale asks.

create table open_asks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  question text not null check (char_length(question) between 10 and 400),
  status text not null default 'open' check (status in ('open', 'closed', 'expired')),
  -- close_reason only describes member/service closes; expiry is its own status.
  close_reason text check (close_reason in ('member_closed', 'resolved')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  closed_at timestamptz,
  last_matched_at timestamptz,
  -- Pin the state machine: anything not open carries a closed_at; close_reason
  -- belongs to 'closed' only. Cap the TTL at creation so a client insert
  -- cannot park an ask open for a year.
  check (status = 'open' or closed_at is not null),
  check (close_reason is null or status = 'closed'),
  check (expires_at <= created_at + interval '30 days')
);

comment on table open_asks is
  'Standing asks left open for background matching after live search found no strong fit.';

-- Pilot rule: one live standing ask per member per organization.
create unique index open_asks_one_open_per_user_idx
  on open_asks (organization_id, user_id) where status = 'open';
create index open_asks_org_open_idx on open_asks (organization_id) where status = 'open';

alter table open_asks enable row level security;

create policy "members read own open asks" on open_asks
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "members create own open asks in their org" on open_asks
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and is_active_member_of(organization_id)
  );

-- Members may only perform the close transition; the column-level grant
-- below keeps question / expires_at / organization_id / sweep bookkeeping
-- out of client reach (RLS cannot restrict columns). Renewal and question
-- edits go through service-role code so stale match rows get invalidated.
create policy "members close own open asks" on open_asks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and is_active_member_of(organization_id)
  );

revoke update on open_asks from authenticated;
grant update (status, close_reason, closed_at) on open_asks to authenticated;

-- Matches the background sweep found for a standing ask. Fully service-role
-- owned on the client path (the enrichment_sweep_jobs precedent): the asker
-- gets a bare count ("shown to N matched helpers") through /lib code over
-- the admin client — never helper identities, scores, or rationales, which
-- would let an asker cold-approach ranked helpers and bypass the two-sided
-- buffer. Helper-side reads arrive only with the /help supply surface,
-- deliberately and gated.
create table open_ask_matches (
  id uuid primary key default gen_random_uuid(),
  open_ask_id uuid not null references open_asks(id) on delete cascade,
  helper_user_id uuid not null references users(id) on delete cascade,
  match_score numeric,
  rationale text,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (open_ask_id, helper_user_id)
);

comment on table open_ask_matches is
  'Sweep-discovered helper matches for standing asks. Service-role only; no client policies.';

create index open_ask_matches_helper_idx on open_ask_matches (helper_user_id);

alter table open_ask_matches enable row level security;
-- No policies on purpose: RLS denies all client access; service_role bypasses.
