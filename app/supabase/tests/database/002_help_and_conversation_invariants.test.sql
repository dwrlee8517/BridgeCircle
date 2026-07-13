begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(21);

select extensions.throws_ok(
  $$
    insert into public.asks (
      organization_id, asker_membership_id, kind, status,
      recipient_membership_id, question, request_message, client_request_id
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '20000000-0000-4000-8000-000000000005',
      'direct', 'open',
      '20000000-0000-4000-8000-000000000003',
      'Illegal direct state', 'This must not insert.',
      '90000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  null,
  'direct asks cannot use circle-only open status'
);

select extensions.throws_ok(
  $$
    insert into public.asks (
      organization_id, asker_membership_id, kind, status,
      question, reach, client_request_id
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '20000000-0000-4000-8000-000000000005',
      'circle', 'waiting', 'Illegal circle state', 'matched',
      '90000000-0000-4000-8000-000000000002'
    )
  $$,
  '23514',
  null,
  'circle asks cannot use direct-only waiting status'
);

select extensions.throws_ok(
  $$
    insert into public.ask_offers (
      organization_id, ask_id, helper_membership_id, offer_note, client_request_id
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '30000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000004',
      'This direct Ask must reject offers.',
      '90000000-0000-4000-8000-000000000003'
    )
  $$,
  '23514',
  null,
  'offers cannot target direct asks'
);

select extensions.throws_ok(
  $$
    insert into public.conversations (kind, user_a_id, user_b_id)
    values (
      'direct',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000004'
    )
  $$,
  '23505',
  null,
  'a user pair can have only one direct conversation'
);

select extensions.throws_ok(
  $$
    insert into public.messages (
      conversation_id, sender_user_id, kind, body, client_nonce
    ) values (
      '50000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000005',
      'user', 'I am not a participant.',
      '90000000-0000-4000-8000-000000000004'
    )
  $$,
  '23514',
  null,
  'non-participants cannot insert messages'
);

select extensions.throws_ok(
  $$
    insert into private.reports (
      reporter_user_id, reported_user_id, reason,
      target_type, target_id, ask_id, evidence_snapshot
    ) values (
      '10000000-0000-4000-8000-000000000005',
      '10000000-0000-4000-8000-000000000003',
      'other', 'profile',
      '10000000-0000-4000-8000-000000000003',
      '30000000-0000-4000-8000-000000000001',
      '{}'::jsonb
    )
  $$,
  '23514',
  null,
  'report target type must match its typed foreign key'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;

select extensions.lives_ok(
  $$
    select api.create_direct_ask(
      '20000000-0000-4000-8000-000000000005',
      '20000000-0000-4000-8000-000000000003',
      'Could you review another career option?',
      'I would value a second perspective on this path.',
      '90000000-0000-4000-8000-000000000101'
    )
  $$,
  'authenticated owner can create a direct Ask through the API'
);

select extensions.is(
  api.create_direct_ask(
    '20000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000003',
    'Could you review another career option?',
    'I would value a second perspective on this path.',
    '90000000-0000-4000-8000-000000000101'
  ),
  api.create_direct_ask(
    '20000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000003',
    'Ignored on idempotent retry',
    'Ignored on idempotent retry.',
    '90000000-0000-4000-8000-000000000101'
  ),
  'Ask creation is idempotent by membership and client request ID'
);

select extensions.lives_ok(
  $$
    select api.create_direct_ask(
      '20000000-0000-4000-8000-000000000005',
      '20000000-0000-4000-8000-000000000003',
      'Active Ask three', 'A third active request.',
      '90000000-0000-4000-8000-000000000102'
    );
    select api.create_direct_ask(
      '20000000-0000-4000-8000-000000000005',
      '20000000-0000-4000-8000-000000000003',
      'Active Ask four', 'A fourth active request.',
      '90000000-0000-4000-8000-000000000103'
    );
    select api.create_direct_ask(
      '20000000-0000-4000-8000-000000000005',
      '20000000-0000-4000-8000-000000000003',
      'Active Ask five', 'A fifth active request.',
      '90000000-0000-4000-8000-000000000104'
    )
  $$,
  'five active Asks are allowed'
);

select extensions.throws_ok(
  $$
    select api.create_direct_ask(
      '20000000-0000-4000-8000-000000000005',
      '20000000-0000-4000-8000-000000000003',
      'Active Ask six', 'This request must be rejected.',
      '90000000-0000-4000-8000-000000000105'
    )
  $$,
  'P0001',
  null,
  'the sixth active Ask is rejected transactionally'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;

select extensions.lives_ok(
  $$
    select api.respond_to_direct_ask(
      '30000000-0000-4000-8000-000000000001',
      'accept',
      'Yes — happy to talk through both paths.',
      null, null,
      '90000000-0000-4000-8000-000000000201'
    )
  $$,
  'direct Ask acceptance creates the conversation atomically'
);

reset role;
select extensions.lives_ok('set constraints all immediate', 'deferred direct Ask invariants pass');
set constraints all deferred;

select extensions.is(
  (select status from public.asks where id = '30000000-0000-4000-8000-000000000001'),
  'accepted'::text,
  'accepted direct Ask has accepted status'
);

select extensions.is(
  (select count(*)::bigint from public.conversations where ask_id = '30000000-0000-4000-8000-000000000001'),
  1::bigint,
  'accepted direct Ask has exactly one conversation'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;

select extensions.is(
  (select asker_user_id from api.get_ask_detail('30000000-0000-4000-8000-000000000002')),
  null::uuid,
  'matched helper cannot see an anonymous Ask author before acceptance'
);

select extensions.lives_ok(
  $$
    create temporary table test_offer_id on commit drop as
    select api.offer_to_help(
      '30000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000006',
      'I work in this area and would be glad to compare notes.',
      '90000000-0000-4000-8000-000000000301'
    ) as id
  $$,
  'matched helper can offer to help'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select extensions.lives_ok(
  $$
    select api.decide_offer(
      (
        select id from test_offer_id
      ),
      'accept',
      'Thank you — I would appreciate your perspective.',
      null, null,
      '90000000-0000-4000-8000-000000000302'
    )
  $$,
  'Ask owner can accept one offer atomically'
);

reset role;
select extensions.lives_ok('set constraints all immediate', 'deferred circle Ask invariants pass');
set constraints all deferred;

select extensions.is(
  (
    select count(*)::bigint from public.ask_offers
    where ask_id = '30000000-0000-4000-8000-000000000002' and status = 'accepted'
  ),
  1::bigint,
  'accepted circle Ask has exactly one accepted offer'
);

select extensions.is(
  (select count(*)::bigint from public.conversations where ask_id = '30000000-0000-4000-8000-000000000002'),
  1::bigint,
  'accepted circle Ask has exactly one conversation'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;

select extensions.is(
  (select asker_user_id from api.get_ask_detail('30000000-0000-4000-8000-000000000002')),
  '10000000-0000-4000-8000-000000000002'::uuid,
  'accepted helper sees the previously anonymous Ask author'
);

reset role;
select * from extensions.finish();
rollback;
