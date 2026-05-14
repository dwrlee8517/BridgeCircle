'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { SearchForm, type SearchFormDefaults } from './search-form'

type Props = {
  defaults: SearchFormDefaults
  filtersOpen: boolean
  children: React.ReactNode
}

type SearchKind = 'nl' | 'structured'
type Stage = 'hidden' | 'reading' | 'looking' | 'careers' | 'structured'

// Scripted-stage timings, calibrated to typical server timings. Real progress
// callbacks would need streaming from the server; the timing variance is
// small enough (~1–3s total for NL) that scripted reads as accurate.
//
//   0–300ms:    hidden (avoid flashing the indicator on fast structured queries)
//   300–1000:   "Reading your search…"             (covers Haiku extract)
//   1000–1400:  "Looking through your circle…"     (covers pool query)
//   1400ms+:    "Reading career histories…"        (covers Haiku rerank)
//
// On a cache hit (post-extract-cache PR, ~900ms total) the user typically
// only sees the first stage — which still reads honestly as "I'm working on
// what you typed."
const INDICATOR_DELAY_MS = 300
const STAGE_LOOKING_MS = 1000
const STAGE_CAREERS_MS = 1400

const STAGE_COPY: Record<Exclude<Stage, 'hidden'>, string> = {
  reading: 'Reading your search…',
  looking: 'Looking through your circle…',
  careers: 'Reading career histories…',
  structured: 'Updating results…',
}

/**
 * Client wrapper around /people's interactive surface. Three jobs:
 *
 *  1. Hold `useTransition` state so prior results stay rendered (dimmed)
 *     while a new server query runs — instead of swapping to the loading.tsx
 *     skeleton. Tighter UX when re-searching with adjusted filters.
 *
 *  2. Own the `router.push` so the SearchForm's commit callbacks (search /
 *     clear) flow through `startTransition`. The form fires `onSearch` on
 *     submit AND on checkbox toggle; this surface decides what the
 *     navigation looks like.
 *
 *  3. Show a scripted status banner during the pending transition. NL
 *     search cycles through stages (extract → pool → rerank) on calibrated
 *     timings; structured search shows a single line. The 300ms delay keeps
 *     short structured searches silent.
 */
export function PeopleSearchSurface({ defaults, filtersOpen, children }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchKind, setSearchKind] = useState<SearchKind>('structured')
  const [stage, setStage] = useState<Stage>('hidden')

  // Schedule the staged status copy via timers. The effect deliberately does
  // NOT call setState synchronously in its body — `stage` is reset to 'hidden'
  // at the event-handler boundary (handleSearch / handleClear) before the
  // transition starts. When `isPending` flips back to false, the render-time
  // gate below hides the banner without needing a synchronous reset here.
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
      <StatusBanner stage={visibleStage} />
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
