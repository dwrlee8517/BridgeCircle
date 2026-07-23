import { Pin } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { loadSchoolAnnouncements } from '@/lib/school/operations'
import { announcementFilterHref, parseAnnouncementFilter } from '@/lib/school/query'
import { cn } from '@/lib/utils'
import { ArchiveHeader } from '../archive-header'

const filters = [
  ['all', 'All'],
  ['mentorship', 'Career guidance'],
  ['hiring', 'Hiring'],
  ['reunion', 'Reunion'],
  ['general', 'General'],
] as const

export default async function SchoolAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>
}) {
  const filter = parseAnnouncementFilter((await searchParams).tag)
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()
  const items = await loadSchoolAnnouncements(
    membership.membershipId,
    filter,
    createSchoolRepository(client),
  )
  if (!items) notFound()

  return (
    <div className="min-h-full bg-surface-canvas">
      <ArchiveHeader title="Announcements" />
      <div className="mx-auto w-full max-w-[680px] px-4 py-6 sm:px-7 sm:py-8">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Announcement filters</legend>
          {filters.map(([value, label]) => (
            <Link
              key={value}
              href={announcementFilterHref(value)}
              aria-current={filter === value ? 'page' : undefined}
              className={cn(
                'rounded-full px-4 py-2 text-chip font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                filter === value
                  ? 'bg-primary-tint-strong text-action-weak-text ring-1 ring-action-primary/25'
                  : 'bg-surface-card text-text-secondary shadow-sm ring-1 ring-border-subtle hover:bg-surface-subtle',
              )}
            >
              {label}
            </Link>
          ))}
        </fieldset>

        <section
          className="mt-5 overflow-hidden rounded-2xl bg-surface-card shadow-card ring-1 ring-border-subtle"
          aria-label="Announcements"
        >
          {items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/school/announcements/${item.id}`}
                className={cn(
                  'flex gap-4 border-t border-divider-row px-5 py-4 first:border-t-0 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring sm:px-6',
                  item.pinned && 'bg-primary-tint/60 shadow-[inset_3px_0_0_var(--action-primary)]',
                )}
              >
                <span className="mt-1.5 flex size-5 shrink-0 items-center justify-center">
                  {item.pinned ? (
                    <Pin className="size-4 text-action-weak-text" aria-label="Pinned" />
                  ) : item.unread ? (
                    <>
                      <span className="size-2 rounded-full bg-action-primary" aria-hidden="true" />
                      <span className="sr-only">Unread</span>
                    </>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-fine font-bold tracking-caps text-text-muted uppercase">
                    {item.tag} · {formatPublished(item.publishedAt)}
                  </span>
                  <span className="mt-1 block text-body font-bold text-text-primary">
                    {item.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-caption leading-relaxed text-text-secondary">
                    {item.summary}
                  </span>
                </span>
                <span
                  className="self-center text-caption font-bold text-text-muted"
                  aria-hidden="true"
                >
                  ›
                </span>
              </Link>
            ))
          ) : (
            <div className="px-6 py-14 text-center">
              <h2 className="text-body font-bold text-text-primary">Nothing in this section yet</h2>
              <p className="mt-2 text-caption text-text-secondary">
                Try All, or come back when the school has another note.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function formatPublished(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
