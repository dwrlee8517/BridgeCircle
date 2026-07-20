export const DEV_PROJECT_REF = 'ojpvahiuafdcynbdbmri'
export const PROD_PROJECT_REF = 'edumxwzilfgvamzarwvo'
export const PROD_APP_ORIGIN = 'https://bridgecircle.org'
export const DEV_CANDIDATE_BRANCH = 'codex/redesign-v2'

export type RemoteTarget = 'dev' | 'production'

type TargetInput = {
  target: RemoteTarget
  appEnv: string | undefined
  supabaseUrl: string | undefined
  databaseUrl: string | undefined
}

type GitInput = {
  headSha: string
  expectedSha: string | undefined
  cleanWorktree: boolean
  branch: string
  githubRef?: string
  requireDetached?: boolean
  remoteTarget?: RemoteTarget
  devCandidateConfirmation?: string
}

export type ResetAuthorizationInput = GitInput &
  TargetInput & {
    execute: string | undefined
    zeroDataAcknowledged: string | undefined
    confirmation: string | undefined
  }

function parsedUrl(value: string | undefined, label: string): URL {
  if (!value) throw new Error(`${label} is missing`)
  try {
    return new URL(value)
  } catch {
    throw new Error(`${label} is not a valid URL`)
  }
}

function expectedProjectRef(target: RemoteTarget): string {
  return target === 'dev' ? DEV_PROJECT_REF : PROD_PROJECT_REF
}

function expectedAppEnv(target: RemoteTarget): string {
  return target === 'dev' ? 'dev' : 'prod'
}

export function validateRemoteTarget(input: TargetInput): void {
  const projectRef = expectedProjectRef(input.target)
  if (input.appEnv !== expectedAppEnv(input.target)) {
    throw new Error(`APP_ENV must be ${expectedAppEnv(input.target)}`)
  }

  const api = parsedUrl(input.supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')
  if (
    api.origin !== `https://${projectRef}.supabase.co` ||
    api.pathname !== '/' ||
    api.search !== '' ||
    api.hash !== ''
  ) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL does not target allowlisted ${input.target}`)
  }

  const database = parsedUrl(input.databaseUrl, 'SUPABASE_DB_URL')
  const username = decodeURIComponent(database.username)
  const direct = database.hostname === `db.${projectRef}.supabase.co` && username === 'postgres'
  const pooler =
    database.hostname.endsWith('.pooler.supabase.com') && username === `postgres.${projectRef}`
  if ((!direct && !pooler) || database.pathname !== '/postgres') {
    throw new Error(`SUPABASE_DB_URL does not target allowlisted ${input.target}`)
  }
}

export function validateExactGitState(input: GitInput): void {
  if (!/^[0-9a-f]{40}$/.test(input.headSha)) throw new Error('HEAD must be a full commit SHA')
  if (!/^[0-9a-f]{40}$/.test(input.expectedSha ?? '')) {
    throw new Error('The approved cutover SHA must be a full commit SHA')
  }
  if (input.headSha !== input.expectedSha)
    throw new Error('HEAD does not match the approved cutover SHA')
  if (!input.cleanWorktree) throw new Error('Cutover commands require a clean worktree')

  if (input.requireDetached) {
    if (input.branch !== '') throw new Error('The destructive reset requires a detached checkout')
    return
  }

  const onMain = input.branch === 'main' || input.githubRef === 'refs/heads/main'
  const onDevCandidate =
    input.branch === DEV_CANDIDATE_BRANCH ||
    input.githubRef === `refs/heads/${DEV_CANDIDATE_BRANCH}`
  const expectedCandidateConfirmation = `DEPLOY dev ${input.headSha}`
  const explicitlyAuthorizedDevCandidate =
    input.remoteTarget === 'dev' &&
    onDevCandidate &&
    input.devCandidateConfirmation === expectedCandidateConfirmation
  if (!onMain && !explicitlyAuthorizedDevCandidate) {
    throw new Error('Remote migration commands require main or an exact-SHA dev candidate')
  }
}

export function migrationVersionsFromFilenames(filenames: string[]): string[] {
  const versions = filenames
    .filter((filename) => filename.endsWith('.sql'))
    .map((filename) => {
      const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(filename)
      if (!match) throw new Error(`Invalid migration filename: ${filename}`)
      return match[1]
    })
    .sort()
  if (new Set(versions).size !== versions.length)
    throw new Error('Duplicate migration versions found')
  return versions
}

export function pendingMigrationVersions(input: {
  localVersions: string[]
  remoteVersions: string[]
}): string[] {
  const local = [...input.localVersions].sort()
  const remote = [...input.remoteVersions].sort()
  if (local.some((version) => !/^\d{14}$/.test(version))) {
    throw new Error('Local migration history contains an invalid version')
  }
  if (remote.some((version) => !/^\d{14}$/.test(version))) {
    throw new Error('Remote migration history contains an invalid version')
  }
  const localSet = new Set(local)
  const remoteOnly = remote.filter((version) => !localSet.has(version))
  if (remoteOnly.length > 0) {
    throw new Error(`Remote-only migration versions found: ${remoteOnly.join(',')}`)
  }
  const remoteSet = new Set(remote)
  return local.filter((version) => !remoteSet.has(version))
}

export function validateProductionResetAuthorization(input: ResetAuthorizationInput): void {
  if (input.target !== 'production') throw new Error('The destructive reset refuses non-production')
  validateRemoteTarget(input)
  validateExactGitState({ ...input, requireDetached: true })
  if (input.execute !== '1') throw new Error('PRODUCTION_V2_RESET_EXECUTE must equal 1')
  if (input.zeroDataAcknowledged !== '1') {
    throw new Error('PRODUCTION_V2_ZERO_DATA_ACK must equal 1')
  }
  const expected = `RESET ${PROD_PROJECT_REF} AT ${input.headSha}`
  if (input.confirmation !== expected)
    throw new Error(`Confirmation must exactly equal: ${expected}`)
}

export function validateBootstrapInput(input: {
  slug: string | undefined
  name: string | undefined
  email: string | undefined
  token: string | undefined
  appOrigin: string | undefined
}): { slug: string; name: string; email: string; token: string; appOrigin: string } {
  const slug = input.slug?.trim() ?? ''
  const name = input.name?.trim() ?? ''
  const email = input.email?.trim().toLowerCase() ?? ''
  const token = input.token ?? ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid organization slug')
  if (name.length < 1 || name.length > 200) throw new Error('Invalid organization name')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new Error('Invalid owner email')
  }
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) throw new Error('Invalid bootstrap invite token')
  const origin = parsedUrl(input.appOrigin, 'NEXT_PUBLIC_APP_URL')
  if (origin.origin !== PROD_APP_ORIGIN || origin.pathname !== '/') {
    throw new Error(`NEXT_PUBLIC_APP_URL must equal ${PROD_APP_ORIGIN}`)
  }
  return { slug, name, email, token, appOrigin: origin.origin }
}
