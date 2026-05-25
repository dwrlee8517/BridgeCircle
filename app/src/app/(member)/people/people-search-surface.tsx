'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { SearchForm, type SearchFormDefaults } from './search-form'

export type Density = 'comfortable' | 'compact'

export const DensityContext = createContext<{
  density: Density
  setDensity: (density: Density) => void
}>({
  density: 'comfortable',
  setDensity: () => {},
})

export const useDensity = () => useContext(DensityContext)

type Props = {
  defaults: SearchFormDefaults
  filtersOpen: boolean
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

export function PeopleSearchSurface({ defaults, filtersOpen, children }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchKind, setSearchKind] = useState<SearchKind>('structured')
  const [stage, setStage] = useState<Stage>('hidden')
  const [density, setDensity] = useState<Density>('compact')

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
    <DensityContext.Provider value={{ density, setDensity }}>
      <SearchForm
        defaults={defaults}
        filtersOpen={filtersOpen}
        onSearch={handleSearch}
        onClear={handleClear}
      >
        <StatusBanner stage={visibleStage} />
        <div
          className={`space-y-6 transition-opacity duration-150 ${isPending ? 'opacity-60' : ''}`}
          aria-busy={isPending}
        >
          {children}
        </div>
      </SearchForm>
    </DensityContext.Provider>
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

export function ResultsHeader({
  resultCount,
  hasFilter,
}: {
  resultCount: number
  hasFilter: boolean
}) {
  const { density, setDensity } = useDensity()
  const suffix = hasFilter
    ? resultCount === 1
      ? 'alum matches your filters'
      : 'alumni match your filters'
    : resultCount === 1
      ? 'alum in your circle'
      : 'alumni in your circle'

  return (
    <div className="flex items-center justify-between border-b pb-3 border-border">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{resultCount.toLocaleString()}</strong> {suffix}
      </p>
      <div className="flex items-center gap-1 select-none bg-muted/40 p-0.5 rounded-lg border border-border/60">
        <button
          type="button"
          onClick={() => setDensity('comfortable')}
          className={cn(
            'font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-all cursor-pointer',
            density === 'comfortable'
              ? 'bg-card text-primary font-bold shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Cards
        </button>
        <button
          type="button"
          onClick={() => setDensity('compact')}
          className={cn(
            'font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-all cursor-pointer',
            density === 'compact'
              ? 'bg-card text-primary font-bold shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Rows
        </button>
      </div>
    </div>
  )
}

export function ResultGrid({ children }: { children: React.ReactNode }) {
  const { density } = useDensity()
  if (density === 'compact') {
    return <div className="flex flex-col gap-3">{children}</div>
  }
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">{children}</div>
}
