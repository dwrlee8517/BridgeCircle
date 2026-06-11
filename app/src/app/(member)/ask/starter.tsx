import { CircleHelp, Lock } from 'lucide-react'
import Link from 'next/link'
import { PersonAvatar } from '@/components/ui/person-card'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { countOpenAskMatches, getOpenAskForUser } from '@/lib/asks/openAsks'
import {
  type AskStarterStats,
  getAskStarterStats,
  SOCIAL_PROOF_MIN_HELPERS,
} from '@/lib/asks/starterStats'
import { requireSession } from '@/lib/auth/session'
import { displayName } from '@/lib/utils'
import { AskBar } from '../ask-bar'
import { OpenAskRow } from './open-ask-ui'

const STARTER_ASKS = [
  'How do I move from agency design into an in-house product team?',
  'Is a gap year before med school a mistake?',
  'What does day-to-day work actually look like in venture capital?',
]

/**
 * The ask entry moment — the one sanctioned Ink editorial band on a member
 * workflow surface (tokens.md § screen-level rules). The white command
 * surface overlaps the band so the eye lands in the input first; everything
 * below answers the embarrassed asker's unspoken questions: who sees this,
 * is anyone actually out there, and what happens after I press enter.
 */
export async function AskStarter({ defaultValue = '' }: { defaultValue?: string }) {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  let admin = null
  try {
    admin = createAdminClient()
  } catch {
    // No service key in this environment — skip the admin-only aggregates.
  }

  let stats: AskStarterStats | null = null
  if (membership) {
    stats = await getAskStarterStats(supabase, admin, {
      organizationId: membership.organization_id,
    })
  }

  const openAsk = await getOpenAskForUser(supabase, { userId: session.userId })
  const openAskMatchCount =
    openAsk && admin ? await countOpenAskMatches(admin, { openAskId: openAsk.id }) : 0

  const showSocialProof = (stats?.helperCount ?? 0) >= SOCIAL_PROOF_MIN_HELPERS

  return (
    <div className="min-h-full bg-background">
      <section className="relative overflow-hidden bg-surface-editorial text-surface-editorial-foreground">
        <svg
          aria-hidden="true"
          viewBox="0 0 520 380"
          className="absolute -top-24 -right-20 h-[340px] w-[470px] opacity-20"
        >
          <title>Decorative two-circle motif</title>
          <circle cx="200" cy="190" r="140" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle
            cx="320"
            cy="190"
            r="140"
            fill="none"
            stroke="var(--primary-on-dark)"
            strokeWidth="1.5"
          />
        </svg>
        <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-8 lg:pt-14">
          <p className="flex items-center gap-2 text-kicker font-bold uppercase tracking-kicker text-primary-on-dark">
            <span aria-hidden className="h-0.5 w-7 rounded-full bg-primary-on-dark" />
            Ask
          </p>
          <h1 className="mt-3 max-w-2xl font-heading text-display-md font-semibold leading-[1.1] sm:text-display-lg">
            What are you trying to figure out?
          </h1>
          <p className="mt-3 max-w-2xl text-body-lg leading-[1.55] text-surface-editorial-muted">
            Describe the situation in your own words. We&rsquo;ll find alumni who&rsquo;ve been
            there — and show you why each one fits.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-9 max-w-5xl px-4 sm:px-8">
        <AskBar
          defaultValue={defaultValue}
          autoFocus={Boolean(defaultValue)}
          hint={
            <span className="flex items-center gap-1.5">
              <Lock aria-hidden className="size-3 shrink-0" />
              Plain words work best. Nothing is sent yet — you&rsquo;ll choose who sees this later.
            </span>
          }
        />
      </section>

      {openAsk ? <OpenAskRow openAsk={openAsk} matchCount={openAskMatchCount} /> : null}

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <p className="bc-card-label">Not sure how to put it?</p>
            <div className="mt-3 space-y-2.5">
              {STARTER_ASKS.map((ask) => (
                <StarterAsk key={ask} href={`/ask?nl=${encodeURIComponent(ask)}`}>
                  {ask}
                </StarterAsk>
              ))}
            </div>
          </div>

          {showSocialProof && stats ? <OpenToHelpPanel stats={stats} /> : null}
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-border border-t px-4 py-8 sm:px-8">
        <p className="bc-card-label">How asking works</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <HowItWorksStep
            number="01"
            title="Describe the situation"
            body="Only members who chose to be askable will ever see it."
          />
          <HowItWorksStep
            number="02"
            title="See who fits, and why"
            body="Every name comes with a reason. No mystery scores."
          />
          <HowItWorksStep
            number="03"
            title="Send a short note"
            body="We help with the draft. If the timing's wrong, they can pass quietly — no awkwardness on either side."
          />
        </div>
      </section>
    </div>
  )
}

function StarterAsk({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-md border border-border bg-card p-3.5 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-primary/30 hover:shadow-card-hover"
    >
      <CircleHelp aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="text-sm font-medium leading-snug text-foreground group-hover:text-primary">
        {children}
      </span>
    </Link>
  )
}

function OpenToHelpPanel({ stats }: { stats: AskStarterStats }) {
  const remainder = Math.max(0, stats.helperCount - stats.sampleHelpers.length)

  return (
    <div>
      <p className="bc-card-label">Open to help right now</p>
      <div className="mt-3 rounded-md border border-border bg-card p-4 shadow-card">
        <div className="flex items-center">
          {stats.sampleHelpers.map((helper, index) => (
            <PersonAvatar
              key={helper.userId}
              userId={helper.userId}
              name={displayName(helper.name, helper.preferredName)}
              avatarUrl={helper.avatarUrl}
              className={index === 0 ? 'size-8 text-xs' : '-ml-2 size-8 text-xs'}
            />
          ))}
          {remainder > 0 ? (
            <span className="ml-2.5 font-mono text-xs text-muted-foreground">+{remainder}</span>
          ) : null}
        </div>
        <p className="mt-3.5 text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{stats.helperCount}</span>{' '}
          members chose to be askable
        </p>
        {stats.answeredRecentCount > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">
              {stats.answeredRecentCount}
            </span>{' '}
            {stats.answeredRecentCount === 1 ? 'ask' : 'asks'} answered in the last 90 days
          </p>
        ) : null}
      </div>
    </div>
  )
}

function HowItWorksStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="border-border border-t pt-3">
      <p className="font-mono text-xs text-primary">{number}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}
