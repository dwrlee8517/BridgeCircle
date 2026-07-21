import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { loadNewsletterIssue } from '@/lib/school/operations'
import { ArchiveHeader } from '../../archive-header'

export default async function NewsletterIssuePage({
  params,
}: {
  params: Promise<{ issue: string }>
}) {
  const { issue: slug } = await params
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()
  const issue = await loadNewsletterIssue(
    membership.membershipId,
    slug,
    createSchoolRepository(client),
  )
  if (!issue) notFound()

  return (
    <div className="min-h-full bg-surface-canvas">
      <ArchiveHeader title={issue.title} />
      <div className="mx-auto w-full max-w-[680px] px-5 py-8 sm:py-12">
        <article>
          <p className="text-overline font-bold tracking-caps text-action-weak-text uppercase">
            Newsletter · Issue {issue.issueNumber}
          </p>
          <h1 className="mt-3 font-heading text-display-md font-black leading-tight tracking-heading text-text-primary text-balance sm:text-display-event">
            {issue.title}
          </h1>
          {issue.summary ? (
            <p className="mt-4 text-body leading-relaxed text-text-secondary">{issue.summary}</p>
          ) : null}
          <p className="mt-3 text-caption font-semibold text-text-secondary">
            {formatDate(issue.publishedAt)}
          </p>
          <div className="mt-8 space-y-9 border-t border-divider-row pt-8">
            {issue.sections.map((section) => (
              <section key={section.id}>
                <h2 className="text-section-title font-extrabold tracking-heading text-text-primary">
                  {section.heading}
                </h2>
                <p className="mt-3 text-body leading-[1.75] whitespace-pre-line text-text-secondary">
                  {section.body}
                </p>
                {section.linkLabel && section.linkUrl ? (
                  <a
                    href={section.linkUrl}
                    className="mt-3 inline-block text-control font-bold text-action-weak-text"
                  >
                    {section.linkLabel} <span aria-hidden="true">→</span>
                  </a>
                ) : null}
              </section>
            ))}
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
