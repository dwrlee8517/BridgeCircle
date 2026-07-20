import { describe, expect, it, vi } from 'vitest'
import type { ProfileRepository } from './contracts'
import {
  markOnboardingComplete,
  saveOnboardingAbout,
  saveOnboardingEducation,
  saveOnboardingPast,
} from './savePartialProfile'

function repository(overrides: Partial<ProfileRepository> = {}): ProfileRepository {
  return {
    get: vi.fn(),
    saveIdentity: vi.fn().mockResolvedValue('saved'),
    saveEducation: vi.fn().mockResolvedValue('saved'),
    saveCurrent: vi.fn().mockResolvedValue('saved'),
    saveHistory: vi.fn().mockResolvedValue('saved'),
    saveAbout: vi.fn().mockResolvedValue('saved'),
    saveVisibility: vi.fn().mockResolvedValue('saved'),
    saveLinks: vi.fn().mockResolvedValue('saved'),
    savePreferences: vi.fn().mockResolvedValue('saved'),
    setAvatarPath: vi.fn().mockResolvedValue('saved'),
    completeOnboarding: vi.fn().mockResolvedValue({
      ok: true,
      completedAt: '2026-07-14T00:00:00Z',
    }),
    ...overrides,
  }
}

describe('onboarding profile operations', () => {
  it('saves identity through the selected membership only', async () => {
    const repo = repository()
    await expect(
      saveOnboardingAbout(repo, 'membership-1', {
        name: 'Maren Lee',
        preferredName: 'Maren',
        nameOther: null,
        graduationYear: 2022,
      }),
    ).resolves.toEqual({ ok: true })
    expect(repo.saveIdentity).toHaveBeenCalledWith('membership-1', {
      displayName: 'Maren Lee',
      preferredName: 'Maren',
      nameOther: null,
      graduationYear: 2022,
    })
  })

  it('maps membership denials without leaking database detail', async () => {
    const repo = repository({ saveIdentity: vi.fn().mockResolvedValue('not_owned') })
    await expect(
      saveOnboardingAbout(repo, 'membership-1', {
        name: 'Maren Lee',
        preferredName: null,
        nameOther: null,
        graduationYear: 2022,
      }),
    ).resolves.toEqual({ ok: false, error: 'no_membership' })
  })

  it('normalizes ordered education and experience dates', async () => {
    const repo = repository()
    await saveOnboardingEducation(repo, 'membership-1', {
      university: 'UCLA',
      major: 'Design',
      educationHistory: [
        {
          school: 'UCLA',
          degree: 'BA',
          field: 'Design',
          startDate: '2018-09',
          endDate: '2022-06',
        },
      ],
    })
    await saveOnboardingPast(repo, 'membership-1', {
      careerHistory: [
        {
          employer: 'BridgeCircle',
          title: 'Founder',
          startDate: '2024',
          endDate: null,
          description: null,
        },
      ],
      skills: ['Community'],
    })

    expect(repo.saveEducation).toHaveBeenCalledWith(
      'membership-1',
      expect.objectContaining({
        education: [expect.objectContaining({ startYear: 2018, startMonth: 9, endYear: 2022 })],
      }),
    )
    expect(repo.saveHistory).toHaveBeenCalledWith(
      'membership-1',
      expect.objectContaining({
        experiences: [expect.objectContaining({ startYear: 2024, startMonth: null })],
      }),
    )
  })

  it('returns an incomplete result from final completion', async () => {
    const repo = repository({
      completeOnboarding: vi.fn().mockResolvedValue({ ok: false, error: 'incomplete_profile' }),
    })
    await expect(markOnboardingComplete(repo, 'membership-1')).resolves.toEqual({
      ok: false,
      error: 'incomplete_profile',
    })
  })
})
