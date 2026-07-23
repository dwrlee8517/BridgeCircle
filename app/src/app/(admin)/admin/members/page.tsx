import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { createAdminMembersRepository } from '@/db/repositories/admin-members'
import { listAdminMembers, parseAdminMemberFilters } from '@/lib/admin/members'
import { MembersDirectory } from './members-directory'

const PAGE_SIZE = 50

type SearchParams = {
  q?: string
  year?: string
  status?: string
  help?: string
  inactive?: string
  page?: string
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [{ client, membership }, params] = await Promise.all([
    loadSchoolAdminContext(),
    searchParams,
  ])
  const filters = parseAdminMemberFilters(params)
  const pageNumber = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const result = await listAdminMembers(createAdminMembersRepository(client), {
    membershipId: membership.membershipId,
    ...filters,
    limit: PAGE_SIZE,
    offset: (pageNumber - 1) * PAGE_SIZE,
  })

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-display-section font-bold tracking-tight text-[var(--text-primary)]">
          Members
        </h1>
        <p className="mt-1 text-sm leading-relaxed font-medium text-[var(--text-muted)]">
          Everyone with a {membership.organization.name} membership — search, filter, and manage
          console roles.
        </p>
      </header>
      <MembersDirectory
        result={result}
        filters={filters}
        page={pageNumber}
        pageSize={PAGE_SIZE}
        viewerMembershipId={membership.membershipId}
        viewerIsSuperAdmin={membership.roles.includes('super_admin')}
      />
    </div>
  )
}
