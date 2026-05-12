export type EventAttendee = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

export type RsvpRow = { event_id: string; user_id: string; responded_at: string | null }
export type ProfileRow = { user_id: string; name: string | null; avatar_url: string | null }

/**
 * Group RSVPs by event_id preserving input order, keeping at most `limit`
 * per event. Pure, exported separately from the DB shell so tests don't have
 * to fake a Supabase client.
 */
export function trimByEvent(rsvps: RsvpRow[], limit: number): Map<string, RsvpRow[]> {
  const out = new Map<string, RsvpRow[]>()
  if (limit <= 0) return out
  for (const r of rsvps) {
    const list = out.get(r.event_id)
    if (!list) out.set(r.event_id, [r])
    else if (list.length < limit) list.push(r)
  }
  return out
}

export function uniqueUserIds(grouped: Map<string, RsvpRow[]>): string[] {
  const set = new Set<string>()
  for (const rows of grouped.values()) for (const r of rows) set.add(r.user_id)
  return Array.from(set)
}

/**
 * Join trimmed RSVPs with profile rows. Missing profile → null fields,
 * which is acceptable — the avatar fallback is a colored initial pill.
 */
export function hydrate(
  grouped: Map<string, RsvpRow[]>,
  profiles: ProfileRow[],
): Map<string, EventAttendee[]> {
  const profileById = new Map(profiles.map((p) => [p.user_id, p]))
  const out = new Map<string, EventAttendee[]>()
  for (const [eventId, rs] of grouped) {
    out.set(
      eventId,
      rs.map((r) => {
        const p = profileById.get(r.user_id)
        return { userId: r.user_id, name: p?.name ?? null, avatarUrl: p?.avatar_url ?? null }
      }),
    )
  }
  return out
}
