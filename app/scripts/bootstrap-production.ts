import {
  databaseUrlFromEnvironment,
  git,
  runPsql,
} from '../src/lib/cutover/remote-database'
import {
  PROD_PROJECT_REF,
  validateBootstrapInput,
  validateExactGitState,
  validateRemoteTarget,
} from '../src/lib/cutover/remote-target'

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function run(): void {
  if (process.env.GITHUB_ACTIONS === 'true') {
    throw new Error('Production bootstrap must run in an operator terminal, not GitHub Actions')
  }
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
  if (process.env.PRODUCTION_BOOTSTRAP_EXECUTE !== '1') {
    throw new Error('PRODUCTION_BOOTSTRAP_EXECUTE must equal 1')
  }
  const confirmation = `BOOTSTRAP ${PROD_PROJECT_REF} AT ${headSha}`
  if (process.env.PRODUCTION_BOOTSTRAP_CONFIRM !== confirmation) {
    throw new Error(`PRODUCTION_BOOTSTRAP_CONFIRM must exactly equal: ${confirmation}`)
  }

  const input = validateBootstrapInput({
    slug: process.env.BOOTSTRAP_ORGANIZATION_SLUG,
    name: process.env.BOOTSTRAP_ORGANIZATION_NAME,
    email: process.env.BOOTSTRAP_OWNER_EMAIL,
    token: process.env.BOOTSTRAP_INVITE_TOKEN,
    appOrigin: process.env.NEXT_PUBLIC_APP_URL,
  })
  const result = runPsql(
    databaseUrl,
    `begin;
     insert into public.organizations (slug, name, requires_admin_approval)
     values (${sqlLiteral(input.slug)}, ${sqlLiteral(input.name)}, false)
     on conflict (slug) do nothing;

     do $$
     begin
       if not exists (
         select 1 from public.organizations
         where slug = ${sqlLiteral(input.slug)} and name = ${sqlLiteral(input.name)}
       ) then
         raise exception 'bootstrap_organization_conflict';
       end if;
     end;
     $$;

     insert into public.invites (
       organization_id, email, email_normalized, token_hash, status, expires_at
     )
     select id, ${sqlLiteral(input.email)}, ${sqlLiteral(input.email)},
            extensions.digest(${sqlLiteral(input.token)}, 'sha256'), 'pending', now() + interval '7 days'
       from public.organizations where slug = ${sqlLiteral(input.slug)}
     on conflict (organization_id, email_normalized) where status = 'pending'
     do update set
       token_hash = excluded.token_hash,
       expires_at = greatest(public.invites.expires_at, excluded.expires_at);

     select
       (select count(*) from public.organizations where slug = ${sqlLiteral(input.slug)})::text || '|' ||
       (select count(*) from public.invites i join public.organizations o on o.id = i.organization_id
         where o.slug = ${sqlLiteral(input.slug)} and i.email_normalized = ${sqlLiteral(input.email)}
           and i.status = 'pending')::text;
     commit;\n`,
  )
  if (result !== '1|1') throw new Error(`Unexpected production bootstrap result: ${result}`)

  console.log('production_bootstrap=pass')
  console.log(`owner_join_url=${input.appOrigin}/join?token=${encodeURIComponent(input.token)}`)
}

try {
  run()
} catch (error) {
  console.error(`Production bootstrap failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
