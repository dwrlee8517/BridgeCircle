import { describe, expect, it, vi } from 'vitest'
import type { HelpWorkerRepository } from '@/db/repositories/help-worker'
import type { ClaimedOutboxJob } from '@/lib/outbox/contracts'
import {
  createHelpOutboxHandlers,
  type HelpOutboxHandlerDependencies,
  normalizeHelpAppBaseUrl,
} from './handlers'

const job: ClaimedOutboxJob = {
  id: 41,
  jobType: 'create_notification',
  payload: {},
  attempts: 1,
  maxAttempts: 8,
  availableAt: '2026-07-15T01:00:00.000Z',
  lockedAt: '2026-07-15T01:00:00.000Z',
  lockedBy: 'worker-1',
}

function repository(): HelpWorkerRepository {
  return {
    getMatchingContext: vi.fn<HelpWorkerRepository['getMatchingContext']>(async () => null),
    searchMatchingCandidates: vi.fn<HelpWorkerRepository['searchMatchingCandidates']>(
      async () => [],
    ),
    applyMatches: vi.fn<HelpWorkerRepository['applyMatches']>(async () => ({
      result_code: 'applied',
      applied_count: 0,
    })),
    getProfileIndexSource: vi.fn<HelpWorkerRepository['getProfileIndexSource']>(async () => null),
    syncProfileIndex: vi.fn<HelpWorkerRepository['syncProfileIndex']>(async () => ({
      result_code: 'synced',
      chunk_count: 0,
    })),
    materializeNotification: vi.fn<HelpWorkerRepository['materializeNotification']>(async () => ({
      result_code: 'materialized',
      notification_id: 1,
      email_job_id: 2,
    })),
    getEmailContext: vi.fn<HelpWorkerRepository['getEmailContext']>(async () => null),
    recordEmailProviderResult: vi.fn<HelpWorkerRepository['recordEmailProviderResult']>(
      async () => 'recorded',
    ),
    runMaintenance: vi.fn<HelpWorkerRepository['runMaintenance']>(async () => ({
      reminders_sent: 0,
      asks_closed: 0,
      offers_closed: 0,
      helpers_paused: 0,
    })),
  }
}

function dependencies(repo = repository()): HelpOutboxHandlerDependencies {
  return {
    repository: repo,
    embeddings: null,
    reranker: null,
    profilePassages: null,
    emailSender: { send: vi.fn(async () => ({ providerId: 'email-1' })) },
    appBaseUrl: 'http://localhost:3000/',
    profileIndexingEnabled: false,
    pipelineVersion: 'help-v1',
    modelVersion: 'deterministic-v1',
    entryOperations: {
      sendInvite: vi.fn(async () => undefined),
      generateAccountExport: vi.fn(async () => undefined),
    },
  }
}

