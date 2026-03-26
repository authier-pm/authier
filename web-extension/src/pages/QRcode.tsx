import { useContext, useEffect } from 'react'
import ReactQRCode from 'react-qr-code'
import { useLocation } from 'wouter'
import { IoArrowForward } from 'react-icons/io5'
import { Button } from '@src/components/ui/button'
import { UserContext } from '@src/providers/UserProvider'
import { useDeviceCountQuery } from './QRcode.codegen'

export function QRCode() {
  const [, setLocation] = useLocation()
  const { userId } = useContext(UserContext)
  const { data, startPolling, stopPolling } = useDeviceCountQuery()

  useEffect(() => {
    startPolling(500)

    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

  useEffect(() => {
    const devicesCount = data?.me?.devicesCount ?? 0

    if (devicesCount > 1) {
      stopPolling()
      setLocation('/')
    }
  }, [data, setLocation, stopPolling])

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
        Scan QR code in app
      </h3>
      <div className="rounded-[var(--radius-lg)] bg-white p-4 shadow-lg">
        <ReactQRCode size={200} value={userId ?? ''} />
      </div>
      <Button
        variant="outline"
        onClick={() => {
          stopPolling()
          setLocation('/')
        }}
      >
        <IoArrowForward className="size-4" />
        Skip
      </Button>
    </div>
  )
}
