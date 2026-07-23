-- Profile embedding chunks for ADR 0009 hybrid Ask matching.
-- Additive only: current Ask/People search behavior remains unchanged unless
-- ASK_MATCHING_PIPELINE=voyage_hybrid is enabled in the app.

create extension if not exists vector;
create table profile_embedding_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  organization_membership_id uuid not null references organization_memberships(id) on delete cascade,
  chunk_kind text not null check (chunk_kind in ('raw', 'synthetic')),
  source_section text not null check (
    source_section in (
      'directory',
      'career_history',
      'education_history',
      'bio',
      'skills',
      'mentoring_topics',
      'career_path_summary',
      'help_topics_summary'
    )
  ),
  visibility_tier text not null check (visibility_tier in ('org', 'friends')),
  content text not null,
  content_hash text not null,
  synthetic_prompt_version text,
  embedding_model text not null,
  embedding_dim int not null default 1024 check (embedding_dim = 1024),
  embedding vector(1024) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    organization_id,
    user_id,
    chunk_kind,
    source_section,
    visibility_tier,
    content_hash,
    embedding_model,
    embedding_dim
  )
);
create index profile_embedding_chunks_org_user_idx
  on profile_embedding_chunks (organization_id, user_id);
create index profile_embedding_chunks_visibility_idx
  on profile_embedding_chunks (organization_id, visibility_tier);
create index profile_embedding_chunks_hash_idx
  on profile_embedding_chunks (content_hash);
create index profile_embedding_chunks_embedding_idx
  on profile_embedding_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
alter table profile_embedding_chunks enable row level security;
-- No client policies by design. The table contains profile text prepared for
-- retrieval; app code accesses it through service_role and applies the same
-- section-level visibility rules used by profile/search code.

create or replace function match_profile_embedding_chunks(
  p_organization_id uuid,
  p_query_embedding vector(1024),
  p_viewer_id uuid,
  p_friend_ids uuid[],
  p_limit int default 80
)
returns table (
  chunk_id uuid,
  user_id uuid,
  organization_membership_id uuid,
  chunk_kind text,
  source_section text,
  visibility_tier text,
  content text,
  similarity double precision
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as chunk_id,
    c.user_id,
    c.organization_membership_id,
    c.chunk_kind,
    c.source_section,
    c.visibility_tier,
    c.content,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from profile_embedding_chunks c
  join organization_memberships m
    on m.id = c.organization_membership_id
  where c.organization_id = p_organization_id
    and m.status = 'active'
    and c.user_id <> p_viewer_id
    and (
      c.visibility_tier = 'org'
      or (
        c.visibility_tier = 'friends'
        and c.user_id = any(coalesce(p_friend_ids, '{}'::uuid[]))
      )
    )
  order by c.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_limit, 80), 200));
$$;
revoke all on function match_profile_embedding_chunks(uuid, vector(1024), uuid, uuid[], int)
  from public, anon, authenticated;
grant execute on function match_profile_embedding_chunks(uuid, vector(1024), uuid, uuid[], int)
  to service_role;
