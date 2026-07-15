import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createPeopleRepository } from '@/db/repositories/people'
import { selectedMembership } from '@/lib/membership/selection'
import { searchPeople } from '@/lib/people/operations'
import {
  parsePeopleSearchParams,
  peopleSearchHref,
  type RawPeopleSearchParams,
} from '@/lib/people/query'
import { PeopleDirectory } from './people-directory'

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<RawPeopleSearchParams>
}) {
  const raw = await searchParams
  const parsed = parsePeopleSearchParams(raw)
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  const fallback = parsePeopleSearchParams({})
  if (!fallback.ok) throw new Error('People default search contract is invalid')
  const search = parsed.ok ? parsed.value : fallback.value
  const result = await searchPeople(
    {
      membershipId: membership.membershipId,
      query: search.query,
      scope: search.scope,
      filters: search.filters,
      limit: 50,
    },
    createPeopleRepository(client),
  )
  if (result.status === 'invalid_input') throw new Error('People server search was rejected')

  const avatarStorage = createAvatarStorageRepository(client)
  const avatarUrls = Object.fromEntries(
    result.result.items.flatMap((person) =>
      person.avatarPath ? [[person.avatarPath, avatarStorage.publicUrl(person.avatarPath)]] : [],
    ),
  )

  return (
    <PeopleDirectory
      key={peopleSearchHref(search)}
      organizationId={membership.organization.id}
      organizationName={membership.organization.name}
      viewerGraduationYear={membership.profile.graduationYear}
      initialSearch={search}
      initialResult={result.result}
      initialAvatarUrls={avatarUrls}
      invalidSearch={!parsed.ok}
    />
  )
}
