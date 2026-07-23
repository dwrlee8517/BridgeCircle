'use client'

import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useMemberShellHeader } from '@/app/(member)/member-shell-header-context'
import { Button } from '@/components/ui/button'
import type { SelfProfile } from '@/lib/profile/contracts'
import { SelfProfileHeader } from './self-profile-header'
import { SelfProfileRail } from './self-profile-rail'
import { SelfProfileAbout, SelfProfileCareer, SelfProfileEducation } from './self-profile-sections'
import { QuietEmpty, SelfSection } from './self-profile-ui'

export function SelfProfileView({
  profile,
  avatarUrl,
}: {
  profile: SelfProfile
  avatarUrl: string | null
}) {
  useMemberShellHeader({
    title: 'Your profile',
    meta: 'What you edit here is exactly what other members see.',
  })

  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <article className="mx-auto max-w-[1180px] overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <SelfProfileHeader
          identity={profile.identity}
          current={profile.current}
          openToHelp={profile.preferences.openToHelp}
          avatarUrl={avatarUrl}
        />

        <div className="mx-5 h-px bg-[var(--divider-row)] sm:mx-7 lg:mx-8.5" />
        <div className="grid gap-8 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_290px] lg:px-8.5 lg:py-7">
          <div className="min-w-0 space-y-7">
            <SelfProfileAbout bio={profile.preferences.bio} />
            <SelfProfileCareer
              current={profile.current}
              experiences={profile.experiences}
              skills={profile.skills}
            />
            <SelfProfileEducation current={profile.current} education={profile.education} />
            <SelfSection title="Can help with" divided>
              {profile.preferences.helperTopics.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {profile.preferences.helperTopics.map((topic) => (
                    <div
                      key={topic.name}
                      className="flex min-h-10 items-start gap-2.5 rounded-xl p-2 text-control font-bold"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--action-primary)]" />
                      {topic.name}
                    </div>
                  ))}
                </div>
              ) : (
                <QuietEmpty icon={ShieldCheck}>No helping topics are listed yet.</QuietEmpty>
              )}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-2 -ml-2 text-[var(--blue-600)]"
              >
                <Link href="/help?mode=give">Manage in Help · Give</Link>
              </Button>
            </SelfSection>
          </div>

          <SelfProfileRail
            links={profile.links}
            visibility={profile.visibility}
            openToHelp={profile.preferences.openToHelp}
          />
        </div>
      </article>
    </div>
  )
}
