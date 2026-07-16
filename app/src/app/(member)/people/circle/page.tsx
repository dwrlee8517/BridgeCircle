import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createPeopleRepository } from '@/db/repositories/people'
import { selectedMembership } from '@/lib/membership/selection'
import type { PeopleFilters } from '@/lib/people/contracts'
import { searchPeople } from '@/lib/people/operations'
import { MyCircleView } from './my-circle-view'

const EMPTY_FILTERS: PeopleFilters = {
  industry: null,
  classYearStart: null,
  classYearEnd: null,
  location: null,
  employer: null,
  education: null,
  topic: null,
}

export default async function MyCirclePage() {
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  const result = await searchPeople(
    {
      membershipId: membership.membershipId,
      query: null,
      scope: 'in_circle',
      filters: EMPTY_FILTERS,
      limit: 50,
    },
    createPeopleRepository(client),
  )
  if (result.status === 'invalid_input') throw new Error('My circle query was rejected')

  const avatarStorage = createAvatarStorageRepository(client)
  const avatarUrls = Object.fromEntries(
    result.result.items.flatMap((person) =>
      person.avatarPath ? [[person.avatarPath, avatarStorage.publicUrl(person.avatarPath)]] : [],
    ),
  )

  return <MyCircleView initialItems={result.result.items} avatarUrls={avatarUrls} />
}
