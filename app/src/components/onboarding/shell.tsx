import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const TOTAL_STEPS = 5

type Props = {
  step: number
  eyebrow: string
  title: string
  lede: ReactNode
  children: ReactNode
}

/**
 * Shared shell for the staged onboarding flow. Centers a narrow card with
 * a wordmark, a 5-dot progress indicator, and the step's content. Each
 * step component renders its form (and its own Continue / Skip controls)
 * as the children prop, since the controls' enabled state depends on
 * step-local state (e.g. step 1's "name" must have a value).
 *
 * Layout choices:
 *   - max-w-xl, comfortable line-height, generous vertical rhythm — the
 *     opposite of the old single-page form. Each step should feel like a
 *     single slide of conversation, not a tax return.
 *   - Wordmark links to / so a partial-onboarded user could leave without
 *     finishing (their data is saved per step). They'll be routed back to
 *     the right step on next signin.
 */
export function OnboardingShell({ step, eyebrow, title, lede, children }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" aria-label="BridgeCircle home" className="inline-flex">
          <span className="bc-fraunces text-xl font-bold tracking-[-0.025em] text-foreground">
            Bridge<span className="text-primary">Circle</span>
          </span>
        </Link>
        <p className="text-xs font-medium text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </p>
      </header>

      <ProgressDots step={step} />

      {/* Back to previous step. Hidden on step 1 (nothing to go back to —
          the wordmark above is the escape hatch). Each step's data is
          saved on Continue, so backing out of step 3 to revisit step 2
          shows the values they just saved, not blanks. */}
      {step > 1 ? (
        <Link
          href={`/onboarding?step=${step - 1}`}
          className="mt-6 inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </Link>
      ) : null}

      <section className={step > 1 ? 'mt-4' : 'mt-10'}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1
          className="bc-fraunces mt-2 text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          {title}
        </h1>
        <div className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{lede}</div>
      </section>

      <div className="mt-8 flex-1">{children}</div>
    </main>
  )
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Progress: step ${step} of ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const idx = i + 1
        const isCurrent = idx === step
        const isDone = idx < step
        return (
          <div
            key={idx}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              isDone && 'bg-primary',
              isCurrent && 'bg-primary',
              !isDone && !isCurrent && 'bg-muted',
            )}
            aria-hidden
          />
        )
      })}
    </div>
  )
}
