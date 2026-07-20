import { describe, expect, it, vi } from 'vitest'
import type { HelpWorkerRepository } from '@/db/repositories/help-worker'
import { type ClaimedOutboxJob, OutboxJobError } from '@/lib/outbox/contracts'
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
    consumeAskMatchingProviderBudget: vi.fn<
      HelpWorkerRepository['consumeAskMatchingProviderBudget']
    >(async () => 'allowed'),
    applyMatches: vi.fn<HelpWorkerRepository['applyMatches']>(async () => ({
      result_code: 'applied',
      applied_count: 0,
    })),
    getProfileIndexSource: vi.fn<HelpWorkerRepository['getProfileIndexSource']>(async () => null),
    beginProfileIndexAttempt: vi.fn<HelpWorkerRepository['beginProfileIndexAttempt']>(
      async () => 'allowed',
    ),
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
    runSchoolMaintenance: vi.fn<HelpWorkerRepository['runSchoolMaintenance']>(async () => ({
      expired_offers: 0,
      opened_offers: 0,
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
      failAccountExport: vi.fn(async () => undefined),
      processAccountDeletion: vi.fn(async () => 'completed' as const),
      deleteStorageObjects: vi.fn(async () => 'completed' as const),
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

  it('links School email notifications to their canonical detail pages', async () => {
    const repo = repository()
    vi.mocked(repo.getEmailContext)
      .mockResolvedValueOnce({
        jobId: 41,
        notificationType: 'event_reminder',
        recipientUserId: '10000000-0000-4000-8000-000000000001',
        recipientEmail: 'member@example.test',
        recipientDisplayName: 'Jordan',
        actorDisplayName: null,
        targetType: 'event',
        targetId: '50000000-0000-4000-8000-000000000001',
        idempotencyKey: 'outbox:41',
        providerResultId: null,
      })
      .mockResolvedValueOnce({
        jobId: 42,
        notificationType: 'announcement_published',
        recipientUserId: '10000000-0000-4000-8000-000000000001',
        recipientEmail: 'member@example.test',
        recipientDisplayName: 'Jordan',
        actorDisplayName: null,
        targetType: 'announcement',
        targetId: '60000000-0000-4000-8000-000000000001',
        idempotencyKey: 'outbox:42',
        providerResultId: null,
      })
    const deps = dependencies(repo)
    const handlers = createHelpOutboxHandlers(deps)

    await handlers.send_email({ ...job, jobType: 'send_email' }, new AbortController().signal)
    await handlers.send_email(
      { ...job, id: 42, jobType: 'send_email' },
      new AbortController().signal,
    )

    expect(deps.emailSender.send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        notificationType: 'event_reminder',
        actionUrl: 'http://localhost:3000/school/events/50000000-0000-4000-8000-000000000001',
      }),
      expect.any(AbortSignal),
    )
    expect(deps.emailSender.send).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        notificationType: 'announcement_published',
        actionUrl:
          'http://localhost:3000/school/announcements/60000000-0000-4000-8000-000000000001',
      }),
      expect.any(AbortSignal),
    )
  })

  it('delegates account deletion and Storage cleanup to the lifecycle worker', async () => {
    const deps = dependencies()
    const handlers = createHelpOutboxHandlers(deps)

    await expect(
      handlers.process_account_deletion(
        { ...job, jobType: 'process_account_deletion' },
        new AbortController().signal,
      ),
    ).resolves.toEqual({ outcome: 'completed' })
    await expect(
      handlers.delete_storage_objects(
        { ...job, jobType: 'delete_storage_objects' },
        new AbortController().signal,
      ),
    ).resolves.toEqual({ outcome: 'completed' })
  })

  it('marks an export failed when its final worker attempt cannot complete', async () => {
    const deps = dependencies()
    vi.mocked(deps.entryOperations.generateAccountExport).mockRejectedValue(
      new OutboxJobError('account_export_upload_failed', false),
    )
    const handlers = createHelpOutboxHandlers(deps)

    await expect(
      handlers.generate_account_export(
        { ...job, jobType: 'generate_account_export', attempts: 8, maxAttempts: 8 },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'account_export_upload_failed' })
    expect(deps.entryOperations.failAccountExport).toHaveBeenCalledWith(
      job.payload,
      'account_export_upload_failed',
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

  it('uses lexical matching without provider calls when queued matching is limited', async () => {
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
    vi.mocked(repo.consumeAskMatchingProviderBudget).mockResolvedValue('limited')
    const deps = dependencies(repo)
    deps.embeddings = {
      embedQuery: vi.fn(async () => [0.1, 0.2]),
      embedDocuments: vi.fn(async () => []),
    }
    deps.reranker = { rerank: vi.fn(async () => []) }

    await createHelpOutboxHandlers(deps).run_ask_matching(
      { ...job, jobType: 'run_ask_matching' },
      new AbortController().signal,
    )

    expect(repo.consumeAskMatchingProviderBudget).toHaveBeenCalledWith(41, 'worker-1')
    expect(deps.embeddings.embedQuery).not.toHaveBeenCalled()
    expect(deps.reranker.rerank).not.toHaveBeenCalled()
    expect(repo.applyMatches).toHaveBeenCalledWith(
      expect.objectContaining({ matches: [expect.objectContaining({ rank: 1 })] }),
    )
  })

  it('does not consume queued provider budget when lexical retrieval is empty', async () => {
    const repo = repository()
    vi.mocked(repo.getMatchingContext).mockResolvedValue({
      askId: '30000000-0000-4000-8000-000000000001',
      askerMembershipId: '20000000-0000-4000-8000-000000000001',
      question: 'Could someone help?',
    })
    const deps = dependencies(repo)
    deps.embeddings = {
      embedQuery: vi.fn(async () => [0.1, 0.2]),
      embedDocuments: vi.fn(async () => []),
    }

    await createHelpOutboxHandlers(deps).run_ask_matching(
      { ...job, jobType: 'run_ask_matching' },
      new AbortController().signal,
    )

    expect(repo.consumeAskMatchingProviderBudget).not.toHaveBeenCalled()
    expect(deps.embeddings.embedQuery).not.toHaveBeenCalled()
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

  it.each([
    'unchanged',
    'coalesced',
  ] as const)('skips provider work when the profile index attempt is %s', async (authorization) => {
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
    vi.mocked(repo.beginProfileIndexAttempt).mockResolvedValue(authorization)
    const deps = dependencies(repo)
    deps.profileIndexingEnabled = true
    deps.embeddings = {
      embedQuery: vi.fn(async () => []),
      embedDocuments: vi.fn(async () => []),
    }

    await expect(
      createHelpOutboxHandlers(deps).index_profile(
        { ...job, jobType: 'index_profile' },
        new AbortController().signal,
      ),
    ).resolves.toEqual({ outcome: 'skipped' })
    expect(deps.embeddings.embedDocuments).not.toHaveBeenCalled()
    expect(repo.syncProfileIndex).not.toHaveBeenCalled()
  })

  it.each([
    'busy',
    'limited',
  ] as const)('retries without provider work when the profile index attempt is %s', async (authorization) => {
    const repo = repository()
    vi.mocked(repo.getProfileIndexSource).mockResolvedValue({
      organizationId: '11111111-1111-4111-8111-111111111111',
      userId: '10000000-0000-4000-8000-000000000001',
      membershipId: '20000000-0000-4000-8000-000000000001',
      facts: [],
      existingChunks: [],
    })
    vi.mocked(repo.beginProfileIndexAttempt).mockResolvedValue(authorization)
    const deps = dependencies(repo)
    deps.profileIndexingEnabled = true
    deps.embeddings = {
      embedQuery: vi.fn(async () => []),
      embedDocuments: vi.fn(async () => []),
    }

    await expect(
      createHelpOutboxHandlers(deps).index_profile(
        { ...job, jobType: 'index_profile' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: `profile_index_${authorization}`, terminal: false })
    expect(deps.embeddings.embedDocuments).not.toHaveBeenCalled()
    expect(repo.syncProfileIndex).not.toHaveBeenCalled()
  })
})
