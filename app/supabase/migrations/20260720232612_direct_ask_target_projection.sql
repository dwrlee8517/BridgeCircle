-- A profile can open a direct Ask without first creating a private Help-search
-- draft. Keep the recipient projection membership-scoped and permission-safe;
-- the create command still revalidates availability, blocks, and capacity.

create or replace function private.get_direct_ask_target(
  p_asker_membership_id uuid,
  p_recipient_membership_id uuid
)
returns table (
  result_code text,
  recipient jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_asker record;
  v_recipient record;
begin
  if p_asker_membership_id is null or p_recipient_membership_id is null then
    return query select 'not_available'::text, null::jsonb;
    return;
  end if;

  select membership.user_id, membership.organization_id
    into v_asker
  from public.organization_memberships membership
  join public.users account
    on account.id = membership.user_id
   and account.account_state = 'active'
  where membership.id = p_asker_membership_id
    and membership.user_id = (select auth.uid())
    and membership.status = 'active';

  if not found then
    return query select 'not_available'::text, null::jsonb;
    return;
  end if;

  select
    membership.id as membership_id,
    membership.user_id,
    profile_row.display_name,
    profile_row.headline,
    profile_row.avatar_path,
    organization_profile.graduation_year,
    coalesce((
      select array_agg(topic.name order by topic.sort_order)
      from public.helper_topics topic
      where topic.organization_membership_id = membership.id
    ), array[]::text[]) as topics
    into v_recipient
  from public.organization_memberships membership
  join public.users account
    on account.id = membership.user_id
   and account.account_state = 'active'
  join public.profiles profile_row
    on profile_row.user_id = membership.user_id
  left join public.organization_profiles organization_profile
    on organization_profile.organization_membership_id = membership.id
  join public.helper_preferences preferences
    on preferences.organization_membership_id = membership.id
   and preferences.organization_id = membership.organization_id
   and preferences.open_to_help = true
   and preferences.paused_at is null
  where membership.id = p_recipient_membership_id
    and membership.organization_id = v_asker.organization_id
    and membership.status = 'active';

  if not found
     or v_recipient.user_id = v_asker.user_id
     or private.is_blocked(v_asker.user_id, v_recipient.user_id) then
    return query select 'not_available'::text, null::jsonb;
    return;
  end if;

  return query select
    'ok'::text,
    jsonb_build_object(
      'membershipId', v_recipient.membership_id,
      'userId', v_recipient.user_id,
      'displayName', v_recipient.display_name,
      'headline', v_recipient.headline,
      'avatarPath', v_recipient.avatar_path,
      'graduationYear', v_recipient.graduation_year,
      'topics', v_recipient.topics
    );
end;
$$;

create or replace function api.get_direct_ask_target(
  p_asker_membership_id uuid,
  p_recipient_membership_id uuid
)
returns table (
  result_code text,
  recipient jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from private.get_direct_ask_target(
    p_asker_membership_id,
    p_recipient_membership_id
  );
$$;

revoke execute on function private.get_direct_ask_target(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function api.get_direct_ask_target(uuid, uuid)
  from public, anon;
grant execute on function api.get_direct_ask_target(uuid, uuid) to authenticated;
