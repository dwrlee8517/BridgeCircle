import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventTime } from '@/components/ui/event-time'
import type { HomeEvent, HomeFeed } from '@/lib/home/getHomeFeed'
import {
  AskBar,
  FreshnessReviewCard,
  type HelpNetworkPerson,
  HelpOpportunityCard,
  MatchBriefCard,
  NetworkMotif,
  PromptChips,
  SchoolPulseCard,
} from './help-network-ui'

const PROMPTS = [
  'I want to move from consulting into product',
  'I need college advice from someone who studied in the US',
  'I am moving to Seoul and want to meet alumni nearby',
  'Can someone review my resume or portfolio?',
  'I want to understand finance careers after Chadwick',
  'I am looking for an ongoing mentor',
]

interface DashboardClientProps {
  feed: HomeFeed
  firstName: string
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
  viewerCity,
  isHelper,
}: DashboardClientProps) {
  const featuredEvent = feed.upcomingEvents[0] ?? null
  const peopleWhoCanHelp = feed.openMentors.slice(0, 3).map(toPerson)
  const peopleYouCouldHelp = feed.pendingMentorRequests.slice(0, 3)
  const fallbackHelp = feed.recentJoiners.slice(0, 3)

  return (
    <main className="min-h-screen bg-background">
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-10">
          <div className="flex min-w-0 flex-col justify-between gap-6">
            <div className="space-y-3">
              <p className="bc-section-kicker">
                {cohortYear ? `Class of ${cohortYear} · ` : ''}
                {orgDisplayName}
              </p>
              <div className="max-w-2xl space-y-2">
                <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Hi {firstName}. Who do you want to ask?
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Find someone who has been there, or offer help where your experience matters.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <AskBar />
              <PromptChips prompts={PROMPTS} />
            </div>
          </div>

          <NetworkMotif
            helperCount={feed.stats.openMentorsTotal}
            requestCount={feed.pendingMentorRequests.length}
            eventCount={feed.stats.upcomingEventsTotal}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.7fr)]">
          <div className="space-y-8">
            <SectionHeader
              kicker="Relationship path"
              title="People who can help you"
              body="Start from your question. These are open helpers and mentors from your trusted school circle."
              href="/ask"
              cta="Ask a question"
            />
            <div className="space-y-4">
              {peopleWhoCanHelp.length > 0 ? (
                peopleWhoCanHelp.map((person) => (
                  <MatchBriefCard key={person.userId} person={person} compact />
                ))
              ) : (
                <EmptyPanel
                  title="No open helpers surfaced yet"
                  body="Update your profile and try People search while the first helper supply is seeded."
                  href="/people"
                  cta="Explore people"
                />
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <SectionHeader
                kicker="Offer help"
                title="People you could help"
                body={
                  isHelper
                    ? 'Requests and likely fits where your experience can be useful.'
                    : 'Turn on advice or mentorship availability when you are ready to help.'
                }
                href="/help"
                cta="Open Help"
              />
              {peopleYouCouldHelp.length > 0 ? (
                <div className="grid gap-3">
                  {peopleYouCouldHelp.map((request) => (
                    <HelpOpportunityCard
                      key={request.id}
                      title={`${request.menteeName ?? 'Someone'} is asking for help`}
                      subtitle={
                        request.menteeGraduationYear
                          ? `Class of ${request.menteeGraduationYear}`
                          : 'School circle request'
                      }
                      body={
                        request.reason ??
                        request.helpNeeded ??
                        'Review their ask and reply if you can help.'
                      }
                      href={`/ask/${request.id}`}
                      cta="Review request"
                      tone="ochre"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {fallbackHelp.slice(0, 2).map((member) => (
                    <HelpOpportunityCard
                      key={member.userId}
                      title={`${member.name ?? 'A new member'} joined the circle`}
                      subtitle={
                        member.graduationYear ? `Class of ${member.graduationYear}` : 'New member'
                      }
                      body={buildJoinerHelpCopy(
                        member.currentTitle,
                        member.currentEmployer,
                        member.city,
                      )}
                      href={`/profile/${member.userId}`}
                      cta="See where you can help"
                    />
                  ))}
                  <HelpOpportunityCard
                    title={
                      isHelper ? 'Keep your helper settings current' : 'Make yourself available'
                    }
                    subtitle={viewerCity ? `Visible in ${viewerCity}` : 'Availability matters'}
                    body="Choose quick advice, ongoing mentorship, and the topics where classmates should find you."
                    href="/mentorship/settings"
                    cta="Update availability"
                    tone="plum"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <SectionHeader
                kicker="School signal"
                title="School pulse"
                body="Events and announcements stay close to the relationship work."
                href="/school"
                cta="Open School"
              />
              <div className="grid gap-3">
                {featuredEvent ? <HomeEventPulse event={featuredEvent} /> : null}
                {feed.latestAnnouncement ? (
                  <SchoolPulseCard
                    title={feed.latestAnnouncement.title}
                    meta="Announcement"
                    body={feed.latestAnnouncement.body ?? 'Latest update from your school circle.'}
                    href="/announcements"
                    kind="announcement"
                  />
                ) : null}
                {!featuredEvent && !feed.latestAnnouncement ? (
                  <EmptyPanel
                    title="No school updates yet"
                    body="Events and announcements will appear here as the circle starts moving."
                    href="/school"
                    cta="Open School"
                  />
                ) : null}
              </div>
            </div>

            <FreshnessReviewCard />
          </div>
        </div>
      </section>
    </main>
  )
}

function SectionHeader({
  title,
  body,
  href,
  cta,
  kicker,
}: {
  title: string
  body: string
  href: string
  cta: string
  kicker: string
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="bc-section-kicker mb-3">{kicker}</p>
        <h2 className="font-heading text-2xl font-semibold leading-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="w-fit rounded-[6px]">
        <Link href={href}>
          {cta}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  )
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
    <div className="rounded-[6px] border border-dashed border-border bg-card p-6">
      <p className="font-heading text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button asChild size="sm" variant="outline" className="mt-4 rounded-[6px]">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}

function HomeEventPulse({ event }: { event: HomeEvent }) {
  return (
    <SchoolPulseCard
      title={event.title}
      meta={
        <>
          <EventTime iso={event.startsAt} pattern="MMM d" /> · {event.goingCount} going
        </>
      }
      body={
        event.location
          ? `A school gathering at ${event.location}. See who is going and decide if it belongs on your calendar.`
          : 'A school gathering from your circle. See who is going and decide if it belongs on your calendar.'
      }
      href={`/events/${event.id}`}
      kind="event"
    />
  )
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

function buildJoinerHelpCopy(title: string | null, employer: string | null, city: string | null) {
  const role = [title, employer].filter(Boolean).join(' at ')
  if (role)
    return `${role}. A quick welcome or context from your path can make the network feel alive.`
  if (city) return `Based in ${city}. Local context is often the easiest first way to help.`
  return 'A quick welcome or useful pointer can make the network feel alive.'
}
