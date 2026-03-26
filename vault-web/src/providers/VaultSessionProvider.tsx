import {
  abToCryptoKey,
  base64ToBuffer,
  bufferToBase64,
  cryptoKeyToString,
  decryptDeviceSecretWithPassword,
  decryptString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret
} from '@shared/cryptoUtils'
import type { VaultApiOutputs } from '@shared/orpc/contract'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { orpcClient } from '@/lib/orpc'
import { getOrCreateDeviceIdentity, type DeviceIdentity } from '@/lib/deviceIdentity'
import { setAccessToken } from '@/lib/accessToken'
import {
  decryptSecrets,
  encryptLoginSecret,
  encryptTotpSecret,
  type DecryptedVaultSecret,
  type LoginSecretValues,
  type TotpSecretValues
} from '@/lib/vaultSecrets'

type SessionBootstrap = VaultApiOutputs['session']['bootstrap']
type ApprovedChallenge = Extract<
  VaultApiOutputs['auth']['requestDeviceChallenge'],
  { status: 'approved' }
>
type PendingChallenge = Extract<
  VaultApiOutputs['auth']['requestDeviceChallenge'],
  { status: 'pending' }
>
type AuthenticatedSession = VaultApiOutputs['auth']['refresh']

type LockedVaultState = {
  userId: string
  email: string
  deviceName: string
  encryptionSalt: string
  authSecretEncrypted: string
  vaultLockTimeoutSeconds: number
}

type PendingLoginState = {
  email: string
  password: string
  lastResult: PendingChallenge
}

type UnlockedVaultState = {
  session: SessionBootstrap
  masterKey: string
}

type VaultStatus = 'guest' | 'locked' | 'authenticated'

type VaultSessionContextValue = {
  status: VaultStatus
  deviceIdentity: DeviceIdentity
  session: SessionBootstrap | null
  lockedState: LockedVaultState | null
  decryptedSecrets: DecryptedVaultSecret[]
  skippedSecretsCount: number
  pendingLogin: PendingLoginState | null
  isBusy: boolean
  submitLogin: (email: string, password: string) => Promise<'authenticated' | 'pending'>
  pollPendingLogin: () => Promise<'authenticated' | 'pending'>
  requestMasterDeviceReset: (challengeId: number) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  unlockVault: (password: string) => Promise<void>
  lockVault: () => void
  logout: () => Promise<void>
  createLoginSecret: (values: LoginSecretValues) => Promise<void>
  createTotpSecret: (values: TotpSecretValues) => Promise<void>
  updateLoginSecret: (id: string, values: LoginSecretValues) => Promise<void>
  updateTotpSecret: (id: string, values: TotpSecretValues) => Promise<void>
  deleteSecret: (id: string) => Promise<void>
}

const REFRESH_TOKEN_STORAGE_KEY = 'authier-vault-refresh-token'
const LOCKED_STATE_STORAGE_KEY = 'authier-vault-locked-state'
const UNLOCKED_STATE_STORAGE_KEY = 'authier-vault-unlocked-state'

const VaultSessionContext = createContext<VaultSessionContextValue | null>(null)

const readStoredString = (key: string) => window.localStorage.getItem(key)

const readStoredJson = <T,>(key: string): T | null => {
  const rawValue = window.localStorage.getItem(key)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return null
  }
}

