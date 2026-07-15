import type { HelpAskStatus, HelpAskSummary } from '@/lib/help/contracts'

const CURRENT_STATUSES = new Set<HelpAskStatus>(['waiting', 'open', 'accepted', 'declined'])

export function isCurrentAsk(ask: Pick<HelpAskSummary, 'status'>) {
  return CURRENT_STATUSES.has(ask.status)
}

export function daysUntil(timestamp: string, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(timestamp) - now) / 86_400_000))
}

export function closingSoonDays(
  ask: Pick<HelpAskSummary, 'status' | 'expiresAt'>,
  now = Date.now(),
) {
  if (ask.status !== 'waiting' && ask.status !== 'open') return null
  const days = daysUntil(ask.expiresAt, now)
  return days <= 3 ? days : null
}

export function askStatusLabel(status: HelpAskStatus, offerCount = 0) {
  if (status === 'open' && offerCount > 0) {
    return `${offerCount} ${offerCount === 1 ? 'offer' : 'offers'}`
  }
  const labels: Record<HelpAskStatus, string> = {
    waiting: 'Waiting',
    open: 'Open',
    accepted: 'Answered',
    declined: 'Declined',
    retracted: 'Retracted',
    resolved: 'Resolved',
    closed: 'Closed',
  }
  return labels[status]
}
