import { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import {
  VERIFICATION_CODE_STORAGE_KEY,
  CodeMessageKind,
  verificationCodesSchema,
  type VerificationCode
} from './verificationCodeProtocol'

<<<<<<< HEAD
// Faster checks while open supplement the background alarm's 30-second checks.
=======
// Phones relay a code within seconds; check while the popup is open.
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
const RELAY_POLL_MS = 4000

export const useVerificationCodes = () => {
  const [entries, setEntries] = useState<VerificationCode[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    let revision = 0
    const refresh = () => {
      const requestRevision = ++revision
      void browser.runtime.sendMessage({ kind: CodeMessageKind.LIST }).then(
        (response: unknown) => {
          if (!active || requestRevision !== revision) return
          const parsed = verificationCodesSchema.safeParse(response)
          setError(!parsed.success)
          if (parsed.success)
            setEntries(
              parsed.data.filter((entry) => entry.expiresAt > Date.now())
            )
        },
        () => {
          if (active) setError(true)
        }
      )
    }
    const syncRelayed = () => {
      // New codes arrive through storage changes. A failed poll (offline, or a
      // locked vault) is simply retried on the next interval.
      void browser.runtime
        .sendMessage({ kind: CodeMessageKind.SYNC_RELAYED })
        .catch((syncError: unknown) => {
          console.warn('Could not check for codes from your phone', syncError)
        })
    }
    const onChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      area: string
    ) => {
      if (area === 'session' && VERIFICATION_CODE_STORAGE_KEY in changes)
        refresh()
    }
    browser.storage.onChanged.addListener(onChanged)
    refresh()
    syncRelayed()
    const relayTimer = window.setInterval(syncRelayed, RELAY_POLL_MS)
    // Alarms can be delayed during sleep; never leave an expired code in an open popup.
    const timer = window.setInterval(() => {
      setEntries((current) =>
        current.filter((entry) => entry.expiresAt > Date.now())
      )
    }, 1000)
    return () => {
      active = false
      window.clearInterval(timer)
      window.clearInterval(relayTimer)
      browser.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const update = async (
    kind: typeof CodeMessageKind.COPIED | typeof CodeMessageKind.DISMISS,
    id: string
  ) => {
    const response: unknown = await browser.runtime.sendMessage({ kind, id })
    const parsed = verificationCodesSchema.parse(response)
    setEntries(parsed.filter((entry) => entry.expiresAt > Date.now()))
  }

  return { entries, error, update }
}
