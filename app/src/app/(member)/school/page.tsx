import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Pin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/db/server'
import { type AnnouncementRow, listAnnouncements } from '@/lib/announcements/listAnnouncements'
import { requireSession } from '@/lib/auth/session'
import type { EventAttendee } from '@/lib/events/attendeePreviewHelpers'
import { listAttendeePreviewsByEvent } from '@/lib/events/listAttendeePreviewsByEvent'
import { listEvents } from '@/lib/events/listEvents'
import { displayOrgName } from '@/lib/utils'
import { SchoolEventsMasterDetail } from './school-events-master-detail'
import { SchoolHubSections } from './school-hub-sections'

const ATTENDEE_PREVIEW_LIMIT = 5

export default async function SchoolPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations!organization_memberships_organization_id_fkey(name)')
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
  const latestAnnouncement = announcements[0] ?? null
  const otherAnnouncements = announcements.slice(1)
  const attendeesMap = await listAttendeePreviewsByEvent(
    supabase,
    events.map((event) => event.id),
    ATTENDEE_PREVIEW_LIMIT,
  )
  const attendeesByEvent: Record<string, EventAttendee[]> = {}
  for (const [eventId, attendees] of attendeesMap) attendeesByEvent[eventId] = attendees

  return (
    <main className="min-h-full bg-background pb-16">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        <div className="mb-5">
          <p className="bc-section-kicker mb-3">{orgName}</p>
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground sm:text-[34px]">
            School circle
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Events, announcements, and timely updates from the verified school community.
          </p>
        </div>

        {latestAnnouncement ? <PinnedAnnouncementBanner announcement={latestAnnouncement} /> : null}

        <SchoolHubSections
          eventCount={events.length}
          announcementCount={otherAnnouncements.length}
          events={
            <SchoolEventsSection
              events={events}
              attendeesByEvent={attendeesByEvent}
              orgName={orgName}
              isAdmin={isAdmin}
            />
          }
          announcements={
            <SchoolAnnouncementsSection
              latestAnnouncement={latestAnnouncement}
              otherAnnouncements={otherAnnouncements}
              orgName={orgName}
              isAdmin={isAdmin}
            />
          }
        />
      </section>
    </main>
  )
}

function SchoolEventsSection({
  events,
  attendeesByEvent,
  orgName,
  isAdmin,
}: {
  events: Awaited<ReturnType<typeof listEvents>>
  attendeesByEvent: Record<string, EventAttendee[]>
  orgName: string
  isAdmin: boolean
}) {
  if (events.length > 0) {
    return (
      <SchoolEventsMasterDetail
        events={events}
        attendeesByEvent={attendeesByEvent}
        orgName={orgName}
      />
    )
  }

  return (
    <div>
      <div className="mb-3 border-t border-border pt-5">
        <p className="bc-section-kicker mb-3">Upcoming · 0 events</p>
        <h2 className="font-heading text-[22px] font-semibold leading-tight text-foreground">
          On the calendar
        </h2>
      </div>
      <EmptySchoolState
        title="No upcoming events yet"
        body="When admins publish dinners, panels, campus visits, or local gatherings, they will appear here."
        href={isAdmin ? '/admin/events' : '/events'}
        cta={isAdmin ? 'Create event' : 'Open events'}
      />
    </div>
  )
}

function SchoolAnnouncementsSection({
  latestAnnouncement,
  otherAnnouncements,
  orgName,
  isAdmin,
}: {
  latestAnnouncement: AnnouncementRow | null
  otherAnnouncements: AnnouncementRow[]
  orgName: string
  isAdmin: boolean
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
      <div className="border-t border-border pt-5">
        <p className="bc-section-kicker mb-3">Announcements · {otherAnnouncements.length}</p>
        <h2 className="font-heading text-lg font-semibold leading-tight text-foreground">
          From the office
        </h2>
      </div>

      {otherAnnouncements.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-card">
          {otherAnnouncements.map((announcement, index) => (
            <Link
              key={announcement.id}
              href="/announcements"
              className={
                index === 0
                  ? 'block p-4 transition-colors hover:bg-surface-panel/55'
                  : 'block border-t border-border p-4 transition-colors hover:bg-surface-panel/55'
              }
            >
              <p className="bc-card-label">Announcement</p>
              <h3 className="mt-1 font-heading text-sm font-semibold leading-snug text-foreground">
                {announcement.title}
              </h3>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {announcement.body ?? 'Latest update from your school circle.'}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {announcement.authorName ?? orgName}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(announcement.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : latestAnnouncement ? (
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          No other announcements right now.
        </div>
      ) : (
        <EmptySchoolState
          title="No announcements yet"
          body="Updates from admins will appear here."
          href={isAdmin ? '/admin/announcements' : '/announcements'}
          cta={isAdmin ? 'Post announcement' : 'Open archive'}
        />
      )}

      <div className="text-center">
        <Button asChild size="sm" variant="ghost" className="rounded-md text-muted-foreground">
          <Link href="/announcements">
            See all announcements
            <ArrowRight className="size-3.5" strokeWidth={1.6} />
          </Link>
        </Button>
      </div>
    </aside>
  )
}

function PinnedAnnouncementBanner({ announcement }: { announcement: AnnouncementRow }) {
  return (
    <Link
      href="/announcements"
      className="mb-5 flex flex-col gap-2 rounded-md border border-border px-4 py-3 transition-colors hover:bg-primary-tint/60 sm:flex-row sm:items-center sm:gap-3"
      style={{
        borderLeft: '3px solid var(--primary)',
        background: 'color-mix(in srgb, var(--primary) 5%, var(--card))',
      }}
    >
      <span className="flex items-center gap-3">
        <Pin className="size-3.5 shrink-0 text-primary" strokeWidth={1.8} />
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          Pinned announcement
        </span>
        <span className="hidden shrink-0 text-border sm:inline">·</span>
      </span>
      <span className="min-w-0 flex-1 font-heading text-sm font-semibold leading-snug text-foreground sm:truncate">
        {announcement.title}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground sm:ml-auto">
        {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
      </span>
      <ArrowRight className="hidden size-4 shrink-0 text-primary sm:block" />
    </Link>
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
    <div className="rounded-md border border-dashed border-border bg-card p-6">
      <p className="font-heading text-xl font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button asChild size="sm" variant="outline" className="mt-4 rounded-md">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}
