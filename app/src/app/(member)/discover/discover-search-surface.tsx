'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { SearchForm, type SearchFormDefaults } from './search-form'

type Props = {
  defaults: SearchFormDefaults
  filtersOpen: boolean
  children: React.ReactNode
}

/**
 * Client wrapper around /discover's interactive surface. Two jobs:
 *
 *  1. Hold `useTransition` state so prior results stay rendered (dimmed)
 *     while a new server query runs — instead of swapping to the loading.tsx
 *     skeleton. Tighter UX when re-searching with adjusted filters.
 *
 *  2. Own the `router.push` so the SearchForm's commit callbacks (search /
 *     clear) flow through `startTransition`. The form fires `onSearch` on
 *     submit AND on checkbox toggle; this surface decides what the
 *     navigation looks like.
 */
export function DiscoverSearchSurface({ defaults, filtersOpen, children }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSearch = (params: URLSearchParams) => {
    const qs = params.toString()
    startTransition(() => {
      router.push(qs.length > 0 ? `/discover?${qs}` : '/discover')
    })
  }

  const handleClear = () => {
    startTransition(() => {
      router.push('/discover')
    })
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <SearchForm
            defaults={defaults}
            filtersOpen={filtersOpen}
            onSearch={handleSearch}
            onClear={handleClear}
          />
        </CardContent>
      </Card>
      <div
        className={`space-y-6 transition-opacity duration-150 ${
          isPending ? 'pointer-events-none opacity-60' : ''
        }`}
        aria-busy={isPending}
      >
        {children}
      </div>
    </>
  )
}
