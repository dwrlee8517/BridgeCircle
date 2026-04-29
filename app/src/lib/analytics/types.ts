/**
 * Shape of a single metric card in the admin analytics dashboard.
 *
 * `value` is the headline (string so we can format "62%" or "—"); `sub` is the
 * grey caption that gives the underlying counts; `tone` controls the sub-line
 * color (up/down/neutral). All cards share this shape so the page renderer is
 * a single map.
 */
export type MetricCard = {
  key: string
  label: string
  value: string
  sub: string
  footnote: string
  tone: 'up' | 'down' | 'neutral'
  /** Tooltip text — explains the metric on hover. */
  tooltip: string
}

export type DashboardMetrics = {
  cards: MetricCard[]
  /** ISO timestamp of when the metrics were computed. */
  computedAt: string
}
