const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

type DateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function utcMilliseconds(parts: DateTimeParts) {
  const date = new Date(0)
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day)
  date.setUTCHours(parts.hour, parts.minute, 0, 0)
  return date.getTime()
}

function parseLocalDateTime(value: string): DateTimeParts | null {
  const match = LOCAL_DATE_TIME.exec(value)
  if (!match) return null

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  }
  const normalized = new Date(utcMilliseconds(parts))
  if (
    normalized.getUTCFullYear() !== parts.year ||
    normalized.getUTCMonth() + 1 !== parts.month ||
    normalized.getUTCDate() !== parts.day ||
    normalized.getUTCHours() !== parts.hour ||
    normalized.getUTCMinutes() !== parts.minute
  ) {
    return null
  }
  return parts
}

function partsInTimeZone(instant: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const values = new Map(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(values.get('year')),
    month: Number(values.get('month')),
    day: Number(values.get('day')),
    hour: Number(values.get('hour')),
    minute: Number(values.get('minute')),
  }
}

function sameDateTime(left: DateTimeParts, right: DateTimeParts) {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  )
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
    return true
  } catch {
    return false
  }
}

/**
 * Interpret a timezone-naive `datetime-local` value in the explicitly selected
 * IANA timezone. This never reads the browser or server's local timezone.
 * Nonexistent wall times during the spring DST transition are rejected.
 */
export function localDateTimeToIso(value: string, timeZone: string): string | null {
  const desired = parseLocalDateTime(value)
  if (!desired || !isValidTimeZone(timeZone)) return null

  const desiredMilliseconds = utcMilliseconds(desired)
  let candidateMilliseconds = desiredMilliseconds

  // Reconcile the timezone's displayed wall clock with the desired wall clock.
  // Two passes cover ordinary offsets and DST boundaries; a third makes the
  // convergence explicit without relying on the runtime's system timezone.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = partsInTimeZone(new Date(candidateMilliseconds), timeZone)
    const adjustment = desiredMilliseconds - utcMilliseconds(shown)
    if (adjustment === 0) break
    candidateMilliseconds += adjustment
  }

  const candidate = new Date(candidateMilliseconds)
  return sameDateTime(partsInTimeZone(candidate, timeZone), desired)
    ? candidate.toISOString()
    : null
}

/** Format an instant for a `datetime-local` input in an explicit IANA zone. */
export function isoToLocalDateTime(value: string, timeZone: string): string {
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime()) || !isValidTimeZone(timeZone)) return ''
  const parts = partsInTimeZone(instant, timeZone)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}
