-- Entry and Operations vertical slice.
-- All member-facing access is through fixed api functions. Private workflow
-- relations intentionally have no client table grants.

alter table public.invites
  add column request_id uuid,
  add column updated_at timestamptz not null default now();

create unique index invites_request_id_key
  on public.invites (request_id)
  where request_id is not null;

create table private.invite_operation_requests (
  request_id uuid primary key,
  actor_user_id uuid not null references public.users(id) on delete cascade,
  invite_id uuid not null references public.invites(id) on delete cascade,
  operation text not null,
  result_code text not null,
  created_at timestamptz not null default now(),
  constraint invite_operation_requests_operation_check
    check (operation in ('issue', 'resend', 'revoke')),
  constraint invite_operation_requests_result_check
    check (char_length(btrim(result_code)) between 1 and 100)
);

create index invite_operation_requests_actor_idx
  on private.invite_operation_requests (actor_user_id, created_at desc);
create index invite_operation_requests_invite_idx
  on private.invite_operation_requests (invite_id, created_at desc);

create table private.onboarding_drafts (
  organization_membership_id uuid primary key
    references public.organization_memberships(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  question text,
  current_step smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_drafts_question_check
    check (question is null or char_length(btrim(question)) between 1 and 2000),
  constraint onboarding_drafts_step_check check (current_step between 1 and 7)
);

create index onboarding_drafts_user_idx
  on private.onboarding_drafts (user_id, updated_at desc);

create table public.user_communication_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  school_newsletter_email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table private.account_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  request_id uuid not null unique,
  status text not null default 'queued',
  storage_bucket text,
  storage_path text,
  expires_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint account_export_requests_status_check
    check (status in ('queued', 'processing', 'ready', 'failed', 'expired')),
  constraint account_export_requests_storage_pair_check
    check ((storage_bucket is null) = (storage_path is null)),
  constraint account_export_requests_ready_check check (
    (status = 'ready' and storage_bucket is not null and expires_at is not null and completed_at is not null)
    or status <> 'ready'
  ),
  constraint account_export_requests_error_check
    check (last_error is null or char_length(last_error) between 1 and 2000)
);

create unique index account_export_requests_one_active_per_user
  on private.account_export_requests (user_id)
  where status in ('queued', 'processing', 'ready');

create index account_export_requests_user_idx
  on private.account_export_requests (user_id, created_at desc);

