import type {
  BlockMemberResult,
  ReportMessageResult,
  ReportProfileResult,
  ReportReason,
  SafetyRepository,
} from './contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REASONS = new Set<ReportReason>([
  'harassment',
  'spam',
  'inappropriate',
  'impersonation',
  'other',
])

export async function reportMessage(
  input: { messageId: number; reason: ReportReason; note: string | null },
  repository: Pick<SafetyRepository, 'reportMessage'>,
): Promise<ReportMessageResult> {
  const note = input.note?.trim() || null
  if (
    !Number.isSafeInteger(input.messageId) ||
    input.messageId < 1 ||
    !REASONS.has(input.reason) ||
    (note?.length ?? 0) > 4_000
  ) {
    return { status: 'invalid_input' }
  }
  return repository.reportMessage({ ...input, note })
}

export async function reportProfile(
  input: { userId: string; reason: ReportReason; note: string | null },
  repository: Pick<SafetyRepository, 'reportProfile'>,
): Promise<ReportProfileResult> {
  const note = input.note?.trim() || null
  if (
    !UUID_PATTERN.test(input.userId) ||
    !REASONS.has(input.reason) ||
    (note?.length ?? 0) > 4_000
  ) {
    return { status: 'invalid_input' }
  }
  return repository.reportProfile({ ...input, note })
}

export async function blockMember(
  userId: string,
  repository: Pick<SafetyRepository, 'blockMember'>,
): Promise<BlockMemberResult> {
  if (!UUID_PATTERN.test(userId)) return { status: 'not_available' }
  return repository.blockMember(userId)
}
