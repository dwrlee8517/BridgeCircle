import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventTime } from '@/components/ui/event-time'
import { PersonAvatar, RationaleBlock, TopicChips } from '@/components/ui/person-card'
import { StatusBadge } from '@/components/ui/status-badge'
import type { HomeEvent, HomeFeed, HomeRecentAsk } from '@/lib/home/getHomeFeed'
import { askComposeHref, classYearShort, displayName, preferredAskType } from '@/lib/utils'
import { AskBar, type HelpNetworkPerson } from './help-network-ui'

interface DashboardClientProps {
  feed: HomeFeed
  firstName: string
  viewerName: string
  cohortYear: number | null
  orgDisplayName: string
  viewerCity: string | null
  isHelper: boolean
}

export default function DashboardClient({
  feed,
  firstName,
  cohortYear,
  orgDisplayName,
}: DashboardClientProps) {
  const featuredEvent = feed.upcomingEvents[0] ?? null
  const peopleWhoCanHelp = feed.openMentors.slice(0, 6).map(toPerson)
  const cohortLabel = cohortYear ? `Class of '${String(cohortYear).slice(-2)}` : null

  return (
    // The route layout already renders the page <main>; this wrapper must stay
    // a <div> so the home route doesn't nest main landmarks.
    <div className="min-h-screen bg-background">
      <HomeAnnouncementStrip announcement={feed.latestAnnouncement} event={featuredEvent} />

      <section className="bc-page-band relative overflow-hidden">
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-10 text-center min-[761px]:px-8 min-[761px]:py-14">
          <div className="flex w-full max-w-[820px] flex-col items-center gap-6">
            <div className="space-y-3">
              <div className="bc-section-kicker justify-center">
                {[cohortLabel, orgDisplayName].filter(Boolean).join(' · ')}
              </div>
              <div className="mx-auto max-w-[720px]">
                <h1 className="font-heading text-[40px] font-semibold leading-[1.1] tracking-normal text-foreground max-[480px]:text-[32px]">
                  Hi {firstName}. Who do you want to ask?
                </h1>
                <p className="mx-auto mt-2.5 max-w-[640px] text-[17px] leading-[1.55] text-muted-foreground">
                  Find someone who has been there, or offer help where your experience matters.
                </p>
              </div>
            </div>

            <div className="w-full">
              <AskBar />
            </div>
          </div>

          <div className="w-full max-w-[580px] text-left">
            <YourAsksRail asks={feed.myRecentAsks} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="space-y-6">
          <SectionHeader title="People who can help you" href="/people" cta="Ask a question" />
          {peopleWhoCanHelp.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {peopleWhoCanHelp.map((person) => (
                <HomePersonCard key={person.userId} person={person} />
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No one to suggest just yet"
              body="As more alumni join and open up to helping, they'll show up here. In the meantime, browse People to find someone yourself."
              href="/people"
              cta="Browse people"
            />
          )}
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-heading text-lg font-semibold leading-tight text-foreground">
          {title}
        </h2>
      </div>
      <Button asChild variant="outline" size="sm" className="h-8 w-fit rounded-md text-xs">
        <Link href={href}>
          {cta}
          <ArrowRight className="size-[13px]" />
        </Link>
      </Button>
    </div>
  )
}

function HomeAnnouncementStrip({
  announcement,
  event,
}: {
  announcement: HomeFeed['latestAnnouncement']
  event: HomeEvent | null
}) {
  if (!announcement && !event) return null

  const href = announcement ? '/announcements' : event ? `/events/${event.id}` : '/school'
  const label = announcement ? 'Announcement' : 'Event'
  const title = announcement?.title ?? event?.title ?? 'School update'
  const stamp = announcement ? (
    shortRelativeTime(new Date(announcement.publishedAt))
  ) : event ? (
    <EventTime iso={event.startsAt} pattern="MMM d" />
  ) : null

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 border-b border-border bg-primary/[0.03] px-4 py-2 text-xs transition-colors hover:bg-primary/[0.06] sm:px-8"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Send className="size-3.5 shrink-0 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          {label}
        </span>
        <span className="min-w-0 truncate font-medium text-foreground">{title}</span>
      </span>
      {stamp ? (
        <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
          <span>{stamp}</span>
          <ArrowRight className="size-3" />
        </span>
      ) : null}
    </Link>
  )
}

function shortRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days}d ago`
  return formatDistanceToNow(date, { addSuffix: true })
}

function EmptyPanel({
  title,
  body,
  href,
  cta,
}: {
  title: string
  body: string
  href: string
  cta: string
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-6">
      <p className="font-heading text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button asChild size="sm" variant="outline" className="mt-4 rounded-md">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}

function HomePersonCard({ person }: { person: HelpNetworkPerson }) {
  const name = displayName(person.name, person.preferredName ?? null)
  const yearShort = classYearShort(person.graduationYear)
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' · ')
  const context = [person.city, person.university, person.major].filter(Boolean).join(' · ')
  const topics = buildHomeTopics(person)
  const rationale = person.rationale ?? buildHomeRationale(person)
  const askType = preferredAskType(person)

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border bg-card p-5 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-foreground hover:shadow-card-hover"
      data-interactive="true"
    >
      <div className="flex flex-1 gap-3">
        <PersonAvatar
          userId={person.userId}
          name={name}
          avatarUrl={person.avatarUrl}
          className="size-[52px] text-base"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Link
              href={`/profile/${person.userId}`}
              className="truncate font-heading text-[15px] font-semibold text-foreground hover:text-primary"
            >
              {name}
            </Link>
            {yearShort ? (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{yearShort}</span>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap gap-1">
            {person.isOpenAsMentor ? (
              <StatusBadge tone="open" size="sm" className="min-h-5 px-2 text-xs">
                <span className="size-[5px] rounded-full bg-accent-sage" aria-hidden />
                Mentor
              </StatusBadge>
            ) : person.isOpenAsAdviceHelper ? (
              <StatusBadge tone="open" size="sm" dot className="min-h-5 px-2 text-xs">
                Advice
              </StatusBadge>
            ) : null}
          </div>

          {role ? <p className="mt-1.5 text-xs font-medium text-foreground">{role}</p> : null}
          {context ? <p className="mt-0.5 text-[11px] text-muted-foreground">{context}</p> : null}
        </div>
      </div>

      {rationale ? (
        <RationaleBlock className="mt-3" bodyClassName="text-xs leading-[1.5]">
          {rationale}
        </RationaleBlock>
      ) : null}

      <TopicChips topics={topics} className="mt-2.5" />

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-dashed border-border pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {askType ? (
            <Button asChild variant="default" size="sm" className="h-8 rounded-md text-xs">
              {/* preferredAskType routes mentor-only people to the mentorship
                  composer (the old hardcoded type=advice mislabeled them). */}
              <Link href={askComposeHref(person.userId, askType)}>Ask for help</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="h-8 rounded-md text-xs">
              <Link href={`/profile/${person.userId}`}>View profile</Link>
            </Button>
          )}
          {askType ? (
            <Link
              href={`/profile/${person.userId}`}
              className="px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              View profile
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function buildHomeTopics(person: HelpNetworkPerson) {
  // Topic chips only — employer/university already appear in the card header,
  // and repeating them as chips was pure noise ("one accent moment per card").
  return person.mentoringTopics ?? []
}

function buildHomeRationale(person: HelpNetworkPerson) {
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' at ')
  if (role) return `Their path as ${role} could be useful context.`
  if (person.university) return 'They share school context and are open to helping.'
  return 'They are part of your trusted school circle.'
}

/**
 * Hero-right "Your asks" rail — the viewer's recent outgoing asks with a
 * status dot + lifecycle label, mirroring the Civic Editorial prototype.
 * The dot carries the status hue; the label stays foreground/accent so small
 * text never relies on ochre (which fails contrast below ~12px).
 */
function YourAsksRail({ asks: allAsks }: { asks: HomeRecentAsk[] }) {
  // Cap at 3 so the suggestions section crests the fold; "See all" covers the rest.
  const asks = allAsks.slice(0, 3)
  const hasAsks = asks.length > 0

  return (
    <aside
      className={`flex h-fit w-full flex-col rounded-md border bg-card ${
        hasAsks
          ? 'gap-3.5 border-border p-[18px_20px] shadow-hero'
          : 'gap-2.5 border-border/70 p-[14px_16px] shadow-none'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="bc-section-kicker">Your asks</p>
        <Link
          href="/inbox"
          className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          See all
        </Link>
      </div>
      {asks.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {asks.map((ask, i) => {
            const meta = askStatusMeta(ask)
            return (
              <li
                key={ask.id}
                className={
                  i < asks.length - 1
                    ? 'flex items-start gap-2.5 border-b border-muted pb-2.5'
                    : 'flex items-start gap-2.5'
                }
              >
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${meta.dotClass}`}
                  aria-hidden
                />
                <Link href={`/ask/${ask.id}`} className="group min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug text-foreground group-hover:text-primary">
                    {ask.summary}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${meta.labelClass}`}>{meta.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">·</span>
                    <span className="font-mono text-xs text-muted-foreground">{meta.stamp}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="py-0.5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No active asks yet. Start above when you know what you want to ask.
          </p>
          <Link
            href="/people"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-link hover:text-link-hover"
          >
            Browse helpers
            <ArrowRight className="size-3" />
          </Link>
        </div>
      )}
    </aside>
  )
}

function askStatusMeta(ask: HomeRecentAsk): {
  label: string
  dotClass: string
  labelClass: string
  stamp: string
} {
  const ago = formatDistanceToNow(new Date(ask.createdAt), { addSuffix: true })
  switch (ask.status) {
    case 'accepted':
      return {
        label: 'Active',
        dotClass: 'bg-accent-sage',
        labelClass: 'text-accent-sage',
        stamp: ask.respondedAt
          ? `replied ${formatDistanceToNow(new Date(ask.respondedAt), { addSuffix: true })}`
          : ago,
      }
    case 'declined':
      // Dignified on the asker's side: the rust dot carries the state; the
      // word "declined" never faces the asker (voice guidelines § decline copy).
      return {
        label: 'Not this time',
        dotClass: 'bg-accent-rust',
        labelClass: 'text-muted-foreground',
        stamp: ago,
      }
    case 'expired':
      return {
        label: 'Expired',
        dotClass: 'bg-muted-foreground',
        labelClass: 'text-muted-foreground',
        stamp: ago,
      }
    default:
      return {
        label: 'Waiting',
        dotClass: 'bg-accent-ochre',
        labelClass: 'text-foreground',
        stamp: `sent ${ago}`,
      }
  }
}

function toPerson(member: HomeFeed['openMentors'][number]): HelpNetworkPerson {
  return {
    userId: member.userId,
    name: member.name,
    avatarUrl: member.avatarUrl,
    graduationYear: member.graduationYear,
    currentTitle: member.currentTitle,
    currentEmployer: member.currentEmployer,
    city: member.city,
    university: member.university,
    major: member.major,
    isOpenAsMentor: true,
    isOpenAsAdviceHelper: true,
    mentoringTopics: null,
  }
}