create index account_export_requests_status_created_idx
  on private.account_export_requests (status, created_at, id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('account-exports', 'account-exports', false, 52428800, array['application/json'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table private.outbox_jobs
  drop constraint outbox_jobs_type_check;
alter table private.outbox_jobs
  add constraint outbox_jobs_type_check check (job_type in (
    'send_email', 'send_invite_email', 'create_notification',
    'run_ask_matching', 'index_profile', 'generate_account_export',
    'process_account_deletion', 'delete_storage_objects'
  ));

create trigger invites_set_updated_at
  before update on public.invites
  for each row execute function private.set_updated_at();
create trigger onboarding_drafts_set_updated_at
  before update on private.onboarding_drafts
  for each row execute function private.set_updated_at();
create trigger communication_preferences_set_updated_at
  before update on public.user_communication_preferences
  for each row execute function private.set_updated_at();
create trigger account_export_requests_set_updated_at
  before update on private.account_export_requests
  for each row execute function private.set_updated_at();

create function private.owns_entry_membership(p_membership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.users u on u.id = m.user_id
    where m.id = p_membership_id
      and m.user_id = (select auth.uid())
      and m.status in ('pending', 'active')
      and u.account_state = 'active'
  );
$$;

create function private.entry_admin_membership(p_organization_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.organization_memberships m
  join public.users u on u.id = m.user_id
  join public.admin_role_assignments a
    on a.organization_id = m.organization_id
   and a.organization_membership_id = m.id
  where m.organization_id = p_organization_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
    and u.account_state = 'active'
    and a.role in ('super_admin', 'admin')
  order by case a.role when 'super_admin' then 0 else 1 end
  limit 1;
$$;

create function private.get_my_onboarding_draft(p_membership_id uuid)
returns table(result_code text, question text, current_step smallint, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.owns_entry_membership(p_membership_id) then
    return query select 'not_available'::text, null::text, null::smallint, null::timestamptz;
    return;
  end if;

  return query
  select
    case when d.organization_membership_id is null then 'empty' else 'ok' end,
    d.question,
    coalesce(d.current_step, 1::smallint),
    d.updated_at
  from (select 1) seed
  left join private.onboarding_drafts d
    on d.organization_membership_id = p_membership_id;
end;
$$;

create function private.save_my_onboarding_draft(
  p_membership_id uuid,
  p_question text
)
returns table(result_code text, question text, current_step smallint, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question text := btrim(coalesce(p_question, ''));
  v_user_id uuid := (select auth.uid());
  v_saved private.onboarding_drafts%rowtype;
begin
  if not private.owns_entry_membership(p_membership_id) then
    return query select 'not_available'::text, null::text, null::smallint, null::timestamptz;
    return;
  end if;
  if char_length(v_question) not between 1 and 2000 then
    return query select 'invalid_input'::text, null::text, null::smallint, null::timestamptz;
    return;
  end if;

  insert into private.onboarding_drafts (
    organization_membership_id, user_id, question
  ) values (
    p_membership_id, v_user_id, v_question
  )
  on conflict (organization_membership_id) do update
    set question = excluded.question,
        user_id = excluded.user_id
  returning * into v_saved;

  return query select 'saved'::text, v_saved.question, v_saved.current_step, v_saved.updated_at;
end;
$$;

create function private.save_my_onboarding_progress(p_membership_id uuid, p_step smallint)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.owns_entry_membership(p_membership_id) then return 'not_available'; end if;
  if p_step not between 1 and 7 then return 'invalid_input'; end if;
  insert into private.onboarding_drafts (
    organization_membership_id, user_id, current_step
  ) values (
    p_membership_id, (select auth.uid()), p_step
  )
  on conflict (organization_membership_id) do update
    set current_step = greatest(private.onboarding_drafts.current_step, excluded.current_step),
        user_id = excluded.user_id;
  return 'saved';
end;
$$;

create function private.clear_my_onboarding_draft(p_membership_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.owns_entry_membership(p_membership_id) then
    return 'not_available';
  end if;
  delete from private.onboarding_drafts
  where organization_membership_id = p_membership_id
    and user_id = (select auth.uid());
  return 'cleared';
end;
$$;

create function private.get_my_notification_preferences()
returns table(
  notification_type text,
  in_app_enabled boolean,
  email_enabled boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select np.notification_type, np.in_app_enabled, np.email_enabled, np.updated_at
  from public.notification_preferences np
  where np.user_id = (select auth.uid())
  order by np.notification_type;
$$;

create function private.save_my_notification_preference(
  p_notification_type text,
  p_in_app_enabled boolean,
  p_email_enabled boolean
)
returns table(
  result_code text,
  notification_type text,
  in_app_enabled boolean,
  email_enabled boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saved public.notification_preferences%rowtype;
begin
  if (select auth.uid()) is null
     or not exists (
       select 1 from public.users u
       where u.id = (select auth.uid()) and u.account_state = 'active'
     ) then
    return query select 'not_available'::text, null::text, null::boolean,
      null::boolean, null::timestamptz;
    return;
  end if;

  begin
    insert into public.notification_preferences (
      user_id, notification_type, in_app_enabled, email_enabled
    ) values (
      (select auth.uid()), p_notification_type, p_in_app_enabled, p_email_enabled
    )
    on conflict on constraint notification_preferences_pkey do update
      set in_app_enabled = excluded.in_app_enabled,
          email_enabled = excluded.email_enabled,
          updated_at = now()
    returning * into v_saved;
  exception when check_violation then
    return query select 'invalid_type'::text, null::text, null::boolean,
      null::boolean, null::timestamptz;
    return;
  end;

  return query select 'saved'::text, v_saved.notification_type,
    v_saved.in_app_enabled, v_saved.email_enabled, v_saved.updated_at;
end;
$$;

create function private.get_my_communication_preferences()
returns table(school_newsletter_email_enabled boolean, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then return; end if;
  insert into public.user_communication_preferences (user_id)
  values ((select auth.uid()))
  on conflict (user_id) do nothing;

  return query
  select p.school_newsletter_email_enabled, p.updated_at
  from public.user_communication_preferences p
  where p.user_id = (select auth.uid());
end;
$$;

create function private.save_my_communication_preferences(
  p_school_newsletter_email_enabled boolean
)
returns table(
  result_code text,
  school_newsletter_email_enabled boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saved public.user_communication_preferences%rowtype;
begin
  if (select auth.uid()) is null
     or not exists (
       select 1 from public.users u
       where u.id = (select auth.uid()) and u.account_state = 'active'
     ) then
    return query select 'not_available'::text, null::boolean, null::timestamptz;
    return;
  end if;

  insert into public.user_communication_preferences (
    user_id, school_newsletter_email_enabled
  ) values (
    (select auth.uid()), p_school_newsletter_email_enabled
  )
  on conflict (user_id) do update
    set school_newsletter_email_enabled = excluded.school_newsletter_email_enabled,
        updated_at = now()
  returning * into v_saved;

  return query select 'saved'::text,
    v_saved.school_newsletter_email_enabled, v_saved.updated_at;
end;
$$;

create function private.list_my_blocked_members()
returns table(
  blocked_user_id uuid,
  display_name text,
  avatar_path text,
  blocked_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.blocked_user_id,
         coalesce(p.display_name, 'Former member'),
         p.avatar_path,
         b.created_at
  from public.member_blocks b
  left join public.profiles p on p.user_id = b.blocked_user_id
  where b.blocker_user_id = (select auth.uid())
  order by b.created_at desc, b.blocked_user_id;
$$;

create function private.issue_invite(
  p_organization_id uuid,
  p_email text,
  p_full_name text,
  p_graduation_year smallint,
  p_request_id uuid
)
returns table(
  result_code text,
  invite_id uuid,
  invite_status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_admin_membership_id uuid;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_full_name text := nullif(btrim(coalesce(p_full_name, '')), '');
  v_graduation_year smallint := nullif(p_graduation_year, 0);
  v_token text;
  v_invite public.invites%rowtype;
begin
  v_admin_membership_id := private.entry_admin_membership(p_organization_id);
  if v_admin_membership_id is null then
    return query select 'not_available'::text, null::uuid, null::text, null::timestamptz;
    return;
  end if;
  if p_request_id is null
     or char_length(v_email) not between 3 and 320
     or position('@' in v_email) < 2
     or (v_full_name is not null and char_length(v_full_name) > 200)
     or (v_graduation_year is not null and v_graduation_year not between 1900 and 2100) then
    return query select 'invalid_input'::text, null::uuid, null::text, null::timestamptz;
    return;
  end if;

  select i.* into v_invite
  from private.invite_operation_requests r
  join public.invites i on i.id = r.invite_id
  where r.request_id = p_request_id
    and r.actor_user_id = v_actor_user_id
    and r.operation = 'issue';
  if found then
    return query select 'issued'::text, v_invite.id, v_invite.status, v_invite.expires_at;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':' || v_email, 0));

  update public.invites i
  set status = 'expired'
  where i.organization_id = p_organization_id
    and i.email_normalized = v_email
    and i.status = 'pending'
    and i.expires_at <= now();

  select * into v_invite
  from public.invites i
  where i.organization_id = p_organization_id
    and i.email_normalized = v_email
    and i.status = 'pending'
  for update;

  if found then
    insert into private.invite_operation_requests (
      request_id, actor_user_id, invite_id, operation, result_code
    ) values (
      p_request_id, v_actor_user_id, v_invite.id, 'issue', 'already_pending'
    );
    return query select 'already_pending'::text, v_invite.id,
      v_invite.status, v_invite.expires_at;
    return;
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.invites (
    organization_id, email, email_normalized, token_hash, status,
    full_name, graduation_year, sent_by_membership_id, expires_at, request_id
  ) values (
    p_organization_id, v_email, v_email, extensions.digest(v_token, 'sha256'), 'pending',
    v_full_name, v_graduation_year, v_admin_membership_id,
    now() + interval '14 days', p_request_id
  ) returning * into v_invite;

  insert into private.invite_operation_requests (
    request_id, actor_user_id, invite_id, operation, result_code
  ) values (
    p_request_id, v_actor_user_id, v_invite.id, 'issue', 'issued'
  );

  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id,
    payload
  ) values (
    v_actor_user_id, p_organization_id, 'invite.issued', 'invite',
    v_invite.id::text,
    jsonb_build_object('requestId', p_request_id)
  );

  perform private.enqueue_outbox(
    'send_invite_email',
    jsonb_build_object(
      'inviteId', v_invite.id,
      'organizationId', p_organization_id,
      'recipientEmail', v_email,
      'token', v_token,
      'template', 'member_invite'
    ),
    'invite:issue:' || p_request_id::text
  );

  return query select 'issued'::text, v_invite.id,
    v_invite.status, v_invite.expires_at;
end;
$$;

create function private.list_invites(
  p_organization_id uuid,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 50
)
returns table(
  invite_id uuid,
  email text,
  full_name text,
  graduation_year smallint,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.entry_admin_membership(p_organization_id) is null then return; end if;

  return query
  select i.id, i.email, i.full_name, i.graduation_year,
         case when i.status = 'pending' and i.expires_at <= now()
           then 'expired' else i.status end,
         i.expires_at, i.created_at
  from public.invites i
  where i.organization_id = p_organization_id
    and (
      p_before_created_at is null
      or (i.created_at, i.id) < (p_before_created_at, p_before_id)
    )
  order by i.created_at desc, i.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

create function private.resend_invite(p_invite_id uuid, p_request_id uuid)
returns table(result_code text, invite_id uuid, invite_status text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_invite public.invites%rowtype;
  v_token text;
begin
  select i.* into v_invite
  from public.invites i
  where i.id = p_invite_id
  for update;
  if not found or private.entry_admin_membership(v_invite.organization_id) is null then
    return query select 'not_available'::text, null::uuid, null::text, null::timestamptz;
    return;
  end if;
  if p_request_id is null then
    return query select 'invalid_input'::text, v_invite.id, v_invite.status, v_invite.expires_at;
    return;
  end if;
  if exists (
    select 1 from private.invite_operation_requests r
    where r.request_id = p_request_id
      and r.actor_user_id = v_actor_user_id
      and r.invite_id = v_invite.id
      and r.operation = 'resend'
  ) then
    return query select 'resent'::text, v_invite.id, v_invite.status, v_invite.expires_at;
    return;
  end if;
  if v_invite.status <> 'pending' then
    return query select v_invite.status, v_invite.id, v_invite.status, v_invite.expires_at;
    return;
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  update public.invites
  set token_hash = extensions.digest(v_token, 'sha256'),
      expires_at = now() + interval '14 days'
  where id = v_invite.id
  returning * into v_invite;

  insert into private.invite_operation_requests (
    request_id, actor_user_id, invite_id, operation, result_code
  ) values (p_request_id, v_actor_user_id, v_invite.id, 'resend', 'resent');
  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_actor_user_id, v_invite.organization_id, 'invite.resent', 'invite',
    v_invite.id::text, jsonb_build_object('requestId', p_request_id)
  );
  perform private.enqueue_outbox(
    'send_invite_email',
    jsonb_build_object(
      'inviteId', v_invite.id,
      'organizationId', v_invite.organization_id,
      'recipientEmail', v_invite.email,
      'token', v_token,
      'template', 'member_invite'
    ),
    'invite:resend:' || p_request_id::text
  );

  return query select 'resent'::text, v_invite.id, v_invite.status, v_invite.expires_at;
end;
$$;

create function private.revoke_invite(p_invite_id uuid, p_request_id uuid)
returns table(result_code text, invite_id uuid, invite_status text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_invite public.invites%rowtype;
begin
  select i.* into v_invite
  from public.invites i
  where i.id = p_invite_id
  for update;
  if not found or private.entry_admin_membership(v_invite.organization_id) is null then
    return query select 'not_available'::text, null::uuid, null::text, null::timestamptz;
    return;
  end if;
  if p_request_id is null then
    return query select 'invalid_input'::text, v_invite.id, v_invite.status, v_invite.expires_at;
    return;
  end if;
  if exists (
    select 1 from private.invite_operation_requests r
    where r.request_id = p_request_id
      and r.actor_user_id = v_actor_user_id
      and r.invite_id = v_invite.id
      and r.operation = 'revoke'
  ) then
    return query select 'revoked'::text, v_invite.id, 'revoked'::text, v_invite.expires_at;
    return;
  end if;
  if v_invite.status = 'revoked' then
    return query select 'revoked'::text, v_invite.id, v_invite.status, v_invite.expires_at;
    return;
  end if;
  if v_invite.status <> 'pending' then
    return query select v_invite.status, v_invite.id, v_invite.status, v_invite.expires_at;
    return;
  end if;

  update public.invites set status = 'revoked'
  where id = v_invite.id returning * into v_invite;
  insert into private.invite_operation_requests (
    request_id, actor_user_id, invite_id, operation, result_code
  ) values (p_request_id, v_actor_user_id, v_invite.id, 'revoke', 'revoked');
  insert into private.audit_log (
    actor_user_id, organization_id, action, target_type, target_id, payload
  ) values (
    v_actor_user_id, v_invite.organization_id, 'invite.revoked', 'invite',
    v_invite.id::text, jsonb_build_object('requestId', p_request_id)
  );

  return query select 'revoked'::text, v_invite.id, v_invite.status, v_invite.expires_at;
end;
$$;

create function private.list_pending_memberships(
  p_organization_id uuid,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 50
)
returns table(
  membership_id uuid,
  user_id uuid,
  display_name text,
  avatar_path text,
  graduation_year smallint,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.entry_admin_membership(p_organization_id) is null then return; end if;

  return query
  select m.id, m.user_id, p.display_name, p.avatar_path,
         op.graduation_year, m.created_at
  from public.organization_memberships m
  join public.users u on u.id = m.user_id and u.account_state = 'active'
  left join public.profiles p on p.user_id = m.user_id
  left join public.organization_profiles op
    on op.organization_membership_id = m.id
  where m.organization_id = p_organization_id
    and m.status = 'pending'
    and (
      p_before_created_at is null
      or (m.created_at, m.id) < (p_before_created_at, p_before_id)
    )
  order by m.created_at desc, m.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

create function private.schedule_my_account_deletion()
returns table(result_code text, delete_scheduled_for timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.users%rowtype;
begin
  select * into v_user from public.users
  where id = (select auth.uid()) for update;
  if not found or v_user.account_state = 'deleted' then
    return query select 'not_available'::text, null::timestamptz;
    return;
  end if;
  if v_user.account_state = 'deletion_scheduled' then
    return query select 'scheduled'::text, v_user.delete_scheduled_for;
    return;
  end if;

  update public.users
  set account_state = 'deletion_scheduled',
      delete_scheduled_for = now() + interval '7 days',
      delete_reason = 'member_requested',
      delete_initiated_by_admin = false
  where id = v_user.id
  returning * into v_user;

  insert into private.audit_log (
    actor_user_id, action, target_type, target_id,
    payload
  ) values (
    v_user.id, 'account.deletion_scheduled', 'user', v_user.id::text,
    jsonb_build_object('deleteScheduledFor', v_user.delete_scheduled_for)
  );
  perform private.enqueue_outbox(
    'process_account_deletion',
    jsonb_build_object('userId', v_user.id),
    'account_deletion:' || v_user.id::text
  );

  return query select 'scheduled'::text, v_user.delete_scheduled_for;
end;
$$;

create function private.cancel_my_account_deletion()
returns table(result_code text, account_state text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.users%rowtype;
begin
  select * into v_user from public.users
  where id = (select auth.uid()) for update;
  if not found or v_user.account_state = 'deleted' then
    return query select 'not_available'::text, null::text;
    return;
  end if;
  if v_user.account_state = 'active' then
    return query select 'active'::text, 'active'::text;
    return;
  end if;
  if v_user.delete_scheduled_for <= now() then
    return query select 'too_late'::text, v_user.account_state;
    return;
  end if;

  update public.users
  set account_state = 'active', delete_scheduled_for = null,
      delete_reason = null, delete_initiated_by_admin = false
  where id = v_user.id
  returning * into v_user;

  insert into private.audit_log (
    actor_user_id, action, target_type, target_id
  ) values (
    v_user.id, 'account.deletion_cancelled', 'user', v_user.id::text
  );
  return query select 'cancelled'::text, v_user.account_state;
end;
$$;

create function private.request_my_account_export(p_request_id uuid)
returns table(
  result_code text,
  export_request_id uuid,
  status text,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_request private.account_export_requests%rowtype;
begin
  if p_request_id is null
     or not exists (
       select 1 from public.users u
       where u.id = v_user_id and u.account_state = 'active'
     ) then
    return query select 'not_available'::text, null::uuid, null::text,
      null::timestamptz, null::timestamptz;
    return;
  end if;

  select * into v_request
  from private.account_export_requests r
  where r.request_id = p_request_id and r.user_id = v_user_id;
  if found then
    return query select 'current'::text, v_request.id, v_request.status,
      v_request.created_at, v_request.expires_at;
    return;
  end if;

  update private.account_export_requests r
  set status = 'expired'
  where r.user_id = v_user_id
    and r.status = 'ready'
    and r.expires_at <= now();

  select * into v_request
  from private.account_export_requests r
  where r.user_id = v_user_id
    and r.status in ('queued', 'processing', 'ready')
  order by r.created_at desc
  limit 1
  for update;
  if found then
    return query select 'current'::text, v_request.id, v_request.status,
      v_request.created_at, v_request.expires_at;
    return;
  end if;

  insert into private.account_export_requests (user_id, request_id)
  values (v_user_id, p_request_id)
  returning * into v_request;
  perform private.enqueue_outbox(
    'generate_account_export',
    jsonb_build_object('userId', v_user_id, 'exportRequestId', v_request.id),
    'account_export:' || v_request.id::text
  );
  insert into private.audit_log (
    actor_user_id, action, target_type, target_id
  ) values (
    v_user_id, 'account.export_requested', 'account_export', v_request.id::text
  );

  return query select 'queued'::text, v_request.id, v_request.status,
    v_request.created_at, v_request.expires_at;
end;
$$;

create function private.get_my_account_export()
returns table(
  export_request_id uuid,
  status text,
  created_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         case when r.status = 'ready' and r.expires_at <= now()
           then 'expired' else r.status end,
         r.created_at, r.completed_at, r.expires_at
  from private.account_export_requests r
  where r.user_id = (select auth.uid())
  order by r.created_at desc
  limit 1;
$$;

create function private.complete_account_export(
  p_export_request_id uuid,
  p_storage_bucket text,
  p_storage_path text,
  p_expires_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(btrim(p_storage_bucket), '') = ''
     or coalesce(btrim(p_storage_path), '') = ''
     or p_expires_at <= now() then
    return 'invalid_input';
  end if;
  update private.account_export_requests
  set status = 'ready', storage_bucket = p_storage_bucket,
      storage_path = p_storage_path, expires_at = p_expires_at,
      completed_at = now(), last_error = null
  where id = p_export_request_id and status in ('queued', 'processing');
  if not found then return 'not_available'; end if;
  return 'ready';
end;
$$;

create function private.get_my_account_export_download()
returns table(storage_bucket text, storage_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.storage_bucket, r.storage_path
  from private.account_export_requests r
  where r.user_id = (select auth.uid())
    and r.status = 'ready'
    and r.expires_at > now()
    and r.storage_bucket is not null
    and r.storage_path is not null
  order by r.created_at desc
  limit 1;
$$;

create function private.list_my_notifications(
  p_before_created_at timestamptz default null,
  p_before_id bigint default null,
  p_limit integer default 30,
  p_unread_only boolean default false
)
returns table(
  id bigint,
  type text,
  target_type text,
  target_id text,
  organization_id uuid,
  actor_user_id uuid,
  read_at timestamptz,
  created_at timestamptz,
  payload jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.type, n.target_type, n.target_id, n.organization_id,
         n.actor_user_id, n.read_at, n.created_at, n.payload
  from public.notifications n
  where n.recipient_user_id = (select auth.uid())
    and (not coalesce(p_unread_only, false) or n.read_at is null)
    and (
      p_before_created_at is null
      or (n.created_at, n.id) < (p_before_created_at, p_before_id)
    )
  order by n.created_at desc, n.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

create function private.mark_notifications_read_before(p_before timestamptz)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  if p_before is null then return 0; end if;
  update public.notifications
  set read_at = coalesce(read_at, now())
  where recipient_user_id = (select auth.uid())
    and read_at is null
    and created_at <= p_before;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function private.cleanup_entry_operations_after_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.account_state is distinct from 'deleted' and new.account_state = 'deleted' then
    delete from public.user_communication_preferences where user_id = new.id;
    delete from private.onboarding_drafts where user_id = new.id;
    delete from private.account_export_requests where user_id = new.id;
    delete from private.invite_operation_requests where actor_user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger users_cleanup_entry_operations
  after update of account_state on public.users
  for each row execute function private.cleanup_entry_operations_after_user_deleted();

-- Fixed public API wrappers. Privileged bodies remain in the unexposed private
-- schema; wrappers are invoker functions and receive only explicit grants.

create function api.get_my_onboarding_draft(p_membership_id uuid)
returns table(result_code text, question text, current_step smallint, updated_at timestamptz)
language sql set search_path = ''
as $$ select * from private.get_my_onboarding_draft(p_membership_id); $$;

create function api.save_my_onboarding_draft(p_membership_id uuid, p_question text)
returns table(result_code text, question text, current_step smallint, updated_at timestamptz)
language sql set search_path = ''
as $$ select * from private.save_my_onboarding_draft(p_membership_id, p_question); $$;

create function api.clear_my_onboarding_draft(p_membership_id uuid)
returns text language sql set search_path = ''
as $$ select private.clear_my_onboarding_draft(p_membership_id); $$;

create function api.save_my_onboarding_progress(p_membership_id uuid, p_step smallint)
returns text language sql set search_path = ''
as $$ select private.save_my_onboarding_progress(p_membership_id, p_step); $$;

create function api.issue_invite(
  p_organization_id uuid,
  p_email text,
  p_full_name text,
  p_graduation_year smallint,
  p_request_id uuid
)
returns table(result_code text, invite_id uuid, invite_status text, expires_at timestamptz)
language sql set search_path = ''
as $$
  select * from private.issue_invite(
    p_organization_id, p_email, p_full_name, p_graduation_year, p_request_id
  );
$$;

create function api.list_invites(
  p_organization_id uuid,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 50
)
returns table(
  invite_id uuid, email text, full_name text, graduation_year smallint,
  status text, expires_at timestamptz, created_at timestamptz
)
language sql set search_path = ''
as $$
  select * from private.list_invites(
    p_organization_id, p_before_created_at, p_before_id, p_limit
  );
$$;

create function api.resend_invite(p_invite_id uuid, p_request_id uuid)
returns table(result_code text, invite_id uuid, invite_status text, expires_at timestamptz)
language sql set search_path = ''
as $$ select * from private.resend_invite(p_invite_id, p_request_id); $$;

create function api.revoke_invite(p_invite_id uuid, p_request_id uuid)
returns table(result_code text, invite_id uuid, invite_status text, expires_at timestamptz)
language sql set search_path = ''
as $$ select * from private.revoke_invite(p_invite_id, p_request_id); $$;

create function api.list_pending_memberships(
  p_organization_id uuid,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 50
)
returns table(
  membership_id uuid, user_id uuid, display_name text, avatar_path text,
  graduation_year smallint, requested_at timestamptz
)
language sql set search_path = ''
as $$
  select * from private.list_pending_memberships(
    p_organization_id, p_before_created_at, p_before_id, p_limit
  );
$$;

create function api.get_my_notification_preferences()
returns table(
  notification_type text, in_app_enabled boolean, email_enabled boolean,
  updated_at timestamptz
)
language sql set search_path = ''
as $$ select * from private.get_my_notification_preferences(); $$;

create function api.save_my_notification_preference(
  p_notification_type text,
  p_in_app_enabled boolean,
  p_email_enabled boolean
)
returns table(
  result_code text, notification_type text, in_app_enabled boolean,
  email_enabled boolean, updated_at timestamptz
)
language sql set search_path = ''
as $$
  select * from private.save_my_notification_preference(
    p_notification_type, p_in_app_enabled, p_email_enabled
  );
$$;

create function api.get_my_communication_preferences()
returns table(school_newsletter_email_enabled boolean, updated_at timestamptz)
language sql set search_path = ''
as $$ select * from private.get_my_communication_preferences(); $$;

create function api.save_my_communication_preferences(
  p_school_newsletter_email_enabled boolean
)
returns table(
  result_code text, school_newsletter_email_enabled boolean,
  updated_at timestamptz
)
language sql set search_path = ''
as $$
  select * from private.save_my_communication_preferences(
    p_school_newsletter_email_enabled
  );
$$;

create function api.list_my_blocked_members()
returns table(
  blocked_user_id uuid, display_name text, avatar_path text,
  blocked_at timestamptz
)
language sql set search_path = ''
as $$ select * from private.list_my_blocked_members(); $$;

create function api.schedule_my_account_deletion()
returns table(result_code text, delete_scheduled_for timestamptz)
language sql set search_path = ''
as $$ select * from private.schedule_my_account_deletion(); $$;

create function api.cancel_my_account_deletion()
returns table(result_code text, account_state text)
language sql set search_path = ''
as $$ select * from private.cancel_my_account_deletion(); $$;

create function api.request_my_account_export(p_request_id uuid)
returns table(
  result_code text, export_request_id uuid, status text,
  created_at timestamptz, expires_at timestamptz
)
language sql set search_path = ''
as $$ select * from private.request_my_account_export(p_request_id); $$;

create function api.get_my_account_export()
returns table(
  export_request_id uuid, status text, created_at timestamptz,
  completed_at timestamptz, expires_at timestamptz
)
language sql set search_path = ''
as $$ select * from private.get_my_account_export(); $$;

create function api.complete_account_export(
  p_export_request_id uuid,
  p_storage_bucket text,
  p_storage_path text,
  p_expires_at timestamptz
)
returns text language sql set search_path = ''
as $$
  select private.complete_account_export(
    p_export_request_id, p_storage_bucket, p_storage_path, p_expires_at
  );
$$;

create function api.get_my_account_export_download()
returns table(storage_bucket text, storage_path text)
language sql set search_path = ''
as $$ select * from private.get_my_account_export_download(); $$;

create function api.list_my_notifications(
  p_before_created_at timestamptz default null,
  p_before_id bigint default null,
  p_limit integer default 30,
  p_unread_only boolean default false
)
returns table(
  id bigint, type text, target_type text, target_id text,
  organization_id uuid, actor_user_id uuid, read_at timestamptz,
  created_at timestamptz, payload jsonb
)
language sql set search_path = ''
as $$
  select * from private.list_my_notifications(
    p_before_created_at, p_before_id, p_limit, p_unread_only
  );
$$;

create function api.mark_notifications_read_before(p_before timestamptz)
returns integer language sql set search_path = ''
as $$ select private.mark_notifications_read_before(p_before); $$;

-- RLS and grants.

alter table public.user_communication_preferences enable row level security;
alter table private.invite_operation_requests enable row level security;
alter table private.onboarding_drafts enable row level security;
alter table private.account_export_requests enable row level security;

create policy communication_preferences_select_owner
  on public.user_communication_preferences
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.user_communication_preferences
  from public, anon, authenticated;
revoke all on table private.invite_operation_requests,
  private.onboarding_drafts, private.account_export_requests
  from public, anon, authenticated;

revoke all on function private.owns_entry_membership(uuid),
  private.entry_admin_membership(uuid),
  private.get_my_onboarding_draft(uuid),
  private.save_my_onboarding_draft(uuid, text),
  private.clear_my_onboarding_draft(uuid),
  private.save_my_onboarding_progress(uuid, smallint),
  private.issue_invite(uuid, text, text, smallint, uuid),
  private.list_invites(uuid, timestamptz, uuid, integer),
  private.resend_invite(uuid, uuid),
  private.revoke_invite(uuid, uuid),
  private.list_pending_memberships(uuid, timestamptz, uuid, integer),
  private.get_my_notification_preferences(),
  private.save_my_notification_preference(text, boolean, boolean),
  private.get_my_communication_preferences(),
  private.save_my_communication_preferences(boolean),
  private.list_my_blocked_members(),
  private.schedule_my_account_deletion(),
  private.cancel_my_account_deletion(),
  private.request_my_account_export(uuid),
  private.get_my_account_export(),
  private.get_my_account_export_download(),
  private.complete_account_export(uuid, text, text, timestamptz),
  private.list_my_notifications(timestamptz, bigint, integer, boolean),
  private.mark_notifications_read_before(timestamptz),
  private.cleanup_entry_operations_after_user_deleted()
  from public, anon, authenticated;

revoke all on function api.get_my_onboarding_draft(uuid),
  api.save_my_onboarding_draft(uuid, text),
  api.clear_my_onboarding_draft(uuid),
  api.save_my_onboarding_progress(uuid, smallint),
  api.issue_invite(uuid, text, text, smallint, uuid),
  api.list_invites(uuid, timestamptz, uuid, integer),
  api.resend_invite(uuid, uuid),
  api.revoke_invite(uuid, uuid),
  api.list_pending_memberships(uuid, timestamptz, uuid, integer),
  api.get_my_notification_preferences(),
  api.save_my_notification_preference(text, boolean, boolean),
  api.get_my_communication_preferences(),
  api.save_my_communication_preferences(boolean),
  api.list_my_blocked_members(),
  api.schedule_my_account_deletion(),
  api.cancel_my_account_deletion(),
  api.request_my_account_export(uuid),
  api.get_my_account_export(),
  api.get_my_account_export_download(),
  api.complete_account_export(uuid, text, text, timestamptz),
  api.list_my_notifications(timestamptz, bigint, integer, boolean),
  api.mark_notifications_read_before(timestamptz)
  from public, anon, authenticated;

grant execute on function private.get_my_onboarding_draft(uuid),
  private.save_my_onboarding_draft(uuid, text),
  private.clear_my_onboarding_draft(uuid),
  private.save_my_onboarding_progress(uuid, smallint),
  private.issue_invite(uuid, text, text, smallint, uuid),
  private.list_invites(uuid, timestamptz, uuid, integer),
  private.resend_invite(uuid, uuid),
  private.revoke_invite(uuid, uuid),
  private.list_pending_memberships(uuid, timestamptz, uuid, integer),
  private.get_my_notification_preferences(),
  private.save_my_notification_preference(text, boolean, boolean),
  private.get_my_communication_preferences(),
  private.save_my_communication_preferences(boolean),
  private.list_my_blocked_members(),
  private.schedule_my_account_deletion(),
  private.cancel_my_account_deletion(),
  private.request_my_account_export(uuid),
  private.get_my_account_export(),
  private.get_my_account_export_download(),
  private.list_my_notifications(timestamptz, bigint, integer, boolean),
  private.mark_notifications_read_before(timestamptz)
  to authenticated;

grant execute on function api.get_my_onboarding_draft(uuid),
  api.save_my_onboarding_draft(uuid, text),
  api.clear_my_onboarding_draft(uuid),
  api.save_my_onboarding_progress(uuid, smallint),
  api.issue_invite(uuid, text, text, smallint, uuid),
  api.list_invites(uuid, timestamptz, uuid, integer),
  api.resend_invite(uuid, uuid),
  api.revoke_invite(uuid, uuid),
  api.list_pending_memberships(uuid, timestamptz, uuid, integer),
  api.get_my_notification_preferences(),
  api.save_my_notification_preference(text, boolean, boolean),
  api.get_my_communication_preferences(),
  api.save_my_communication_preferences(boolean),
  api.list_my_blocked_members(),
  api.schedule_my_account_deletion(),
  api.cancel_my_account_deletion(),
  api.request_my_account_export(uuid),
  api.get_my_account_export(),
  api.get_my_account_export_download(),
  api.list_my_notifications(timestamptz, bigint, integer, boolean),
  api.mark_notifications_read_before(timestamptz)
  to authenticated;

grant execute on function private.complete_account_export(uuid, text, text, timestamptz),
  api.complete_account_export(uuid, text, text, timestamptz)
  to service_role;
