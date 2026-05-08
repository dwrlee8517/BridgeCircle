import 'server-only'

/**
 * Stub analytics emitter. Real `analytics_events` table is on the post-launch
 * backlog (see `docs/specs/phase-1/post-launch-backlog.md`); until that
 * lands, events are logged to stdout in dev and dropped in prod. This lets
 * us instrument call sites *now* (so when the table arrives we don't have to
 * go retrofit every flow) without paying for an event pipeline today.
 *
 * Payloads should not include PII — pass user IDs and plain numeric/string
 * facts only. The intent is funnel/usage analytics, not behavioral tracking.
 */
export type AnalyticsEvent =
  | { type: 'onboarding_step_completed'; userId: string; step: 1 | 2 | 3 | 4 | 5 }
  | { type: 'onboarding_skipped'; userId: string; step: 2 | 3 | 4 | 5 }
  | { type: 'onboarding_finished'; userId: string; skippedFinal: boolean }

export function track(event: AnalyticsEvent): void {
  // Production: drop on the floor until the events table lands.
  if (process.env.NODE_ENV === 'production') return
  // Dev: log a single line for the funnel — easy to grep in the dev log.
  // Format mirrors what the future analytics_events row would look like.
  // eslint-disable-next-line no-console
  console.log('[analytics]', JSON.stringify({ ...event, ts: new Date().toISOString() }))
}
