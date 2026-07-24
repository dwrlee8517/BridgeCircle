import type { AdminOverview, AdminOverviewRepository, AdminOverviewResult } from './contracts'

/** Attention queues, most urgent first — safety before intake before nudges. */
export const ATTENTION_ORDER = [
  'reports',
  'approvals',
  'staleInvites',
  'quietAsks',
  'quietNewMembers',
] as const

export type AttentionKey = (typeof ATTENTION_ORDER)[number]

export function getAdminOverview(
  repository: AdminOverviewRepository,
  input: { membershipId: string },
): Promise<AdminOverviewResult> {
  return repository.get(input)
}

/** Attention keys with something waiting, most urgent first. */
export function openAttention(overview: AdminOverview): AttentionKey[] {
  return ATTENTION_ORDER.filter((key) => overview.attention[key].count > 0)
}

export function isAllClear(overview: AdminOverview): boolean {
  return openAttention(overview).length === 0
}

/**
 * Whole days an item has waited, for "oldest has waited N days" lines.
 * Returns null when there is no oldest item or the timestamp is malformed.
 */
export function daysWaiting(oldestAt: string | null, now: Date): number | null {
  if (!oldestAt) return null
  const oldest = new Date(oldestAt).getTime()
  if (Number.isNaN(oldest)) return null
  return Math.max(0, Math.floor((now.getTime() - oldest) / 86_400_000))
}
