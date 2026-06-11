'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { HelpNetworkPerson } from '../help-network-ui'
import { CompactMatchRow, FeaturedMatchCard, MatchRowDivider } from './results-ui'

const SWAP_OUT_MS = 170
const FLASH_MS = 90

/**
 * The featured slot as a focus viewer. Clicking a row promotes that person
 * into the main slot with their full match details; the previously focused
 * person condenses back into the list at their rank position with a brief
 * highlight so the eye can follow them. The list order never changes —
 * rank is rank; focus is just a lens.
 *
 * Honesty guards: the slot label flips from "Strongest fit" to "In focus"
 * whenever anyone but the top match is shown (with a one-click way back),
 * and the band badge travels with each person, so focusing a longer shot
 * never dresses them up as a strong fit.
 */
export function ResultsFocus({
  people,
  intent,
  initialFocusId = null,
}: {
  /** Rank-ordered (rerank score desc), as served. */
  people: HelpNetworkPerson[]
  intent: string
  /** ?focus= from the server — passed down instead of useSearchParams so
   * the island never deopts the route into a client-rendered second pass. */
  initialFocusId?: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()

  const initialFocus =
    initialFocusId && people.some((p) => p.userId === initialFocusId)
      ? initialFocusId
      : people[0]?.userId

  const [focusId, setFocusId] = useState(initialFocus)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [swapping, setSwapping] = useState(false)
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const focused = people.find((p) => p.userId === focusId) ?? people[0]
  if (!focused) return null

  const rows = people.filter((p) => p.userId !== focused.userId)
  const isTop = focused.userId === people[0]?.userId

  function focusOn(id: string) {
    if (id === focusId || swapping) return
    const demoted = focusId
    setSwapping(true)
    if (swapTimer.current) clearTimeout(swapTimer.current)
    swapTimer.current = setTimeout(() => {
      setFocusId(id)
      setFlashId(demoted)
      setSwapping(false)
      setTimeout(() => setFlashId(null), FLASH_MS)

      // Keep the focus shareable and back-button friendly without a
      // server round-trip. window.location is fine here: this runs only
      // inside a click handler, never during render.
      const params = new URLSearchParams(window.location.search)
      if (id === people[0]?.userId) params.delete('focus')
      else params.set('focus', id)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, SWAP_OUT_MS)
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="bc-card-label">{isTop ? 'Strongest fit' : 'In focus'}</p>
        {!isTop ? (
          <button
            type="button"
            onClick={() => focusOn(people[0].userId)}
            className="text-xs font-medium text-link hover:text-link-hover"
          >
            Back to the strongest fit
          </button>
        ) : null}
      </div>
      {/* Screen readers hear the swap; sighted users see it. */}
      <p aria-live="polite" className="sr-only">
        Now viewing {focused.name ?? 'a match'}
      </p>
      <div
        className={cn(
          'mt-2 transition-[opacity,transform] duration-base ease-standard',
          swapping && 'translate-y-1 scale-[0.99] opacity-0',
        )}
      >
        <FeaturedMatchCard person={focused} intent={intent} reason={focused.rationale ?? null} />
      </div>

      {rows.length > 0 ? (
        <div className="mt-6">
          <p className="bc-card-label">Also worth asking</p>
          <div className="mt-2">
            <MatchRowDivider>
              {rows.map((person) => (
                <CompactMatchRow
                  key={person.userId}
                  person={person}
                  intent={intent}
                  reason={person.rationale ?? null}
                  onSelect={() => focusOn(person.userId)}
                  dimmed={
                    person.matchScore !== null &&
                    person.matchScore !== undefined &&
                    person.matchScore < 65
                  }
                  flash={person.userId === flashId}
                />
              ))}
            </MatchRowDivider>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Click a row to see their full match — Ask stays one click on both.
          </p>
        </div>
      ) : null}
    </div>
  )
}
