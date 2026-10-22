import { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import {
  CLOCK_SKEW_STORAGE_KEY,
  clockSkewSchema,
  type ClockSkew
} from './clockSkew'

export function useClockSkew() {
  const [sample, setSample] = useState<ClockSkew | null>(null)

  useEffect(() => {
    let active = true
    let revision = 0
    const update = (value: unknown) => {
      if (value === undefined) {
        setSample(null)
        return
      }
      const parsed = clockSkewSchema.safeParse(value)
      if (parsed.success) setSample(parsed.data)
    }
    const onChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'session' || !(CLOCK_SKEW_STORAGE_KEY in changes)) return
      revision += 1
      update(changes[CLOCK_SKEW_STORAGE_KEY].newValue)
    }

    browser.storage.onChanged.addListener(onChanged)
    const initialRevision = revision
    void browser.storage.session
      .get(CLOCK_SKEW_STORAGE_KEY)
      .then((stored) => {
        // A sync may finish while the initial storage read is still pending.
        if (active && revision === initialRevision)
          update(stored[CLOCK_SKEW_STORAGE_KEY])
      })
      .catch((error: unknown) => {
        console.warn('Could not read the last clock check', error)
      })

    return () => {
      active = false
      browser.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  return sample
}
