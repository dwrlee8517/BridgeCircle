import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getFriendshipState } from '@/lib/friendship/friendshipState'
import { getProfile } from '@/lib/profile/getProfile'
import { cn, displayName } from '@/lib/utils'
import { startThreadAction } from '../../messages/[id]/actions'
import { FriendshipAction } from './friendship-action'

type Params = { id: string }
type SearchParams = { saved?: string; error?: string }

export default async function ProfileDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const profile = await getProfile(supabase, id, session.userId)

  if (!profile) notFound()

  // Flash banners — driven by query params from sibling actions:
  //   ?saved=1               → editProfileAction's success path
  //   ?error=not_friends     → startThreadAction when DMs are gated by
  //                            mutual friendship and the gate isn't met
  const flashSaved = profile.isSelf && sp.saved === '1'
  const flashNotFriends = sp.error === 'not_friends'

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
    // Surface the most recent mentorship-type ask either direction.
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

  // Fetch viewer friendships (restricted by RLS to viewer's own rows)
  const { data: viewerFriendships } = await supabase
    .from('friendships')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${session.userId},user_b_id.eq.${session.userId}`)

  const viewerFriendIds = (viewerFriendships || []).map((f) =>
    f.user_a_id === session.userId ? f.user_b_id : f.user_a_id,
  )

  // Fetch target friendships bypassing RLS using admin client (only if not self)
  let mutualProfiles: Array<{
    userId: string
    name: string | null
    preferredName: string | null
    avatarUrl: string | null
  }> = []

  if (!isSelf) {
    const adminSupabase = createAdminClient()
    const { data: targetFriendships } = await adminSupabase
      .from('friendships')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${id},user_b_id.eq.${id}`)

    const targetFriendIds = (targetFriendships || []).map((f) =>
      f.user_a_id === id ? f.user_b_id : f.user_a_id,
    )

    const mutualFriendIds = viewerFriendIds.filter((fId) => targetFriendIds.includes(fId))

    if (mutualFriendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('base_profiles')
        .select('user_id, name, preferred_name, avatar_url')
        .in('user_id', mutualFriendIds)

      if (profiles) {
        mutualProfiles = profiles.map((p) => ({
          userId: p.user_id,
          name: p.name,
          preferredName: p.preferred_name,
          avatarUrl: p.avatar_url,
        }))
      }
    }
  }

  // Fetch shared events count
  let sharedEventCount = 0
  if (!isSelf) {
    const { data: viewerRsvps } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', session.userId)
      .eq('status', 'going')

    const { data: targetRsvps } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', id)
      .eq('status', 'going')

    const viewerEventIds = (viewerRsvps || []).map((r) => r.event_id)
    const targetEventIds = (targetRsvps || []).map((r) => r.event_id)
    sharedEventCount = viewerEventIds.filter((eId) => targetEventIds.includes(eId)).length
  }

  // Fetch viewer city for same-city check
  const { data: viewerProfile } = await supabase
    .from('base_profiles')
    .select('city')
    .eq('user_id', session.userId)
    .maybeSingle()

  const sameCity =
    !isSelf &&
    profile.city &&
    viewerProfile?.city &&
    profile.city.trim().toLowerCase() === viewerProfile.city.trim().toLowerCase()

  // Fetch verification details (Anchor, Joined date, Approved by)
  let approvedByProfile: { name: string | null; preferredName: string | null } | null = null
  let joinedAtStr = '—'
  if (profile.membershipId) {
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('joined_at, approved_by')
      .eq('id', profile.membershipId)
      .maybeSingle()

    if (membership?.joined_at) {
      const d = new Date(membership.joined_at)
      joinedAtStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    if (membership?.approved_by) {
      const { data: adminProf } = await supabase
        .from('base_profiles')
        .select('name, preferred_name')
        .eq('user_id', membership.approved_by)
        .maybeSingle()
      if (adminProf) {
        approvedByProfile = {
          name: adminProf.name,
          preferredName: adminProf.preferred_name,
        }
      }
    }
  }

  const roleLine = [profile.currentTitle, profile.currentEmployer].filter(Boolean)
  const careerHistory = profile.careerHistory || []
  const educationHistory = profile.educationHistory || []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
      {/* Breadcrumb */}
      <Link
        href="/people"
        className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors mb-6"
      >
        ← People
      </Link>

      {flashSaved ? (
        <div className="mb-6 rounded-[6px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Profile saved.
        </div>
      ) : null}
      {flashNotFriends ? (
        <div className="mb-6 rounded-[6px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Direct messages are open to friends only. Add{' '}
          <span className="font-medium">{profile.name ?? 'this member'}</span> as a friend first to
          start a conversation.
        </div>
      ) : null}

      {/* Hero Card */}
      <Card className="overflow-hidden bg-card border border-border rounded-[6px] relative p-6 md:p-8 shadow-none mb-6">
        <div
          aria-hidden
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(12,12,11,0.15) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <svg
          aria-hidden="true"
          role="presentation"
          viewBox="0 0 200 200"
          className="absolute -right-10 -top-10 h-[200px] w-[200px] opacity-15 pointer-events-none"
        >
          <title>Decorative two-circle motif</title>
          <circle
            cx="80"
            cy="100"
            r="60"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1"
          />
          <circle cx="130" cy="100" r="60" fill="none" className="stroke-primary" strokeWidth="1" />
        </svg>

        <div className="relative z-10 space-y-4">
          {/* Top Badges */}
          <div className="flex flex-wrap gap-2">
            {profile.graduationYear ? (
              <StatusBadge tone="sage" dot>
                Verified &apos;{`${profile.graduationYear}`.slice(-2)}
              </StatusBadge>
            ) : null}
            {profile.isOpenAsMentor && !profile.mentorshipAtCapacity ? (
              <StatusBadge tone="open" dot>
                Open to mentor
              </StatusBadge>
            ) : profile.isOpenAsMentor && profile.mentorshipAtCapacity ? (
              <StatusBadge tone="warn" dot>
                Mentorship full
              </StatusBadge>
            ) : profile.mentorPaused ? (
              <StatusBadge tone="warn" dot>
                Paused
              </StatusBadge>
            ) : null}
            {profile.isOpenAsAdviceHelper ? (
              <StatusBadge tone="open" dot>
                Open to advice
              </StatusBadge>
            ) : null}
          </div>

          {/* Avatar and Name details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Avatar className="size-20 shrink-0 border border-border">
              {profile.avatarUrl ? (
                <AvatarImage
                  src={profile.avatarUrl}
                  alt={displayName(profile.name, profile.preferredName, '')}
                />
              ) : null}
              <AvatarFallback className="bg-primary text-2xl font-bold text-white">
                {displayName(profile.name, profile.preferredName, '?').slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <h1
                className="bc-fraunces text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl"
                style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
              >
                {displayName(profile.name, profile.preferredName)}
              </h1>
              <div className="text-sm md:text-base text-muted-foreground font-sans">
                {roleLine.length > 0 ? (
                  <>
                    {profile.currentTitle || ''}
                    {profile.currentTitle && profile.currentEmployer ? ' at ' : ''}
                    {profile.currentEmployer ? (
                      <strong className="text-foreground font-semibold">
                        {profile.currentEmployer}
                      </strong>
                    ) : (
                      ''
                    )}
                  </>
                ) : (
                  <span className="italic">No employment listed</span>
                )}
                {profile.city ? ` · ${profile.city}` : ''}
              </div>
              {profile.nameOther ? (
                <p className="text-xs text-muted-foreground/85">
                  Also known as{' '}
                  <span className="font-medium text-foreground">{profile.nameOther}</span>
                </p>
              ) : null}
              {profile.headline ? (
                <p className="max-w-2xl text-sm md:text-base leading-relaxed text-muted-foreground/90 mt-1">
                  {profile.headline}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_336px] gap-6">
        {/* Left Column: timelines, bios, details */}
        <div className="space-y-6">
          {/* Bio */}
          {profile.bio ? (
            <Card className="rounded-[6px] border border-border bg-card p-6 md:p-8 shadow-none">
              <div className="border-t-2 border-foreground pt-4 mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  In their own words
                </span>
              </div>
              <p className="bc-pull-quote text-base md:text-lg whitespace-pre-line text-foreground/90 leading-relaxed italic">
                &ldquo;{profile.bio}&rdquo;
              </p>
            </Card>
          ) : null}

          {/* Career History */}
          {careerHistory.length > 0 ? (
            <Card className="rounded-[6px] border border-border bg-card p-6 md:p-8 shadow-none">
              <div className="border-t-2 border-foreground pt-4 mb-6 flex justify-between items-baseline">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Career
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 hidden sm:inline">
                  CHRONOLOGICAL RAIL
                </span>
              </div>
              <ol className="list-none p-0 m-0">
                {careerHistory.map((c, i) => {
                  const last = i === careerHistory.length - 1
                  return (
                    <li
                      key={`${c.employer}|${c.title}|${c.start_date ?? ''}`}
                      className="grid grid-cols-[80px_20px_1fr] md:grid-cols-[100px_24px_1fr] gap-2 md:gap-4 pb-6 last:pb-0"
                    >
                      {/* Date */}
                      <div className="font-mono text-[11px] tracking-wider text-muted-foreground font-semibold pt-1">
                        {c.start_date ?? '?'} – {c.end_date ?? 'present'}
                      </div>
                      {/* Rail */}
                      <div className="relative flex flex-col items-center pt-2">
                        <span className="size-2 rounded-full bg-primary block shrink-0" />
                        {!last && <span className="absolute top-4 bottom-0 w-[1px] bg-border" />}
                      </div>
                      {/* Body */}
                      <div className="min-w-0 pt-0.5 space-y-1">
                        <h4 className="bc-fraunces text-base md:text-lg font-bold leading-tight text-foreground">
                          {c.title}
                        </h4>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          at <strong className="text-foreground font-semibold">{c.employer}</strong>
                        </div>
                        {c.description ? (
                          <p className="text-xs md:text-sm text-muted-foreground/90 whitespace-pre-line mt-1.5 leading-relaxed">
                            {c.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Card>
          ) : null}

          {/* Education History */}
          {educationHistory.length > 0 ? (
            <Card className="rounded-[6px] border border-border bg-card p-6 md:p-8 shadow-none">
              <div className="border-t-2 border-foreground pt-4 mb-6">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Education
                </span>
              </div>
              <ol className="list-none p-0 m-0">
                {educationHistory.map((e, i) => {
                  const last = i === educationHistory.length - 1
                  return (
                    <li
                      key={`${e.school}|${e.start_date ?? ''}`}
                      className="grid grid-cols-[80px_20px_1fr] md:grid-cols-[100px_24px_1fr] gap-2 md:gap-4 pb-6 last:pb-0"
                    >
                      {/* Date */}
                      <div className="font-mono text-[11px] tracking-wider text-muted-foreground font-semibold pt-1">
                        {e.start_date || e.end_date ? (
                          <span>
                            {e.start_date ?? '?'} – {e.end_date ?? '?'}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/60">n/a</span>
                        )}
                      </div>
                      {/* Rail */}
                      <div className="relative flex flex-col items-center pt-2">
                        <span className="size-2 rounded-full bg-primary block shrink-0" />
                        {!last && <span className="absolute top-4 bottom-0 w-[1px] bg-border" />}
                      </div>
                      {/* Body */}
                      <div className="min-w-0 pt-0.5 space-y-1">
                        <h4 className="bc-fraunces text-base md:text-lg font-bold leading-tight text-foreground">
                          {e.school}
                        </h4>
                        {[e.degree, e.field].filter(Boolean).length > 0 ? (
                          <div className="text-xs md:text-sm text-muted-foreground">
                            {[e.degree, e.field].filter(Boolean).join(', ')}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Card>
          ) : null}

          {/* Open To Grids */}
          <Card className="rounded-[6px] border border-border bg-card p-6 md:p-8 shadow-none">
            <div className="border-t-2 border-foreground pt-4 mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Open to
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mentorship box */}
              <div
                className={cn(
                  'p-4 rounded-[4px] border transition-colors',
                  profile.isOpenAsMentor
                    ? 'border-border bg-card text-foreground'
                    : 'border-border/50 bg-muted/30 text-muted-foreground opacity-75',
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      profile.isOpenAsMentor
                        ? profile.mentorshipAtCapacity
                          ? 'bg-accent-ochre'
                          : 'bg-accent-sage'
                        : 'bg-muted-foreground/60',
                    )}
                  />
                  <span className="text-sm font-semibold">Mentorship</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile.isOpenAsMentor
                    ? profile.mentorshipAtCapacity
                      ? 'At capacity right now'
                      : 'Yes — open to request'
                    : profile.mentorPaused
                      ? 'Paused while away'
                      : 'Not accepting right now'}
                </p>
              </div>

              {/* Advice box */}
              <div
                className={cn(
                  'p-4 rounded-[4px] border transition-colors',
                  profile.isOpenAsAdviceHelper
                    ? 'border-border bg-card text-foreground'
                    : 'border-border/50 bg-muted/30 text-muted-foreground opacity-75',
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      profile.isOpenAsAdviceHelper ? 'bg-accent-sage' : 'bg-muted-foreground/60',
                    )}
                  />
                  <span className="text-sm font-semibold">Advice</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile.isOpenAsAdviceHelper
                    ? 'Yes — open to questions'
                    : 'Not accepting right now'}
                </p>
              </div>
            </div>
          </Card>

          {/* Mentoring Topics */}
          {profile.mentoringTopics && profile.mentoringTopics.length > 0 ? (
            <Card className="rounded-[6px] border border-border bg-card p-6 md:p-8 shadow-none">
              <div className="border-t-2 border-foreground pt-4 mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Mentoring Topics
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.mentoringTopics.map((topic) => (
                  <span
                    key={topic}
                    className="font-mono text-[10px] uppercase tracking-wider text-foreground border border-border bg-card px-2.5 py-1 rounded-[2px]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 ? (
            <Card className="rounded-[6px] border border-border bg-card p-6 md:p-8 shadow-none">
              <div className="border-t-2 border-foreground pt-4 mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Skills & Expertise
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border/80 bg-muted/20 px-2 py-0.5 rounded-[2px]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Links */}
          {profile.linkedinUrl ? (
            <Card className="rounded-[6px] border border-border bg-card p-6 md:p-8 shadow-none">
              <div className="border-t-2 border-foreground pt-4 mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Links
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline font-mono uppercase tracking-wider inline-flex items-center gap-1"
                >
                  LinkedIn ↗
                </a>
              </div>
            </Card>
          ) : null}
        </div>

        {/* Right Column: Actions sidebar */}
        <aside className="space-y-6">
          {/* Actions panel */}
          <Card className="rounded-[6px] border border-border bg-card p-6 shadow-none">
            <div className="border-t-2 border-foreground pt-4 mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {isSelf ? (
                <Button asChild className="w-full">
                  <Link href="/profile/edit">Edit profile</Link>
                </Button>
              ) : (
                <>
                  <HelperAsks
                    profileUserId={profile.userId}
                    isOpenAsMentor={profile.isOpenAsMentor}
                    isOpenAsAdviceHelper={profile.isOpenAsAdviceHelper}
                    mentorshipAtCapacity={profile.mentorshipAtCapacity}
                    mentorshipState={mentorshipState}
                    relatedRequestId={relatedRequestId}
                    relatedThreadId={relatedThreadId}
                  />
                  <FriendshipAction profileUserId={profile.userId} state={friendshipActionKind} />
                  {isFriend ? (
                    <form action={startThreadAction} className="w-full">
                      <input type="hidden" name="receiverId" value={profile.userId} />
                      <Button type="submit" variant="outline" className="w-full">
                        Message
                      </Button>
                    </form>
                  ) : null}
                </>
              )}
            </div>
          </Card>

          {/* Verification Details */}
          <Card className="rounded-[6px] border border-border bg-card p-6 shadow-none">
            <div className="border-t-2 border-foreground pt-4 mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Verification
              </span>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="size-8 rounded-full border border-accent-sage flex items-center justify-center text-accent-sage shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  className="stroke-accent-sage"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M10 16.5 L14.5 21 L23 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-accent-sage"
                  />
                </svg>
              </div>
              <div>
                <h4 className="bc-fraunces text-[15px] font-bold text-foreground leading-tight">
                  Verified Member
                </h4>
                <p className="text-[11px] text-muted-foreground">Registered & verified identity</p>
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <NumberedField
                n={1}
                label="Name"
                value={displayName(profile.name, profile.preferredName)}
              />
              <NumberedField
                n={2}
                label="Network"
                value={profile.organizationName || 'Chadwick Network'}
              />
              {profile.graduationYear ? (
                <NumberedField
                  n={3}
                  label="Cohort"
                  value={`Class of '${`${profile.graduationYear}`.slice(-2)}`}
                />
              ) : null}
              <NumberedField n={4} label="Joined" value={joinedAtStr} />
              {approvedByProfile ? (
                <NumberedField
                  n={5}
                  label="Verified By"
                  value={displayName(approvedByProfile.name, approvedByProfile.preferredName)}
                />
              ) : null}
            </div>
          </Card>

          {/* You share card (Mutual Connections + event RSVPs) */}
          {!isSelf ? (
            <Card className="rounded-[6px] border border-border bg-card p-6 shadow-none">
              <div className="border-t-2 border-foreground pt-4 mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  You share
                </span>
              </div>

              <div className="space-y-1">
                <NumberedField
                  n={1}
                  label="Mutuals"
                  value={mutualProfiles.length}
                  sub={
                    mutualProfiles.map((p) => displayName(p.name, p.preferredName)).join(', ') ||
                    undefined
                  }
                />
                <NumberedField
                  n={2}
                  label="Same city"
                  value={
                    sameCity
                      ? `Yes · ${profile.city}`
                      : profile.city && viewerProfile?.city
                        ? 'No'
                        : '—'
                  }
                />
                <NumberedField
                  n={3}
                  label="Past events"
                  value={
                    sharedEventCount > 0
                      ? `${sharedEventCount} attended together`
                      : '0 attended together'
                  }
                />
              </div>

              {mutualProfiles.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
                  {mutualProfiles.slice(0, 8).map((p) => {
                    const initials = displayName(p.name, p.preferredName, '?')
                      .split(/\s+/)
                      .map((s) => s[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    return (
                      <Link
                        key={p.userId}
                        href={`/profile/${p.userId}`}
                        title={displayName(p.name, p.preferredName)}
                      >
                        <Avatar className="size-[30px] border border-border">
                          {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="" /> : null}
                          <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function NumberedField({
  n,
  label,
  value,
  sub,
}: {
  n: number
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="grid grid-cols-[28px_1fr_auto] gap-3 py-2.5 border-b border-border/40 last:border-b-0 items-baseline">
      <span className="font-mono text-[10px] text-muted-foreground/60">
        {String(n).padStart(2, '0')}
      </span>
      <span className="text-xs md:text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <div className="text-xs md:text-sm font-semibold text-foreground">{value}</div>
        {sub ? <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div> : null}
      </div>
    </div>
  )
}

/**
 * Helper-asks CTA cluster on the profile detail page.
 */
function HelperAsks({
  profileUserId,
  isOpenAsMentor,
  isOpenAsAdviceHelper,
  mentorshipAtCapacity,
  mentorshipState,
  relatedRequestId,
  relatedThreadId,
}: {
  profileUserId: string
  isOpenAsMentor: boolean
  isOpenAsAdviceHelper: boolean
  mentorshipAtCapacity: boolean
  mentorshipState: 'none' | 'pending_outgoing' | 'pending_incoming' | 'active'
  relatedRequestId: string | null
  relatedThreadId: string | null
}) {
  if (mentorshipState === 'active' && relatedThreadId) {
    return (
      <Button asChild className="w-full">
        <Link href={`/ask/thread/${relatedThreadId}`}>Open mentorship thread</Link>
      </Button>
    )
  }
  if (mentorshipState === 'pending_outgoing' && relatedRequestId) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={`/ask/${relatedRequestId}`}>Request pending — view</Link>
      </Button>
    )
  }
  if (mentorshipState === 'pending_incoming' && relatedRequestId) {
    return (
      <Button asChild className="w-full">
        <Link href={`/ask/${relatedRequestId}`}>Review their request</Link>
      </Button>
    )
  }

  if (!isOpenAsMentor && !isOpenAsAdviceHelper) {
    return (
      <Button variant="outline" disabled className="w-full">
        Not open to requests right now
      </Button>
    )
  }

  const showMentorshipButton = isOpenAsMentor && !mentorshipAtCapacity
  const showCapacityNotice = isOpenAsMentor && mentorshipAtCapacity

  return (
    <>
      {isOpenAsAdviceHelper ? (
        <Button asChild variant={showMentorshipButton ? 'outline' : 'default'} className="w-full">
          <Link href={`/ask/new?to=${profileUserId}&type=advice`}>Ask for advice</Link>
        </Button>
      ) : null}
      {showMentorshipButton ? (
        <Button asChild className="w-full">
          <Link href={`/ask/new?to=${profileUserId}&type=mentorship`}>Request mentorship</Link>
        </Button>
      ) : null}
      {showCapacityNotice ? (
        <Button variant="outline" disabled className="w-full">
          Mentorship full right now
        </Button>
      ) : null}
    </>
  )
}
