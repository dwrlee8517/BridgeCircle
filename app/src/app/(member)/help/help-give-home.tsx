import { Pause, Search } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type {
  GiveHelpItem,
  HelpDirectRequest,
  HelpHome,
  HelpProfilePreview,
  HelpSuggestedAsk,
} from '@/lib/help/contracts'
import { cn, getInitials } from '@/lib/utils'
import { HelpModeSwitch } from './help-mode-switch'
import { HelpPreferencesForm } from './help-preferences-form'

export function HelpGiveHome({
  home,
  searchableAsks,
  searchQuery,
  avatarUrls,
  explicitMode,
}: {
  home: HelpHome
  searchableAsks: GiveHelpItem[]
  searchQuery: string | null
  avatarUrls: Record<string, string>
  explicitMode: boolean
}) {
  const available = home.openToHelp && !home.pausedAt
  const opportunityCount = home.directRequests.length + home.suggestedAsks.length

  return (
    <div className="min-h-full bg-[var(--surface-page)]">
      <section className="bg-[image:var(--wash-give)] px-4 pt-5 pb-7 sm:px-6 sm:pt-7 sm:pb-8 xl:px-8">
        <div className="mx-auto max-w-[860px]">
          <div className="flex flex-wrap items-center gap-3">
            <HelpModeSwitch
              membershipId={home.membershipId}
              mode="give"
              explicitMode={explicitMode}
            />
            <span className="ml-auto text-xs font-semibold text-[var(--text-faint)]">
              {opportunityCount > 0
                ? `${opportunityCount} ${opportunityCount === 1 ? 'ask' : 'asks'} may fit`
                : 'Nothing needs you right now'}
            </span>
          </div>

          <h1 className="mt-5 text-display-hero leading-10 font-extrabold text-[var(--text-primary)]">
            Where your experience matters.
          </h1>
          <p className="mt-2 text-sm leading-[1.55] font-medium text-[var(--grey-600)]">
            A quick pointer can save someone weeks. You decide what to answer and when.
          </p>

          <div className="mt-5 rounded-[var(--radius-large)] bg-card p-4 shadow-[var(--ring-card),var(--shadow-card)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="inline-flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    'relative h-5 w-[34px] shrink-0 rounded-full',
                    available ? 'bg-[var(--green-500)]' : 'bg-[var(--icon-muted)]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-4 rounded-full bg-white shadow-sm',
                      available ? 'right-0.5' : 'left-0.5',
                    )}
                  />
                </span>
                <span>
                  <span className="block text-body-sm font-bold text-[var(--text-primary)]">
                    {available ? 'Open to helping' : 'Matching is paused'}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-[var(--text-faint)]">
                    Pausing is never announced.
                  </span>
                </span>
              </span>

              <div className="h-px bg-[var(--divider)] sm:h-9 sm:w-px" />

              <div className="min-w-0 flex-1">
                <span className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
                  Can help with
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {home.helperTopics.length > 0 ? (
                    home.helperTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-[var(--give-tint-weak)] px-2.5 py-1 text-xs font-bold text-[var(--action-give-text)]"
                      >
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-[var(--text-faint)]">
                      Add up to five topics so the right asks can find you.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <HelpPreferencesForm
              key={`${home.openToHelp}:${home.helperTopics.join('|')}`}
              defaults={{ openToHelp: home.openToHelp, topics: home.helperTopics }}
            />

            {home.pausedAt ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-[var(--radius-box)] bg-[var(--surface-inset)] px-3.5 py-3">
                <Pause aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--text-faint)]" />
                <p className="text-xs leading-relaxed font-medium text-[var(--text-secondary)]">
                  Topic matching is resting. Asks that name you directly can still arrive below.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[860px] space-y-7 px-4 py-6 sm:px-6 sm:py-7 xl:px-0">
        {home.directRequests.length > 0 ? (
          <DirectRequestList requests={home.directRequests} avatarUrls={avatarUrls} />
        ) : null}

        {available ? (
          <SuggestedAskList asks={home.suggestedAsks} avatarUrls={avatarUrls} />
        ) : home.directRequests.length === 0 ? (
          <div className="rounded-[var(--radius-large)] bg-card px-5 py-8 text-center shadow-[var(--ring-card),var(--shadow-card)]">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Nothing is waiting on you
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed font-medium text-[var(--text-faint)]">
              Browsing stays available while matching is paused. Direct asks will still appear here.
            </p>
          </div>
        ) : null}

        <BrowseAskList asks={searchableAsks} query={searchQuery} avatarUrls={avatarUrls} />
      </div>
    </div>
  )
}

