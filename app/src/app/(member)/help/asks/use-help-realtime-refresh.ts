'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useUserControl } from '../../user-control-provider'

export function useHelpRealtimeRefresh() {
  const router = useRouter()
  const { helpRevision } = useUserControl()
  const lastRevision = useRef(helpRevision)

  useEffect(() => {
    if (lastRevision.current === helpRevision) return
    lastRevision.current = helpRevision
    router.refresh()
  }, [helpRevision, router])
}
