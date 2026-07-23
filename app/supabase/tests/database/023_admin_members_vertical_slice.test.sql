begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(12);

-- Contract surface -----------------------------------------------------------

select extensions.has_function(
  'api', 'list_admin_members',
  array['uuid', 'text', 'integer', 'text', 'boolean', 'integer', 'integer', 'integer'],
  'admins list members through the fixed api projection'
);
select extensions.has_function(
  'api', 'admin_grant_role',
  array['uuid', 'uuid', 'text'],
  'role grants go through the api command'
);
select extensions.has_function(
  'api', 'admin_revoke_role',
  array['uuid', 'uuid', 'text'],
  'role revokes go through the api command'
);

-- An ordinary member is denied -----------------------------------------------

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.list_admin_members('20000000-0000-4000-8000-000000000002')->>'resultCode',
  'not_available',
  'an ordinary member cannot list the member directory'
);
select extensions.is(
  api.admin_grant_role(
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003', 'event_moderator'
  )->>'resultCode',
  'not_available',
  'an ordinary member cannot grant roles'
);

-- The super_admin operates the directory -------------------------------------

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select extensions.ok(
  (
    select (result->>'resultCode') = 'ok' and (result->>'total')::int >= 4
    from api.list_admin_members('20000000-0000-4000-8000-000000000001') as result
  ),
  'the super_admin sees the organization-one members with a total'
);
select extensions.ok(
  (
    select (result->>'total')::int = 1
      and result->'items'->0->>'membershipId' = '20000000-0000-4000-8000-000000000002'
    from api.list_admin_members(
      '20000000-0000-4000-8000-000000000001', 'Richard'
    ) as result
  ),
  'name search narrows the directory to the matching member'
);

select extensions.is(
  api.admin_grant_role(
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002', 'event_moderator'
  )->>'resultCode',
  'granted',
  'the super_admin grants event_moderator'
);
select extensions.is(
  api.admin_grant_role(
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002', 'event_moderator'
  )->>'resultCode',
  'already_granted',
  'granting the same role twice is idempotent'
);
select extensions.is(
  api.admin_grant_role(
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002', 'super_admin'
  )->>'resultCode',
  'invalid_input',
  'super_admin is never grantable from the console'
);
select extensions.is(
  api.admin_revoke_role(
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002', 'event_moderator'
  )->>'resultCode',
  'revoked',
  'the super_admin revokes the granted role'
);
select extensions.is(
  api.admin_revoke_role(
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002', 'event_moderator'
  )->>'resultCode',
  'not_found',
  'revoking an absent role reports not_found'
);

select * from extensions.finish();
rollback;
