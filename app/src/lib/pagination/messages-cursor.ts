import type { MessagesCursor } from '@/lib/messages/contracts'

/**
 * Codec for the inbox cursor.
 *
 * Unlike Help (which ships its own codec), the Messages list cursor is a
 * three-part composite — `(priority, activityAt, conversationId)` — and v2 had
 * no encoder because the server actions passed the object around in-process.
 * The GraphQL connection needs an opaque string, so this is the canonical
 * encoding. Framework-agnostic, so it lives in `/lib` alongside the keyset
 * helpers rather than in the resolver layer.
 *
 * `|` is a safe separator: priority is 1–3, activityAt is ISO-8601, and
 * conversationId is a UUID — none can contain it.
 */

const SEP = '|'

export function encodeMessagesCursor(cursor: MessagesCursor): string {
  return `${cursor.priority}${SEP}${cursor.activityAt}${SEP}${cursor.conversationId}`
}

/**
 * Returns null for absent or malformed cursors rather than throwing — the
 * repository treats null as "from the beginning", which is the right behavior
 * for a client replaying a stale cursor.
 */
export function decodeMessagesCursor(value: string | null | undefined): MessagesCursor | null {
  if (!value) return null
  const parts = value.split(SEP)
  if (parts.length !== 3) return null
  const [rawPriority, activityAt, conversationId] = parts
  const priority = Number(rawPriority)
  if (priority !== 1 && priority !== 2 && priority !== 3) return null
  if (!activityAt || !Number.isFinite(Date.parse(activityAt))) return null
  if (!conversationId) return null
  return { priority, activityAt, conversationId }
}
