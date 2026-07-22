import { describe, expect, it, vi } from 'vitest'
import {
  changeAccountEmail,
  createAccountExportDownload,
  requestAccountExport,
  saveNotificationGroup,
} from './operations'

describe('settings operations', () => {
  it('saves every notification type and reports partial failure', async () => {
    const save = vi.fn().mockResolvedValueOnce('saved').mockResolvedValueOnce('not_available')
    await expect(
      saveNotificationGroup(
        { groupId: 'connections', inApp: true, email: false },
        { saveNotificationPreference: save },
      ),
    ).resolves.toBe('failed')
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('rejects unknown notification groups without I/O', async () => {
    const save = vi.fn()
    await expect(
      saveNotificationGroup(
        { groupId: 'invented', inApp: true, email: true },
        { saveNotificationPreference: save },
      ),
    ).resolves.toBe('invalid_group')
    expect(save).not.toHaveBeenCalled()
  })

  it('injects the export id and storage signer', async () => {
    const requestExport = vi.fn(async () => null)
    await requestAccountExport({ requestExport }, () => 'request-id')
    expect(requestExport).toHaveBeenCalledWith('request-id')

    const createSignedUrl = vi.fn(async () => 'https://download.example/export')
    await expect(
      createAccountExportDownload(
        { getExportDownload: vi.fn(async () => ({ bucket: 'exports', path: 'one.zip' })) },
        { createSignedUrl },
      ),
    ).resolves.toBe('https://download.example/export')
    expect(createSignedUrl).toHaveBeenCalledWith('exports', 'one.zip')
  })

  it('delegates email changes to the auth adapter', async () => {
    const changeEmail = vi.fn(async () => 'changed' as const)
    await expect(changeAccountEmail('member@example.com', { changeEmail })).resolves.toBe('changed')
  })
})
