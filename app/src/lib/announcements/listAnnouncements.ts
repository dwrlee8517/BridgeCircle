import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type AnnouncementRow = {
  id: string
  title: string
  body: string | null
  publishedAt: string
  createdBy: string | null
  /** Display name of the admin who posted, when resolvable. */
  authorName: string | null
}

export type ListAnnouncementsOptions = {
  /** Cap on rows returned. Default 50. */
  limit?: number
}

/**
 * List announcements for an org, newest first. RLS gates visibility:
 *   - members see only published rows in orgs they actively belong to
 *   - admins see all rows in orgs they admin (we still filter to published
 *     here since the admin index does its own pull)
 *
 * Joins to base_profiles to surface the author's name on the member view.
 * Author resolution is best-effort — if the admin who posted has since
 * been deleted (tombstoned) the row shows author "Former member".
 */
export async function listAnnouncements(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  options: ListAnnouncementsOptions = {},
): Promise<AnnouncementRow[]> {
  const limit = options.limit ?? 50

  const { data: rows, error } = await supabase
    .from('announcements')
    .select('id, title, body, published_at, created_by')
    .eq('organization_id', organizationId)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`listAnnouncements: ${error.message}`)
  if (!rows || rows.length === 0) return []

  const authorIds = Array.from(
    new Set(rows.map((r) => r.created_by).filter((id): id is string => id !== null)),
  )
  const nameByUser = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: bases } = await supabase
      .from('base_profiles')
      .select('user_id, name')
      .in('user_id', authorIds)
    for (const b of bases ?? []) {
      if (b.name) nameByUser.set(b.user_id, b.name)
    }
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    publishedAt: r.published_at as string,
    createdBy: r.created_by,
    authorName: r.created_by ? (nameByUser.get(r.created_by) ?? null) : null,
  }))
}
