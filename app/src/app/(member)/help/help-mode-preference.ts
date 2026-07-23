export type HelpMode = 'get' | 'give'

function helpModeKey(membershipId: string) {
  return `bridgecircle:help-mode:v1:${membershipId}`
}

export function readHelpMode(storage: Pick<Storage, 'getItem'>, membershipId: string): HelpMode {
  try {
    return storage.getItem(helpModeKey(membershipId)) === 'give' ? 'give' : 'get'
  } catch {
    return 'get'
  }
}

export function writeHelpMode(
  storage: Pick<Storage, 'setItem'>,
  membershipId: string,
  mode: HelpMode,
) {
  try {
    storage.setItem(helpModeKey(membershipId), mode)
  } catch {
    // Preference persistence is optional; both modes remain directly reachable.
  }
}
