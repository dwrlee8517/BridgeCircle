'use client'

import { Camera, Loader2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { uploadAvatarAction } from '@/app/(member)/profile/edit/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

type Props = {
  initialAvatarUrl: string | null
  initialName: string | null
}

/**
 * Avatar uploader. Click → file picker → optimistic preview (object URL) →
 * server action does the actual upload + base_profile update.
 *
 * Errors come back from the server action and render as a small red note
 * below. We don't roll back the preview on failure — leaving the new image
 * visible while the user re-tries is friendlier than snapping back.
 *
 * Used by /profile/edit and the onboarding step-5 surface. The server
 * action targets the signed-in user's own row, so the same action is
 * correct in both contexts.
 */
export function AvatarUploader({ initialAvatarUrl, initialName }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    const fd = new FormData()
    fd.set('file', file)

    startTransition(async () => {
      const result = await uploadAvatarAction(fd)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.publicUrl) {
        // Replace the local object-URL preview with the durable storage URL
        setPreviewUrl(result.publicUrl)
        URL.revokeObjectURL(localPreview)
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-20 shrink-0">
        {previewUrl ? <AvatarImage src={previewUrl} alt={initialName ?? ''} /> : null}
        <AvatarFallback className="text-xl">
          {(initialName ?? '?').slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Camera className="size-3.5" />
              {previewUrl ? 'Change photo' : 'Upload photo'}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF. 4 MB max.</p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFile}
        />
      </div>
    </div>
  )
}
