export type HelpAssistanceResponse = {
  status?: 'suggested' | 'fallback' | 'limited' | 'not_available' | 'invalid_input'
  text?: string | null
}

const ASSISTANCE_TIMEOUT_MS = 10_000

export async function requestHelpAssistance(input: {
  task?: 'ask_draft' | 'offer_note' | 'decline_note'
  currentText: string
  context: string[]
  fallbackText: string
  signal: AbortSignal
}): Promise<HelpAssistanceResponse> {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | null = null
  let settleCallerAbort: ((result: HelpAssistanceResponse) => void) | null = null
  const abortFromCaller = () => {
    controller.abort(input.signal.reason)
    settleCallerAbort?.({ status: 'not_available', text: null })
  }
  input.signal.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const request = fetch('/api/help/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: input.task ?? 'ask_draft',
        currentText: input.currentText,
        context: input.context,
        fallbackText: input.fallbackText,
      }),
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return { status: 'not_available', text: input.fallbackText } as const
        return (await response.json()) as HelpAssistanceResponse
      })
      .catch(() =>
        input.signal.aborted
          ? ({ status: 'not_available', text: null } as const)
          : ({ status: 'fallback', text: input.fallbackText } as const),
      )

    const timedFallback = new Promise<HelpAssistanceResponse>((resolve) => {
      timeout = setTimeout(() => {
        controller.abort('help_assistance_timeout')
        resolve({ status: 'fallback', text: input.fallbackText })
      }, ASSISTANCE_TIMEOUT_MS)
    })
    const callerAbort = new Promise<HelpAssistanceResponse>((resolve) => {
      settleCallerAbort = resolve
      if (input.signal.aborted) abortFromCaller()
    })
    return await Promise.race([request, timedFallback, callerAbort])
  } finally {
    if (timeout) clearTimeout(timeout)
    input.signal.removeEventListener('abort', abortFromCaller)
    settleCallerAbort = null
  }
}
