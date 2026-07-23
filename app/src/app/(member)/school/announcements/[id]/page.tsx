import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { loadSchoolAnnouncement } from '@/lib/school/operations'
import { ArchiveHeader } from '../../archive-header'
import { MarkAnnouncementRead } from './mark-announcement-read'

export default async function SchoolAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()
  const announcement = await loadSchoolAnnouncement(
    membership.membershipId,
    id,
    createSchoolRepository(client),
  )
  if (!announcement) notFound()

  return (
    <div className="min-h-full bg-surface-canvas">
      <ArchiveHeader title={announcement.title} />
      <MarkAnnouncementRead announcementId={announcement.id} />
      <div className="mx-auto w-full max-w-[680px] px-5 py-8 sm:py-12">
        <article>
          <p className="text-overline font-bold tracking-caps text-action-weak-text uppercase">
            {announcement.tag}
          </p>
          <h1 className="mt-3 font-heading text-display-md font-bold leading-tight tracking-heading text-text-primary text-balance sm:text-display-event">
            {announcement.title}
          </h1>
          <p className="mt-4 text-caption font-semibold text-text-secondary">
            {announcement.authorName ?? 'Chadwick School'} · {formatDate(announcement.publishedAt)}
          </p>
          <div className="mt-8 space-y-5 border-t border-divider-row pt-7 text-body leading-[1.75] font-medium whitespace-pre-line text-text-secondary">
            {announcement.body}
          </div>
        </article>
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
