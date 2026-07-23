import type { SchoolAnnouncementFilter } from './contracts'

const announcementFilters = new Set<SchoolAnnouncementFilter>([
  'all',
  'mentorship',
  'hiring',
  'reunion',
  'general',
])

export function parseAnnouncementFilter(
  value: string | string[] | undefined,
): SchoolAnnouncementFilter {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate && announcementFilters.has(candidate as SchoolAnnouncementFilter)
    ? (candidate as SchoolAnnouncementFilter)
    : 'all'
}

export function announcementFilterHref(filter: SchoolAnnouncementFilter) {
  return filter === 'all' ? '/school/announcements' : `/school/announcements?tag=${filter}`
}

export function selectedSchoolEventId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate && /^[0-9a-f-]{36}$/i.test(candidate) ? candidate : null
}
