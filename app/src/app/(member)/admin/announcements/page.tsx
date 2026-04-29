import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { listAnnouncements } from '@/lib/announcements/listAnnouncements'
import { requireAdmin } from '@/lib/auth/session'
import { AnnouncementForm } from './announcement-form'

export default async function AdminAnnouncementsPage() {
  const session = await requireAdmin()
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)

  const adminOrg = roles?.[0]
  if (!adminOrg) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">No admin organization.</p>
      </div>
    )
  }
  const orgName = (adminOrg.organizations as { name: string } | null)?.name ?? 'your organization'

  const recent = await listAnnouncements(supabase, adminOrg.organization_id, { limit: 30 })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
          <CardDescription>
            Publishes immediately to {orgName}. Members see it on /announcements; if you tick the
            email box, every active member also receives it in their inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent announcements</CardTitle>
          <CardDescription>Last 30 published.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing published yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((a) => (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <span
                      className="shrink-0 text-xs text-muted-foreground"
                      title={format(new Date(a.publishedAt), 'PPpp')}
                    >
                      {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {a.body ? (
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                      {a.body}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
