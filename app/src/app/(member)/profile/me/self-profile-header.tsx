'use client'

import { Pencil } from 'lucide-react'
import { useActionState, useState } from 'react'
import { AvatarUploader } from '@/components/avatar-uploader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { SelfProfile } from '@/lib/profile/contracts'
import { initialProfileActionState, saveIdentityAction } from './actions'
import { ActionFooter, EditorPanel, Field, initials, ProfileTag } from './self-profile-ui'

export function SelfProfileHeader({
  identity,
  current,
  openToHelp,
  avatarUrl,
}: {
  identity: SelfProfile['identity']
  current: SelfProfile['current']
  openToHelp: boolean
  avatarUrl: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [state, action, pending] = useActionState(saveIdentityAction, initialProfileActionState)
  const name = identity.preferredName || identity.displayName || 'Your profile'
  const visibleCurrent = [current.title, current.employer, current.city].filter(Boolean).join(' · ')

  return (
    <header className="px-5 py-6 sm:px-7 lg:px-8.5 lg:py-7.5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar className="size-20 ring-2 ring-[rgb(49_130_246_/_0.28)] ring-offset-2 ring-offset-white sm:size-[84px]">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-2xl">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-display-large leading-tight font-extrabold tracking-display">
              {name}
            </h1>
            {identity.graduationYear ? (
              <ProfileTag>Class of ’{String(identity.graduationYear).slice(-2)}</ProfileTag>
            ) : null}
            {openToHelp ? <ProfileTag tone="green">Open to help</ProfileTag> : null}
          </div>
          <p className="mt-1.5 text-sm font-medium text-[var(--grey-600)]">
            {visibleCurrent || 'Add what you are working on now'}
          </p>
          {current.headline ? (
            <p className="mt-2 max-w-[62ch] text-body-sm leading-relaxed font-medium text-[var(--text-secondary)]">
              {current.headline}
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>
          <Pencil aria-hidden /> Edit header
        </Button>
      </div>

      {editing ? (
        <EditorPanel title="Edit your header" onClose={() => setEditing(false)}>
          <div className="mb-5">
            <AvatarUploader initialAvatarUrl={avatarUrl} initialName={name} />
          </div>
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="displayName"
              required
              defaultValue={identity.displayName}
            />
            <Field
              label="Preferred name"
              name="preferredName"
              defaultValue={identity.preferredName}
            />
            <Field label="Other name" name="nameOther" defaultValue={identity.nameOther} />
            <Field
              label="Graduation year"
              name="graduationYear"
              type="number"
              required
              min={1900}
              max={2100}
              defaultValue={identity.graduationYear}
            />
            <ActionFooter state={state} pending={pending} />
          </form>
        </EditorPanel>
      ) : null}
    </header>
  )
}
