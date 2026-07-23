import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { createAdminModerationRepository } from '@/db/repositories/admin-moderation'
import { ReportQueue } from './report-queue'

export default async function AdminReportsPage() {
  const { client, membership } = await loadSchoolAdminContext()
  const result = await createAdminModerationRepository(client).list({
    membershipId: membership.membershipId,
    limit: 200,
  })

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review member-submitted safety concerns and keep a private record of each decision.
        </p>
      </header>
      <ReportQueue
        reports={result.ok ? result.items : []}
        unavailableMessage={
          result.ok ? undefined : 'This report queue is not available for your membership.'
        }
      />
    </main>
  )
}
