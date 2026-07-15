import type {
  MemberProfileResult,
  PeopleDirectoryResult,
  PeopleMatchEvidence,
  PeopleRepository,
  PeopleSearchInput,
} from './contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function searchPeople(
  input: PeopleSearchInput,
  repository: Pick<PeopleRepository, 'list'>,
): Promise<{ status: 'ok'; result: PeopleDirectoryResult } | { status: 'invalid_input' }> {
  const limit = input.limit ?? 50
  if (
    !UUID_PATTERN.test(input.membershipId) ||
    (input.query?.length ?? 0) > 300 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    return { status: 'invalid_input' }
  }
  return {
    status: 'ok',
    result: await repository.list({
      ...input,
      query: input.query?.trim() || null,
      queryEmbedding: input.queryEmbedding ?? null,
      limit,
    }),
  }
}

export async function getMemberProfile(
  membershipId: string,
  userId: string,
  repository: Pick<PeopleRepository, 'getMemberProfile'>,
): Promise<MemberProfileResult> {
  if (!UUID_PATTERN.test(membershipId) || !UUID_PATTERN.test(userId)) {
    return { ok: false, error: 'not_available' }
  }
  return repository.getMemberProfile(membershipId, userId)
}

export function matchEvidenceCopy(evidence: PeopleMatchEvidence): string {
  if (evidence.title && evidence.organization) {
    return `${evidence.title} at ${evidence.organization}`
  }
  if (evidence.organization) return `Experience at ${evidence.organization}`
  if (evidence.title) return evidence.title
  switch (evidence.kind) {
    case 'career_history':
    case 'career_path_summary':
      return 'Relevant career experience'
    case 'education_history':
      return 'Relevant education experience'
    case 'skills':
      return 'Relevant skills'
    case 'helper_topics':
    case 'help_topics_summary':
      return 'Offers help in this area'
    case 'bio':
      return 'Relevant profile experience'
    default:
      return 'Relevant profile match'
  }
}
