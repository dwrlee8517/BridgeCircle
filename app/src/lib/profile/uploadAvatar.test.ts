import { describe, expect, it, vi } from 'vitest'
import type { AvatarStorageRepository, ProfileRepository } from './contracts'
import { uploadAvatar } from './uploadAvatar'

function file(type = 'image/png', size = 128) {
  return new File([new Uint8Array(size)], 'avatar.png', { type })
}

describe('uploadAvatar', () => {
  it('uploads an owner-scoped path and persists the path, not the public URL', async () => {
    const storage: AvatarStorageRepository = {
      upload: vi.fn().mockResolvedValue({ ok: true }),
      publicUrl: vi.fn().mockReturnValue('https://example.test/avatar.png'),
    }
    const profiles = {
      setAvatarPath: vi.fn().mockResolvedValue('saved'),
    } as unknown as ProfileRepository

    const result = await uploadAvatar({
      storage,
      profiles,
      membershipId: 'membership-1',
      userId: '80000000-0000-4000-8000-000000000001',
      file: file(),
      now: () => 1234,
    })

    expect(result).toEqual({ ok: true, publicUrl: 'https://example.test/avatar.png' })
    expect(profiles.setAvatarPath).toHaveBeenCalledWith(
      'membership-1',
      '80000000-0000-4000-8000-000000000001/1234.png',
    )
  })

  it('rejects unsupported files before storage is called', async () => {
    const storage: AvatarStorageRepository = {
      upload: vi.fn(),
      publicUrl: vi.fn(),
    }
    const profiles = {} as ProfileRepository
    await expect(
      uploadAvatar({
        storage,
        profiles,
        membershipId: 'membership-1',
        userId: 'user-1',
        file: file('image/gif'),
      }),
    ).resolves.toMatchObject({ ok: false, error: 'unsupported_type' })
    expect(storage.upload).not.toHaveBeenCalled()
  })
})
