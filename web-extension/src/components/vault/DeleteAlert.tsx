import { Button } from '@src/components/ui/button'
import { useEffect } from 'react'

export function DeleteAlert({
  isOpen,
  onClose,
  deleteItem
}: {
  onClose: () => void
  isOpen: boolean
  deleteItem: () => void
}) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 shadow-xl"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--color-foreground)]">
              Delete confirmation
            </h2>
            <p className="mt-3 text-sm text-[color:var(--color-muted)]">
              Are you sure you want to delete this item?
            </p>
          </div>
          <button
            aria-label="Close delete confirmation"
            className="rounded-full p-1 text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            No
          </Button>
          <Button
            onClick={() => {
              onClose()
              deleteItem()
            }}
            variant="destructive"
          >
            Yes
          </Button>
        </div>
      </div>
    </div>
  )
}
