/**
 * Build an RFC 5545 VCALENDAR string for a single event. Used by the
 * /events/[id]/ical route so members can drop the event into Apple Calendar,
 * Google Calendar, or Outlook with a click.
 *
 * Kept deliberately small — no recurrence, no attendees, no alarms.
 * Production-grade ics libraries handle line folding, escaping, and time
 * zones; for our single-event case the surface is small enough to do by
 * hand and avoid pulling another dep.
 */
export type IcalInput = {
  uid: string
  title: string
  description: string | null
  location: string | null
  startsAt: string // ISO 8601
  endsAt: string | null // ISO 8601, optional. Defaults to startsAt + 1h.
  url: string
}

/** Escape commas, semicolons, and newlines per RFC 5545 §3.3.11. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

/** Format an ISO timestamp as UTC YYYYMMDDTHHMMSSZ. */
function formatUtc(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

export function buildIcal(input: IcalInput): string {
  const dtStart = formatUtc(input.startsAt)
  const dtEnd = formatUtc(
    input.endsAt ?? new Date(new Date(input.startsAt).getTime() + 60 * 60 * 1000).toISOString(),
  )
  const dtStamp = formatUtc(new Date().toISOString())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BridgeCircle//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@bridgecircle.org`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${esc(input.title)}`,
    input.description ? `DESCRIPTION:${esc(input.description)}` : null,
    input.location ? `LOCATION:${esc(input.location)}` : null,
    `URL:${esc(input.url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => l !== null)

  // RFC 5545 requires CRLF terminators.
  return `${lines.join('\r\n')}\r\n`
}
