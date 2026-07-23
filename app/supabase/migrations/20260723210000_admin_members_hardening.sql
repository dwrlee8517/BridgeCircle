-- Hardening pass on 20260723200000_admin_members_vertical_slice.sql from the
-- migration review: align private-function grants with the revoke pattern in
-- 20260722010000, escape the directory search pattern, require an active
-- account on role-grant targets, and reload the PostgREST schema cache.

-- ---------------------------------------------------------------------------
-- Grants: private functions are reached only through the security-definer api
-- wrappers, so callers get no direct execute on them.
-- ---------------------------------------------------------------------------

revoke execute on function private.admin_actor_role(uuid) from public, anon, authenticated;
revoke execute on function private.list_admin_members(
  uuid, text, integer, text, boolean, integer, integer, integer
) from public, anon, authenticated;
revoke execute on function private.admin_grant_role(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function private.admin_revoke_role(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function api.list_admin_members(
  uuid, text, integer, text, boolean, integer, integer, integer
) from public, anon;
revoke execute on function api.admin_grant_role(uuid, uuid, text) from public, anon;
revoke execute on function api.admin_revoke_role(uuid, uuid, text) from public, anon;

-- ---------------------------------------------------------------------------
-- Search escaping + length guard
-- ---------------------------------------------------------------------------

create or replace function private.list_admin_members(
  p_membership_id uuid,
  p_search text default null,
  p_class_year integer default null,
  p_status text default null,
  p_open_to_help boolean default null,
  p_inactive_days integer default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid := private.moderation_admin_organization(p_membership_id);
  v_search_pattern text;
  v_items jsonb;
  v_total bigint;
begin
  if v_organization_id is null then
    return jsonb_build_object('resultCode', 'not_available');
  end if;
  if p_status is not null and p_status not in ('pending', 'active', 'rejected', 'revoked') then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;
  if p_limit < 1 or p_limit > 200 or p_offset < 0 or coalesce(p_inactive_days, 1) < 1 then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;
  if char_length(coalesce(p_search, '')) > 120 then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;
  if p_search is not null then
    v_search_pattern := '%' || replace(replace(replace(
      p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  with member as (
    select
      membership.id as membership_id,
      membership.user_id,
      membership.status,
      membership.joined_at,
      membership.created_at,
      coalesce(profile.preferred_name, profile.display_name) as display_name,
      profile.current_title,
      profile.current_employer,
      profile.city,
      org_profile.graduation_year,
      account.account_state,
      account.last_seen_at,
      coalesce(prefs.open_to_help, false) as open_to_help,
      coalesce(
        (
          select jsonb_agg(assignment.role order by assignment.role)
          from public.admin_role_assignments assignment
          where assignment.organization_membership_id = membership.id
        ),
        '[]'::jsonb
      ) as roles
    from public.organization_memberships membership
    join public.users account on account.id = membership.user_id
    left join public.profiles profile on profile.user_id = membership.user_id
    left join public.organization_profiles org_profile
      on org_profile.organization_membership_id = membership.id
    left join public.helper_preferences prefs
      on prefs.organization_membership_id = membership.id
    where membership.organization_id = v_organization_id
      and account.account_state <> 'deleted'
      and (p_status is null or membership.status = p_status)
      and (p_class_year is null or org_profile.graduation_year = p_class_year)
      and (p_open_to_help is null or coalesce(prefs.open_to_help, false) = p_open_to_help)
      and (
        p_inactive_days is null
        or account.last_seen_at is null
        or account.last_seen_at < now() - make_interval(days => p_inactive_days)
      )
      and (
        v_search_pattern is null
        or coalesce(profile.preferred_name, profile.display_name, '') ilike v_search_pattern
        or coalesce(profile.display_name, '') ilike v_search_pattern
      )
  )
  select
    (select count(*) from member),
    (
      select jsonb_agg(jsonb_build_object(
        'membershipId', page.membership_id,
        'userId', page.user_id,
        'displayName', page.display_name,
        'title', page.current_title,
        'employer', page.current_employer,
        'city', page.city,
        'graduationYear', page.graduation_year,
        'status', page.status,
        'joinedAt', page.joined_at,
        'createdAt', page.created_at,
        'accountState', page.account_state,
        'lastSeenAt', page.last_seen_at,
        'openToHelp', page.open_to_help,
        'roles', page.roles
      ))
      from (
        select * from member
        order by member.display_name nulls last, member.membership_id
        limit p_limit offset p_offset
      ) page
    )
  into v_total, v_items;

  return jsonb_build_object(
    'resultCode', 'ok',
    'total', coalesce(v_total, 0),
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grant target must be an active account, matching the actor-side gate.
-- ---------------------------------------------------------------------------

create or replace function private.admin_grant_role(
  p_membership_id uuid,
  p_target_membership_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid := private.moderation_admin_organization(p_membership_id);
  v_actor_role text := private.admin_actor_role(p_membership_id);
begin
  if v_organization_id is null or v_actor_role is null then
    return jsonb_build_object('resultCode', 'not_available');
  end if;
  if p_role not in ('admin', 'event_moderator', 'ambassador') then
    return jsonb_build_object('resultCode', 'invalid_input');
  end if;
  if p_role = 'admin' and v_actor_role <> 'super_admin' then
    return jsonb_build_object('resultCode', 'forbidden');
  end if;

  if not exists (
    select 1
    from public.organization_memberships membership
    join public.users account on account.id = membership.user_id
    where membership.id = p_target_membership_id
      and membership.organization_id = v_organization_id
      and membership.status = 'active'
      and account.account_state = 'active'
  ) then
    return jsonb_build_object('resultCode', 'not_available');
  end if;

  insert into public.admin_role_assignments (
    organization_id, organization_membership_id, role, granted_by_membership_id
  ) values (
    v_organization_id, p_target_membership_id, p_role, p_membership_id
  )
  on conflict (organization_membership_id, role) do nothing;

  if found then
    return jsonb_build_object('resultCode', 'granted');
  end if;
  return jsonb_build_object('resultCode', 'already_granted');
end;
$$;

notify pgrst, 'reload schema';
