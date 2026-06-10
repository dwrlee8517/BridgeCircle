'use client'

import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import type { HomeCareerMove, HomeLocationMove } from '@/lib/home/getHomeFeed'
import { getInitials } from '@/lib/utils'

const AVATAR_COLORS = [
  'border-accent-sage/30 bg-accent-sage/10 text-accent-sage',
  'border-primary/30 bg-primary/10 text-primary',
  'border-accent-plum/30 bg-accent-plum/10 text-accent-plum',
  'border-accent-ochre/30 bg-accent-ochre/10 text-accent-ochre',
]

function getAvatarBg(name: string | null): string {
  if (!name) return AVATAR_COLORS[0]
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_COLORS[charCodeSum % AVATAR_COLORS.length]
}

export default function CircleMovesToggle({
  careerMoves,
  locationMoves,
}: {
  careerMoves: HomeCareerMove[]
  locationMoves: HomeLocationMove[]
}) {
  const [activeTab, setActiveTab] = useState<'career' | 'location'>('career')

  return (
    <div className="space-y-4">
      {/* Interactive Tabs Header with 2px top border */}
      <div className="border-t-2 border-foreground pt-4 flex items-center justify-between">
        <div className="flex gap-5">
          <button
            type="button"
            onClick={() => setActiveTab('career')}
            className={`font-heading font-semibold text-lg tracking-tight pb-1 transition-colors border-b-2 -mb-[18px] z-10 ${
              activeTab === 'career'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Career moves
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`font-heading font-semibold text-lg tracking-tight pb-1 transition-colors border-b-2 -mb-[18px] z-10 ${
              activeTab === 'location'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Location moves
          </button>
        </div>

        <span className="font-mono text-xs font-bold tracking-[0.14em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 shrink-0">
          <span className="size-1 rounded-full bg-current" />
          Circle updates
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed pt-1.5">
        {activeTab === 'career'
          ? 'Recent title or employer changes in your professional network.'
          : 'Members relocating or active near your local area.'}
      </p>

      {/* Main card */}
      <Card className="rounded-lg border border-border p-5 bg-card">
        {activeTab === 'career' ? (
          <div className="divide-y divide-border/30">
            {careerMoves.map((m) => {
              const yearShort = m.graduationYear ? `'${`${m.graduationYear}`.slice(-2)}` : null
              const initials = getInitials(m.name)
              const avatarBg = getAvatarBg(m.name)
              const isMock = m.userId.startsWith('mock-')

              const content = (
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start py-3.5 px-3 -mx-3 transition rounded-lg hover:bg-muted/5 dark:hover:bg-muted/10">
                  <div
                    className={`size-10 rounded-lg border flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${avatarBg}`}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0 pr-2">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {m.name}
                      </h4>
                      {yearShort && (
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {yearShort}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-foreground font-medium mt-1 leading-normal">
                      {m.newTitle} <span className="text-muted-foreground font-normal">at</span>{' '}
                      <span className="text-foreground font-semibold">{m.newEmployer}</span>
                    </p>

                    {m.oldEmployer && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                        formerly {m.oldTitle ? `${m.oldTitle} at ` : ''}
                        <span>{m.oldEmployer}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {m.pulse && (
                      <span className="relative flex h-2 w-2 rounded-full bg-accent-sage ring-4 ring-success-tint">
                        <span className="sr-only">New</span>
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                      {m.timeAgo}
                    </span>
                  </div>
                </div>
              )

              if (isMock) {
                return (
                  <div key={m.userId} className="group block">
                    {content}
                  </div>
                )
              }

              return (
                <Link key={m.userId} href={`/profile/${m.userId}`} className="group block">
                  {content}
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {locationMoves.map((m) => {
              const yearShort = m.graduationYear ? `'${`${m.graduationYear}`.slice(-2)}` : null
              const initials = getInitials(m.name)
              const avatarBg = getAvatarBg(m.name)
              const isMock = m.userId.startsWith('mock-')

              const content = (
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start py-3.5 px-3 -mx-3 transition rounded-lg hover:bg-muted/5 dark:hover:bg-muted/10">
                  <div
                    className={`size-10 rounded-lg border flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${avatarBg}`}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0 pr-2">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {m.name}
                      </h4>
                      {yearShort && (
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {yearShort}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 leading-normal">
                      {m.currentTitle ? (
                        <span>
                          <span className="text-foreground font-medium">{m.currentTitle}</span>
                          {m.currentEmployer && (
                            <span>
                              {' '}
                              <span className="text-muted-foreground font-normal">at</span>{' '}
                              <span className="text-foreground font-semibold">
                                {m.currentEmployer}
                              </span>
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>Member</span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground bg-muted/65 px-2.5 py-0.5 rounded-md border border-border/40">
                      <MapPin className="size-3 text-muted-foreground/75 shrink-0 mr-1" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{m.city}</span>
                    </div>
                  </div>
                </div>
              )

              if (isMock) {
                return (
                  <div key={m.userId} className="group block">
                    {content}
                  </div>
                )
              }

              return (
                <Link key={m.userId} href={`/profile/${m.userId}`} className="group block">
                  {content}
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
