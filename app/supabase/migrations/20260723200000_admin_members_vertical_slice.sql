-- Admin members directory + role management. Gives the console its member
-- data spine: a filterable member list and grant/revoke for the delegated
-- admin roles. Follows the jsonb resultCode contract from
-- 20260722010000_complete_admin_operations.sql.

-- ---------------------------------------------------------------------------
-- Actor role — like private.moderation_admin_organization but returns the
-- strongest console role so callers can distinguish super_admin from admin.
-- ---------------------------------------------------------------------------

create or replace function private.admin_actor_role(p_membership_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role.role
  from public.organization_memberships membership
  join public.admin_role_assignments role
    on role.organization_id = membership.organization_id
   and role.organization_membership_id = membership.id
  join public.users actor on actor.id = membership.user_id
  where membership.id = p_membership_id
    and membership.user_id = (select auth.uid())
    and membership.status = 'active'
    and actor.account_state = 'active'
    and role.role in ('super_admin', 'admin')
  order by case role.role when 'super_admin' then 0 else 1 end
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Members directory
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
        p_search is null
        or coalesce(profile.preferred_name, profile.display_name, '')
          ilike '%' || p_search || '%'
        or coalesce(profile.display_name, '') ilike '%' || p_search || '%'
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
-- Role grant / revoke. super_admin is never grantable or revocable here —
-- it stays a deliberate SQL-level act. Granting or revoking 'admin' requires
-- a super_admin actor, so delegated admins can only manage the lighter roles.
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
  v_target public.organization_memberships%rowtype;
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

  select * into v_target
  from public.organization_memberships membership
  where membership.id = p_target_membership_id
    and membership.organization_id = v_organization_id
    and membership.status = 'active';
  if not found then
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

create or replace function private.admin_revoke_role(
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

  delete from public.admin_role_assignments assignment
  where assignment.organization_id = v_organization_id
    and assignment.organization_membership_id = p_target_membership_id
    and assignment.role = p_role;

  if found then
    return jsonb_build_object('resultCode', 'revoked');
  end if;
  return jsonb_build_object('resultCode', 'not_found');
end;
$$;

-- ---------------------------------------------------------------------------
-- api wrappers + grants
-- ---------------------------------------------------------------------------

create or replace function api.list_admin_members(
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
language sql
stable
security definer
set search_path = ''
as $$
  select private.list_admin_members(
    p_membership_id, p_search, p_class_year, p_status,
    p_open_to_help, p_inactive_days, p_limit, p_offset
  );
$$;

create or replace function api.admin_grant_role(
  p_membership_id uuid,
  p_target_membership_id uuid,
  p_role text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$ select private.admin_grant_role(p_membership_id, p_target_membership_id, p_role); $$;

create or replace function api.admin_revoke_role(
  p_membership_id uuid,
  p_target_membership_id uuid,
  p_role text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$ select private.admin_revoke_role(p_membership_id, p_target_membership_id, p_role); $$;

grant execute on function api.list_admin_members(
  uuid, text, integer, text, boolean, integer, integer, integer
) to authenticated;
grant execute on function api.admin_grant_role(uuid, uuid, text) to authenticated;
grant execute on function api.admin_revoke_role(uuid, uuid, text) to authenticated;
grant execute on function private.admin_actor_role(uuid) to authenticated;
grant execute on function private.list_admin_members(
  uuid, text, integer, text, boolean, integer, integer, integer
) to authenticated;
grant execute on function private.admin_grant_role(uuid, uuid, text) to authenticated;
grant execute on function private.admin_revoke_role(uuid, uuid, text) to authenticated;
