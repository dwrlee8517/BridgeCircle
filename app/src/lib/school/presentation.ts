const LEGACY_NEWSLETTER_PREFIX = /^The Bridge\s*(?:·|:)\s*/i

/** Keeps legacy persisted issue titles from reviving the retired newsletter name. */
export function newsletterDisplayTitle(title: string): string {
  const displayTitle = title.replace(LEGACY_NEWSLETTER_PREFIX, '').trim()
  return displayTitle || 'Newsletter'
}
