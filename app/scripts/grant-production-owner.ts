import {
  databaseUrlFromEnvironment,
  git,
  runPsql,
} from '../src/lib/cutover/remote-database'
import {
  PROD_PROJECT_REF,
  validateExactGitState,
  validateRemoteTarget,
} from '../src/lib/cutover/remote-target'

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function run(): void {
  const databaseUrl = databaseUrlFromEnvironment()
  const headSha = git(['rev-parse', 'HEAD'])
  const branch = git(['branch', '--show-current'])
  validateRemoteTarget({
    target: 'production',
    appEnv: process.env.APP_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    databaseUrl,
  })
  validateExactGitState({
    headSha,
    expectedSha: process.env.CUTOVER_SHA,
    cleanWorktree: git(['status', '--porcelain']) === '',
    branch,
    githubRef: process.env.GITHUB_REF,
    requireDetached: branch === '' && process.env.GITHUB_REF !== 'refs/heads/main',
  })
  if (process.env.PRODUCTION_OWNER_GRANT_EXECUTE !== '1') {
    throw new Error('PRODUCTION_OWNER_GRANT_EXECUTE must equal 1')
  }
  const confirmation = `GRANT SUPER_ADMIN ${PROD_PROJECT_REF} AT ${headSha}`
  if (process.env.PRODUCTION_OWNER_GRANT_CONFIRM !== confirmation) {
    throw new Error(`PRODUCTION_OWNER_GRANT_CONFIRM must exactly equal: ${confirmation}`)
  }

  const slug = process.env.BOOTSTRAP_ORGANIZATION_SLUG?.trim() ?? ''
  const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase() ?? ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid organization slug')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new Error('Invalid owner email')
  }

  const result = runPsql(
    databaseUrl,
    `begin;
     do $$
     declare
       v_membership_id uuid;
       v_organization_id uuid;
     begin
       select m.id, m.organization_id
         into v_membership_id, v_organization_id
         from public.organization_memberships m
         join public.organizations o on o.id = m.organization_id
         join auth.users u on u.id = m.user_id
        where o.slug = ${sqlLiteral(slug)}
          and lower(u.email) = ${sqlLiteral(email)}
          and m.status = 'active';

       if v_membership_id is null then raise exception 'active_owner_membership_not_found'; end if;

       insert into public.admin_role_assignments (
         organization_id, organization_membership_id, role, granted_by_membership_id
       ) values (v_organization_id, v_membership_id, 'super_admin', v_membership_id)
       on conflict (organization_membership_id, role) do nothing;
     end;
     $$;

     select count(*)::text
       from public.admin_role_assignments r
       join public.organization_memberships m on m.id = r.organization_membership_id
       join public.organizations o on o.id = m.organization_id
       join auth.users u on u.id = m.user_id
      where o.slug = ${sqlLiteral(slug)} and lower(u.email) = ${sqlLiteral(email)}
        and m.status = 'active' and r.role = 'super_admin';
     commit;\n`,
  )
  if (result !== '1') throw new Error(`Unexpected owner grant result: ${result}`)
  console.log('production_owner_grant=pass')
}

try {
  run()
} catch (error) {
  console.error(`Production owner grant failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