function BrowseAskList({
  asks,
  query,
  avatarUrls,
}: {
  asks: GiveHelpItem[]
  query: string | null
  avatarUrls: Record<string, string>
}) {
  return (
    <section aria-labelledby="browse-asks-title">
      <div className="mb-2.5 flex flex-wrap items-baseline gap-2">
        <h2
          id="browse-asks-title"
          className="text-body-lg font-extrabold text-[var(--text-primary)]"
        >
          Browse open asks
        </h2>
        <span className="text-xs font-semibold text-[var(--text-faint)]">
          Search stays private until you choose to offer help.
        </span>
      </div>
      <form
        className="flex gap-2 rounded-[var(--radius-large)] bg-card p-3 shadow-[var(--ring-card),var(--shadow-card)]"
        action="/help"
        method="get"
      >
        <input type="hidden" name="mode" value="give" />
        <label className="sr-only" htmlFor="give-search">
          Search open asks
        </label>
        <input
          id="give-search"
          name="q"
          defaultValue={query ?? ''}
          placeholder="Try a topic, role, or question"
          className="min-w-0 flex-1 rounded-xl bg-surface-subtle px-3.5 text-body-sm font-medium text-text-primary outline-none placeholder:text-text-muted focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--give-tint)] px-4 text-caption font-extrabold text-[var(--action-give-text)] hover:bg-[var(--green-100)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Search aria-hidden className="size-4" />
          Search
        </button>
      </form>
      {asks.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-[18px] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          {asks.map((ask) => (
            <HelpOpportunityRow
              key={ask.id}
              href={`/help/asks/${ask.id}/offer`}
              question={ask.question}
              person={ask.asker}
              meta={ask.matchReason ?? 'Open to help from the circle'}
              action="Read & offer"
              avatarUrls={avatarUrls}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-[var(--radius-large)] bg-card px-5 py-6 text-center text-caption leading-relaxed font-medium text-[var(--text-faint)] shadow-[var(--ring-card),var(--shadow-card)]">
          {query
            ? `No open asks match “${query}” yet.`
            : 'No other open asks are available right now.'}
        </p>
      )}
    </section>
  )
}

function DirectRequestList({
  requests,
  avatarUrls,
}: {
  requests: HelpDirectRequest[]
  avatarUrls: Record<string, string>
}) {
  return (
    <section aria-labelledby="direct-requests-title">
      <div className="mb-2.5 flex flex-wrap items-baseline gap-2">
        <h2
          id="direct-requests-title"
          className="text-body-lg font-extrabold text-[var(--text-primary)]"
        >
          Asked you directly
        </h2>
        <span className="rounded-full bg-[var(--state-danger)] px-2 py-0.5 text-kicker font-bold text-[var(--destructive-foreground)]">
          {requests.length}
        </span>
        <span className="text-xs font-semibold text-[var(--text-faint)]">Waiting on you</span>
      </div>
      <div className="overflow-hidden rounded-[18px] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        {requests.map((request) => (
          <HelpOpportunityRow
            key={request.askId}
            href={`/help/asks/${request.askId}`}
            question={request.question}
            person={request.asker}
            meta="asked you by name"
            action="View ask"
            direct
            avatarUrls={avatarUrls}
          />
        ))}
      </div>
    </section>
  )
}

function SuggestedAskList({
  asks,
  avatarUrls,
}: {
  asks: HelpSuggestedAsk[]
  avatarUrls: Record<string, string>
}) {
  return (
    <section aria-labelledby="suggested-asks-title">
      <div className="mb-2.5 flex flex-wrap items-baseline gap-2">
        <h2
          id="suggested-asks-title"
          className="text-body-lg font-extrabold text-[var(--text-primary)]"
        >
          Matched to your topics
        </h2>
        <span className="text-xs font-semibold text-[var(--text-faint)]">
          from the topics you chose above
        </span>
      </div>

      {asks.length > 0 ? (
        <div className="overflow-hidden rounded-[18px] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          {asks.map((ask) => (
            <HelpOpportunityRow
              key={ask.askId}
              href={`/help/asks/${ask.askId}/offer`}
              question={ask.question}
              person={ask.asker}
              meta={ask.matchReason}
              action="Read & offer"
              avatarUrls={avatarUrls}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-large)] bg-card px-5 py-8 text-center shadow-[var(--ring-card),var(--shadow-card)]">
          <p className="text-sm font-bold text-[var(--text-primary)]">
            Nothing needs you right now
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed font-medium text-[var(--text-faint)]">
            We’ll bring a private match here when your experience fits. No feed to keep up with.
          </p>
        </div>
      )}
    </section>
  )
}

function HelpOpportunityRow({
  href,
  question,
  person,
  meta,
  action,
  avatarUrls,
  direct = false,
}: {
  href: string
  question: string
  person: HelpProfilePreview
  meta: string
  action: string
  avatarUrls: Record<string, string>
  direct?: boolean
}) {
  const name = person.displayName
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-3 border-t border-[var(--divider-row)] px-4 py-4 text-inherit first:border-t-0 hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring sm:flex-row sm:items-center sm:px-5',
        direct && 'shadow-[inset_3px_0_0_var(--action-primary)]',
      )}
    >
      <HelpAvatar person={person} avatarUrls={avatarUrls} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug font-bold text-[var(--text-primary)]">
          “{question}”
        </span>
        <span className="mt-1 block text-xs leading-relaxed font-medium text-[var(--grey-600)]">
          {name} · {meta}
        </span>
      </span>
      <span
        className={cn(
          'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-4 text-xs font-bold',
          direct
            ? 'bg-[var(--action-weak)] text-[var(--blue-600)]'
            : 'bg-[var(--give-tint)] text-[var(--action-give-text)]',
        )}
      >
        {action} <span aria-hidden>→</span>
      </span>
    </Link>
  )
}

function HelpAvatar({
  person,
  avatarUrls,
}: {
  person: HelpProfilePreview
  avatarUrls: Record<string, string>
}) {
  const avatarUrl =
    person.identity === 'identified' && person.avatarPath
      ? avatarUrls[person.avatarPath]
      : undefined
  return (
    <Avatar className="size-10 shrink-0 after:border-black/5">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback
        seed={
          person.identity === 'identified'
            ? person.userId
            : `anonymous:${person.graduationYear ?? 'member'}`
        }
        className="text-body-sm font-bold"
      >
        {getInitials(person.displayName)}
      </AvatarFallback>
    </Avatar>
  )
}
