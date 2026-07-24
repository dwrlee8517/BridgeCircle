-- Admin health overview. One read-only projection behind the console's front
-- page: the short list of things waiting on a person, plus a small pulse of
-- how the community is doing. Aggregates only for member Help activity — ask
-- content stays private from admins. Follows the jsonb resultCode contract
-- from 20260722010000_complete_admin_operations.sql.

create or replace function private.admin_overview(p_membership_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid := private.moderation_admin_organization(p_membership_id);
  v_attention jsonb;
  v_pulse jsonb;
begin
  if v_organization_id is null then
    return jsonb_build_object('resultCode', 'not_available');
  end if;

  select jsonb_build_object(
    'approvals', (
      select jsonb_build_object('count', count(*), 'oldestAt', min(membership.created_at))
      from public.organization_memberships membership
      join public.users account on account.id = membership.user_id
      where membership.organization_id = v_organization_id
        and membership.status = 'pending'
        and account.account_state <> 'deleted'
    ),
    'reports', (
      select jsonb_build_object('count', count(*), 'oldestAt', min(report.created_at))
      from private.reports report
      where report.organization_id = v_organization_id
        and report.status in ('open', 'reviewing')
    ),
    'staleInvites', (
      -- Deliberately includes pending invites already past expires_at: these
      -- are re-invite candidates, and filtering them out would leave the
      -- signal empty (the default invite expiry is also 14 days).
      select jsonb_build_object('count', count(*), 'oldestAt', min(invite.created_at))
      from public.invites invite
      where invite.organization_id = v_organization_id
        and invite.status = 'pending'
        and invite.created_at < now() - interval '14 days'
    ),
    'quietAsks', (
      -- Aggregate only: how many asks are still waiting, never what they say.
      select jsonb_build_object('count', count(*), 'oldestAt', min(ask.created_at))
      from public.asks ask
      where ask.organization_id = v_organization_id
        and ask.status in ('waiting', 'open')
        and ask.created_at < now() - interval '3 days'
        and ask.expires_at > now()
    ),
    'quietNewMembers', (
      select jsonb_build_object('count', count(*))
      from public.organization_memberships membership
      join public.users account on account.id = membership.user_id
      left join public.profiles profile on profile.user_id = membership.user_id
      where membership.organization_id = v_organization_id
        and membership.status = 'active'
        and account.account_state = 'active'
        and membership.joined_at >= now() - interval '30 days'
        and nullif(btrim(coalesce(profile.current_title, '')), '') is null
        and nullif(btrim(coalesce(profile.current_employer, '')), '') is null
    )
  ) into v_attention;

  select jsonb_build_object(
    'activeMembers', (
      select count(*)
      from public.organization_memberships membership
      join public.users account on account.id = membership.user_id
      where membership.organization_id = v_organization_id
        and membership.status = 'active'
        and account.account_state = 'active'
    ),
    'openToHelp', (
      select count(*)
      from public.helper_preferences prefs
      join public.organization_memberships membership
        on membership.id = prefs.organization_membership_id
      join public.users account on account.id = membership.user_id
      where prefs.organization_id = v_organization_id
        and prefs.open_to_help = true
        and membership.status = 'active'
        and account.account_state = 'active'
    ),
    'asksLast30', (
      -- Retracted asks drop out of both counts so the pair reads as a rate.
      select count(*)
      from public.asks ask
      where ask.organization_id = v_organization_id
        and ask.created_at >= now() - interval '30 days'
        and ask.status <> 'retracted'
    ),
    'heardBackLast30', (
      -- "Heard back" counts any response — a direct reply (a decline is
      -- still an answer) or at least one offer on a circle ask, which only
      -- gets responded_at once the asker accepts.
      select count(*)
      from public.asks ask
      where ask.organization_id = v_organization_id
        and ask.created_at >= now() - interval '30 days'
        and ask.status <> 'retracted'
        and (
          ask.responded_at is not null
          or exists (
            select 1 from public.ask_offers offer where offer.ask_id = ask.id
          )
        )
    ),
    'newMembersLast30', (
      select count(*)
      from public.organization_memberships membership
      join public.users account on account.id = membership.user_id
      where membership.organization_id = v_organization_id
        and membership.status = 'active'
        and account.account_state = 'active'
        and membership.joined_at >= now() - interval '30 days'
    ),
    'nextEvent', (
      select jsonb_build_object(
        'id', event.id,
        'title', event.title,
        'startsAt', event.starts_at,
        'goingCount', (
          select count(*)
          from public.event_rsvps rsvp
          where rsvp.event_id = event.id and rsvp.status = 'going'
        )
      )
      from public.events event
      where event.organization_id = v_organization_id
        and event.status = 'published'
        and event.starts_at > now()
      order by event.starts_at, event.id
      limit 1
    )
  ) into v_pulse;

  return jsonb_build_object(
    'resultCode', 'ok',
    'attention', v_attention,
    'pulse', v_pulse
  );
end;
$$;

create or replace function api.admin_overview(p_membership_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$ select private.admin_overview(p_membership_id); $$;

grant execute on function api.admin_overview(uuid) to authenticated;
revoke execute on function api.admin_overview(uuid) from public, anon;
revoke execute on function private.admin_overview(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
