import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { createAdminOverviewRepository } from '@/db/repositories/admin-overview'
import { getAdminOverview } from '@/lib/admin/overview'
import { AdminPage } from './admin-page'
import { OverviewBoard } from './overview-board'

// The console's front page: what's waiting on a person, then a small pulse of
// how the community is doing. The layout's admin gate runs first; non-admins
// bounce before this renders.
export default async function AdminOverviewPage() {
  const { client, membership } = await loadSchoolAdminContext()
  const result = await getAdminOverview(createAdminOverviewRepository(client), {
    membershipId: membership.membershipId,
  })

  return (
    <AdminPage
      title="Overview"
      description={`What needs a hand this week, and how ${membership.organization.name} is doing.`}
    >
      <OverviewBoard result={result} organizationName={membership.organization.name} />
    </AdminPage>
  )
}
