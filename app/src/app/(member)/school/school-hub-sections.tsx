'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

type SchoolHubTab = 'events' | 'announcements'

export function SchoolHubSections({
  eventCount,
  announcementCount,
  events,
  announcements,
}: {
  eventCount: number
  announcementCount: number
  events: ReactNode
  announcements: ReactNode
}) {
  const [activeTab, setActiveTab] = useState<SchoolHubTab>('events')

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-border bg-card p-1 md:hidden">
        <SchoolHubTabButton
          label="Events"
          count={eventCount}
          active={activeTab === 'events'}
          onClick={() => setActiveTab('events')}
        />
        <SchoolHubTabButton
          label="Announcements"
          count={announcementCount}
          active={activeTab === 'announcements'}
          onClick={() => setActiveTab('announcements')}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className={activeTab === 'events' ? 'block' : 'hidden md:block'}>{events}</div>
        <div className={activeTab === 'announcements' ? 'block' : 'hidden md:block'}>
          {announcements}
        </div>
      </div>
    </>
  )
}

function SchoolHubTabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bc-motion-control inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-sm px-2 text-xs font-semibold ${
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
      }`}
      aria-pressed={active}
    >
      <span className="min-w-0 truncate">{label}</span>
      {count > 0 ? (
        <span
          className={`font-mono text-xs ${active ? 'text-background/75' : 'text-muted-foreground'}`}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
