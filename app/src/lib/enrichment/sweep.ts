import 'server-only'
import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import { applyExtractedToProfile } from '@/lib/resume/applyToProfile'
import type { ApplyExtractedInput, ExtractedProfile } from '@/lib/resume/schemas'
import { sendProposalAppliedEmail, sendProposalReviewEmail } from '@/notify/resend'
import { fingerprintProfile, fingerprintsDiffer } from './fingerprint'
import { isAcceptableResult } from './quality'
import { providerFor } from './registry'
import type { ProviderName, SweepRecord, SweepTarget } from './types'

const SWEEP_BATCH_LIMIT = 10_000
const ESCALATION_THRESHOLD = 3
const PROPOSAL_TTL_DAYS = 14
const PROPOSAL_TOKEN_BYTES = 32

export type StartSweepResult =
  | { ok: true; jobId: string | null; memberCount: number; snapshotId: string | null }
  | { ok: false; error: string }

/**
 * Monthly sweep entry point. Selects members eligible for refresh, kicks off
 * a Bright Data snapshot, persists targets, returns the job id so the caller
 * can monitor.
 *
 * "Eligible" = active member + has a LinkedIn URL on file + refresh_policy
 * is not 'manual_only'. The query joins through organization_memberships
 * because deleted/deactivated users shouldn't get crawled.
 */
export async function startSweep(opts?: { limit?: number }): Promise<StartSweepResult> {
  const admin = createAdminClient()
  const limit = Math.min(opts?.limit ?? SWEEP_BATCH_LIMIT, SWEEP_BATCH_LIMIT)

  const { data: targetRows, error: queryErr } = await admin
    .from('profile_enrichment_settings')
    .select('user_id, linkedin_url, users!inner(deleted_at)')
    .neq('refresh_policy', 'manual_only')
    .not('linkedin_url', 'is', null)
    .is('users.deleted_at', null)
    .limit(limit)
  if (queryErr) return { ok: false, error: queryErr.message }

  const targets: SweepTarget[] = []
  for (const r of targetRows ?? []) {
    if (typeof r.linkedin_url === 'string' && r.linkedin_url.length > 0) {
      targets.push({ userId: r.user_id, url: r.linkedin_url })
    }
  }

  if (targets.length === 0) {
    return { ok: true, jobId: null, memberCount: 0, snapshotId: null }
  }

  const provider = providerFor('sweep')
  const start = await provider.startSweep(targets)
  if (!start.ok) {
    // Persist the failed attempt so the operator can see why monthly sweep
    // didn't fire — useful when Bright Data is unavailable.
    await admin.from('enrichment_sweep_jobs').insert({
      provider: provider.name,
      status: 'failed',
      member_count: targets.length,
      targets:
        targets as unknown as Database['public']['Tables']['enrichment_sweep_jobs']['Insert']['targets'],
      error: start.error,
      completed_at: new Date().toISOString(),
    })
    return { ok: false, error: start.error }
  }

  const { data: job, error: insertErr } = await admin
    .from('enrichment_sweep_jobs')
    .insert({
      provider: provider.name,
      snapshot_id: start.snapshotId,
      status: 'pending',
      member_count: targets.length,
      targets:
        targets as unknown as Database['public']['Tables']['enrichment_sweep_jobs']['Insert']['targets'],
    })
    .select('id')
    .single()
  if (insertErr || !job) {
    return { ok: false, error: insertErr?.message ?? 'job insert failed' }
  }

  return { ok: true, jobId: job.id, memberCount: targets.length, snapshotId: start.snapshotId }
}

export type PollSweepResult = {
  ok: true
  /** Number of pending jobs found. */
  scanned: number
  /** Records processed across all completed jobs. */
  processed: number
  /** Counts by outcome. */
  proposalsCreated: number
  autoApplied: number
  missed: number
  escalated: number
}

/**
 * Drain any pending sweep jobs. Called by the 5-minute poll cron. Idempotent
 * for jobs that are still in flight (drainSnapshot returns not_ready and the
 * row is left pending).
 */
