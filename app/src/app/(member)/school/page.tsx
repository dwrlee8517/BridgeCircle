import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, CalendarDays, Megaphone, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventTime } from '@/components/ui/event-time'
import { createClient } from '@/db/server'
import { listAnnouncements } from '@/lib/announcements/listAnnouncements'
import { requireSession } from '@/lib/auth/session'
import { listEvents } from '@/lib/events/listEvents'
import { displayOrgName } from '@/lib/utils'
import { SchoolPulseCard } from '../help-network-ui'

export default async function SchoolPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = displayOrgName((membership.organizations as { name: string } | null)?.name)
  // Synthesis P2-7: dropped active-membership count query — it only fed
  // the removed NetworkMotif.
  const [events, announcements, { data: adminRole }] = await Promise.all([
    listEvents(supabase, membership.organization_id, session.userId, { includePast: false }),
    listAnnouncements(supabase, membership.organization_id, { limit: 5 }),
    supabase
      .from('admin_role_assignments')
      .select('role')
      .eq('user_id', session.userId)
      .eq('organization_id', membership.organization_id)
      .in('role', ['super_admin', 'admin'])
      .limit(1)
      .maybeSingle(),
  ])

  const isAdmin = !!adminRole
  const featuredEvent = events[0] ?? null
  const latestAnnouncement = announcements[0] ?? null

  return (
    <main className="min-h-screen bg-background">
      {/* Synthesis P2-7: removed NetworkMotif. School is a content-led hub;
          let events and announcements own the page. P1-6: demoted hero. */}
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-8">
          <div className="space-y-5">
            <p className="bc-section-kicker">
              School pulse · {orgName}
            </p>
            <div className="max-w-2xl space-y-2">
              <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground">
                Feel connected to what is happening around the school.
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                Events, announcements, and community updates sit in one place so the network feels
                current without becoming a noisy feed.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-[6px]">
                <Link href="/events">
                  <CalendarDays className="size-4" />
                  View events
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-[6px]">
                <Link href="/announcements">
                  <Megaphone className="size-4" />
                  Read announcements
                </Link>
              </Button>
              {/* Synthesis: admin actions stay quieter than member actions */}
              {isAdmin ? (
                <Button asChild size="sm" variant="ghost" className="self-center rounded-[6px]">
                  <Link href="/admin/events">
                    <Plus className="size-4" />
                    Create event
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="bc-section-kicker mb-3">Calendar signal</p>
                <h2 className="font-heading text-2xl font-semibold leading-tight text-foreground">
                  Upcoming events
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  School gatherings become more useful when they connect to people you may want to
                  meet.
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="w-fit rounded-[6px]">
                <Link href="/events">
                  Events archive
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {events.length > 0 ? (
              <div className="relative space-y-3">
                <div className="bc-timeline-line absolute bottom-4 left-[17px] top-4 hidden w-px sm:block" />
                {events.slice(0, 4).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group relative flex gap-4 rounded-[8px] border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
                  >
                    <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-tint text-primary">
                      <CalendarDays className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                        <EventTime iso={event.startsAt} />
                      </p>
                      <h3 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground">
                        {event.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {event.description ??
                          'A school gathering for your circle. See details, RSVP, and find who else is going.'}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{event.goingCount} going</span>
                        {event.location ? <span>· {event.location}</span> : null}
                        {event.viewerRsvp ? (
                          <span>· You are {event.viewerRsvp.replace('_', ' ')}</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="hidden items-center gap-1.5 self-center text-sm font-semibold text-link group-hover:text-link-hover sm:inline-flex">
                      View
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptySchoolState
                title="No upcoming events yet"
                body="When admins publish dinners, panels, campus visits, or local gatherings, they will appear here."
                href={isAdmin ? '/admin/events' : '/events'}
                cta={isAdmin ? 'Create event' : 'Open events'}
              />
            )}
          </div>

          <aside className="space-y-6">
            <div className="space-y-4 border-t border-border pt-5">
              <div>
                <p className="bc-section-kicker mb-3">Official pulse</p>
                <h2 className="font-heading text-2xl font-semibold leading-tight text-foreground">
                  Announcements
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  The latest official updates from the school circle.
                </p>
              </div>

              {latestAnnouncement ? (
                <SchoolPulseCard
                  title={latestAnnouncement.title}
                  meta={`Posted ${formatDistanceToNow(new Date(latestAnnouncement.publishedAt), { addSuffix: true })}`}
                  body={latestAnnouncement.body ?? 'Latest update from your school circle.'}
                  href="/announcements"
                  kind="announcement"
                />
              ) : (
                <EmptySchoolState
                  title="No announcements yet"
                  body="Updates from admins will appear here."
                  href={isAdmin ? '/admin/announcements' : '/announcements'}
                  cta={isAdmin ? 'Post announcement' : 'Open archive'}
                />
              )}
            </div>

            {featuredEvent ? (
              <div className="rounded-[8px] border border-border bg-card p-5 shadow-sm">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Next gathering
                </p>
                <p className="mt-2 font-heading text-xl font-semibold leading-tight text-foreground">
                  {featuredEvent.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {featuredEvent.goingCount} people are going. RSVP, then use People to find who you
                  may want to meet before the event.
                </p>
                <Button asChild className="mt-5 rounded-[6px]">
                  <Link href={`/events/${featuredEvent.id}`}>Open event</Link>
                </Button>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  )
}

function EmptySchoolState({
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
    <div className="rounded-[8px] border border-dashed border-border bg-card p-6">
      <p className="font-heading text-xl font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button asChild size="sm" variant="outline" className="mt-4 rounded-[6px]">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}
