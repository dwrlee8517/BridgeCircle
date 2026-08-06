/**
 * Keyset (cursor) pagination helpers shared by every connection.
 *
 * Framework-agnostic on purpose: `/lib` data-access functions and the GraphQL
 * resolver layer both use these, so they live in `/lib` (graphql depends on
 * lib, never the reverse).
 *
 * A cursor is opaque to clients (per the Relay spec) but internally encodes the
 * `(sortValue, id)` tuple a keyset query orders by. `id` is the tie-breaker, so
 * pages are stable even when rows share a sort value. Keyset beats offset
 * because inserts don't shift the window — no duplicates, no skips.
 */

const SEP = '|'

/**
 * Encode a keyset cursor. `sortValue` must not contain `|` — ISO-8601
 * timestamps and UUIDs (the only sort/id columns we page on) never do.
 */
export function encodeKeysetCursor(sortValue: string, id: string): string {
  return `${sortValue}${SEP}${id}`
}

export function decodeKeysetCursor(cursor: string): { sortValue: string; id: string } {
  const idx = cursor.indexOf(SEP)
  if (idx === -1) throw new Error(`malformed keyset cursor: ${cursor}`)
  return { sortValue: cursor.slice(0, idx), id: cursor.slice(idx + 1) }
}

/**
 * Build the argument for a PostgREST `.or()` that compares a `(sort, id)` tuple
 * against a cursor position:
 *
 *   direction 'gt' → rows *after*  the cursor (forward paging, ascending order)
 *   direction 'lt' → rows *before* the cursor (backward paging, descending order)
 *
 * Expands to `sort > v OR (sort = v AND id > cursorId)` so ties on the sort
 * column are broken by id.
 */
export function keysetOrFilter(
  sortColumn: string,
  idColumn: string,
  sortValue: string,
  id: string,
  direction: 'gt' | 'lt',
): string {
  return `${sortColumn}.${direction}.${sortValue},and(${sortColumn}.eq.${sortValue},${idColumn}.${direction}.${id})`
}
