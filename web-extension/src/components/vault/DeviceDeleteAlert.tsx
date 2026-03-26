import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import {
  useLogoutDeviceMutation,
  useRemoveDeviceMutation
} from '@shared/graphql/AccountDevices.codegen'
import { Button } from '@src/components/ui/button'
import { Switch } from '@src/components/ui/switch'
import { Tooltip } from '@src/components/ui/tooltip'
import { useDevicesListWithDataQuery } from '@src/pages-vault/Devices.codegen'

export function DeviceDeleteAlert({
  id,
  isOpen,
  onClose
}: {
  onClose: () => void
  isOpen: boolean
  id: string
}) {
  const { refetch: devicesRefetch } = useDevicesListWithDataQuery()
  const [remove, setRemove] = useState(false)
  const [logoutDevice] = useLogoutDeviceMutation({
    variables: {
      id
    }
  })
  const [removeDevice] = useRemoveDeviceMutation({
    variables: {
      id
    }
  })

  useEffect(() => {
    if (!isOpen) {
      setRemove(false)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close logout confirmation"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 shadow-xl">
        <button
          aria-label="Close logout confirmation"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]"
          onClick={onClose}
          type="button"
        >
          <FiX className="size-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
            <FiAlertTriangle className="size-4" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--color-foreground)]">
              Logout confirmation
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
              Are you sure you want to logout this device?
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[color:var(--color-foreground)]">
                Remove device from list
              </div>
              <div className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                The next login on this device will require confirmation again.
              </div>
            </div>
            <Tooltip content="You will have to confirm login again">
              <div>
                <Switch checked={remove} onCheckedChange={setRemove} />
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            No
          </Button>
          <Button
            onClick={async () => {
              if (remove) {
                await removeDevice({ variables: { id } })
              } else {
                await logoutDevice({ variables: { id } })
              }
              onClose()
              await devicesRefetch()
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
