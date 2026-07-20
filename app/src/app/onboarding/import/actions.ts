'use server'

import * as Sentry from '@sentry/nextjs'
import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import {
  createProfileImportRepository,
  type ImportAttempt,
} from '@/db/repositories/profile-imports'
import { createProfileRepository } from '@/db/repositories/profiles'
import { requireSession } from '@/lib/auth/session'
import { fetchForOnboarding } from '@/lib/enrichment/onboardingFetch'
import { isAcceptableResult } from '@/lib/enrichment/quality'
import { selectedMembership } from '@/lib/membership/selection'
import { getImportCurrentProfile } from '@/lib/onboarding/import-current-profile'
import {
  buildImportApplyPayload,
  currentProfileAsExtracted,
  parseApplySelections,
} from '@/lib/onboarding/import-proposal'
import { resumeImportSourceKey } from '@/lib/onboarding/import-source'
import { extractFromResume } from '@/lib/resume/extract'
import { storeResumeUpload } from '@/lib/resume/storeUpload'
import { fastFillAction } from '../actions'

const MAX_BYTES = 5 * 1024 * 1024
const PDF = 'application/pdf'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const ACCEPTED_MIME = new Set([PDF, DOCX])

export type ImportStartState = { error?: string }
export type ImportReviewState = { error?: string }

export async function startLinkedInImportAction(
  _previous: ImportStartState,
  formData: FormData,
): Promise<ImportStartState> {
  const session = await requireSession()
  const url = normalizeLinkedInUrl(String(formData.get('linkedinUrl') ?? ''))
  const clientRequestId = String(formData.get('clientRequestId') ?? '')
  if (!url) return { error: 'Paste a LinkedIn profile URL, such as linkedin.com/in/yourname.' }
  if (!isUuid(clientRequestId))
    return { error: 'This import could not be started. Refresh and try again.' }

  const context = await importContext()
  const current = await getImportCurrentProfile(context.profiles, context.membershipId)
  const begin = await context.imports.begin({
    membershipId: context.membershipId,
    clientRequestId,
    source: 'linkedin',
    sourceKey: url.toLowerCase(),
  })

  if (begin.result_code === 'existing' && begin.proposal_id) {
    redirect(`/onboarding/import/${begin.proposal_id}`)
  }
  if (begin.result_code === 'in_progress') {
    return { error: 'That import is already running. Give it a moment, then try again.' }
  }
  if (begin.result_code === 'limited') {
    return { error: 'You have reached the import limit for now. Try again in about an hour.' }
  }
  if (begin.result_code !== 'started' || !begin.request_id) {
    return { error: 'We could not start that import. Refresh and try again.' }
  }

  const self = await context.profiles.get(context.membershipId)
  const identity =
    self.ok && current.name && session.email && self.profile.identity.graduationYear
      ? {
          name: current.name,
          email: session.email,
          gradYear: self.profile.identity.graduationYear,
          lastEmployer: current.currentEmployer ?? undefined,
        }
      : undefined
  const result = await fetchForOnboarding({ userId: session.userId, url, identity })

  if (!result.ok) {
    await context.imports.fail(begin.request_id, 'providers_failed', result.attempts)
    Sentry.captureMessage('onboarding_linkedin_import_failed', {
      level: 'info',
      extra: { userId: session.userId, providerCount: result.attempts.length },
    })
    return { error: linkedinErrorMessage(result.attempts) }
  }

  const proposed = { ...result.profile, name: result.profile.name ?? current.name }
  const quality = isAcceptableResult(currentProfileAsExtracted(current), proposed)
  if (!quality.ok) {
    await context.imports.fail(begin.request_id, `quality_${quality.reason}`, result.attempts)
    return {
      error:
        'We found a profile, but could not verify it was yours. You can try another URL or fill this in yourself.',
    }
  }

  const finished = await context.imports.finish({
    requestId: begin.request_id,
    current,
    proposed,
    source: result.provider,
    sourceMetadata: {
      linkedinUrl: url,
      linkedinUsername: result.linkedinUsername,
      providerRecordId: result.providerRecordId,
      fingerprintHash: result.fingerprintHash,
    },
    attempts: result.attempts,
    confidence: 0.9,
  })
  if (!finished.proposal_id)
    return { error: 'The import finished, but the review could not be opened. Try again.' }
  redirect(`/onboarding/import/${finished.proposal_id}`)
}

