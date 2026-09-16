import { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import {
  EMAIL_CODE_STORAGE_KEY,
  EmailCodeMessageKind,
  emailVerificationCodesSchema,
  type EmailVerificationCode
} from './emailCodeProtocol'

export const useEmailVerificationCodes = () => {
  const [entries, setEntries] = useState<EmailVerificationCode[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    let revision = 0
    const refresh = () => {
      const requestRevision = ++revision
      void browser.runtime
        .sendMessage({ kind: EmailCodeMessageKind.LIST })
        .then(
          (response: unknown) => {
            if (!active || requestRevision !== revision) return
            const parsed = emailVerificationCodesSchema.safeParse(response)
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
    const onChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      area: string
    ) => {
      if (area === 'session' && EMAIL_CODE_STORAGE_KEY in changes) refresh()
    }
    browser.storage.onChanged.addListener(onChanged)
    refresh()
    // Alarms can be delayed during sleep; never leave an expired code in an open popup.
    const timer = window.setInterval(() => {
      setEntries((current) =>
        current.filter((entry) => entry.expiresAt > Date.now())
      )
    }, 1000)
    return () => {
      active = false
      window.clearInterval(timer)
      browser.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const update = async (
    kind:
      | typeof EmailCodeMessageKind.COPIED
      | typeof EmailCodeMessageKind.DISMISS,
    id: string
  ) => {
    const response: unknown = await browser.runtime.sendMessage({ kind, id })
    const parsed = emailVerificationCodesSchema.parse(response)
    setEntries(parsed.filter((entry) => entry.expiresAt > Date.now()))
  }

  return { entries, error, update }
}
