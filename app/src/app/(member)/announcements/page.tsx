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
    .select('organization_id, organizations!organization_memberships_organization_id_fkey(name)')
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
    <div className="density-cozy mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-8">
      <div className="space-y-2">
        <p className="bc-section-kicker">From the office</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Announcements
        </h1>
        <p className="text-sm text-muted-foreground">News and updates from {orgName}.</p>
      </div>

      {announcements.length === 0 ? (
        /* Synthesis P3: empty state carries brand voice. */
        <EmptyState
          icon={Megaphone}
          title="A quiet board today."
          description={
            isAdmin
              ? `Nothing has been posted yet. When ${orgName} needs to share something with everyone, this is where it lives.`
              : `Admins post the things ${orgName} wants every member to see here. Quieter than a feed, by design.`
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
              <span className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary">
                <Megaphone className="size-3.5" />
                Announcement
              </span>
              <div className="flex items-baseline justify-between gap-3">
                <CardTitle className="text-lg">{a.title}</CardTitle>
                <span
                  className="shrink-0 font-mono text-xs text-muted-foreground"
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
