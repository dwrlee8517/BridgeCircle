import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { parseSearchParams } from '@/lib/search/schemas'
import { searchAlumni, type SearchHit } from '@/lib/search/searchAlumni'

type RawSearchParams = Record<string, string | string[] | undefined>

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const session = await requireSession()
  const supabase = await createClient()
  const params = await searchParams
  const filters = parseSearchParams(params)

  const { data: viewerMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!viewerMembership) {
    return null
  }

  const [{ data: viewerBase }, { data: viewerOrgProfile }] = await Promise.all([
    supabase
      .from('base_profiles')
      .select('university, major, city')
      .eq('user_id', session.userId)
      .maybeSingle(),
    supabase
      .from('organization_profiles')
      .select('graduation_year')
      .eq('organization_membership_id', viewerMembership.id)
      .maybeSingle(),
  ])

  const hits = await searchAlumni(supabase, {
    organizationId: viewerMembership.organization_id,
    viewerId: session.userId,
    viewerUniversity: viewerBase?.university ?? null,
    viewerMajor: viewerBase?.major ?? null,
    viewerCity: viewerBase?.city ?? null,
    viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
    filters,
  })

  const orgName = (viewerMembership.organizations as { name: string } | null)?.name ?? 'your network'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search {orgName}</h1>
        <p className="text-sm text-muted-foreground">
          Find alumni by background, role, or location. Mentors who are open appear first.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form method="get" className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                placeholder="name, employer, role, university…"
                defaultValue={filters.q ?? ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={filters.city ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employer">Employer</Label>
              <Input id="employer" name="employer" defaultValue={filters.employer ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="university">University</Label>
              <Input id="university" name="university" defaultValue={filters.university ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="major">Major</Label>
              <Input id="major" name="major" defaultValue={filters.major ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic">Mentor topic</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="consulting, product, …"
                defaultValue={filters.topic ?? ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="gradYearMin">Grad year ≥</Label>
                <Input
                  id="gradYearMin"
                  name="gradYearMin"
                  inputMode="numeric"
                  pattern="\d{4}"
                  defaultValue={filters.gradYearMin?.toString() ?? ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gradYearMax">Grad year ≤</Label>
                <Input
                  id="gradYearMax"
                  name="gradYearMax"
                  inputMode="numeric"
                  pattern="\d{4}"
                  defaultValue={filters.gradYearMax?.toString() ?? ''}
                />
              </div>
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="openToMentor"
                  defaultChecked={!!filters.openToMentor}
                  className="h-4 w-4"
                  suppressHydrationWarning
                />
                Only show mentors
              </label>
              <div className="ml-auto flex gap-2">
                <Button type="submit">Search</Button>
                <Button type="reset" variant="outline" asChild>
                  <a href="/search">Clear</a>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {hits.length} {hits.length === 1 ? 'result' : 'results'}
        </p>
        {hits.map((h) => (
          <ResultCard key={h.userId} hit={h} />
        ))}
        {hits.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No alumni matched these filters. Try removing one.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function ResultCard({ hit }: { hit: SearchHit }) {
  return (
    <Link href={`/profile/${hit.userId}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-4 pt-5">
          <Avatar className="size-12">
            {hit.avatarUrl ? <AvatarImage src={hit.avatarUrl} alt={hit.name ?? ''} /> : null}
            <AvatarFallback>{(hit.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{hit.name}</span>
              {hit.graduationYear ? (
                <span className="text-sm text-muted-foreground">'{`${hit.graduationYear}`.slice(-2)}</span>
              ) : null}
              {hit.isOpenAsMentor ? (
                <Badge variant="default">Mentor</Badge>
              ) : hit.mentorPaused ? (
                <Badge variant="outline">Paused</Badge>
              ) : null}
            </div>
            {hit.headline ? (
              <p className="text-sm text-muted-foreground">{hit.headline}</p>
            ) : null}
            <p className="text-sm">
              {[hit.currentTitle, hit.currentEmployer].filter(Boolean).join(' · ')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {[hit.city, [hit.university, hit.major].filter(Boolean).join(', ')]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">{hit.reason}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
