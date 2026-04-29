import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { listAnnouncements } from '@/lib/announcements/listAnnouncements'
import { requireSession } from '@/lib/auth/session'

export default async function AnnouncementsPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (!membership) return null

  const orgName = (membership.organizations as { name: string } | null)?.name ?? 'your network'
  const announcements = await listAnnouncements(supabase, membership.organization_id, {
    limit: 50,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <p className="text-sm text-muted-foreground">News and updates from {orgName}.</p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No announcements yet.
          </CardContent>
        </Card>
      ) : (
        announcements.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-baseline justify-between gap-3">
                <CardTitle className="text-lg">{a.title}</CardTitle>
                <span
                  className="shrink-0 text-xs text-muted-foreground"
                  title={format(new Date(a.publishedAt), 'PPpp')}
                >
                  {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}
                </span>
              </div>
              {a.authorName ? (
                <p className="text-xs text-muted-foreground">Posted by {a.authorName}</p>
              ) : null}
            </CardHeader>
            {a.body ? (
              <CardContent>
                <p className="whitespace-pre-line text-sm">{a.body}</p>
              </CardContent>
            ) : null}
          </Card>
        ))
      )}
    </div>
  )
}
