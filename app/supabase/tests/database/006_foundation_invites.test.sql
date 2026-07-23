begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(35);

select (to_regprocedure('api.verify_invite(text)') is not null)::integer
  as verify_function_exists \gset
select (to_regprocedure('api.accept_invite(text)') is not null)::integer
  as accept_function_exists \gset
select (to_regprocedure('api.decide_membership(uuid,text)') is not null)::integer
  as decision_function_exists \gset

select extensions.has_function(
  'api', 'verify_invite', array['text'],
  'service invite-verification API exists'
);

\if :verify_function_exists

insert into public.invites (
  id, organization_id, email, email_normalized, token_hash, status,
  full_name, graduation_year, accepted_by_user_id, accepted_at, expires_at
) values
  (
    '80000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'valid@example.com', 'valid@example.com',
    extensions.digest('foundation-verify-valid-token-0000000001', 'sha256'),
    'pending', 'Valid Member', 2014, null, null, now() + interval '1 day'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'expired@example.com', 'expired@example.com',
    extensions.digest('foundation-verify-expired-token-0000001', 'sha256'),
    'pending', null, null, null, null, now() - interval '1 minute'
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'revoked@example.com', 'revoked@example.com',
    extensions.digest('foundation-verify-revoked-token-0000001', 'sha256'),
    'revoked', null, null, null, null, now() + interval '1 day'
  ),
  (
    '80000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'accepted@example.com', 'accepted@example.com',
    extensions.digest('foundation-verify-accepted-token-000001', 'sha256'),
    'accepted', null, null,
    '10000000-0000-4000-8000-000000000002', now(), now() + interval '1 day'
  );

set local role service_role;
select extensions.ok(
  (
    select result_code = 'valid'
      and invite_id = '80000000-0000-4000-8000-000000000001'
      and organization_name = 'Chadwick School (Local)'
      and email = 'valid@example.com'
    from api.verify_invite('foundation-verify-valid-token-0000000001')
  ),
  'service role receives only the valid safe invite projection'
);
select extensions.is(
  (select result_code from api.verify_invite('foundation-verify-missing-token-00000001')),
  'not_found',
  'unknown invite token returns not_found'
);
select extensions.is(
  (select result_code from api.verify_invite('foundation-verify-expired-token-0000001')),
  'expired',
  'past-due pending invite returns expired'
);
select extensions.is(
  (select result_code from api.verify_invite('foundation-verify-revoked-token-0000001')),
  'revoked',
  'revoked invite returns revoked'
);
select extensions.is(
  (select result_code from api.verify_invite('foundation-verify-accepted-token-000001')),
  'accepted',
  'accepted invite returns accepted'
);
reset role;

select extensions.ok(
  not exists (
    select 1
    from pg_proc p,
      unnest(coalesce(p.proargnames, array[]::text[])) as argument_name
    where p.oid = 'api.verify_invite(text)'::regprocedure
      and argument_name = 'token_hash'
  ),
  'invite verification return signature never exposes token_hash'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated', 'api.verify_invite(text)', 'execute'
  ),
  'authenticated members cannot call service invite verification'
);

select extensions.ok(
  not has_function_privilege(
    'anon', 'api.verify_invite(text)', 'execute'
  ),
  'anonymous callers cannot call service invite verification'
);

\else
select * from extensions.skip(8, 'invite verification API is not implemented yet');
\endif

select extensions.has_function(
  'api', 'accept_invite', array['text'],
  'atomic invite-acceptance API exists'
);

\if :accept_function_exists

