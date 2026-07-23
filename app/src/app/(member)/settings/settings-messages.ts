export function settingsSavedMessage(
  saved: string | undefined,
  currentEmail: string,
  pendingEmail: string | null,
) {
  switch (saved) {
    case 'email':
      return pendingEmail
        ? `Confirmation instructions were sent to ${pendingEmail}. Keep signing in with ${currentEmail} until the change is confirmed.`
        : `Your sign-in email is now ${currentEmail}.`
    case 'notifications':
      return 'Your notification preferences were saved.'
    case 'school':
      return 'Your school email preference was saved.'
    case 'export':
      return 'We’re checking your data export. Its current status appears below.'
    case 'unblocked':
      return 'That member was unblocked.'
    default:
      return saved ? 'Your settings were saved.' : null
  }
}

export type AccountExportStatus = 'queued' | 'processing' | 'ready' | 'failed' | 'expired'

export function exportStatusTitle(status: AccountExportStatus) {
  switch (status) {
    case 'queued':
      return 'Export queued'
    case 'processing':
      return 'Export in progress'
    case 'ready':
      return 'Export ready'
    case 'failed':
      return 'Export needs another try'
    case 'expired':
      return 'Export link expired'
  }
}

export function exportStatusDescription(status: AccountExportStatus) {
  switch (status) {
    case 'queued':
      return 'You can leave this page. Preparation continues in the background.'
    case 'processing':
      return 'BridgeCircle is preparing your private archive.'
    case 'ready':
      return 'Download it here. The private file expires seven days after it is prepared.'
    case 'failed':
      return 'Nothing was deleted or changed. Request a new archive when you’re ready.'
    case 'expired':
      return 'Request a new archive to create a fresh private download.'
  }
}
