import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'

type Params = { id: string }

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()
  const profile = await getProfile(supabase, id)

  if (!profile) notFound()

  const isSelf = profile.userId === session.userId

  // Mentorship state with this user (only meaningful when viewing someone else)
  let mentorshipState: 'none' | 'pending_outgoing' | 'pending_incoming' | 'active' = 'none'
  let relatedRequestId: string | null = null
  let relatedThreadId: string | null = null

  if (!isSelf) {
    const { data: req } = await supabase
      .from('mentorship_requests')
      .select('id, mentor_id, mentee_id, status')
      .or(
        `and(mentor_id.eq.${id},mentee_id.eq.${session.userId}),and(mentor_id.eq.${session.userId},mentee_id.eq.${id})`,
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (req) {
      relatedRequestId = req.id
      if (req.status === 'pending') {
        mentorshipState =
          req.mentor_id === session.userId ? 'pending_incoming' : 'pending_outgoing'
      } else if (req.status === 'accepted') {
        mentorshipState = 'active'
        const { data: thread } = await supabase
          .from('mentorship_threads')
          .select('id')
          .eq('request_id', req.id)
          .maybeSingle()
        relatedThreadId = thread?.id ?? null
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Link href="/search" className="text-sm text-muted-foreground hover:underline">
        ← Back to search
      </Link>

      <Card>
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <Avatar className="size-20">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.name ?? ''} />
            ) : null}
            <AvatarFallback className="text-2xl">
              {(profile.name ?? '?').slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              {profile.graduationYear ? (
                <span className="text-base text-muted-foreground">
                  Class of {profile.graduationYear}
                </span>
              ) : null}
              {profile.isOpenAsMentor ? (
                <Badge variant="default">Open to mentor</Badge>
              ) : profile.mentorPaused ? (
                <Badge variant="outline">Paused while away</Badge>
              ) : null}
            </div>
            {profile.headline ? (
              <p className="text-base text-muted-foreground">{profile.headline}</p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Section title="Now">
            <Row label="Role">
              {[profile.currentTitle, profile.currentEmployer].filter(Boolean).join(' · ') || '—'}
            </Row>
            <Row label="City">{profile.city ?? '—'}</Row>
          </Section>

          <Section title="Education">
            <Row label="University">{profile.university ?? '—'}</Row>
            <Row label="Major">{profile.major ?? '—'}</Row>
          </Section>

          {profile.bio ? (
            <Section title="Bio">
              <p className="text-sm whitespace-pre-line">{profile.bio}</p>
            </Section>
          ) : null}

          {profile.mentoringTopics && profile.mentoringTopics.length > 0 ? (
            <Section title="Mentoring topics">
              <div className="flex flex-wrap gap-1.5">
                {profile.mentoringTopics.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </Section>
          ) : null}

          {/*
            Per phase-1-launch-spec.md:32, contact links (LinkedIn URL) are
            friends-only by default. Friendships ship in week 3+, so at launch
            this means: only the profile owner sees their own LinkedIn URL.
            When friendships land, this gate broadens to (isSelf || isFriend).
          */}
          {profile.linkedinUrl && isSelf ? (
            <Section title="Links">
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                LinkedIn
              </a>
            </Section>
          ) : null}

          <div className="flex gap-2 pt-2">
            {isSelf ? (
              <Button asChild>
                <Link href="/profile/edit">Edit profile</Link>
              </Button>
            ) : (
              <MentorshipAction
                profileUserId={profile.userId}
                isOpenAsMentor={profile.isOpenAsMentor}
                state={mentorshipState}
                relatedRequestId={relatedRequestId}
                relatedThreadId={relatedThreadId}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

function MentorshipAction({
  profileUserId,
  isOpenAsMentor,
  state,
  relatedRequestId,
  relatedThreadId,
}: {
  profileUserId: string
  isOpenAsMentor: boolean
  state: 'none' | 'pending_outgoing' | 'pending_incoming' | 'active'
  relatedRequestId: string | null
  relatedThreadId: string | null
}) {
  if (state === 'active' && relatedThreadId) {
    return (
      <Button asChild>
        <Link href={`/mentorship/thread/${relatedThreadId}`}>Open mentorship thread</Link>
      </Button>
    )
  }
  if (state === 'pending_outgoing' && relatedRequestId) {
    return (
      <Button asChild variant="outline">
        <Link href={`/mentorship/request/${relatedRequestId}`}>Request pending — view</Link>
      </Button>
    )
  }
  if (state === 'pending_incoming' && relatedRequestId) {
    return (
      <Button asChild>
        <Link href={`/mentorship/request/${relatedRequestId}`}>Review their request</Link>
      </Button>
    )
  }
  if (!isOpenAsMentor) {
    return (
      <Button variant="outline" disabled>
        Not open to mentor right now
      </Button>
    )
  }
  return (
    <Button asChild>
      <Link href={`/mentorship/request/new?to=${profileUserId}`}>Send mentorship request</Link>
    </Button>
  )
}
