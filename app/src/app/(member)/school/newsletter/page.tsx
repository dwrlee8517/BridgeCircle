import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { loadNewsletterIssues } from '@/lib/school/operations'
import { ArchiveHeader } from '../archive-header'

export default async function NewsletterArchivePage() {
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()
  const issues = await loadNewsletterIssues(membership.membershipId, createSchoolRepository(client))
  if (!issues) notFound()

  return (
    <div className="min-h-full bg-surface-canvas">
      <ArchiveHeader title="Newsletter" />
      <div className="mx-auto w-full max-w-[820px] px-4 py-7 sm:px-7 sm:py-10">
        <header className="mb-6">
          <p className="text-overline font-bold tracking-caps text-text-muted uppercase">Archive</p>
          <h1 className="mt-1 font-heading text-page-title font-black tracking-heading text-text-primary">
            Notes worth keeping
          </h1>
          <p className="mt-2 text-control text-text-secondary">
            Campus news and small stories from the alumni circle, newest first.
          </p>
        </header>
        <section className="space-y-3" aria-label="Newsletter issues">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/school/newsletter/${issue.slug}`}
              className="block rounded-2xl bg-surface-card px-5 py-5 shadow-card ring-1 ring-border-subtle transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:px-6"
            >
              <span className="text-fine font-bold tracking-caps text-text-muted uppercase">
                Issue {issue.issueNumber} · {formatMonth(issue.publishedAt)}
              </span>
              <span className="mt-1.5 block text-body font-extrabold text-text-primary">
                {issue.title}
              </span>
              {issue.summary ? (
                <span className="mt-1 block text-caption leading-relaxed text-text-secondary">
                  {issue.summary}
                </span>
              ) : null}
            </Link>
          ))}
          {issues.length === 0 ? (
            <p className="rounded-2xl bg-surface-card px-6 py-12 text-center text-caption text-text-muted shadow-card ring-1 ring-border-subtle">
              The first issue will appear here.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(value),
  )
}
