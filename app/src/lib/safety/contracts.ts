export type ReportReason = 'harassment' | 'spam' | 'inappropriate' | 'impersonation' | 'other'

export type ReportMessageResult =
  | { status: 'submitted'; reportId: string }
  | { status: 'not_available' | 'invalid_input' }

export type BlockMemberResult = { status: 'blocked' | 'unchanged' | 'not_available' }

export type SafetyRepository = {
  reportMessage(input: {
    messageId: number
    reason: ReportReason
    note: string | null
  }): Promise<ReportMessageResult>
  blockMember(userId: string): Promise<BlockMemberResult>
}
