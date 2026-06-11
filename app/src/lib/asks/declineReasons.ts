/**
 * Decline-reason vocabulary, shared by the helper-side chooser (client),
 * the asker-facing closed copy (server), and respondToAsk validation. One
 * source so what the helper previews is exactly what the asker reads.
 *
 * No 'server-only' on purpose — pure data + string builders.
 */

export const DECLINE_REASONS = [
  { id: 'at_capacity', helperLabel: "I'm at capacity" },
  { id: 'not_my_area', helperLabel: 'Not my area' },
  { id: 'not_now', helperLabel: 'Just not now' },
] as const

export type DeclineReason = (typeof DECLINE_REASONS)[number]['id']

export function isDeclineReason(value: unknown): value is DeclineReason {
  return DECLINE_REASONS.some((reason) => reason.id === value)
}

/**
 * The dignified line the asker reads for a declined ask. Every variant
 * de-personalizes the no; "not_my_area" deliberately points forward at
 * the next-best-fit block rendered directly beneath it.
 */
export function declineCopyForAsker(reason: DeclineReason | null, helperFirstName: string): string {
  switch (reason) {
    case 'at_capacity':
      return `${helperFirstName} is at capacity right now — this isn’t about your ask.`
    case 'not_my_area':
      return `This one’s outside ${helperFirstName}’s wheelhouse — let’s find someone closer to it.`
    case 'not_now':
      return `Now wasn’t the right time for ${helperFirstName}. This isn’t about your ask.`
    default:
      return `${helperFirstName} couldn’t take this one right now. Capacity comes and goes — this usually isn’t about your ask.`
  }
}