describe('Help outbox handlers', () => {
  it('accepts only an HTTP(S) application origin for notification links', () => {
    expect(normalizeHelpAppBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000')
    expect(normalizeHelpAppBaseUrl('https://bridgecircle.org')).toBe('https://bridgecircle.org')
    expect(() => normalizeHelpAppBaseUrl('javascript:alert(1)')).toThrow(
      'Invalid Help app base URL',
    )
    expect(() => normalizeHelpAppBaseUrl('https://bridgecircle.org/untrusted')).toThrow(
      'Invalid Help app base URL',
    )
  })

  it('materializes notifications through the locked database transaction', async () => {
    const deps = dependencies()
    await expect(
      createHelpOutboxHandlers(deps).create_notification(job, new AbortController().signal),
    ).resolves.toEqual({ outcome: 'completed' })
    expect(deps.repository.materializeNotification).toHaveBeenCalledWith(41, 'worker-1')
  })

  it('uses one stable email key, records the provider result, and skips replayed sends', async () => {
    const repo = repository()
    vi.mocked(repo.getEmailContext).mockResolvedValue({
      jobId: 41,
      notificationType: 'offer_received',
      recipientUserId: '10000000-0000-4000-8000-000000000001',
      recipientEmail: 'member@example.test',
      recipientDisplayName: 'Jordan',
      actorDisplayName: 'Sam',
      targetType: 'ask',
      targetId: '30000000-0000-4000-8000-000000000001',
      idempotencyKey: 'outbox:41',
      providerResultId: null,
    })
    const deps = dependencies(repo)
    const handlers = createHelpOutboxHandlers(deps)
    await handlers.send_email({ ...job, jobType: 'send_email' }, new AbortController().signal)
    expect(deps.emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        actionUrl: 'http://localhost:3000/help/asks/30000000-0000-4000-8000-000000000001',
        idempotencyKey: 'outbox:41',
      }),
      expect.any(AbortSignal),
    )
    expect(repo.recordEmailProviderResult).toHaveBeenCalledWith(41, 'worker-1', 'email-1')

    vi.mocked(repo.getEmailContext).mockResolvedValue({
      jobId: 41,
      notificationType: 'offer_received',
      recipientUserId: '10000000-0000-4000-8000-000000000001',
      recipientEmail: 'member@example.test',
      recipientDisplayName: 'Jordan',
      actorDisplayName: 'Sam',
      targetType: 'ask',
      targetId: '30000000-0000-4000-8000-000000000001',
      idempotencyKey: 'outbox:41',
      providerResultId: 'email-1',
    })
    await expect(
      handlers.send_email({ ...job, jobType: 'send_email' }, new AbortController().signal),
    ).resolves.toEqual({ outcome: 'already_applied' })
    expect(deps.emailSender.send).toHaveBeenCalledOnce()
  })

  it('links accepted Help notifications to the resulting conversation', async () => {
    const repo = repository()
    vi.mocked(repo.getEmailContext).mockResolvedValue({
      jobId: 41,
      notificationType: 'offer_accepted',
      recipientUserId: '10000000-0000-4000-8000-000000000001',
      recipientEmail: 'member@example.test',
      recipientDisplayName: 'Jordan',
      actorDisplayName: 'Sam',
      targetType: 'conversation',
      targetId: '50000000-0000-4000-8000-000000000001',
      idempotencyKey: 'outbox:41',
      providerResultId: null,
    })
    const deps = dependencies(repo)
    await createHelpOutboxHandlers(deps).send_email(
      { ...job, jobType: 'send_email' },
      new AbortController().signal,
    )
    expect(deps.emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        actionUrl: 'http://localhost:3000/messages/50000000-0000-4000-8000-000000000001',
      }),
      expect.any(AbortSignal),
    )
  })

  it('runs deterministic Ask matching and applies only IDs and factual evidence IDs', async () => {
    const repo = repository()
    vi.mocked(repo.getMatchingContext).mockResolvedValue({
      askId: '30000000-0000-4000-8000-000000000001',
      askerMembershipId: '20000000-0000-4000-8000-000000000001',
      question: 'Could someone help with product strategy?',
    })
    vi.mocked(repo.searchMatchingCandidates).mockResolvedValue([
      {
        membershipId: '20000000-0000-4000-8000-000000000002',
        userId: '10000000-0000-4000-8000-000000000002',
        displayName: 'Sam',
        headline: null,
        avatarPath: null,
        graduationYear: 2001,
        topics: ['Product strategy'],
        lexicalScore: 0.8,
        semanticScore: 0,
        matchReason: 'Speaks to Product strategy',
        evidenceChunkIds: ['70000000-0000-4000-8000-000000000001'],
      },
    ])
    const handlers = createHelpOutboxHandlers(dependencies(repo))
    await handlers.run_ask_matching(
      { ...job, jobType: 'run_ask_matching' },
      new AbortController().signal,
    )
    expect(repo.applyMatches).toHaveBeenCalledWith({
      askId: '30000000-0000-4000-8000-000000000001',
      pipelineVersion: 'help-v1',
      modelVersion: 'deterministic-v1',
      matches: [
        {
          helperMembershipId: '20000000-0000-4000-8000-000000000002',
          rank: 1,
          score: expect.any(Number),
          reason: 'Speaks to Product strategy',
          evidence: { chunkIds: ['70000000-0000-4000-8000-000000000001'] },
        },
      ],
    })
  })

  it('embeds only changed profile chunks and synchronizes the desired fingerprint set', async () => {
    const repo = repository()
    vi.mocked(repo.getProfileIndexSource).mockResolvedValue({
      organizationId: '11111111-1111-4111-8111-111111111111',
      userId: '10000000-0000-4000-8000-000000000001',
      membershipId: '20000000-0000-4000-8000-000000000001',
      facts: [
        {
          id: 'directory',
          sourceSection: 'directory',
          visibility: 'organization',
          content: 'Product leader',
        },
      ],
      existingChunks: [],
    })
    const deps = dependencies(repo)
    deps.profileIndexingEnabled = true
    deps.embeddings = {
      embedQuery: vi.fn(async () => []),
      embedDocuments: vi.fn(async () => [Array.from({ length: 1024 }, () => 0)]),
    }
    await createHelpOutboxHandlers(deps).index_profile(
      { ...job, jobType: 'index_profile' },
      new AbortController().signal,
    )
    expect(repo.syncProfileIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 41,
        workerId: 'worker-1',
        desiredFingerprints: [expect.stringMatching(/^[0-9a-f]{64}$/)],
        newChunks: [
          expect.objectContaining({
            content: 'Product leader',
            contentVersion: 'help-profile-v1',
            embedding: expect.stringMatching(/^\[0(,0){1023}\]$/),
          }),
        ],
      }),
    )
  })
})
