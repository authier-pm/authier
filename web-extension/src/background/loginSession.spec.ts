import { vi } from 'vitest'
import {
  LoginSessionManager,
  type LoginSessionOperations,
  type LoginSessionStorage
} from './loginSession'
import type {
  LoginApprovedChallenge,
  LoginApprovalChallenge,
  LoginSessionSnapshot
} from './loginSessionTypes'

const deviceInfo = {
  id: 'device-id',
  name: 'Firefox extension',
  platform: 'Firefox'
}

const approvalChallenge: LoginApprovalChallenge = {
  type: 'awaiting-approval',
  id: 42,
  pushNotificationsSentCount: 1,
  pushNotificationsFailedCount: 0,
  masterDeviceResetRequestedAt: null,
  masterDeviceResetProcessAt: null,
  masterDeviceResetConfirmedAt: null,
  masterDeviceResetRejectedAt: null
}

const approvedChallenge: LoginApprovedChallenge = {
  type: 'approved',
  id: 42,
  addDeviceSecretEncrypted: 'encrypted-secret',
  encryptionSalt: 'encryption-salt',
  userId: 'user-id',
  approvedAt: '2037-03-03T13:33:33.333Z'
}

const createStorage = (initialValue: LoginSessionSnapshot | null = null) => {
  let value = initialValue ? structuredClone(initialValue) : null

  const storage: LoginSessionStorage = {
    read: vi.fn(async () => (value ? structuredClone(value) : null)),
    write: vi.fn(async (session) => {
      value = structuredClone(session)
    }),
    clear: vi.fn(async () => {
      value = null
    })
  }

  return {
    storage,
    getStoredValue: () => (value ? structuredClone(value) : null)
  }
}

const createOperations = (
  requestChallenge: LoginSessionOperations['requestChallenge']
) => {
  const completeLogin = vi.fn<LoginSessionOperations['completeLogin']>(
    async () => undefined
  )
  const operations: LoginSessionOperations = {
    hasAuthenticatedDevice: vi.fn(async () => false),
    getDeviceInfo: vi.fn(async () => deviceInfo),
    requestChallenge,
    completeLogin,
    initiateMasterDeviceReset: vi.fn(async () => ({
      requestedAt: '2037-03-03T13:33:33.333Z',
      processAt: '2037-03-04T13:33:33.333Z',
      alreadyPending: false
    }))
  }

  return { operations, completeLogin }
}

describe('LoginSessionManager', () => {
  it('restores form values after the popup is recreated', async () => {
    const { storage, getStoredValue } = createStorage()
    const { operations } = createOperations(async () => approvalChallenge)
    const firstManager = new LoginSessionManager(operations, storage, 60_000)

    await firstManager.updateDraft({
      email: 'person@example.com',
      password: 'secret-password'
    })
    firstManager.dispose()

    const restoredManager = new LoginSessionManager(operations, storage, 60_000)
    const restored = await restoredManager.getSnapshot()

    expect(restored).toMatchObject({
      email: 'person@example.com',
      password: 'secret-password',
      status: 'editing'
    })
    expect(getStoredValue()).toMatchObject({
      email: 'person@example.com',
      password: 'secret-password'
    })
    restoredManager.dispose()
  })

  it('resumes approval polling from a stored login attempt', async () => {
    const storedSession: LoginSessionSnapshot = {
      attemptId: 'attempt-id',
      email: 'person@example.com',
      password: 'secret-password',
      deviceName: deviceInfo.name,
      status: 'awaiting-approval',
      challenge: approvalChallenge,
      error: null
    }
    const { storage } = createStorage(storedSession)
    const requestChallenge = vi.fn<LoginSessionOperations['requestChallenge']>(
      async () => approvalChallenge
    )
    const { operations } = createOperations(requestChallenge)
    const manager = new LoginSessionManager(operations, storage, 60_000)

    await manager.initialize()
    await manager.pollNow()

    expect(requestChallenge).toHaveBeenCalledWith({
      email: 'person@example.com',
      device: deviceInfo
    })
    expect(await manager.getSnapshot()).toMatchObject({
      status: 'awaiting-approval',
      challenge: approvalChallenge
    })
    manager.dispose()
  })

  it('discards a stale login session when the device is already authenticated', async () => {
    const storedSession: LoginSessionSnapshot = {
      attemptId: 'attempt-id',
      email: 'person@example.com',
      password: 'secret-password',
      deviceName: deviceInfo.name,
      status: 'awaiting-approval',
      challenge: approvalChallenge,
      error: null
    }
    const { storage, getStoredValue } = createStorage(storedSession)
    const requestChallenge = vi.fn<LoginSessionOperations['requestChallenge']>(
      async () => approvalChallenge
    )
    const { operations } = createOperations(requestChallenge)
    operations.hasAuthenticatedDevice = vi.fn(async () => true)
    const manager = new LoginSessionManager(operations, storage, 60_000)

    expect(await manager.getSnapshot()).toMatchObject({
      email: '',
      password: '',
      status: 'editing'
    })
    expect(getStoredValue()).toBeNull()
    expect(requestChallenge).not.toHaveBeenCalled()
    manager.dispose()
  })

  it('finishes a restored login when approval arrives', async () => {
    const { storage, getStoredValue } = createStorage()
    const requestChallenge = vi
      .fn<LoginSessionOperations['requestChallenge']>()
      .mockResolvedValueOnce(approvalChallenge)
      .mockResolvedValueOnce(approvedChallenge)
    const { operations, completeLogin } = createOperations(requestChallenge)
    const manager = new LoginSessionManager(operations, storage, 60_000)

    await manager.startLogin({
      email: 'person@example.com',
      password: 'secret-password'
    })
    await manager.pollNow()

    expect(completeLogin).toHaveBeenCalledWith({
      session: expect.objectContaining({
        email: 'person@example.com',
        password: 'secret-password'
      }),
      challenge: approvedChallenge,
      device: deviceInfo
    })
    expect(getStoredValue()).toBeNull()
    expect(await manager.getSnapshot()).toMatchObject({
      email: '',
      password: '',
      status: 'editing'
    })
    manager.dispose()
  })
})
