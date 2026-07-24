import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { AdminPage } from '@/app/(admin)/admin/admin-page'
import { createAdminModerationRepository } from '@/db/repositories/admin-moderation'
import { ReportQueue } from './report-queue'

export default async function AdminReportsPage() {
  const { client, membership } = await loadSchoolAdminContext()
  const result = await createAdminModerationRepository(client).list({
    membershipId: membership.membershipId,
    limit: 200,
  })

  return (
    <AdminPage
      title="Reports"
      description="Review member-submitted safety concerns and keep a private record of each decision."
    >
      <ReportQueue
        reports={result.ok ? result.items : []}
        unavailableMessage={
          result.ok ? undefined : 'This report queue is not available for your membership.'
        }
      />
    </AdminPage>
  )
}
