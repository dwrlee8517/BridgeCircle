export type ReportReason = 'harassment' | 'spam' | 'inappropriate' | 'impersonation' | 'other'

export type ReportMessageResult =
  | { status: 'submitted'; reportId: string }
  | { status: 'not_available' | 'invalid_input' }

export type ReportProfileResult = ReportMessageResult

export type BlockMemberResult = { status: 'blocked' | 'unchanged' | 'not_available' }

export type SafetyRepository = {
  reportMessage(input: {
    messageId: number
    reason: ReportReason
    note: string | null
  }): Promise<ReportMessageResult>
  reportProfile(input: {
    userId: string
    reason: ReportReason
    note: string | null
  }): Promise<ReportProfileResult>
  blockMember(userId: string): Promise<BlockMemberResult>
}