insert into public.organizations (
  id, slug, name, requires_admin_approval
) values (
  '60000000-0000-4000-8000-000000000020',
  'foundation-auto', 'Foundation Auto', false
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', person.id,
  'authenticated', 'authenticated', person.email,
  extensions.crypt('foundation-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', person.metadata_name),
  now(), now(), '', '', '', ''
from (values
  ('70000000-0000-4000-8000-000000000031'::uuid, 'accept-auto@example.com', 'Auth Auto'),
  ('70000000-0000-4000-8000-000000000032'::uuid, 'accept-pending@example.com', 'Metadata Pending'),
  ('70000000-0000-4000-8000-000000000033'::uuid, 'accept-mismatch-user@example.com', 'Mismatch User'),
  ('70000000-0000-4000-8000-000000000034'::uuid, 'accept-competitor@example.com', 'Competitor')
) as person(id, email, metadata_name);

insert into public.invites (
  id, organization_id, email, email_normalized, token_hash, status,
  full_name, graduation_year, expires_at
) values
  (
    '80000000-0000-4000-8000-000000000011',
    '60000000-0000-4000-8000-000000000020',
    'Accept-Auto@Example.com', 'accept-auto@example.com',
    extensions.digest('foundation-accept-auto-token-00000000001', 'sha256'),
    'pending', 'Invite Auto', 2010, now() + interval '1 day'
  ),
  (
    '80000000-0000-4000-8000-000000000012',
    '11111111-1111-4111-8111-111111111111',
    'accept-pending@example.com', 'accept-pending@example.com',
    extensions.digest('foundation-accept-pending-token-0000001', 'sha256'),
    'pending', null, 2012, now() + interval '1 day'
  ),
  (
    '80000000-0000-4000-8000-000000000013',
    '60000000-0000-4000-8000-000000000020',
    'accept-target@example.com', 'accept-target@example.com',
    extensions.digest('foundation-accept-mismatch-token-0000001', 'sha256'),
    'pending', null, null, now() + interval '1 day'
  ),
  (
    '80000000-0000-4000-8000-000000000014',
    '60000000-0000-4000-8000-000000000020',
    'expired-accept@example.com', 'expired-accept@example.com',
    extensions.digest('foundation-accept-expired-token-00000001', 'sha256'),
    'pending', null, null, now() - interval '1 minute'
  ),
  (
    '80000000-0000-4000-8000-000000000015',
    '60000000-0000-4000-8000-000000000020',
    'revoked-accept@example.com', 'revoked-accept@example.com',
    extensions.digest('foundation-accept-revoked-token-00000001', 'sha256'),
    'revoked', null, null, now() + interval '1 day'
  );

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000031', true
);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'accepted' and membership_status = 'active'
    from api.accept_invite('foundation-accept-auto-token-00000000001')
  ),
  'auto-approve invite acceptance returns an active membership'
);
reset role;

select extensions.ok(
  (
    select status = 'accepted'
      and accepted_by_user_id = '70000000-0000-4000-8000-000000000031'
      and accepted_at is not null
    from public.invites
    where id = '80000000-0000-4000-8000-000000000011'
  ),
  'acceptance binds the invite to the authenticated user'
);
select extensions.is(
  (select display_name from public.profiles
   where user_id = '70000000-0000-4000-8000-000000000031'),
  'Invite Auto',
  'invite full name prefills the global profile'
);
select extensions.is(
  (
    select graduation_year
    from public.organization_profiles op
    join public.organization_memberships m on m.id = op.organization_membership_id
    where m.user_id = '70000000-0000-4000-8000-000000000031'
  ),
  2010::smallint,
  'invite graduation year prefills the organization profile'
);
select extensions.is(
  (select count(*)::bigint from private.audit_log
   where actor_user_id = '70000000-0000-4000-8000-000000000031'
     and action = 'membership.joined'),
  1::bigint,
  'first acceptance writes one membership audit event'
);

set local role authenticated;
select extensions.ok(
  (
    select result_code = 'accepted'
      and membership_id = (
        select id from public.organization_memberships
        where user_id = '70000000-0000-4000-8000-000000000031'
          and organization_id = '60000000-0000-4000-8000-000000000020'
      )
    from api.accept_invite('foundation-accept-auto-token-00000000001')
  ),
  'repeat acceptance returns the durable membership'
);
reset role;
select extensions.ok(
  (select count(*) = 1 from public.organization_memberships
   where user_id = '70000000-0000-4000-8000-000000000031')
  and
  (select count(*) = 1 from private.audit_log
   where actor_user_id = '70000000-0000-4000-8000-000000000031'
     and action = 'membership.joined'),
  'repeat acceptance creates no duplicate membership or audit event'
);

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000032', true
);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'accepted' and membership_status = 'pending'
    from api.accept_invite('foundation-accept-pending-token-0000001')
  ),
  'approval-mode invite acceptance returns a pending membership'
);
reset role;
select extensions.ok(
  (select display_name = 'Metadata Pending' from public.profiles
   where user_id = '70000000-0000-4000-8000-000000000032')
  and
  (select count(*) = 1 from public.organization_profiles op
   join public.organization_memberships m on m.id = op.organization_membership_id
   where m.user_id = '70000000-0000-4000-8000-000000000032'),
  'Auth metadata fills a missing invite name and organization profile exists'
);

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000033', true
);
set local role authenticated;
select extensions.is(
  (select result_code from api.accept_invite('foundation-accept-mismatch-token-0000001')),
  'email_mismatch',
  'invite acceptance rejects a mismatched Auth email'
);
reset role;
select extensions.ok(
  not exists (
    select 1 from public.organization_memberships
    where user_id = '70000000-0000-4000-8000-000000000033'
  )
  and
  (select status = 'pending' from public.invites
   where id = '80000000-0000-4000-8000-000000000013'),
  'email mismatch leaves no membership and does not consume the invite'
);

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000031', true
);
set local role authenticated;
select extensions.ok(
  (select result_code = 'expired'
   from api.accept_invite('foundation-accept-expired-token-00000001')),
  'expired invite cannot be accepted'
);
reset role;
select extensions.is(
  (select status from public.invites
   where id = '80000000-0000-4000-8000-000000000014'),
  'expired',
  'acceptance durably marks a past-due pending invite expired'
);

