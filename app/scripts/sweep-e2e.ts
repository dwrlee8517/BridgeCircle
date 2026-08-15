// Janitor for leaked e2e data — the out-of-band backstop for the deployed-stage
// Playwright runs (cd.yml `integ` job) against hosted dev.
//
// The suites tear their data down in-process (FoundationScenario.destroy()),
// but a crashed, timed-out, or cancelled run never reaches that code, and its
// `foundation-*` organizations and users strand forever. This sweep deletes
// everything wearing the e2e prefixes, no matter how the run that created it
// died. It runs `if: always()` after the integ job, and manually whenever.
//
// It works through psql (runPsql), NOT the PostgREST admin client, on purpose:
// several restrict-FK blockers live in the `private` schema (ask_events,
// ask_matches, membership_rejection_details), which PostgREST cannot reach —
// exactly why in-process org deletes have been failing silently.
//
// Known, accepted residue: audit rows with `on delete set null` survive as
// anonymous noise, and public.users tombstones pseudonymized by *past*
// auth-only deletions are indistinguishable from real deleted-member
// tombstones — both are inert and left alone.
//
// Usage, from app/ (local stack needs no flags):
//   E2E_SWEEP_ALLOW_DEV=1 doppler run -p bridgecircle -c dev -- pnpm sweep:e2e
import { runPsql } from '../src/lib/cutover/remote-database'
import { DEV_PROJECT_REF } from '../src/lib/cutover/remote-target'

const ORG_SLUG_PREFIX = 'foundation-'
const EMAIL_PREFIXES = ['foundation+', 'foundation-admin+', 'foundation-member+'] as const
const PROTECTED_SLUGS = ['chadwick-local', 'chadwick-international-local', 'demo', 'eval'] as const

function databaseUrl(): string {
  const url = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  if (/prod/i.test(url)) {
    throw new Error('Refusing a database URL containing a production identifier')
  }
  const isLocal = /127\.0\.0\.1|localhost/.test(url)
  if (!isLocal) {
    if (process.env.E2E_SWEEP_ALLOW_DEV !== '1') {
      throw new Error('Non-local target requires E2E_SWEEP_ALLOW_DEV=1')
    }
    if (!url.includes(DEV_PROJECT_REF)) {
      throw new Error('Non-local sweeps may target only the dev project')
    }
    return url
  }
  // runPsql defaults PGSSLMODE to require (it was built for remote targets);
  // the local stack does not speak SSL.
  return url.includes('sslmode=') ? url : `${url}${url.includes('?') ? '&' : '?'}sslmode=prefer`
}

function emailPredicate(alias: string): string {
  return EMAIL_PREFIXES.map((prefix) => `${alias}.email like '${prefix}%'`).join(' or ')
}

function counts(url: string): { orgs: number; users: number } {
  const output = runPsql(
    url,
    `select
       (select count(*) from public.organizations where slug like '${ORG_SLUG_PREFIX}%'),
       (select count(*) from auth.users u where ${emailPredicate('u')});\n`,
  )
  const [orgs, users] = output.trim().split('|').map((value) => Number.parseInt(value, 10))
  if (!Number.isSafeInteger(orgs) || !Number.isSafeInteger(users)) {
    throw new Error(`Could not read residue counts from: ${output}`)
  }
  return { orgs, users }
}

function run(): void {
  const url = databaseUrl()
  const before = counts(url)
  console.log(`sweep-e2e: found orgs=${before.orgs} users=${before.users} wearing e2e prefixes`)
  if (before.orgs === 0 && before.users === 0) {
    console.log('sweep-e2e: nothing to sweep')
    return
  }

  // One transaction, dependency-ordered (children before parents; the
  // restrict-FK map is enumerated from pg_constraint against organizations
  // and users). public.users is deleted BEFORE auth.users so the
  // on_auth_user_deleted pseudonymize trigger no-ops instead of minting a
  // fresh tombstone. Any table this list misses fails the transaction loudly
  // with the blocker's name — never a silent partial sweep.
  runPsql(
    url,
    `begin;

create temporary table doomed_org on commit drop as
  select id from public.organizations where slug like '${ORG_SLUG_PREFIX}%';

do $guard$
begin
  if exists (
    select 1 from public.organizations o
    join doomed_org d on d.id = o.id
    where o.slug in (${PROTECTED_SLUGS.map((slug) => `'${slug}'`).join(', ')})
  ) then
    raise exception 'sweep-e2e: refusing — a protected organization matched the doomed set';
  end if;
end
$guard$;

create temporary table doomed_user on commit drop as
  select id from auth.users u where ${emailPredicate('u')};

delete from public.ask_offers where organization_id in (select id from doomed_org);
delete from private.ask_matches where organization_id in (select id from doomed_org);
delete from private.ask_events where organization_id in (select id from doomed_org);
delete from public.asks where organization_id in (select id from doomed_org);
delete from public.announcement_reads where organization_id in (select id from doomed_org);
delete from public.announcements where organization_id in (select id from doomed_org);
delete from public.event_rsvps where organization_id in (select id from doomed_org);
delete from public.event_schedule_items where organization_id in (select id from doomed_org);
delete from public.event_facts where organization_id in (select id from doomed_org);
delete from public.events where organization_id in (select id from doomed_org);
delete from public.newsletter_sections where organization_id in (select id from doomed_org);
delete from public.newsletter_issues where organization_id in (select id from doomed_org);
delete from public.invites where organization_id in (select id from doomed_org);
delete from public.admin_role_assignments where organization_id in (select id from doomed_org);
delete from public.helper_topics where organization_id in (select id from doomed_org);
delete from public.helper_preferences where organization_id in (select id from doomed_org);
delete from private.membership_rejection_details where organization_id in (select id from doomed_org);
delete from public.profile_contact_links where organization_id in (select id from doomed_org);
delete from public.profile_field_visibility where organization_id in (select id from doomed_org);
delete from public.organization_profiles where organization_id in (select id from doomed_org);
delete from public.organization_memberships where organization_id in (select id from doomed_org);

delete from public.conversations
  where user_a_id in (select id from doomed_user)
     or user_b_id in (select id from doomed_user);
delete from public.connections
  where user_a_id in (select id from doomed_user)
     or user_b_id in (select id from doomed_user);
delete from public.connection_requests
  where requester_user_id in (select id from doomed_user)
     or recipient_user_id in (select id from doomed_user);
delete from public.member_blocks
  where blocker_user_id in (select id from doomed_user)
     or blocked_user_id in (select id from doomed_user);

delete from public.users where id in (select id from doomed_user);
delete from public.organizations where id in (select id from doomed_org);
delete from auth.users where id in (select id from doomed_user);

commit;\n`,
  )

  const after = counts(url)
  if (after.orgs !== 0 || after.users !== 0) {
    throw new Error(`Residue survived the sweep: orgs=${after.orgs} users=${after.users}`)
  }
  console.log(`sweep-e2e: removed orgs=${before.orgs} users=${before.users}; residue is zero`)
}

try {
  run()
} catch (error) {
  console.error(`sweep-e2e failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
