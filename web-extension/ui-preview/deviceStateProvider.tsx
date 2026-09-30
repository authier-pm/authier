import { createContext, type PropsWithChildren, useMemo, useState } from 'react'
import type { SecretTypeUnion } from '@src/background/ExtensionDevice'
import type { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'

type ScreenshotSecuritySettings = {
  autofillCredentialsEnabled: boolean
  autofillForbiddenUrlPatterns: string
  autofillTOTPEnabled: boolean
  notificationOnVaultUnlock: boolean
  notificationOnWrongPasswordAttempts: number
  syncTOTP: boolean
  uiLanguage: string
  vaultLockTimeoutSeconds: number
}

type ScreenshotDeviceStateContext = {
  currentTab: { id: number }
  currentURL: string
  deviceState: ScreenshotSecuritySettings
  setSecuritySettings: (settings: ScreenshotSecuritySettings) => Promise<void>
  loginCredentials: SecretTypeUnion[]
  TOTPSecrets: SecretTypeUnion[]
  passkeys: SecretTypeUnion[]
  selectedItems: SecretTypeUnion[]
  setSelectedItems: (items: SecretTypeUnion[]) => void
  searchSecrets: (
    filter: string,
    types?: EncryptedSecretType[]
  ) => SecretTypeUnion[]
}

const initialDeviceState: ScreenshotSecuritySettings = {
  autofillCredentialsEnabled: true,
  autofillForbiddenUrlPatterns: '',
  autofillTOTPEnabled: true,
  notificationOnVaultUnlock: false,
  notificationOnWrongPasswordAttempts: 3,
  syncTOTP: true,
  uiLanguage: 'en',
  vaultLockTimeoutSeconds: 300
}

const initialContextValue: ScreenshotDeviceStateContext = {
  currentTab: { id: 17 },
  currentURL: 'https://example.com/login',
  deviceState: initialDeviceState,
  setSecuritySettings: async () => undefined,
  loginCredentials: [],
  TOTPSecrets: [],
  passkeys: [],
  selectedItems: [],
  setSelectedItems: () => undefined,
  searchSecrets: () => []
}

export const DeviceStateContext =
  createContext<ScreenshotDeviceStateContext>(initialContextValue)

export const ScreenshotDeviceStateProvider = ({
  children
}: PropsWithChildren) => {
  const [deviceState, setDeviceState] = useState(initialDeviceState)
  const contextValue = useMemo<ScreenshotDeviceStateContext>(
    () => ({
      ...initialContextValue,
      currentTab: initialContextValue.currentTab,
      currentURL: initialContextValue.currentURL,
      deviceState,
      setSecuritySettings: async (settings) => {
        setDeviceState(settings)
      }
    }),
    [deviceState]
  )

  return (
    <DeviceStateContext.Provider value={contextValue}>
      {children}
    </DeviceStateContext.Provider>
  )
}
