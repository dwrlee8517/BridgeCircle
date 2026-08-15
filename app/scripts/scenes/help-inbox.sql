-- Scene: help-inbox (namespace 99999999-7701)
--
-- Three waiting asks addressed to Jamie Rowe — the give-help storyline opener.
-- Askers are queried from the crowd (never hardcoded): the first three active
-- members with a headline, so the inbox cards read as real people on camera.
--
-- Capacity: seed-demo-org gives Jamie max_pending_requests = 10 and the base
-- seed leaves 4 waiting asks in her inbox; these 3 bring it to 7.

begin;

delete from public.ask_offers where ask_id in (
  select id from public.asks where id::text like '99999999-7701-%');
delete from public.asks where id::text like '99999999-7701-%';

with candidate as (
  select m.id as membership_id, row_number() over (order by m.id) as rn
  from public.organization_memberships m
  join public.profiles p on p.user_id = m.user_id
  where m.organization_id = :'org_id'
    and m.status = 'active'
    and m.id::text like 'dddddddd-1111-%'
    and p.headline is not null
)
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  expires_at, created_at
)
select
  ('99999999-7701-4000-8000-' || lpad(rn::text, 12, '0'))::uuid,
  :'org_id',
  membership_id,
  'direct',
  'waiting',
  :'jamie_membership',
  case rn
    when 1 then 'Could I ask how you decided between staying in Seoul and moving abroad for your first job?'
    when 2 then 'quick question about getting into product management?'
    else 'I have two offers on the table and would value an outside read from someone a few years ahead.'
  end,
  case rn
    when 1 then 'Even twenty minutes would help a lot.'
    when 2 then 'Happy to work around your schedule.'
    else 'Any perspective would help, even a short one.'
  end,
  null,
  false,
  ('99999999-7701-4000-8000-' || lpad((100 + rn)::text, 12, '0'))::uuid,
  now() + ((9 + rn) || ' days')::interval,
  now() - (case rn when 1 then interval '2 hours' when 2 then interval '1 day' else interval '3 days' end)
from candidate
where rn <= 3;

commit;
