'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export function FormSubmitButton({
  pendingLabel = 'Saving…',
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}
