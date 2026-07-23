import { format, formatDistanceToNow } from 'date-fns'
import { Megaphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { createSchoolRepository } from '@/db/repositories/school'
import { displayOrgName } from '@/lib/utils'
import { loadSchoolAdminContext } from '../_lib/school-admin'
import { AnnouncementForm } from './announcement-form'

export default async function AdminAnnouncementsPage() {
  const { client, membership } = await loadSchoolAdminContext()
  const orgName = displayOrgName(membership.organization.name)
  const recent =
    (await createSchoolRepository(client).getAdminAnnouncements(membership.membershipId)) ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
          <CardDescription>
            Publishes immediately to {orgName}. Members see it in School and receive a durable
            in-app notification.
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
            <EmptyState
              icon={Megaphone}
              title="Nothing published yet"
              description="The first announcement you post will land at the top of the School announcement archive."
              size="inline"
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <ul className="divide-y">
              {recent.map((a) => (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <span
                      className="shrink-0 text-xs text-muted-foreground"
                      title={a.publishedAt ? format(new Date(a.publishedAt), 'PPpp') : undefined}
                    >
                      {a.publishedAt
                        ? formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })
                        : 'draft'}
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