export function VaultSessionProvider({ children }: { children: ReactNode }) {
  const [deviceIdentity] = useState(getOrCreateDeviceIdentity)
  const [initialUnlockedState] = useState<UnlockedVaultState | null>(() =>
    readStoredJson<UnlockedVaultState>(UNLOCKED_STATE_STORAGE_KEY)
  )
  const [refreshToken, setRefreshTokenState] = useState<string | null>(() =>
    readStoredString(REFRESH_TOKEN_STORAGE_KEY)
  )
  const [lockedState, setLockedStateState] = useState<LockedVaultState | null>(
    () => readStoredJson<LockedVaultState>(LOCKED_STATE_STORAGE_KEY)
  )
  const [session, setSession] = useState<SessionBootstrap | null>(
    () => initialUnlockedState?.session ?? null
  )
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null)
  const [decryptedSecrets, setDecryptedSecrets] = useState<DecryptedVaultSecret[]>(
    []
  )
  const [skippedSecretsCount, setSkippedSecretsCount] = useState(0)
  const [shouldRestoreUnlockedSession, setShouldRestoreUnlockedSession] = useState(
    () => Boolean(initialUnlockedState)
  )
  const [pendingLogin, setPendingLogin] = useState<PendingLoginState | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const status: VaultStatus = session ? 'authenticated' : lockedState ? 'locked' : 'guest'

  useEffect(() => {
    if (!session || !masterKey) {
      setDecryptedSecrets([])
      setSkippedSecretsCount(0)
      return
    }

    let cancelled = false

    void decryptSecrets(session.secrets, masterKey).then((result) => {
      if (!cancelled) {
        setDecryptedSecrets(result.secrets)
        setSkippedSecretsCount(result.failedCount)
      }
    })

    return () => {
      cancelled = true
    }
  }, [masterKey, session])

  useEffect(() => {
    if (!session || !lockedState) {
      return
    }

    const timeoutSeconds = session.currentDevice.vaultLockTimeoutSeconds

    if (timeoutSeconds === 0) {
      return
    }

    let timeoutId: number | undefined

    const scheduleLock = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        clearUnlockedSession()
      }, timeoutSeconds * 1000)
    }

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'pointerdown',
      'touchstart'
    ]

    scheduleLock()

    const onActivity = () => scheduleLock()

    events.forEach((eventName) => window.addEventListener(eventName, onActivity))

    return () => {
      window.clearTimeout(timeoutId)
      events.forEach((eventName) =>
        window.removeEventListener(eventName, onActivity)
      )
    }
  }, [lockedState, session])

  const setRefreshToken = (nextRefreshToken: string | null) => {
    setRefreshTokenState(nextRefreshToken)

    if (nextRefreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken)
      return
    }

    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  }

  const setLockedState = (nextLockedState: LockedVaultState | null) => {
    setLockedStateState(nextLockedState)

    if (nextLockedState) {
      window.localStorage.setItem(
        LOCKED_STATE_STORAGE_KEY,
        JSON.stringify(nextLockedState)
      )
      return
    }

    window.localStorage.removeItem(LOCKED_STATE_STORAGE_KEY)
  }

  const setUnlockedState = (nextUnlockedState: UnlockedVaultState | null) => {
    if (nextUnlockedState) {
      window.localStorage.setItem(
        UNLOCKED_STATE_STORAGE_KEY,
        JSON.stringify(nextUnlockedState)
      )
      return
    }

    window.localStorage.removeItem(UNLOCKED_STATE_STORAGE_KEY)
  }

  const clearUnlockedSession = () => {
    setAccessToken(null)
    setSession(null)
    setMasterKey(null)
    setPendingLogin(null)
    setDecryptedSecrets([])
    setSkippedSecretsCount(0)
    setUnlockedState(null)
  }

  const completeAuthenticatedSession = async (
    authenticatedSession: AuthenticatedSession,
    options: {
      email: string
      encryptionSalt: string
      authSecretEncrypted: string
      masterEncryptionKey: CryptoKey
    }
  ) => {
    setAccessToken(authenticatedSession.accessToken)
    setRefreshToken(authenticatedSession.refreshToken)
    setMasterKey(options.masterEncryptionKey)
    setSession(authenticatedSession.session)
    setLockedState({
      userId: authenticatedSession.session.user.id,
      email: options.email,
      deviceName: authenticatedSession.session.currentDevice.name,
      encryptionSalt: options.encryptionSalt,
      authSecretEncrypted: options.authSecretEncrypted,
      vaultLockTimeoutSeconds:
        authenticatedSession.session.currentDevice.vaultLockTimeoutSeconds
    })
    setPendingLogin(null)
  }

  useEffect(() => {
    if (!initialUnlockedState?.masterKey) {
      return
    }

    let cancelled = false

    void abToCryptoKey(base64ToBuffer(initialUnlockedState.masterKey)).then(
      (restoredMasterKey) => {
        if (!cancelled) {
          setMasterKey((currentMasterKey) => currentMasterKey ?? restoredMasterKey)
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [initialUnlockedState])

  useEffect(() => {
    if (!shouldRestoreUnlockedSession) {
      return
    }

    if (!initialUnlockedState || !refreshToken || !lockedState) {
      setShouldRestoreUnlockedSession(false)
      return
    }

    let cancelled = false

    void orpcClient.auth
      .refresh({
        refreshToken
      })
      .then(async (authenticatedSession) => {
        const restoredMasterKey =
          masterKey ??
          await abToCryptoKey(base64ToBuffer(initialUnlockedState.masterKey))

        if (cancelled) {
          return
        }

        await completeAuthenticatedSession(authenticatedSession, {
          email: lockedState.email,
          encryptionSalt: lockedState.encryptionSalt,
          authSecretEncrypted: lockedState.authSecretEncrypted,
          masterEncryptionKey: restoredMasterKey
        })
        setShouldRestoreUnlockedSession(false)
      })
      .catch((error) => {
        console.warn(
          'Unable to refresh unlocked vault session after reload.',
          error
        )
        setShouldRestoreUnlockedSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    initialUnlockedState,
    lockedState,
    masterKey,
    refreshToken,
    shouldRestoreUnlockedSession
  ])

  useEffect(() => {
    if (!session || !masterKey) {
      return
    }

    let cancelled = false

    void cryptoKeyToString(masterKey).then((serializedMasterKey) => {
      if (!cancelled) {
        setUnlockedState({
          session,
          masterKey: serializedMasterKey
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [masterKey, session])

  const completeApprovedLogin = async (
    challenge: ApprovedChallenge,
    email: string,
    password: string
  ) => {
    const masterEncryptionKey = await generateEncryptionKey(
      password,
      base64ToBuffer(challenge.encryptionSalt)
    )

    let currentAddDeviceSecret: string

    try {
      currentAddDeviceSecret = await decryptString(
        masterEncryptionKey,
        challenge.addDeviceSecretEncrypted
      )
    } catch {
      throw new Error('Login failed, check your email or password')
    }

    const nextDeviceSecrets = await initLocalDeviceAuthSecret(
      masterEncryptionKey,
      base64ToBuffer(challenge.encryptionSalt)
    )

    const authenticatedSession = await orpcClient.auth.completeDeviceLogin({
      challengeId: challenge.challengeId,
      currentAddDeviceSecret,
      input: {
        ...nextDeviceSecrets,
        encryptionSalt: challenge.encryptionSalt,
        firebaseToken: null,
        devicePlatform: deviceIdentity.platform
      }
    })

    await completeAuthenticatedSession(authenticatedSession, {
      email,
      encryptionSalt: challenge.encryptionSalt,
      authSecretEncrypted: nextDeviceSecrets.addDeviceSecretEncrypted,
      masterEncryptionKey
    })
  }

  const submitLogin = async (email: string, password: string) => {
    setIsBusy(true)

    try {
      const result = await orpcClient.auth.requestDeviceChallenge({
        email,
        deviceInput: deviceIdentity
      })

      if (result.status === 'approved') {
        await completeApprovedLogin(result, email, password)
        return 'authenticated' as const
      }

      setPendingLogin({
        email,
        password,
        lastResult: result
      })

      return 'pending' as const
    } finally {
      setIsBusy(false)
    }
  }

  const pollPendingLogin = async () => {
    if (!pendingLogin) {
      throw new Error('No pending login request')
    }

    const result = await orpcClient.auth.requestDeviceChallenge({
      email: pendingLogin.email,
      deviceInput: deviceIdentity
    })

    if (result.status === 'approved') {
      await completeApprovedLogin(
        result,
        pendingLogin.email,
        pendingLogin.password
      )
      return 'authenticated' as const
    }

    setPendingLogin({
      ...pendingLogin,
      lastResult: result
    })

    return 'pending' as const
  }

  const requestMasterDeviceReset = async (challengeId: number) => {
    if (!pendingLogin) {
      throw new Error('No pending login request')
    }

    await orpcClient.auth.initiateMasterDeviceReset({
      email: pendingLogin.email,
      deviceInput: deviceIdentity,
      decryptionChallengeId: challengeId
    })
  }

  const register = async (email: string, password: string) => {
    setIsBusy(true)

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const encryptionSalt = bufferToBase64(salt)
      const masterEncryptionKey = await generateEncryptionKey(password, salt)
      const nextDeviceSecrets = await initLocalDeviceAuthSecret(
        masterEncryptionKey,
        salt
      )

      const authenticatedSession = await orpcClient.auth.register({
        userId: crypto.randomUUID(),
        deviceId: deviceIdentity.id,
        deviceName: deviceIdentity.name,
        email,
        input: {
          ...nextDeviceSecrets,
          encryptionSalt,
          firebaseToken: null,
          devicePlatform: deviceIdentity.platform
        }
      })

      await completeAuthenticatedSession(authenticatedSession, {
        email,
        encryptionSalt,
        authSecretEncrypted: nextDeviceSecrets.addDeviceSecretEncrypted,
        masterEncryptionKey
      })
    } finally {
      setIsBusy(false)
    }
  }

  const unlockVault = async (password: string) => {
    if (!refreshToken || !lockedState) {
      throw new Error('No locked vault available')
    }

    setIsBusy(true)

    try {
      const decryptResult = await decryptDeviceSecretWithPassword(password, {
        encryptionSalt: lockedState.encryptionSalt,
        authSecretEncrypted: lockedState.authSecretEncrypted
      })

      if ('error' in decryptResult) {
        throw new Error('Wrong master password')
      }

      const authenticatedSession = await orpcClient.auth.refresh({
        refreshToken
      })

      await completeAuthenticatedSession(authenticatedSession, {
        email: lockedState.email,
        encryptionSalt: lockedState.encryptionSalt,
        authSecretEncrypted: lockedState.authSecretEncrypted,
        masterEncryptionKey: decryptResult.masterEncryptionKey
      })
    } finally {
      setIsBusy(false)
    }
  }

  const lockVault = () => {
    clearUnlockedSession()
  }

  const logout = async () => {
    try {
      if (session) {
        await orpcClient.auth.logout({})
      }
    } finally {
      clearUnlockedSession()
      setRefreshToken(null)
      setLockedState(null)
    }
  }

  const updateSecretsState = (
    updater: (current: SessionBootstrap['secrets']) => SessionBootstrap['secrets']
  ) => {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession
      }

      return {
        ...currentSession,
        secrets: updater(currentSession.secrets)
      }
    })
  }

  const ensureVaultCanWrite = () => {
    if (!masterKey || !lockedState) {
      throw new Error('Vault is locked')
    }

    return {
      masterKey,
      salt: base64ToBuffer(lockedState.encryptionSalt)
    }
  }

  const createLoginSecret = async (values: LoginSecretValues) => {
    const cryptoContext = ensureVaultCanWrite()
    const encrypted = await encryptLoginSecret(
      values,
      cryptoContext.masterKey,
      cryptoContext.salt
    )
    const created = await orpcClient.vault.createSecret({
      kind: 'LOGIN_CREDENTIALS',
      encrypted
    })

    updateSecretsState((currentSecrets) => [created, ...currentSecrets])
  }

  const createTotpSecret = async (values: TotpSecretValues) => {
    const cryptoContext = ensureVaultCanWrite()
    const encrypted = await encryptTotpSecret(
      values,
      cryptoContext.masterKey,
      cryptoContext.salt
    )
    const created = await orpcClient.vault.createSecret({
      kind: 'TOTP',
      encrypted
    })

    updateSecretsState((currentSecrets) => [created, ...currentSecrets])
  }

  const updateLoginSecret = async (id: string, values: LoginSecretValues) => {
    const cryptoContext = ensureVaultCanWrite()
    const encrypted = await encryptLoginSecret(
      values,
      cryptoContext.masterKey,
      cryptoContext.salt
    )
    const updated = await orpcClient.vault.updateSecret({
      id,
      patch: {
        kind: 'LOGIN_CREDENTIALS',
        encrypted
      }
    })

    updateSecretsState((currentSecrets) =>
      currentSecrets.map((secret) => (secret.id === id ? updated : secret))
    )
  }

  const updateTotpSecret = async (id: string, values: TotpSecretValues) => {
    const cryptoContext = ensureVaultCanWrite()
    const encrypted = await encryptTotpSecret(
      values,
      cryptoContext.masterKey,
      cryptoContext.salt
    )
    const updated = await orpcClient.vault.updateSecret({
      id,
      patch: {
        kind: 'TOTP',
        encrypted
      }
    })

    updateSecretsState((currentSecrets) =>
      currentSecrets.map((secret) => (secret.id === id ? updated : secret))
    )
  }

  const deleteSecret = async (id: string) => {
    await orpcClient.vault.deleteSecret({ id })

    updateSecretsState((currentSecrets) =>
      currentSecrets.filter((secret) => secret.id !== id)
    )
  }

  return (
    <VaultSessionContext.Provider
      value={{
        status,
        deviceIdentity,
        session,
        lockedState,
        decryptedSecrets,
        skippedSecretsCount,
        pendingLogin,
        isBusy,
        submitLogin,
        pollPendingLogin,
        requestMasterDeviceReset,
        register,
        unlockVault,
        lockVault,
        logout,
        createLoginSecret,
        createTotpSecret,
        updateLoginSecret,
        updateTotpSecret,
        deleteSecret
      }}
    >
      {children}
    </VaultSessionContext.Provider>
  )
}

export const useVaultSession = () => {
  const context = useContext(VaultSessionContext)

  if (!context) {
    throw new Error('useVaultSession must be used inside VaultSessionProvider')
  }

  return context
}
