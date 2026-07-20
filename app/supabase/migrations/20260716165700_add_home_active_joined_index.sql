-- Home's weekly circle pulse filters active members by organization and
-- joined_at. The existing directory index is ordered for People browsing, so
-- keep it and add the query-shaped partial index instead of overloading one
-- index with incompatible orderings.

create index organization_memberships_org_joined_active_idx
  on public.organization_memberships (organization_id, joined_at desc, user_id)
  where status = 'active';
