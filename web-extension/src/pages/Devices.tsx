import { IoIosPhonePortrait } from 'react-icons/io'
import { IoTrashOutline } from 'react-icons/io5'
import { HiStar } from 'react-icons/hi'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { useDevicesListWithDataQuery } from '@src/pages-vault/Devices.codegen'

export default function Devices() {
  const { data, loading, error } = useDevicesListWithDataQuery()

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-[color:var(--color-danger)]">
        Failed to load devices.
      </div>
    )
  }

  return (
    <div className="space-y-3 p-2">
      {data?.me?.devices.map((device) => {
        return (
          <div
            key={device.lastIpAddress}
            className="extension-surface rounded-[var(--radius-lg)] border border-[color:var(--color-border)] px-3 py-3 shadow-lg"
          >
            <div className="mb-2 flex justify-end gap-2">
              <Tooltip content="Main device">
                <button
                  aria-label="Main device"
                  className="text-amber-400"
                  type="button"
                >
                  <HiStar className="size-4" />
                </button>
              </Tooltip>
              <Tooltip content="Remove device">
                <button
                  aria-label="Remove device"
                  className="text-[color:var(--color-muted)]"
                  type="button"
                >
                  <IoTrashOutline className="size-4" />
                </button>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3">
              <IoIosPhonePortrait className="size-12 text-[color:var(--color-primary)]" />
              <div className="min-w-0 text-sm text-[color:var(--color-foreground)]">
                <div className="font-semibold">{device.name}</div>
                <div className="truncate text-[color:var(--color-muted)]">
                  {device.lastIpAddress}
                </div>
                <div className="truncate text-[color:var(--color-muted)]">
                  Location: {device.lastGeoLocation}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <Button className="w-full" variant="outline">
        Add device
      </Button>
    </div>
  )
}
