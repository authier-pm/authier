import { CombinedGraphQLErrors } from '@apollo/client/errors'
import browser from 'webextension-polyfill'
import { z } from 'zod'
import {
  AddNewDeviceForUserDocument,
  type AddNewDeviceForUserMutation,
  type AddNewDeviceForUserMutationVariables,
  DeviceDecryptionChallengeDocument,
  type DeviceDecryptionChallengeMutation,
  type DeviceDecryptionChallengeMutationVariables,
  InitiateMasterDeviceResetDocument,
  type InitiateMasterDeviceResetMutation,
  type InitiateMasterDeviceResetMutationVariables
} from '@shared/graphql/Login.codegen'
import { apolloClientWithoutTokenRefresh } from '@src/apollo/apolloClient'
import type { IBackgroundStateSerializable } from './backgroundPage'
import { device, deviceInitialization } from './ExtensionDevice'
import {
  getUserFromToken,
  setAccessToken
} from '@src/util/accessTokenExtension'
import { getAutofillCredentialsEnabled } from '@src/util/autofillCredentialsPreference'
import {
  base64ToBuffer,
  cryptoKeyToString,
  dec,
  generateEncryptionKey
} from '@util/generateEncryptionKey'
import {
  LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL,
  type LoginApprovedChallenge,
  type LoginChallenge,
  type LoginDraft,
  type LoginSessionSnapshot,
  type MasterDeviceResetResult
} from './loginSessionTypes'

const LOGIN_SESSION_STORAGE_KEY = 'login-session'

const loginApprovalChallengeSchema = z.object({
  type: z.literal('awaiting-approval'),
  id: z.number(),
  pushNotificationsSentCount: z.number(),
  pushNotificationsFailedCount: z.number(),
  masterDeviceResetRequestedAt: z.string().nullable(),
  masterDeviceResetProcessAt: z.string().nullable(),
  masterDeviceResetConfirmedAt: z.string().nullable(),
  masterDeviceResetRejectedAt: z.string().nullable()
})

const loginSessionSnapshotSchema = z.object({
  attemptId: z.string().nullable(),
  email: z.string(),
  password: z.string(),
  deviceName: z.string(),
  status: z.enum(['editing', 'awaiting-approval', 'completing']),
  challenge: loginApprovalChallengeSchema.nullable(),
  error: z.string().nullable()
})

const createEmptyLoginSession = (): LoginSessionSnapshot => ({
  attemptId: null,
  email: '',
  password: '',
  deviceName: '',
  status: 'editing',
  challenge: null,
  error: null
})

export interface LoginSessionStorage {
  read: () => Promise<LoginSessionSnapshot | null>
  write: (session: LoginSessionSnapshot) => Promise<void>
  clear: () => Promise<void>
}

export type LoginDeviceInfo = {
  id: string
  name: string
  platform: string
}

export interface LoginSessionOperations {
  hasAuthenticatedDevice: () => Promise<boolean>
  getDeviceInfo: () => Promise<LoginDeviceInfo>
  requestChallenge: (input: {
    email: string
    device: LoginDeviceInfo
  }) => Promise<LoginChallenge | null>
  completeLogin: (input: {
    session: LoginSessionSnapshot
    challenge: LoginApprovedChallenge
    device: LoginDeviceInfo
  }) => Promise<void>
  initiateMasterDeviceReset: (input: {
    email: string
    device: LoginDeviceInfo
    challengeId: number
  }) => Promise<MasterDeviceResetResult>
}

export class LoginSessionError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    cause?: unknown
  ) {
    super(message, { cause })
    this.name = 'LoginSessionError'
  }
}

class BrowserLoginSessionStorage implements LoginSessionStorage {
  constructor(private storageArea: browser.Storage.StorageArea | null) {}

  read() {
    if (!this.storageArea) {
      return Promise.resolve(null)
    }

    return this.storageArea
      .get(LOGIN_SESSION_STORAGE_KEY)
      .then((stored) => {
        const parsed = loginSessionSnapshotSchema.safeParse(
          stored[LOGIN_SESSION_STORAGE_KEY]
        )

        return parsed.success ? parsed.data : null
      })
      .catch((error: unknown) => {
        console.warn(
          'Session storage is unavailable; login state will remain in background memory',
          error
        )
        this.storageArea = null
        return null
      })
  }