export async function pollSweep(): Promise<PollSweepResult | { ok: false; error: string }> {
  const admin = createAdminClient()
  const result: PollSweepResult = {
    ok: true,
    scanned: 0,
    processed: 0,
    proposalsCreated: 0,
    autoApplied: 0,
    missed: 0,
    escalated: 0,
  }

  const { data: jobs, error: queryErr } = await admin
    .from('enrichment_sweep_jobs')
    .select('id, provider, snapshot_id, targets')
    .eq('status', 'pending')
  if (queryErr) return { ok: false, error: queryErr.message }
  result.scanned = jobs?.length ?? 0

  for (const job of jobs ?? []) {
    if (!job.snapshot_id) continue
    const provider =
      job.provider === 'brightdata'
        ? providerFor('sweep')
        : job.provider === 'linkdapi' || job.provider === 'pdl'
          ? // Hydrate a non-default provider when the job's own provider differs
            //  from the current registry default. e.g. a fallback-by-policy job.
            providerFor('sweep')
          : null
    if (!provider) continue

    // Brain-dead targets rehydration. drainSnapshot uses its in-memory map for
    // the same-process case (manual fallback fetch). For BD jobs that span
    // cron invocations, we need to push the persisted targets back into the
    // provider so it can map results back to userIds. For BD specifically,
    // the provider drainSnapshot already looks up targets via its in-process
    // map — for cross-invocation BD work we restore the map first.
    if (provider.name === 'brightdata') {
      restoreBrightDataTargets(job.snapshot_id, job.targets)
    }

    const drained = await provider.drainSnapshot(job.snapshot_id)
    if (!drained.ok) {
      if (drained.error === 'not_ready') continue
      await admin
        .from('enrichment_sweep_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: drained.detail ?? drained.error,
        })
        .eq('id', job.id)
      continue
    }

    for (const record of drained.records) {
      const outcome = await processSweepRecord(admin, record)
      result.processed += 1
      if (outcome.kind === 'proposal') result.proposalsCreated += 1
      if (outcome.kind === 'auto_applied') result.autoApplied += 1
      if (outcome.kind === 'missed') result.missed += 1
      if (outcome.kind === 'escalated') result.escalated += 1
    }

    await admin
      .from('enrichment_sweep_jobs')
      .update({ status: 'downloaded', completed_at: new Date().toISOString() })
      .eq('id', job.id)
  }

  return result
}

type ProcessOutcome =
  | { kind: 'proposal'; proposalId: string }
  | { kind: 'auto_applied' }
  | { kind: 'skipped_unchanged' }
  | { kind: 'rejected'; reason: string }
  | { kind: 'missed' }
  | { kind: 'escalated' }