set local role authenticated;
select extensions.is(
  (select result_code from api.accept_invite('foundation-accept-revoked-token-00000001')),
  'revoked',
  'revoked invite cannot be accepted'
);
select extensions.is(
  (select result_code from api.accept_invite('foundation-accept-missing-token-000000001')),
  'not_found',
  'unknown invite cannot be accepted'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000034', true
);
set local role authenticated;
select extensions.is(
  (select result_code from api.accept_invite('foundation-accept-auto-token-00000000001')),
  'accepted_by_other',
  'a consumed invite cannot create membership for a competing user'
);
reset role;

\else
select * from extensions.skip(14, 'invite acceptance API is not implemented yet');
\endif

select extensions.has_function(
  'api', 'decide_membership', array['uuid', 'text'],
  'admin membership-decision API exists'
);

\if :decision_function_exists

insert into public.organizations (id, slug, name) values
  ('60000000-0000-4000-8000-000000000030', 'foundation-decision', 'Foundation Decision');
insert into public.users (id) values
  ('70000000-0000-4000-8000-000000000041'),
  ('70000000-0000-4000-8000-000000000042'),
  ('70000000-0000-4000-8000-000000000043'),
  ('70000000-0000-4000-8000-000000000044');
insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  (
    '71000000-0000-4000-8000-000000000041',
    '70000000-0000-4000-8000-000000000041',
    '11111111-1111-4111-8111-111111111111', 'pending', null
  ),
  (
    '71000000-0000-4000-8000-000000000042',
    '70000000-0000-4000-8000-000000000042',
    '11111111-1111-4111-8111-111111111111', 'pending', null
  ),
  (
    '71000000-0000-4000-8000-000000000043',
    '70000000-0000-4000-8000-000000000043',
    '11111111-1111-4111-8111-111111111111', 'pending', null
  ),
  (
    '71000000-0000-4000-8000-000000000044',
    '70000000-0000-4000-8000-000000000044',
    '60000000-0000-4000-8000-000000000030', 'active', now()
  );
insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role
) values (
  '60000000-0000-4000-8000-000000000030',
  '71000000-0000-4000-8000-000000000044', 'admin'
);

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true
);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'approved' and membership_status = 'active'
    from api.decide_membership(
      '71000000-0000-4000-8000-000000000041', 'approve'
    )
  ),
  'same-org admin can approve a pending membership'
);
reset role;
select extensions.ok(
  (
    select status = 'active' and joined_at is not null
      and approved_by_membership_id = '20000000-0000-4000-8000-000000000001'
      and approved_at is not null
    from public.organization_memberships
    where id = '71000000-0000-4000-8000-000000000041'
  ),
  'approval records active lifecycle and approving membership'
);
select extensions.ok(
  (select count(*) = 1 from private.audit_log
   where target_id = '71000000-0000-4000-8000-000000000041'
     and action = 'membership.approved')
  and
  (select count(*) = 1 from private.outbox_jobs
   where dedupe_key = 'membership_decision:71000000-0000-4000-8000-000000000041:active'),
  'approval writes one audit event and one deduplicated notification job'
);

set local role authenticated;
select extensions.is(
  (select result_code from api.decide_membership(
    '71000000-0000-4000-8000-000000000041', 'approve'
  )),
  'approved',
  'repeating the same membership decision is idempotent'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true
);
set local role authenticated;
select extensions.ok(
  (
    select result_code = 'rejected' and membership_status = 'rejected'
    from api.decide_membership(
      '71000000-0000-4000-8000-000000000042', 'reject'
    )
  ),
  'same-org admin can reject a pending membership'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true
);
set local role authenticated;
select extensions.is(
  (select result_code from api.decide_membership(
    '71000000-0000-4000-8000-000000000043', 'approve'
  )),
  'not_available',
  'ordinary same-org member cannot decide memberships'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '70000000-0000-4000-8000-000000000044', true
);
set local role authenticated;
select extensions.is(
  (select result_code from api.decide_membership(
    '71000000-0000-4000-8000-000000000043', 'approve'
  )),
  'not_available',
  'admin of another organization cannot decide memberships'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true
);
set local role authenticated;
select extensions.is(
  (select result_code from api.decide_membership(
    '71000000-0000-4000-8000-000000000043', 'maybe'
  )),
  'invalid_decision',
  'invalid membership decision is rejected without a state change'
);
reset role;

\else
select * from extensions.skip(8, 'membership decision API is not implemented yet');
\endif

select * from extensions.finish();
rollback;
