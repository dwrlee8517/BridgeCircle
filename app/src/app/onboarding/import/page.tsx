import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getImportCurrentProfile } from '@/lib/profile/importCurrentProfile'
import { ImportFlow, type ImportSource } from '../../(member)/profile/import/import-flow'

type SearchParams = { return?: string; source?: string }

export default async function OnboardingImportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession('/onboarding/import')
  const params = await searchParams
  const source: ImportSource = params.source === 'resume' ? 'resume' : 'linkedin'
  const returnTo = onboardingReturnTo(params.return, source)
  const switchSource: ImportSource = source === 'linkedin' ? 'resume' : 'linkedin'
  const switchHref = onboardingImportHref(returnTo, switchSource)
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: userRow } = await admin
    .from('users')
    .select('onboarding_completed_at')
    .eq('id', session.userId)
    .maybeSingle()

  if (userRow?.onboarding_completed_at) {
    redirect(`/profile/import?source=${source}&return=${encodeURIComponent('/profile/edit')}`)
  }

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/onboarding')

  const current = await getImportCurrentProfile(supabase, session.userId)
  const copy =
    source === 'linkedin'
      ? {
          eyebrow: 'LinkedIn import',
          title: 'Import your profile from LinkedIn.',
          description:
            'Paste your LinkedIn URL. We pull current role, career history, education, and skills, then you review every field before saving.',
          switchLabel: 'Use a resume/CV instead',
        }
      : {
          eyebrow: 'Resume/CV import',
          title: 'Import your profile from a resume or CV.',
          description:
            'Upload a PDF, DOCX, or PNG. We extract career history, education, and skills, then you review every field before saving.',
          switchLabel: 'Use a LinkedIn URL instead',
        }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" aria-label="BridgeCircle home" className="inline-flex">
          <span className="bc-fraunces text-xl font-bold tracking-tight text-foreground">
            Bridge<span className="text-primary">Circle</span>
          </span>
        </Link>
        <Link href={returnTo} className="text-sm text-muted-foreground hover:text-foreground">
          Back to onboarding
        </Link>
      </header>

      <section className="space-y-3">
        <p className="text-kicker font-semibold uppercase tracking-hero text-muted-foreground">
          {copy.eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {copy.title}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
      </section>

      <Card className="mt-8">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{source === 'linkedin' ? 'LinkedIn URL' : 'Resume/CV file'}</CardTitle>
              <CardDescription>
                {source === 'linkedin'
                  ? 'A single import can fill the next onboarding steps.'
                  : 'PDF, DOCX, or a PNG screenshot of your resume works.'}
              </CardDescription>
            </div>
            <Link
              href={switchHref}
              className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
            >
              {copy.switchLabel}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ImportFlow current={current} returnTo={returnTo} source={source} />
        </CardContent>
      </Card>
    </main>
  )
}

function onboardingReturnTo(raw: string | undefined, source: ImportSource) {
  const fallback = source === 'resume' ? '/onboarding?step=4' : '/onboarding?step=3'
  if (!raw) return fallback
  if (raw === '/onboarding' || raw.startsWith('/onboarding?')) return raw
  return fallback
}

function onboardingImportHref(returnTo: string, source: ImportSource) {
  return `/onboarding/import?source=${source}&return=${encodeURIComponent(returnTo)}`
}