  write(session: LoginSessionSnapshot) {
    if (!this.storageArea) {
      return Promise.resolve()
    }

    return this.storageArea
      .set({
        [LOGIN_SESSION_STORAGE_KEY]: session
      })
      .catch((error: unknown) => {
        console.warn(
          'Session storage is unavailable; login state will remain in background memory',
          error
        )
        this.storageArea = null
      })
  }

  clear() {
    if (!this.storageArea) {
      return Promise.resolve()
    }

    return this.storageArea
      .remove(LOGIN_SESSION_STORAGE_KEY)
      .catch((error: unknown) => {
        console.warn('Unable to clear the stored login session', error)
        this.storageArea = null
      })
  }
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return 'Login failed, please try again'
}

export class LoginSessionManager {
  private session = createEmptyLoginSession()
  private initialization: Promise<void> | null = null
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private pollPromise: Promise<void> | null = null

  constructor(
    private readonly operations: LoginSessionOperations,
    private readonly storage: LoginSessionStorage,
    private readonly pollIntervalMs = LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL
  ) {}

  initialize() {
    if (!this.initialization) {
      this.initialization = this.restore()
    }

    return this.initialization
  }

  private async restore() {
    const storedSession = await this.storage.read()

    if (!storedSession) {
      return
    }

    if (await this.operations.hasAuthenticatedDevice()) {
      await this.storage.clear()
      return
    }

    this.session =
      storedSession.status === 'completing'
        ? { ...storedSession, status: 'awaiting-approval' }
        : storedSession

    if (storedSession.status === 'completing') {
      await this.storage.write(this.session)
    }

    if (this.session.status === 'awaiting-approval') {
      this.startPolling()
      void this.queuePoll()
    }
  }

  async getSnapshot() {
    await this.initialize()
    return this.cloneSnapshot()
  }

  async updateDraft(draft: LoginDraft) {
    await this.initialize()

    if (this.session.status !== 'editing') {
      return this.cloneSnapshot()
    }

    this.session = {
      ...this.session,
      ...draft,
      error: null
    }
    await this.storage.write(this.session)
    return this.cloneSnapshot()
  }

  async startLogin(draft: LoginDraft) {
    await this.initialize()
    const deviceInfo = await this.operations.getDeviceInfo()

    this.stopPolling()
    this.session = {
      attemptId: crypto.randomUUID(),
      ...draft,
      deviceName: deviceInfo.name,
      status: 'awaiting-approval',
      challenge: null,
      error: null
    }
    await this.storage.write(this.session)
    this.startPolling()
    await this.queuePoll()

    return this.cloneSnapshot()
  }

  async pollNow() {
    await this.initialize()
    await this.queuePoll()
    return this.cloneSnapshot()
  }

  async resetLogin() {
    await this.initialize()
    this.stopPolling()
    this.session = createEmptyLoginSession()
    await this.storage.clear()
    return this.cloneSnapshot()
  }

  async initiateMasterDeviceReset() {
    await this.initialize()

    const challenge = this.session.challenge
    if (
      this.session.status !== 'awaiting-approval' ||
      !challenge ||
      !this.session.email
    ) {
      throw new Error('There is no login approval request to reset')
    }

    const deviceInfo = await this.operations.getDeviceInfo()
    const result = await this.operations.initiateMasterDeviceReset({
      email: this.session.email,
      device: deviceInfo,
      challengeId: challenge.id
    })
    await this.queuePoll()
    return result
  }

  dispose() {
    this.stopPolling()
  }

