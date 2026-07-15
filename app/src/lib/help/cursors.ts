import type { HelpCursor } from './contracts'

const cursorPattern =
  /^(\d{4}-\d{2}-\d{2}T[^|]+)\|([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

export function encodeHelpCursor(cursor: HelpCursor): string {
  if (
    !Number.isFinite(Date.parse(cursor.createdAt)) ||
    !cursorPattern.test(`${cursor.createdAt}|${cursor.id}`)
  ) {
    throw new Error('Invalid Help cursor')
  }
  return encodeURIComponent(`${cursor.createdAt}|${cursor.id}`)
}

export function decodeHelpCursor(value: string | null | undefined): HelpCursor | null {
  if (!value) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return null
  }
  const match = cursorPattern.exec(decoded)
  if (!match?.[1] || !match[2] || !Number.isFinite(Date.parse(match[1]))) return null
  return { createdAt: match[1], id: match[2] }
}
