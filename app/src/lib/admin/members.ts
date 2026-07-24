import type {
  AdminMemberFilters,
  AdminMemberListResult,
  AdminMemberStatus,
  AdminMembersRepository,
  AdminRoleChangeResult,
  GrantableAdminRole,
} from './contracts'

const STATUSES = new Set<AdminMemberStatus>(['pending', 'active', 'rejected', 'revoked'])
const GRANTABLE_ROLES = new Set<GrantableAdminRole>(['admin', 'event_moderator', 'ambassador'])
const MAX_SEARCH_LENGTH = 120
const CLASS_YEAR_MIN = 1900
const CLASS_YEAR_MAX = 2100

/**
 * Turn raw searchParams into safe repository filters. Anything malformed
 * degrades to "no filter" rather than an error — an admin pasting a stale
 * URL should see the unfiltered directory, not a failure page.
 */
export function parseAdminMemberFilters(params: {
  q?: string
  year?: string
  status?: string
  help?: string
  inactive?: string
}): AdminMemberFilters {
  const search = params.q?.trim().slice(0, MAX_SEARCH_LENGTH) || null
  const year = Number.parseInt(params.year ?? '', 10)
  const classYear = year >= CLASS_YEAR_MIN && year <= CLASS_YEAR_MAX ? year : null
  const status = STATUSES.has(params.status as AdminMemberStatus)
    ? (params.status as AdminMemberStatus)
    : null
  const openToHelp = params.help === '1' ? true : params.help === '0' ? false : null
  const inactive = Number.parseInt(params.inactive ?? '', 10)
  const inactiveDays = inactive >= 1 && inactive <= 365 ? inactive : null
  return { search, classYear, status, openToHelp, inactiveDays }
}

export function listAdminMembers(
  repository: Pick<AdminMembersRepository, 'list'>,
  input: { membershipId: string; limit?: number; offset?: number } & AdminMemberFilters,
): Promise<AdminMemberListResult> {
  const limit = input.limit ?? 100
  const offset = input.offset ?? 0
  if (limit < 1 || limit > 200 || offset < 0) {
    return Promise.resolve({ ok: false, error: 'invalid_input' })
  }
  return repository.list({ ...input, limit, offset })
}

export function changeAdminRole(
  repository: Pick<AdminMembersRepository, 'grantRole' | 'revokeRole'>,
  input: {
    membershipId: string
    targetMembershipId: string
    role: string
    action: 'grant' | 'revoke'
  },
): Promise<AdminRoleChangeResult> {
  if (!GRANTABLE_ROLES.has(input.role as GrantableAdminRole)) {
    return Promise.resolve({ ok: false, error: 'invalid_input' })
  }
  // Self-service escalation is the SQL layer's job to refuse; refusing
  // self-targeting entirely here keeps the UI story simple: you manage
  // others' roles, never your own.
  if (input.membershipId === input.targetMembershipId) {
    return Promise.resolve({ ok: false, error: 'forbidden' })
  }
  const call = input.action === 'grant' ? repository.grantRole : repository.revokeRole
  return call({
    membershipId: input.membershipId,
    targetMembershipId: input.targetMembershipId,
    role: input.role as GrantableAdminRole,
  })
}
