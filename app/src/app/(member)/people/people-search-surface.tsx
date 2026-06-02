'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { SearchForm, type SearchFormDefaults } from './search-form'

type Props = {
  defaults: SearchFormDefaults
  filtersOpen: boolean
  resultCount: number
  openCount: number
  children: React.ReactNode
}

type SearchKind = 'nl' | 'structured'
type Stage = 'hidden' | 'reading' | 'looking' | 'careers' | 'structured'

const INDICATOR_DELAY_MS = 300
const STAGE_LOOKING_MS = 1000
const STAGE_CAREERS_MS = 1400

const STAGE_COPY: Record<Exclude<Stage, 'hidden'>, string> = {
  reading: 'Reading your search…',
  looking: 'Looking through your circle…',
  careers: 'Reading career histories…',
  structured: 'Updating results…',
}

export function PeopleSearchSurface({
  defaults,
  filtersOpen,
  resultCount,
  openCount,
  children,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchKind, setSearchKind] = useState<SearchKind>('structured')
  const [stage, setStage] = useState<Stage>('hidden')

  useEffect(() => {
    if (!isPending) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const initial: Stage = searchKind === 'nl' ? 'reading' : 'structured'
    timers.push(setTimeout(() => setStage(initial), INDICATOR_DELAY_MS))
    if (searchKind === 'nl') {
      timers.push(setTimeout(() => setStage('looking'), STAGE_LOOKING_MS))
      timers.push(setTimeout(() => setStage('careers'), STAGE_CAREERS_MS))
    }
    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [isPending, searchKind])

  const handleSearch = (params: URLSearchParams) => {
    setStage('hidden')
    setSearchKind((params.get('nl')?.length ?? 0) > 0 ? 'nl' : 'structured')
    const qs = params.toString()
    startTransition(() => {
      router.push(qs.length > 0 ? `/people?${qs}` : '/people')
    })
  }

  const handleClear = () => {
    setStage('hidden')
    setSearchKind('structured')
    startTransition(() => {
      router.push('/people')
    })
  }

  const visibleStage: Stage = isPending ? stage : 'hidden'

  return (
    <SearchForm
      defaults={defaults}
      filtersOpen={filtersOpen}
      resultCount={resultCount}
      openCount={openCount}
      onSearch={handleSearch}
      onClear={handleClear}
    >
      <StatusBanner stage={visibleStage} />
      <div
        className={`space-y-4 transition-opacity duration-150 ${isPending ? 'opacity-60' : ''}`}
        aria-busy={isPending}
      >
        {children}
      </div>
    </SearchForm>
  )
}

function StatusBanner({ stage }: { stage: Stage }) {
  if (stage === 'hidden') return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
    >
      <span
        className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-primary"
        aria-hidden="true"
      />
      <span>{STAGE_COPY[stage]}</span>
    </div>
  )
}

export function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>
}
