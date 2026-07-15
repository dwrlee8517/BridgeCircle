begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(10);

select (to_regprocedure('api.get_my_member_context(uuid)') is not null)::integer
  as context_function_exists \gset

select extensions.has_function(
  'api', 'get_my_member_context', array['uuid'],
  'member context API exists'
);

\if :context_function_exists

insert into public.organizations (id, slug, name) values
  ('60000000-0000-4000-8000-000000000010', 'foundation-context', 'Foundation Context');

insert into public.users (id) values
  ('70000000-0000-4000-8000-000000000020'),
  ('70000000-0000-4000-8000-000000000021'),
  ('70000000-0000-4000-8000-000000000022'),
  ('70000000-0000-4000-8000-000000000023');

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  (
    '71000000-0000-4000-8000-000000000021',
    '70000000-0000-4000-8000-000000000021',
    '11111111-1111-4111-8111-111111111111', 'active', now()
  ),
  (
    '71000000-0000-4000-8000-000000000024',
    '70000000-0000-4000-8000-000000000021',
    '60000000-0000-4000-8000-000000000010', 'active', now()
  ),
  (
    '71000000-0000-4000-8000-000000000022',
    '70000000-0000-4000-8000-000000000022',
    '60000000-0000-4000-8000-000000000010', 'pending', null
  ),
  (
    '71000000-0000-4000-8000-000000000023',
    '70000000-0000-4000-8000-000000000023',
    '60000000-0000-4000-8000-000000000010', 'rejected', null
  );

insert into public.notifications (
  recipient_user_id, type, payload, dedupe_key, read_at
) values
  (
    '70000000-0000-4000-8000-000000000021',
    'message_received', '{}', 'foundation-context:unread', null
  ),
  (
    '70000000-0000-4000-8000-000000000021',
    'message_received', '{}', 'foundation-context:read', now()
  );

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000020', true
);
set local role authenticated;
select extensions.ok(
  (
    select selected_membership_id is null
      and not requires_circle_choice
      and jsonb_array_length(memberships) = 0
    from api.get_my_member_context(null)
  ),
  'account with zero memberships returns one routable empty context'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true
);
set local role authenticated;
select extensions.is(
  (select selected_membership_id from api.get_my_member_context(null)),
  '20000000-0000-4000-8000-000000000002'::uuid,
  'the only active membership is selected automatically'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000021', true
);
set local role authenticated;
select extensions.ok(
  (
    select selected_membership_id is null and requires_circle_choice
    from api.get_my_member_context(null)
  ),
  'multiple active memberships require a circle choice without a preference'
);
select extensions.is(
  (
    select selected_membership_id
    from api.get_my_member_context('71000000-0000-4000-8000-000000000024')
  ),
  '71000000-0000-4000-8000-000000000024'::uuid,
  'an owned usable preferred membership is selected'
);
select extensions.ok(
  (
    select selected_membership_id is null and requires_circle_choice
    from api.get_my_member_context('20000000-0000-4000-8000-000000000002')
  ),
  'a tampered cross-user preference is ignored'
);
select extensions.is(
  (select unread_notification_count from api.get_my_member_context(null)),
  1::bigint,
  'member context includes the current unread-notification count'
);
select extensions.is(
  (select jsonb_array_length(memberships) from api.get_my_member_context(null)),
  2,
  'member context contains only the current user memberships'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000022', true
);
set local role authenticated;
select extensions.is(
  (select selected_membership_id from api.get_my_member_context(null)),
  '71000000-0000-4000-8000-000000000022'::uuid,
  'the only pending membership is selected when no active membership exists'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000023', true
);
set local role authenticated;
select extensions.ok(
  (
    select selected_membership_id is null
      and not requires_circle_choice
      and memberships -> 0 ->> 'status' = 'rejected'
    from api.get_my_member_context(null)
  ),
  'rejected membership remains routable but is not selectable'
);
reset role;

\else
select * from extensions.skip(9, 'member context API is not implemented yet');
\endif

select * from extensions.finish();
rollback;
