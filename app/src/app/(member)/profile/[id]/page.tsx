import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getFriendshipState } from '@/lib/friendship/friendshipState'
import { getProfile } from '@/lib/profile/getProfile'
import { startThreadAction } from '../../messages/[id]/actions'
import { FriendshipAction } from './friendship-action'

type Params = { id: string }

export default async function ProfileDetailPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()
  const profile = await getProfile(supabase, id, session.userId)

  if (!profile) notFound()

  const isSelf = profile.isSelf
  const isFriend = profile.isFriend

  // Mentorship state with this user (only meaningful when viewing someone else)
  let mentorshipState: 'none' | 'pending_outgoing' | 'pending_incoming' | 'active' = 'none'
  let relatedRequestId: string | null = null
  let relatedThreadId: string | null = null

  // Full friendship enum — needed for the CTA button which has more states
  // (pending_outgoing, pending_incoming) than the boolean profile.isFriend.
  const friendship = isSelf
    ? { kind: 'self' as const }
    : await getFriendshipState(supabase, session.userId, id)
  const friendshipActionKind: 'friends' | 'pending_outgoing' | 'pending_incoming' | 'none' =
    friendship.kind === 'self'
      ? 'none'
      : friendship.kind === 'friends'
        ? 'friends'
        : friendship.kind === 'pending_outgoing'
          ? 'pending_outgoing'
          : friendship.kind === 'pending_incoming'
            ? 'pending_incoming'
            : 'none'

  if (!isSelf) {
    // Surface the most recent mentorship-type ask either direction. Advice
    // asks intentionally don't drive the profile-detail mentorship CTA —
    // they're lower-burden one-off conversations, not a relationship state
    // we want to surface as "in progress" on a profile page.
    const { data: req } = await supabase
      .from('asks')
      .select('id, helper_id, asker_id, status')
      .eq('ask_type', 'mentorship')
      .or(
        `and(helper_id.eq.${id},asker_id.eq.${session.userId}),and(helper_id.eq.${session.userId},asker_id.eq.${id})`,
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (req) {
      relatedRequestId = req.id
      if (req.status === 'pending') {
        mentorshipState = req.helper_id === session.userId ? 'pending_incoming' : 'pending_outgoing'
      } else if (req.status === 'accepted') {
        mentorshipState = 'active'
        const { data: thread } = await supabase
          .from('ask_threads')
          .select('id')
          .eq('ask_id', req.id)
          .maybeSingle()
        relatedThreadId = thread?.id ?? null
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <Link href="/discover" className="text-sm text-muted-foreground hover:underline">
        ← Back to discover
      </Link>

      <Card className="mt-6 overflow-hidden p-0">
        <CardHeader className="relative flex-row items-start gap-5 overflow-hidden bg-[linear-gradient(135deg,#0b1220_0%,#131b2e_55%,#1e293b_100%)] p-7 text-white sm:p-8">
          <div
            aria-hidden
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: 'radial-gradient(rgba(180,197,255,0.10) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <svg
            aria-hidden="true"
            role="presentation"
            viewBox="0 0 200 200"
            className="absolute -right-10 -top-10 h-[200px] w-[200px] opacity-20"
          >
            <title>Decorative two-circle motif</title>
            <circle cx="80" cy="100" r="60" fill="none" stroke="#b4c5ff" strokeWidth="1.5" />
            <circle cx="130" cy="100" r="60" fill="none" stroke="#316bf3" strokeWidth="1.5" />
          </svg>
          <Avatar className="relative size-20 after:border-white/20">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.name ?? ''} />
            ) : null}
            <AvatarFallback className="bg-[#316bf3] text-2xl font-bold text-white">
              {(profile.name ?? '?').slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="relative flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle
                className="bc-fraunces text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
                style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
              >
                {profile.name}
              </CardTitle>
              {profile.graduationYear ? (
                <span className="inline-flex h-6 items-center rounded-full bg-white/15 px-2.5 text-xs font-semibold text-white">
                  Class of &apos;{`${profile.graduationYear}`.slice(-2)}
                </span>
              ) : null}
              {profile.isOpenAsMentor ? (
                <StatusBadge tone="open" dot>
                  Open to mentor
                </StatusBadge>
              ) : profile.mentorPaused ? (
                <StatusBadge tone="warn" dot>
                  Paused while away
                </StatusBadge>
              ) : null}
            </div>
            {profile.headline ? (
              <p className="max-w-2xl text-base leading-relaxed text-slate-300">
                {profile.headline}
              </p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-7 sm:p-8">
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
              <p className="bc-pull-quote text-sm whitespace-pre-line">{profile.bio}</p>
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

          {profile.careerHistory && profile.careerHistory.length > 0 ? (
            <Section title="Career history">
              <ol className="space-y-3">
                {profile.careerHistory.map((c) => (
                  <li
                    key={`${c.employer}|${c.title}|${c.start_date ?? ''}`}
                    className="space-y-0.5"
                  >
                    <div className="text-sm font-medium">
                      {c.title}
                      <span className="text-muted-foreground"> · {c.employer}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.start_date ?? '?'} – {c.end_date ?? 'present'}
                    </div>
                    {c.description ? (
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}

          {profile.educationHistory && profile.educationHistory.length > 0 ? (
            <Section title="Education history">
              <ol className="space-y-2">
                {profile.educationHistory.map((e) => (
                  <li key={`${e.school}|${e.start_date ?? ''}`} className="space-y-0.5">
                    <div className="text-sm font-medium">{e.school}</div>
                    {e.degree || e.field ? (
                      <div className="text-xs text-muted-foreground">
                        {[e.degree, e.field].filter(Boolean).join(', ')}
                      </div>
                    ) : null}
                    {e.start_date || e.end_date ? (
                      <div className="text-xs text-muted-foreground">
                        {e.start_date ?? '?'} – {e.end_date ?? '?'}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}

          {profile.skills && profile.skills.length > 0 ? (
            <Section title="Skills">
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </Section>
          ) : null}

          {/* linkedinUrl is server-redacted by getProfile per the profile
              owner's privacy settings (default: friends-only). A null here
              means either the field isn't set or the viewer can't see it —
              both render the same way. */}
          {profile.linkedinUrl ? (
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

          <div className="flex gap-2 pt-2 flex-wrap">
            {isSelf ? (
              <Button asChild>
                <Link href="/profile/edit">Edit profile</Link>
              </Button>
            ) : (
              <>
                <HelperAsks
                  profileUserId={profile.userId}
                  isOpenAsMentor={profile.isOpenAsMentor}
                  isOpenAsAdviceHelper={profile.isOpenAsAdviceHelper}
                  mentorshipState={mentorshipState}
                  relatedRequestId={relatedRequestId}
                  relatedThreadId={relatedThreadId}
                />
                <FriendshipAction profileUserId={profile.userId} state={friendshipActionKind} />
                {isFriend ? (
                  <form action={startThreadAction}>
                    <input type="hidden" name="receiverId" value={profile.userId} />
                    <Button type="submit" variant="outline">
                      Message
                    </Button>
                  </form>
                ) : null}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 border-t pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
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

/**
 * Helper-asks CTA cluster on the profile detail page.
 *
 * The mentorship-state path takes precedence: if there's an active or
 * pending mentorship ask between viewer and profile, we surface that
 * one button (open thread / view pending / review incoming). Otherwise
 * we render up to two "ask" buttons — advice and/or mentorship —
 * depending on what the helper is currently open to. Pause is honored
 * via the isOpenAs* flags from getProfile.
 *
 * Advice asks intentionally don't drive the relationship-state UI: they
 * are one-off, lower-stakes, and shouldn't gate the profile CTA. So a
 * pending advice ask doesn't turn this into "Pending — view"; both
 * sides can keep finding each other normally.
 */
function HelperAsks({
  profileUserId,
  isOpenAsMentor,
  isOpenAsAdviceHelper,
  mentorshipState,
  relatedRequestId,
  relatedThreadId,
}: {
  profileUserId: string
  isOpenAsMentor: boolean
  isOpenAsAdviceHelper: boolean
  mentorshipState: 'none' | 'pending_outgoing' | 'pending_incoming' | 'active'
  relatedRequestId: string | null
  relatedThreadId: string | null
}) {
  if (mentorshipState === 'active' && relatedThreadId) {
    return (
      <Button asChild>
        <Link href={`/ask/thread/${relatedThreadId}`}>Open mentorship thread</Link>
      </Button>
    )
  }
  if (mentorshipState === 'pending_outgoing' && relatedRequestId) {
    return (
      <Button asChild variant="outline">
        <Link href={`/ask/${relatedRequestId}`}>Request pending — view</Link>
      </Button>
    )
  }
  if (mentorshipState === 'pending_incoming' && relatedRequestId) {
    return (
      <Button asChild>
        <Link href={`/ask/${relatedRequestId}`}>Review their request</Link>
      </Button>
    )
  }

  if (!isOpenAsMentor && !isOpenAsAdviceHelper) {
    return (
      <Button variant="outline" disabled>
        Not open to requests right now
      </Button>
    )
  }

  return (
    <>
      {isOpenAsAdviceHelper ? (
        <Button asChild variant={isOpenAsMentor ? 'outline' : 'default'}>
          <Link href={`/ask/new?to=${profileUserId}&type=advice`}>Ask for advice</Link>
        </Button>
      ) : null}
      {isOpenAsMentor ? (
        <Button asChild>
          <Link href={`/ask/new?to=${profileUserId}&type=mentorship`}>Request mentorship</Link>
        </Button>
      ) : null}
    </>
  )
}
