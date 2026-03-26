import type { ReactElement, RefObject } from 'react'
import { Button } from '@src/components/ui/button'

interface Props {
  isOpen: boolean
  onClose: () => void
  cancelRef: RefObject<HTMLButtonElement | null>
}

export default function RemoveAlertDialog({
  isOpen,
  onClose,
  cancelRef
}: Props): ReactElement | null {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 shadow-xl">
        <h2 className="text-lg font-bold text-[color:var(--color-foreground)]">
          Delete password
        </h2>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          Are you sure? You can&apos;t undo this action afterwards.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button onClick={onClose} ref={cancelRef} variant="outline">
            Cancel
          </Button>
          <Button onClick={onClose} variant="destructive">
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
