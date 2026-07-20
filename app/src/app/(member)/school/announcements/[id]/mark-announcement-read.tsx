'use client'

import { useEffect, useTransition } from 'react'
import { markAnnouncementReadAction } from '../../actions'

export function MarkAnnouncementRead({ announcementId }: { announcementId: string }) {
  const [, startTransition] = useTransition()
  useEffect(() => {
    startTransition(() => {
      void markAnnouncementReadAction(announcementId)
    })
  }, [announcementId])
  return null
}