  private startPolling() {
    if (this.pollInterval) {
      return
    }

    this.pollInterval = setInterval(() => {
      void this.queuePoll()
    }, this.pollIntervalMs)
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  private queuePoll() {
    if (this.pollPromise) {
      return this.pollPromise
    }

    if (
      this.session.status !== 'awaiting-approval' ||
      !this.session.attemptId
    ) {
      return Promise.resolve()
    }

    const attemptId = this.session.attemptId
    const pollPromise = this.poll(attemptId)
      .catch((error: unknown) => this.handlePollFailure(attemptId, error))
      .finally(() => {
        if (this.pollPromise === pollPromise) {
          this.pollPromise = null
        }
      })

    this.pollPromise = pollPromise
    return pollPromise
  }

  private async poll(attemptId: string) {
    const sessionAtStart = this.cloneSnapshot()
    const deviceInfo = await this.operations.getDeviceInfo()
    const challenge = await this.operations.requestChallenge({
      email: sessionAtStart.email,
      device: deviceInfo
    })

    if (this.session.attemptId !== attemptId || !challenge) {
      return
    }

    if (challenge.type === 'awaiting-approval') {
      this.session = {
        ...this.session,
        status: 'awaiting-approval',
        challenge,
        error: null
      }
      await this.storage.write(this.session)
      return
    }

    this.stopPolling()
    this.session = {
      ...this.session,
      status: 'completing',
      challenge: null,
      error: null
    }
    await this.storage.write(this.session)
    await this.operations.completeLogin({
      session: sessionAtStart,
      challenge,
      device: deviceInfo
    })

    if (this.session.attemptId !== attemptId) {
      return
    }

    this.session = createEmptyLoginSession()
    await this.storage.clear()
  }

  private async handlePollFailure(attemptId: string, error: unknown) {
    if (this.session.attemptId !== attemptId) {
      return
    }

    console.error('Login session polling failed', error)
    const retryable =
      error instanceof LoginSessionError ? error.retryable : false

    if (retryable) {
      this.session = {
        ...this.session,
        status: 'awaiting-approval',
        error: getErrorMessage(error)
      }
    } else {
      this.stopPolling()
      this.session = {
        ...this.session,
        status: 'editing',
        challenge: null,
        error: getErrorMessage(error)
      }
    }

    await this.storage.write(this.session)
  }

  private cloneSnapshot(): LoginSessionSnapshot {
    return {
      ...this.session,
      challenge: this.session.challenge ? { ...this.session.challenge } : null
    }
  }
}

const normalizeChallengeError = (error: unknown) => {
  if (CombinedGraphQLErrors.is(error)) {
    return new LoginSessionError(
      error.errors[0]?.message ?? 'Login failed, please try again',
      false,
      error
    )
  }

  return new LoginSessionError(
    'Unable to reach Authier. Login will keep retrying.',
    true,
    error
  )
}

const requestChallenge: LoginSessionOperations['requestChallenge'] = (input) =>
  apolloClientWithoutTokenRefresh
    .mutate<
      DeviceDecryptionChallengeMutation,
      DeviceDecryptionChallengeMutationVariables
    >({
      mutation: DeviceDecryptionChallengeDocument,
      variables: {
        email: input.email,
        deviceInput: input.device
      }
    })
    .then(({ data }) => {
      const challenge = data?.deviceDecryptionChallenge

      if (challenge?.__typename === 'DecryptionChallengeForApproval') {
        return {
          type: 'awaiting-approval' as const,
          id: challenge.id,
          pushNotificationsSentCount: challenge.pushNotificationsSentCount,
          pushNotificationsFailedCount: challenge.pushNotificationsFailedCount,
          masterDeviceResetRequestedAt:
            challenge.masterDeviceResetRequestedAt ?? null,
          masterDeviceResetProcessAt:
            challenge.masterDeviceResetProcessAt ?? null,
          masterDeviceResetConfirmedAt:
            challenge.masterDeviceResetConfirmedAt ?? null,
          masterDeviceResetRejectedAt:
            challenge.masterDeviceResetRejectedAt ?? null
        }
      }

      if (challenge?.__typename === 'DecryptionChallengeApproved') {
        return {
          type: 'approved' as const,
          id: challenge.id,
          addDeviceSecretEncrypted: challenge.addDeviceSecretEncrypted,
          encryptionSalt: challenge.encryptionSalt,
          userId: challenge.userId,
          approvedAt: challenge.approvedAt ?? null
        }
      }

      return null
    })
    .catch((error: unknown) => {
      throw normalizeChallengeError(error)
    })

const completeLogin = async (input: {
  session: LoginSessionSnapshot
  challenge: LoginApprovedChallenge
  device: LoginDeviceInfo
}) => {
  const masterEncryptionKey = await generateEncryptionKey(
    input.session.password,
    base64ToBuffer(input.challenge.encryptionSalt)
  )
  const encryptedData = base64ToBuffer(input.challenge.addDeviceSecretEncrypted)
  const iv = encryptedData.slice(16, 28)
  const data = encryptedData.slice(28)
  const decryptedContent = await self.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    masterEncryptionKey,
    data
  )
  const currentAddDeviceSecret = dec.decode(decryptedContent)
  const newDeviceSecretsPair = await device.initLocalDeviceAuthSecret(
    masterEncryptionKey,
    base64ToBuffer(input.challenge.encryptionSalt)
  )
  const fireToken = device.fireToken || `web-ext-${crypto.randomUUID()}`
  const response = await apolloClientWithoutTokenRefresh.mutate<
    AddNewDeviceForUserMutation,
    AddNewDeviceForUserMutationVariables
  >({
    mutation: AddNewDeviceForUserDocument,
    variables: {
      email: input.session.email,
      deviceId: input.device.id,
      deviceInput: input.device,
      input: {
        addDeviceSecret: newDeviceSecretsPair.addDeviceSecret,
        addDeviceSecretEncrypted: newDeviceSecretsPair.addDeviceSecretEncrypted,
        firebaseToken: fireToken,
        devicePlatform: input.device.platform,
        encryptionSalt: input.challenge.encryptionSalt
      },
      currentAddDeviceSecret
    }
  })
  const challengeResponse = response.data?.deviceDecryptionChallenge
  const loginResponse =
    challengeResponse?.__typename === 'DecryptionChallengeApproved'
      ? challengeResponse.addNewDeviceForUser
      : null

