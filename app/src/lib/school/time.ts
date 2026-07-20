import type { SchoolEventCard } from './contracts'

const campusNames: Record<SchoolEventCard['campus'], string> = {
  palos_verdes: 'Palos Verdes',
  songdo: 'Songdo',
  other: 'Campus',
  online: 'Event',
}

export function formatEventDate(iso: string, timeZone: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

export function formatEventTime(iso: string, timeZone: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso))
}

export function formatEventTimeRange(
  startsAt: string,
  endsAt: string | null,
  timeZone: string,
  locale = 'en-US',
) {
  const start = formatEventTime(startsAt, timeZone, locale)
  if (!endsAt) return start
  const end = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(endsAt))
  return `${start} – ${end}`
}

export function campusTimeLabel(event: Pick<SchoolEventCard, 'campus' | 'timeZone'>) {
  return `${campusNames[event.campus]} time · ${event.timeZone}`
}

export function eventCalendarFilename(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'bridgecircle-event'}.ics`
}

function icalEscape(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function utcStamp(iso: string) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

export function buildSchoolEventCalendar(
  event: Pick<SchoolEventCard, 'id' | 'title' | 'summary' | 'startsAt' | 'endsAt' | 'locationName'>,
  canonicalUrl: string,
) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BridgeCircle//School//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@bridgecircle.org`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    `DTSTART:${utcStamp(event.startsAt)}`,
    ...(event.endsAt ? [`DTEND:${utcStamp(event.endsAt)}`] : []),
    `SUMMARY:${icalEscape(event.title)}`,
    ...(event.summary ? [`DESCRIPTION:${icalEscape(event.summary)}`] : []),
    ...(event.locationName ? [`LOCATION:${icalEscape(event.locationName)}`] : []),
    `URL:${icalEscape(canonicalUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