export async function startResumeImportAction(
  _previous: ImportStartState,
  formData: FormData,
): Promise<ImportStartState> {
  const session = await requireSession()
  const file = formData.get('file')
  const clientRequestId = String(formData.get('clientRequestId') ?? '')
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a résumé to upload.' }
  if (file.size > MAX_BYTES) return { error: 'Keep the file under 5 MB.' }
  if (!ACCEPTED_MIME.has(file.type)) return { error: 'Upload a PDF or Word (.docx) file.' }
  if (!isUuid(clientRequestId))
    return { error: 'This import could not be started. Refresh and try again.' }

  const bytes = Buffer.from(await file.arrayBuffer())
  const contentHash = resumeImportSourceKey(bytes)

  const context = await importContext()
  const current = await getImportCurrentProfile(context.profiles, context.membershipId)
  const begin = await context.imports.begin({
    membershipId: context.membershipId,
    clientRequestId,
    source: 'resume',
    sourceKey: contentHash,
  })
  if (begin.result_code === 'existing' && begin.proposal_id) {
    redirect(`/onboarding/import/${begin.proposal_id}`)
  }
  if (begin.result_code === 'in_progress') {
    return { error: 'That résumé is already being read. Give it a moment, then try again.' }
  }
  if (begin.result_code === 'limited') {
    return {
      error: 'You have reached the résumé import limit for now. Try again in about an hour.',
    }
  }
  if (begin.result_code !== 'started' || !begin.request_id) {
    return { error: 'We could not start that import. Refresh and try again.' }
  }

  const stored = await storeResumeUpload(
    context.client,
    session.userId,
    file.name,
    bytes,
    file.type,
  )
  const extracted = await extractFromResume({
    mimeType: file.type as typeof PDF | typeof DOCX,
    bytes,
  })
  if (!extracted.ok) {
    await context.imports.fail(begin.request_id, extracted.error, [])
    if (stored.ok) await context.client.storage.from('resumes').remove([stored.storagePath])
    return { error: resumeErrorMessage(extracted.error) }
  }

  const proposed = { ...extracted.profile, name: extracted.profile.name ?? current.name }
  const quality = isAcceptableResult(currentProfileAsExtracted(current), proposed)
  if (!quality.ok) {
    await context.imports.fail(begin.request_id, `quality_${quality.reason}`, [])
    return {
      error:
        'We could not verify the name on that résumé. Try another file or fill this in yourself.',
    }
  }

  const finished = await context.imports.finish({
    requestId: begin.request_id,
    current,
    proposed,
    source: 'resume',
    sourceMetadata: {
      storagePath: stored.ok ? stored.storagePath : undefined,
      mimeType: file.type,
      originalName: file.name.slice(0, 120),
    },
    attempts: [],
    confidence: 0.85,
  })
  if (!finished.proposal_id)
    return { error: 'The résumé was read, but the review could not be opened. Try again.' }
  redirect(`/onboarding/import/${finished.proposal_id}`)
}

export async function applyProfileImportAction(
  _previous: ImportReviewState,
  formData: FormData,
): Promise<ImportReviewState> {
  await requireSession()
  const proposalId = String(formData.get('proposalId') ?? '')
  const raw = String(formData.get('selections') ?? '')
  if (!isUuid(proposalId) || !raw)
    return { error: 'The review could not be read. Refresh and try again.' }

  const context = await importContext()
  const proposal = await context.imports.get(context.membershipId, proposalId)
  const self = await context.profiles.get(context.membershipId)
  if (!proposal || proposal.status !== 'pending' || !self.ok) {
    return { error: 'This review is no longer available.' }
  }

  try {
    const selections = parseApplySelections(raw)
    const payload = buildImportApplyPayload({
      current: proposal.current,
      selections,
      preferredName: self.profile.identity.preferredName,
      nameOther: self.profile.identity.nameOther,
      graduationYear: self.profile.identity.graduationYear ?? 0,
      industry: self.profile.current.industry,
    })
    const result = await context.imports.apply(context.membershipId, proposalId, payload, true)
    if (result !== 'applied') return { error: applyErrorMessage(result) }
  } catch (error) {
    Sentry.captureException(error, { extra: { scope: 'onboarding-import-apply' } })
    return { error: 'Check the dates and selected fields, then try again.' }
  }

  await fastFillAction()
  return {}
}

export async function declineProfileImportAction(formData: FormData) {
  await requireSession()
  const proposalId = String(formData.get('proposalId') ?? '')
  if (!isUuid(proposalId)) redirect('/onboarding?step=2')
  const context = await importContext()
  await context.imports.decline(context.membershipId, proposalId)
  redirect('/onboarding?step=2')
}

async function importContext() {
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || !['active', 'pending'].includes(membership.status)) redirect('/select-circle')
  return {
    client,
    membershipId: membership.membershipId,
    profiles: createProfileRepository(client),
    imports: createProfileImportRepository(client),
  }
}

function normalizeLinkedInUrl(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withProtocol)
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname) || !/^\/in\/[^/]+\/?$/i.test(url.pathname))
      return null
    url.protocol = 'https:'
    url.hostname = 'www.linkedin.com'
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function linkedinErrorMessage(attempts: ImportAttempt[]) {
  if (attempts.length > 0 && attempts.every((attempt) => attempt.status === 'no_match')) {
    return 'We could not find that profile. Check the URL, upload a résumé, or fill this in yourself.'
  }
  return 'LinkedIn import is temporarily unavailable. Try again, upload a résumé, or continue manually.'
}

function resumeErrorMessage(error: string) {
  if (error === 'docx_parse_failed')
    return 'We could not read that Word file. Save it as a PDF and try again.'
  if (error === 'no_api_key')
    return 'Résumé import is not configured yet. Continue manually for now.'
  return 'We could not read that résumé cleanly. Try another file or continue manually.'
}

function applyErrorMessage(error: string) {
  if (error === 'expired') return 'This review expired. Start a new import.'
  if (error === 'already_reviewed') return 'This review has already been used.'
  return 'We could not apply those changes. Check the fields and try again.'
}