  if (!loginResponse?.accessToken) {
    throw new Error('Missing access token after login approval')
  }

  await browser.storage.local.set({
    addDeviceSecretEncrypted: input.challenge.addDeviceSecretEncrypted,
    currentAddDeviceSecret
  })
  await setAccessToken(loginResponse.accessToken)
  const decodedToken = await getUserFromToken()

  if (!decodedToken) {
    throw new Error('Missing access token after login approval')
  }

  const user = loginResponse.user
  const deviceState: IBackgroundStateSerializable = {
    masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
    userId: input.challenge.userId,
    secrets: user.EncryptedSecrets,
    email: input.session.email,
    encryptionSalt: input.challenge.encryptionSalt,
    deviceName: input.device.name,
    authSecret: newDeviceSecretsPair.addDeviceSecret,
    authSecretEncrypted: newDeviceSecretsPair.addDeviceSecretEncrypted,
    vaultLockTimeoutSeconds: user.device.vaultLockTimeoutSeconds,
    autofillTOTPEnabled: user.device.autofillTOTPEnabled,
    autofillCredentialsEnabled: await getAutofillCredentialsEnabled(),
    autofillForbiddenUrlPatterns: user.autofillForbiddenUrlPatterns,
    uiLanguage: user.uiLanguage,
    syncTOTP: user.device.syncTOTP,
    notificationOnWrongPasswordAttempts:
      user.notificationOnWrongPasswordAttempts,
    notificationOnVaultUnlock: user.notificationOnVaultUnlock,
    theme: user.defaultDeviceSettings.theme
  }

  await device.save(deviceState)
}

const completeLoginWithUserFacingError: LoginSessionOperations['completeLogin'] =
  (input) =>
    completeLogin(input).catch((error: unknown) => {
      throw new LoginSessionError(
        'Login failed, check your email or password',
        false,
        error
      )
    })

const initiateMasterDeviceReset: LoginSessionOperations['initiateMasterDeviceReset'] =
  async (input) => {
    const { data } = await apolloClientWithoutTokenRefresh.mutate<
      InitiateMasterDeviceResetMutation,
      InitiateMasterDeviceResetMutationVariables
    >({
      mutation: InitiateMasterDeviceResetDocument,
      variables: {
        email: input.email,
        deviceInput: input.device,
        decryptionChallengeId: input.challengeId
      }
    })

    if (!data?.initiateMasterDeviceReset) {
      throw new Error('Failed to schedule master device reset')
    }

    return data.initiateMasterDeviceReset
  }

const productionOperations: LoginSessionOperations = {
  async hasAuthenticatedDevice() {
    await deviceInitialization
    return Boolean(device.state || device.lockedState)
  },
  async getDeviceInfo() {
    await deviceInitialization

    if (!device.id) {
      throw new Error('Extension device is not initialized')
    }

    return {
      id: device.id,
      name: device.generateDeviceName(),
      platform: device.platform
    }
  },
  requestChallenge,
  completeLogin: completeLoginWithUserFacingError,
  initiateMasterDeviceReset
}

// Keep the master password memory-only while still surviving popup teardown.
// Firefox versions without storage.session use the persistent background page.
const sessionStorageArea = browser.storage.session ?? null

export const loginSessionManager = new LoginSessionManager(
  productionOperations,
  new BrowserLoginSessionStorage(sessionStorageArea)
)
