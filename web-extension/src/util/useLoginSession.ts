import { useCallback, useEffect, useState } from 'react'
import { extensionDeviceTrpc } from '@src/background/ExtensionDevice'
import type {
  LoginDraft,
  LoginSessionSnapshot
} from '@src/background/loginSessionTypes'

const LOGIN_SESSION_UI_REFRESH_INTERVAL = 1000

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to load the login session'

export function useLoginSession() {
  const [session, setSession] = useState<LoginSessionSnapshot | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const refresh = () =>
      extensionDeviceTrpc.getLoginSession
        .query()
        .then((nextSession) => {
          if (isActive) {
            setSession(nextSession)
            setLoadError(null)
          }
        })
        .catch((error: unknown) => {
          if (isActive) {
            setLoadError(getErrorMessage(error))
          }
        })

    void refresh()
    const interval = window.setInterval(
      refresh,
      LOGIN_SESSION_UI_REFRESH_INTERVAL
    )

    return () => {
      isActive = false
      window.clearInterval(interval)
    }
  }, [])

  const updateDraft = useCallback((draft: LoginDraft) => {
    return extensionDeviceTrpc.updateLoginDraft
      .mutate(draft)
      .then(() => undefined)
  }, [])

  const startLogin = useCallback(async (draft: LoginDraft) => {
    const nextSession = await extensionDeviceTrpc.startLogin.mutate(draft)
    setSession(nextSession)
    return nextSession
  }, [])

  const resetLogin = useCallback(async () => {
    const nextSession = await extensionDeviceTrpc.resetLogin.mutate()
    setSession(nextSession)
  }, [])

  const initiateMasterDeviceReset = useCallback(
    () => extensionDeviceTrpc.initiateLoginMasterDeviceReset.mutate(),
    []
  )

  return {
    session,
    loadError,
    updateDraft,
    startLogin,
    resetLogin,
    initiateMasterDeviceReset
  }
}
