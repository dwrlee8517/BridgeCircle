-- Operational queue/status table for keeping Ask profile embeddings fresh.
-- Service-role code owns this table. Normal users should not read or write it
-- directly; Ask retrieval still happens through controlled server code.

create table profile_embedding_index_status (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  organization_membership_id uuid not null references organization_memberships(id) on delete cascade,
  status text not null check (status in ('dirty', 'indexing', 'ready', 'failed')),
  dirty_reason text,
  dirty_since timestamptz,
  last_indexed_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  attempt_count int not null default 0 check (attempt_count >= 0),
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id, organization_membership_id)
);

create index profile_embedding_index_status_status_idx
  on profile_embedding_index_status (status, dirty_since);

create index profile_embedding_index_status_user_idx
  on profile_embedding_index_status (user_id);

create index profile_embedding_index_status_lock_idx
  on profile_embedding_index_status (locked_at)
  where locked_at is not null;

alter table profile_embedding_index_status enable row level security;

comment on table profile_embedding_index_status is
  'Service-role owned queue/status table for async Ask profile embedding indexing.';
