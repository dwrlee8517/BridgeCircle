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
      return 'Your data export was requested.'
    case 'unblocked':
      return 'That member was unblocked.'
    default:
      return saved ? 'Your settings were saved.' : null
  }
}
