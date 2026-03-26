import { useContext, useEffect, useState } from 'react'
import { TbWorld } from 'react-icons/tb'
import { AuthsList } from '@src/components/pages/AuthsList'
import { ProgressCircle } from '@src/components/ui/progressCircle'
import { Input } from '@src/components/ui/input'
import { Switch } from '@src/components/ui/switch'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

const TOTP_PERIOD_SECONDS = 30

const getTotpTimeRemaining = () => {
  const remainder = Math.floor(Date.now() / 1000) % TOTP_PERIOD_SECONDS
  return remainder === 0 ? TOTP_PERIOD_SECONDS : TOTP_PERIOD_SECONDS - remainder
}

export const Home = () => {
  const [seconds, setRemainingSeconds] = useState(getTotpTimeRemaining())
  const [search, setSearch] = useState('')
  const { currentURL, deviceState, TOTPSecrets } =
    useContext(DeviceStateContext)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds(getTotpTimeRemaining())
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const [filterByTLDManual, setFilterByTLD] = useState<null | boolean>(null)

  const filterByTLD = !currentURL
    ? true
    : filterByTLDManual === null
      ? currentURL.startsWith('http')
      : filterByTLDManual

  return (
    <div className="px-2 pb-2">
      <div className="sticky top-0 z-10 mt-2 flex items-center gap-3 px-2">
        <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-[color:var(--color-foreground)]">
          <span className="inline-flex items-center gap-1.5 text-[color:var(--color-muted)]">
            <TbWorld className="size-4" />
            TLD
          </span>
          <Switch
            checked={filterByTLD}
            onCheckedChange={(checked) => {
              setFilterByTLD(checked)
            }}
          />
        </label>

        <Input
          className="h-9"
          placeholder="Search"
          value={search}
          onChange={(e) => {
            const nextValue = e.target.value

            setFilterByTLD(nextValue === '' ? true : false)
            setSearch(nextValue)
          }}
        />

        {deviceState && TOTPSecrets.length > 0 ? (
          <ProgressCircle
            className="ml-auto shrink-0"
            max={30}
            value={30 - seconds}
            valueLabel={seconds.toString()}
          />
        ) : null}
      </div>

      <div className="mt-2 h-[300px] w-[350px] px-1">
        <div className="grid gap-3 pb-5">
          <AuthsList filterByTLD={filterByTLD} search={search} />
        </div>
      </div>
    </div>
  )
}
