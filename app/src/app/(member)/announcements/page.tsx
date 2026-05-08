import { format, formatDistanceToNow } from 'date-fns'
import { Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { createClient } from '@/db/server'
import { listAnnouncements } from '@/lib/announcements/listAnnouncements'
import { requireSession } from '@/lib/auth/session'
import { displayOrgName } from '@/lib/utils'

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

  const orgName = displayOrgName((membership.organizations as { name: string } | null)?.name)
  const [announcements, { data: adminRole }] = await Promise.all([
    listAnnouncements(supabase, membership.organization_id, { limit: 50 }),
    supabase
      .from('admin_role_assignments')
      .select('role')
      .eq('user_id', session.userId)
      .eq('organization_id', membership.organization_id)
      .in('role', ['super_admin', 'admin'])
      .maybeSingle(),
  ])
  const isAdmin = !!adminRole

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <p className="text-sm text-muted-foreground">News and updates from {orgName}.</p>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description={
            isAdmin
              ? `No one has posted yet. Send the first update for ${orgName}.`
              : `Check back soon — admins post updates from ${orgName} here.`
          }
          action={
            isAdmin
              ? { label: 'Post the first announcement', href: '/admin/announcements' }
              : undefined
          }
        />
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
