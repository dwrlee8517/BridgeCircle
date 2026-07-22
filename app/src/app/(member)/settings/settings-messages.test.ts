import { describe, expect, it } from 'vitest'
import {
  exportStatusDescription,
  exportStatusTitle,
  settingsSavedMessage,
} from './settings-messages'

describe('settingsSavedMessage', () => {
  it('explains the old and pending email state while confirmation is outstanding', () => {
    expect(settingsSavedMessage('email', 'current@example.com', 'next@example.com')).toBe(
      'Confirmation instructions were sent to next@example.com. Keep signing in with current@example.com until the change is confirmed.',
    )
  })

  it('describes an immediately applied email change truthfully', () => {
    expect(settingsSavedMessage('email', 'next@example.com', null)).toBe(
      'Your sign-in email is now next@example.com.',
    )
  })

  it('returns no banner when there was no saved action', () => {
    expect(settingsSavedMessage(undefined, 'current@example.com', null)).toBeNull()
  })

  it('does not promise that a repeated export request created a new job', () => {
    expect(settingsSavedMessage('export', 'current@example.com', null)).toBe(
      'We’re checking your data export. Its current status appears below.',
    )
  })

  it('describes ready and failed export states without promising email delivery', () => {
    expect(exportStatusTitle('ready')).toBe('Export ready')
    expect(exportStatusDescription('ready')).toContain('Download it here')
    expect(exportStatusTitle('failed')).toBe('Export needs another try')
    expect(exportStatusDescription('failed')).toContain('Nothing was deleted or changed')
  })
})
