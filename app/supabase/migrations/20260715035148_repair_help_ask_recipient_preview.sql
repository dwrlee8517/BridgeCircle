-- Keep the list and detail recipient previews on one strict JSON contract.
-- The v2 baseline omitted graduationYear from list_my_asks, which caused the
-- application decoder to fail closed as soon as a direct Ask appeared.
create or replace function api.list_my_asks(
  p_membership_id uuid,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
)
returns table (
  ask_id uuid,
  organization_id uuid,
  kind text,
  status text,
  question text,
  recipient_preview jsonb,
  offer_count integer,
  conversation_id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  ended_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id,
    a.organization_id,
    a.kind,
    a.status,
    a.question,
    case when recipient.user_id is null then null else jsonb_build_object(
      'userId', recipient.user_id,
      'displayName', recipient_profile.display_name,
      'headline', recipient_profile.headline,
      'avatarPath', recipient_profile.avatar_path,
      'graduationYear', recipient_org_profile.graduation_year
    ) end,
    (
      select count(*)::integer
      from public.ask_offers ao
      where ao.ask_id = a.id
    ),
    conversation.id,
    a.created_at,
    a.expires_at,
    a.ended_at
  from public.asks a
  join public.organization_memberships asker
    on asker.id = a.asker_membership_id
   and asker.id = p_membership_id
   and asker.user_id = (select auth.uid())
   and asker.status = 'active'
  left join public.organization_memberships recipient on recipient.id = a.recipient_membership_id
  left join public.profiles recipient_profile on recipient_profile.user_id = recipient.user_id
  left join public.organization_profiles recipient_org_profile
    on recipient_org_profile.organization_membership_id = recipient.id
  left join public.conversations conversation on conversation.ask_id = a.id
  where (
    (p_before_created_at is null and p_before_id is null)
    or (
      p_before_created_at is not null and p_before_id is not null
      and (a.created_at, a.id) < (p_before_created_at, p_before_id)
    )
  )
  order by a.created_at desc, a.id desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;