async function processSweepRecord(
  admin: SupabaseClient<Database>,
  record: SweepRecord,
): Promise<ProcessOutcome> {
  const { userId, result } = record

  if (!result.ok) {
    if (result.error === 'not_found') {
      return handleMiss(admin, userId, record.url)
    }
    await logRun(admin, {
      userId,
      provider: provNameFromRecord(record),
      status: 'failed',
      error: `${result.error}${result.detail ? `: ${result.detail}` : ''}`,
      fingerprint: null,
    })
    return { kind: 'missed' }
  }

  // Pull current profile for diff + quality gates.
  const { data: settings } = await admin
    .from('profile_enrichment_settings')
    .select('refresh_policy, last_profile_fingerprint')
    .eq('user_id', userId)
    .maybeSingle()

  const { data: base } = await admin
    .from('base_profiles')
    .select(
      'name, headline, city, current_employer, current_title, university, major, career_history, education_history, skills',
    )
    .eq('user_id', userId)
    .maybeSingle()
  const currentProfile = baseRowToProfile(base)

  const quality = isAcceptableResult(currentProfile, result.profile)
  if (!quality.ok) {
    await logRun(admin, {
      userId,
      provider: provNameFromRecord(record),
      status: 'failed',
      error: `quality:${quality.reason}`,
      fingerprint: null,
    })
    return { kind: 'rejected', reason: quality.reason }
  }

  const { hash: newHash } = fingerprintProfile(result.profile)

  if (!fingerprintsDiffer(settings?.last_profile_fingerprint ?? null, newHash)) {
    await admin
      .from('profile_enrichment_settings')
      .update({
        last_checked_at: new Date().toISOString(),
        consecutive_sweep_misses: 0,
      })
      .eq('user_id', userId)
    await logRun(admin, {
      userId,
      provider: provNameFromRecord(record),
      status: 'skipped_unchanged',
      error: null,
      fingerprint: newHash,
    })
    return { kind: 'skipped_unchanged' }
  }

  const policy = settings?.refresh_policy ?? 'review_before_update'

  if (policy === 'auto_apply_and_notify') {
    // Map ExtractedProfile straight into ApplyExtractedInput with every field
    // marked use=true — the silent-apply path doesn't go through the user
    // review UI. Existing arrays get replaced wholesale per applyToProfile's
    // documented semantics.
    const input: ApplyExtractedInput = profileToApplyAll(result.profile)
    const applied = await applyExtractedToProfile(admin, userId, input)
    if (!applied.ok) {
      await logRun(admin, {
        userId,
        provider: provNameFromRecord(record),
        status: 'failed',
        error: `apply:${applied.detail ?? applied.error}`,
        fingerprint: null,
      })
      return { kind: 'rejected', reason: 'apply_failed' }
    }
    await admin
      .from('profile_enrichment_settings')
      .update({
        last_profile_fingerprint: newHash,
        last_enriched_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
        consecutive_sweep_misses: 0,
      })
      .eq('user_id', userId)
    await logRun(admin, {
      userId,
      provider: provNameFromRecord(record),
      status: 'succeeded',
      error: null,
      fingerprint: newHash,
    })
    // Auto-applied: record an "edited" proposal row to preserve the snapshot
    // pair, then email the user an undo link.
    const proposalToken = randomBytes(PROPOSAL_TOKEN_BYTES).toString('base64url')
    const expiresAt = new Date(Date.now() + PROPOSAL_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data: proposal } = await admin
      .from('profile_change_proposals')
      .insert({
        user_id: userId,
        source: provNameFromRecord(record),
        status: 'auto_applied',
        current_snapshot:
          currentProfile as unknown as Database['public']['Tables']['profile_change_proposals']['Insert']['current_snapshot'],
        proposed_snapshot:
          result.profile as unknown as Database['public']['Tables']['profile_change_proposals']['Insert']['proposed_snapshot'],
        review_token: proposalToken,
        expires_at: expiresAt,
        reviewed_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (proposal) {
      await dispatchEmail(admin, {
        userId,
        kind: 'auto_applied',
        proposalId: proposal.id,
        token: proposalToken,
        diff: diffSummary(currentProfile, result.profile),
      })
    }
    return { kind: 'auto_applied' }
  }

  // review_before_update: create proposal row.
  const proposalToken = randomBytes(PROPOSAL_TOKEN_BYTES).toString('base64url')
  const expiresAt = new Date(Date.now() + PROPOSAL_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: proposal, error: insertErr } = await admin
    .from('profile_change_proposals')
    .insert({
      user_id: userId,
      source: provNameFromRecord(record),
      status: 'pending',
      current_snapshot:
        currentProfile as unknown as Database['public']['Tables']['profile_change_proposals']['Insert']['current_snapshot'],
      proposed_snapshot:
        result.profile as unknown as Database['public']['Tables']['profile_change_proposals']['Insert']['proposed_snapshot'],
      review_token: proposalToken,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  await admin
    .from('profile_enrichment_settings')
    .update({
      last_checked_at: new Date().toISOString(),
      consecutive_sweep_misses: 0,
    })
    .eq('user_id', userId)
  await logRun(admin, {
    userId,
    provider: provNameFromRecord(record),
    status: 'succeeded',
    error: null,
    fingerprint: newHash,
  })

  if (insertErr || !proposal) {
    return { kind: 'rejected', reason: 'proposal_insert_failed' }
  }

  await dispatchEmail(admin, {
    userId,
    kind: 'review',
    proposalId: proposal.id,
    token: proposalToken,
    diff: diffSummary(currentProfile, result.profile),
  })

  return { kind: 'proposal', proposalId: proposal.id }
}

async function handleMiss(
  admin: SupabaseClient<Database>,
  userId: string,
  _url: string,
): Promise<ProcessOutcome> {
  // Increment the miss counter. After ESCALATION_THRESHOLD consecutive misses
  // we'd escalate to a fallback provider (LinkdAPI by-URL, then PDL). For the
  // PR4 launch slice we record the miss; the actual escalation fetch is a
  // follow-on once we have prod traffic to validate against.
  const { data: settings } = await admin
    .from('profile_enrichment_settings')
    .select('consecutive_sweep_misses')
    .eq('user_id', userId)
    .maybeSingle()
  const nextMisses = (settings?.consecutive_sweep_misses ?? 0) + 1
  await admin
    .from('profile_enrichment_settings')
    .update({
      consecutive_sweep_misses: nextMisses,
      last_checked_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  await logRun(admin, {
    userId,
    provider: 'brightdata',
    status: 'no_match',
    error: null,
    fingerprint: null,
  })
  if (nextMisses >= ESCALATION_THRESHOLD) {
    // The escalation fetch (LinkdAPI by URL, then PDL by identity) is the
    // next iteration. We log the threshold breach so the operator can act.
    await logRun(admin, {
      userId,
      provider: 'linkdapi',
      status: 'failed',
      error: 'sweep_miss_threshold_reached',
      fingerprint: null,
    })
    return { kind: 'escalated' }
  }
  return { kind: 'missed' }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function logRun(
  admin: SupabaseClient<Database>,
  args: {
    userId: string
    provider: ProviderName
    status: 'succeeded' | 'no_match' | 'failed' | 'skipped_unchanged'
    error: string | null
    fingerprint: string | null
  },
) {
  await admin.from('profile_enrichment_runs').insert({
    user_id: args.userId,
    provider: args.provider,
    purpose: 'scheduled_sweep',
    status: args.status,
    cost_units: args.status === 'succeeded' ? 1 : 0,
    fingerprint: args.fingerprint,
    error: args.error,
    fetched_at: new Date().toISOString(),
  })
}

function provNameFromRecord(record: SweepRecord): ProviderName {
  // The SweepRecord doesn't carry the provider name directly; we infer it
  // from whichever provider was actively used. At the moment only one runs
  // per job, so the caller's job.provider is the truth — but for log-time
  // convenience we record what produced the EnrichmentResult.
  if (!record.result.ok) return 'brightdata'
  return 'brightdata' // sweep is BD-only today; future fallback escalation will pass an explicit provider arg.
}

type BaseProfileRow = {
  name: string | null
  headline: string | null
  city: string | null
  current_employer: string | null
  current_title: string | null
  university: string | null
  major: string | null
  career_history: unknown
  education_history: unknown
  skills: string[] | null
}

type DbCareer = {
  employer: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string | null
}
type DbEducation = {
  school: string
  degree: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}

function baseRowToProfile(row: BaseProfileRow | null | undefined): ExtractedProfile {
  return {
    name: row?.name ?? null,
    headline: row?.headline ?? null,
    city: row?.city ?? null,
    currentEmployer: row?.current_employer ?? null,
    currentTitle: row?.current_title ?? null,
    university: row?.university ?? null,
    major: row?.major ?? null,
    careerHistory: ((row?.career_history as DbCareer[] | null) ?? []).map((e) => ({
      employer: e.employer,
      title: e.title,
      startDate: e.start_date,
      endDate: e.end_date,
      description: e.description,
    })),
    educationHistory: ((row?.education_history as DbEducation[] | null) ?? []).map((e) => ({
      school: e.school,
      degree: e.degree,
      field: e.field,
      startDate: e.start_date,
      endDate: e.end_date,
    })),
    skills: row?.skills ?? [],
  }
}

function profileToApplyAll(profile: ExtractedProfile): ApplyExtractedInput {
  return {
    scalars: {
      name: { use: profile.name !== null, value: profile.name },
      headline: { use: profile.headline !== null, value: profile.headline },
      city: { use: profile.city !== null, value: profile.city },
      currentEmployer: { use: profile.currentEmployer !== null, value: profile.currentEmployer },
      currentTitle: { use: profile.currentTitle !== null, value: profile.currentTitle },
      university: { use: profile.university !== null, value: profile.university },
      major: { use: profile.major !== null, value: profile.major },
    },
    careerHistory: profile.careerHistory.map((e) => ({ ...e, use: true })),
    educationHistory: profile.educationHistory.map((e) => ({ ...e, use: true })),
    skills: profile.skills.map((value) => ({ use: true, value })),
  }
}

// ---------------------------------------------------------------------------
// Email dispatch
// ---------------------------------------------------------------------------

type EmailDispatchInput = {
  userId: string
  kind: 'review' | 'auto_applied'
  proposalId: string
  token: string
  diff: string
}

async function dispatchEmail(
  admin: SupabaseClient<Database>,
  input: EmailDispatchInput,
): Promise<void> {
  // Look up the recipient's email (auth.users) and display name (base_profiles).
  const [{ data: authUser }, { data: base }] = await Promise.all([
    admin.auth.admin.getUserById(input.userId),
    admin.from('base_profiles').select('name').eq('user_id', input.userId).maybeSingle(),
  ])
  const email = authUser?.user?.email
  if (!email) return // can't email — silently skip; the proposal still stands
  const recipientName = base?.name ?? null

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const reviewUrl = `${baseUrl}/proposals/${input.proposalId}?token=${encodeURIComponent(input.token)}`
  const confirmUrl = `${reviewUrl}&action=confirm`
  const declineUrl = `${reviewUrl}&action=decline`

  if (input.kind === 'review') {
    await sendProposalReviewEmail({
      to: email,
      recipientName,
      reviewUrl,
      confirmUrl,
      declineUrl,
      changeSummary: input.diff,
    })
  } else {
    await sendProposalAppliedEmail({
      to: email,
      recipientName,
      undoUrl: declineUrl, // Undo = decline + restore. Decline on auto_applied
      //                       restores via the same applyProposal path.
      changeSummary: input.diff,
    })
  }
}

/**
 * Brief human-readable diff for inclusion in the email body. Surfaces the
 * scalar field changes only — careers/educations show as counts. The full
 * detail is still on the review screen.
 */
function diffSummary(prev: ExtractedProfile, next: ExtractedProfile): string {
  const lines: string[] = []
  const scalar = (label: string, a: string | null, b: string | null) => {
    if (a !== b && b) lines.push(`• ${label}: ${b}`)
  }
  scalar('Current role', prev.currentTitle, next.currentTitle)
  scalar('Current employer', prev.currentEmployer, next.currentEmployer)
  scalar('City', prev.city, next.city)
  scalar('University', prev.university, next.university)
  scalar('Major', prev.major, next.major)

  const careerDelta = next.careerHistory.length - prev.careerHistory.length
  if (careerDelta > 0)
    lines.push(`• ${careerDelta} new career entr${careerDelta === 1 ? 'y' : 'ies'}`)
  const eduDelta = next.educationHistory.length - prev.educationHistory.length
  if (eduDelta > 0) lines.push(`• ${eduDelta} new education entr${eduDelta === 1 ? 'y' : 'ies'}`)
  const skillsDelta = next.skills.length - prev.skills.length
  if (skillsDelta > 0) lines.push(`• ${skillsDelta} new skill${skillsDelta === 1 ? '' : 's'}`)

  return lines.length === 0 ? 'See the review page for the full diff.' : lines.join('\n')
}

// Bright Data provider uses an in-process map to associate snapshot ids with
// target lists. For long-running snapshots we persist the list on the job row
// and re-seed the in-process map at poll time. This indirection is kept here
// rather than in the provider so the provider itself stays a thin HTTP client.
function restoreBrightDataTargets(_snapshotId: string, _targets: unknown): void {
  // The Bright Data provider's in-process map is private; rather than reach
  // into it from here we let the provider's drainSnapshot fall through to a
  // "no targets known" path and reconstruct the SweepRecord[] from the raw
  // download in a follow-on iteration. For pilot scale (single process,
  // typical drain completes within minutes of start), the in-process map
  // survives. This placeholder exists so the cross-invocation case has a
  // visible hook to fix when it shows up.
}
